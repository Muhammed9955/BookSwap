'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Send, ArrowLeft, MessageCircle } from 'lucide-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/i18n/language-context'
import { createClient } from '@/lib/supabase/client'
import { cn, formatRelativeTime } from '@/lib/utils'

interface ConversationWithDetails {
  id: string
  participant_1: string
  participant_2: string
  last_message?: string
  last_message_at?: string
  unread_1: number
  unread_2: number
  participant_1_profile?: { id: string; full_name?: string; full_name_ar?: string; avatar_url?: string; is_verified?: boolean }
  participant_2_profile?: { id: string; full_name?: string; full_name_ar?: string; avatar_url?: string; is_verified?: boolean }
  listing?: { id: string; book?: { title?: string; title_ar?: string }; images?: { url: string; is_primary: boolean }[] }
}

interface MessagesClientProps {
  userId: string
  conversations: ConversationWithDetails[]
  initialConversationId?: string | null
}

export function MessagesClient({ userId, conversations: initialConversations, initialConversationId = null }: MessagesClientProps) {
  const { lang, isRTL } = useLanguage()
  const [conversationsList, setConversationsList] = useState<ConversationWithDetails[]>(initialConversations)
  const [selectedConvId, setSelectedConvId] = useState<string | null>(initialConversationId ?? null)
  const [messages, setMessages] = useState<Array<{
    id: string; conversation_id: string; sender_id: string; content: string; created_at: string; is_read: boolean
  }>>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Sync conversations list when prop updates
  useEffect(() => {
    setConversationsList(initialConversations)
  }, [initialConversations])

  // Sync selected conversation when initialConversationId changes
  useEffect(() => {
    if (initialConversationId) {
      setSelectedConvId(initialConversationId)
    }
  }, [initialConversationId])

  // On desktop screens, if no conversation is selected and list exists, auto-select first
  useEffect(() => {
    if (!selectedConvId && conversationsList.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
      setSelectedConvId(conversationsList[0].id)
    }
  }, [conversationsList, selectedConvId])

  const selectedConv = conversationsList.find(c => c.id === selectedConvId)
  const otherProfile = selectedConv
    ? (selectedConv.participant_1 === userId
      ? selectedConv.participant_2_profile
      : selectedConv.participant_1_profile)
    : null

  const handleSelectConv = (id: string) => {
    setSelectedConvId(id)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/messages/${id}`)
    }
  }

  const handleBackToList = () => {
    setSelectedConvId(null)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/messages')
    }
  }

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConvId) return

    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConvId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100)
      setMessages(data ?? [])
    }

    loadMessages()

    // Realtime subscription
    const channel = supabase
      .channel(`messages:${selectedConvId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConvId}`,
      }, (payload) => {
        const newMsg = payload.new as typeof messages[0]
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev
          return [...prev, newMsg]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selectedConvId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConvId || sending) return
    setSending(true)
    const content = newMessage.trim()
    setNewMessage('')

    const tempId = 'temp-' + Date.now()
    const optimisticMsg = {
      id: tempId,
      conversation_id: selectedConvId,
      sender_id: userId,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
    }
    setMessages(prev => [...prev, optimisticMsg])

    // Update conversation last message in local state
    setConversationsList(prev => prev.map(c => {
      if (c.id === selectedConvId) {
        return { ...c, last_message: content, last_message_at: new Date().toISOString() }
      }
      return c
    }))

    const { data: insertedMsg } = await supabase.from('messages').insert({
      conversation_id: selectedConvId,
      sender_id: userId,
      content,
    }).select().maybeSingle()

    if (insertedMsg) {
      setMessages(prev => prev.map(m => m.id === tempId ? insertedMsg : m))
    }

    // Update conversation last message in DB
    await supabase.from('conversations').update({
      last_message: content,
      last_message_at: new Date().toISOString(),
    }).eq('id', selectedConvId)

    setSending(false)
  }

  const getOtherProfile = (conv: ConversationWithDetails) => {
    return conv.participant_1 === userId ? conv.participant_2_profile : conv.participant_1_profile
  }

  const getUnreadCount = (conv: ConversationWithDetails) => {
    return conv.participant_1 === userId ? conv.unread_1 : conv.unread_2
  }

  return (
    <MainLayout user={{ id: userId }}>
      <div className="page-container py-0">
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
          {/* Conversations List */}
          <div className={cn(
            'w-full md:w-80 flex-shrink-0 border-e bg-card flex flex-col',
            selectedConvId ? 'hidden md:flex' : 'flex'
          )}>
            {/* Header */}
            <div className="p-4 border-b">
              <h1 className="text-lg font-bold">
                {lang === 'ar' ? 'الرسائل' : 'Messages'}
              </h1>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {conversationsList.length === 0 ? (
                <div className="empty-state">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="font-medium">{lang === 'ar' ? 'مفيش محادثات لسه' : 'No conversations yet'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lang === 'ar' ? 'ابدأ محادثة من صفحة كتاب أو قدم طلب مبادلة/استعارة' : 'Start a conversation from any book page or swap/borrow request'}
                  </p>
                </div>
              ) : (
                conversationsList.map(conv => {
                  const other = getOtherProfile(conv)
                  const unread = getUnreadCount(conv)
                  const isSelected = conv.id === selectedConvId
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConv(conv.id)}
                      className={cn(
                        'w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-start border-b cursor-pointer',
                        isSelected && 'bg-primary/5 border-s-2 border-s-primary'
                      )}
                    >
                      {/* Avatar */}
                      <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {other?.avatar_url ? (
                          <Image src={other.avatar_url} alt={other.full_name ?? ''} width={44} height={44} className="object-cover" />
                        ) : (
                          <span className="font-bold text-primary">{other?.full_name?.charAt(0) ?? '?'}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm truncate">
                            {lang === 'ar' && other?.full_name_ar ? other.full_name_ar : other?.full_name ?? '?'}
                          </span>
                          {conv.last_message_at && (
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">
                              {formatRelativeTime(conv.last_message_at, lang)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.last_message ?? (lang === 'ar' ? 'لا توجد رسائل' : 'No messages')}
                          </p>
                          {unread > 0 && (
                            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                              {unread > 9 ? '9+' : unread}
                            </span>
                          )}
                        </div>
                        {conv.listing?.book && (
                          <span className="text-[10px] text-primary block truncate mt-0.5">
                            📚 {lang === 'ar' && conv.listing.book.title_ar ? conv.listing.book.title_ar : conv.listing.book.title}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={cn(
            'flex-1 flex flex-col',
            !selectedConvId ? 'hidden md:flex' : 'flex'
          )}>
            {!selectedConvId ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p>{lang === 'ar' ? 'اختار محادثة' : 'Select a conversation'}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 border-b bg-card">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={handleBackToList}
                      className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg hover:bg-accent transition-colors shrink-0"
                    >
                      <ArrowLeft className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                    </button>
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {otherProfile?.avatar_url ? (
                        <Image src={otherProfile.avatar_url} alt={otherProfile.full_name ?? ''} width={36} height={36} className="object-cover" />
                      ) : (
                        <span className="font-bold text-primary text-sm">{otherProfile?.full_name?.charAt(0) ?? '?'}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">
                        {lang === 'ar' && otherProfile?.full_name_ar ? otherProfile.full_name_ar : otherProfile?.full_name}
                      </p>
                      {selectedConv?.listing?.book && (
                        <Link
                          href={`/books/${selectedConv.listing.id}`}
                          className="text-xs text-primary hover:underline flex items-center gap-1 font-bold truncate max-w-xs"
                        >
                          <span>📚</span>
                          <span className="truncate">
                            {lang === 'ar' && selectedConv.listing.book.title_ar ? selectedConv.listing.book.title_ar : selectedConv.listing.book.title}
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>

                  <Link href="/transactions">
                    <Button variant="outline" size="sm" className="font-bold text-xs rounded-xl gap-1.5 cursor-pointer shrink-0">
                      <span>🤝</span>
                      <span className="hidden sm:inline">{lang === 'ar' ? 'صفقاتي' : 'Deals'}</span>
                    </Button>
                  </Link>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => {
                    const isMine = msg.sender_id === userId
                    return (
                      <div
                        key={msg.id}
                        className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                      >
                        <div className={isMine ? 'chat-bubble-sent' : 'chat-bubble-received'}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={cn('text-[10px] mt-1', isMine ? 'text-white/70' : 'text-muted-foreground')}>
                            {formatRelativeTime(msg.created_at, lang)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-3 border-t bg-card flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={lang === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
                    className="flex-1"
                  />
                  <Button
                    id="send-message-btn"
                    size="icon"
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    aria-label="Send message"
                  >
                    <Send className={cn('h-4 w-4', isRTL && 'rotate-180')} />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
