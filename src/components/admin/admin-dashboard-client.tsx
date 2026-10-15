'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users, BookOpen, ShoppingBag, AlertTriangle, Star, TrendingUp,
  BarChart2, Shield, Eye, EyeOff, Trash2, CheckCircle2, Clock,
  Edit3, MapPin, Search, Plus, X, Check, Coffee, Building,
  Smartphone, Download, ExternalLink, Activity, Calendar, ArrowUpRight
} from 'lucide-react'
import type { DashboardStats, Community, CommunityOrgType } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/i18n/language-context'
import { createClient } from '@/lib/supabase/client'
import { cn, formatRelativeTime } from '@/lib/utils'
import { updateCommunityDetails, deleteCommunity } from '@/lib/communities/community-service'
import { WaraqLogo } from '@/components/ui/waraq-logo'

interface AdminDashboardClientProps {
  stats: DashboardStats
  recentListings: Array<Record<string, unknown>>
  recentReports: Array<Record<string, unknown>>
  recentUsers: Array<Record<string, unknown>>
  adminRole: string
  initialCommunities?: Community[]
  currentUserId?: string
}

const navItems = [
  { id: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview', icon: BarChart2 },
  { id: 'analytics', labelAr: 'المستخدمون والاحتفاظ', labelEn: 'Active Users & Retention', icon: TrendingUp },
  { id: 'communities', labelAr: 'المجتمعات', labelEn: 'Communities', icon: Users },
  { id: 'listings', labelAr: 'الإعلانات', labelEn: 'Listings', icon: BookOpen },
  { id: 'users', labelAr: 'المستخدمون', labelEn: 'Users', icon: Shield },
  { id: 'reports', labelAr: 'البلاغات', labelEn: 'Reports', icon: AlertTriangle },
]

export function AdminDashboardClient({
  stats,
  recentListings,
  recentReports,
  recentUsers,
  adminRole,
  initialCommunities = [],
  currentUserId,
}: AdminDashboardClientProps) {
  const { lang } = useLanguage()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('overview')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [communities, setCommunities] = useState<Community[]>(initialCommunities)
  const [commSearch, setCommSearch] = useState('')
  const [commTypeFilter, setCommTypeFilter] = useState('ALL')

  // Edit community modal state
  const [editingComm, setEditingComm] = useState<Community | null>(null)
  const [editForm, setEditForm] = useState<{
    name: string
    name_ar: string
    location_text: string
    description_ar: string
    org_type: CommunityOrgType
    hub_name: string
    hub_address: string
    hub_instructions: string
    cover_image_url: string
    requires_approval: boolean
  }>({
    name: '',
    name_ar: '',
    location_text: '',
    description_ar: '',
    org_type: 'CLUB',
    hub_name: '',
    hub_address: '',
    hub_instructions: '',
    cover_image_url: '',
    requires_approval: false,
  })
  const [isSavingComm, setIsSavingComm] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)

  // Delete community modal state
  const [deletingComm, setDeletingComm] = useState<Community | null>(null)
  const [isDeletingComm, setIsDeletingComm] = useState(false)

  const handleOpenEdit = (comm: Community) => {
    setEditingComm(comm)
    setEditForm({
      name: comm.name || '',
      name_ar: comm.name_ar || '',
      location_text: comm.location_text || '',
      description_ar: comm.description_ar || comm.description || '',
      org_type: (comm.org_type || 'CLUB') as CommunityOrgType,
      hub_name: comm.hub_name || '',
      hub_address: comm.hub_address || '',
      hub_instructions: comm.hub_instructions || '',
      cover_image_url: comm.cover_image_url || comm.banner_url || '',
      requires_approval: Boolean(comm.requires_approval || comm.is_private),
    })
    setSaveSuccessMsg(null)
  }

  const handleSaveCommunity = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingComm) return
    setIsSavingComm(true)
    try {
      const updates: Partial<Community> = {
        name: editForm.name,
        name_ar: editForm.name_ar,
        location_text: editForm.location_text?.trim() || undefined,
        description: editForm.description_ar,
        description_ar: editForm.description_ar,
        org_type: editForm.org_type,
        hub_name: editForm.hub_name,
        hub_address: editForm.hub_address,
        hub_instructions: editForm.hub_instructions,
        cover_image_url: editForm.cover_image_url,
        banner_url: editForm.cover_image_url,
        requires_approval: editForm.requires_approval,
        is_private: editForm.requires_approval,
      }
      const ok = await updateCommunityDetails(editingComm.id, updates)
      if (ok) {
        setCommunities(prev =>
          prev.map(c => (c.id === editingComm.id ? { ...c, ...updates } : c))
        )
        setSaveSuccessMsg(lang === 'ar' ? 'تم حفظ التعديلات بنجاح!' : 'Community updated successfully!')
        setTimeout(() => {
          setEditingComm(null)
          setSaveSuccessMsg(null)
        }, 1200)
      } else {
        alert(lang === 'ar' ? 'حدث خطأ أثناء حفظ التعديلات' : 'Failed to save changes')
      }
    } finally {
      setIsSavingComm(false)
    }
  }

  const handleDeleteCommunityAdmin = async () => {
    if (!deletingComm) return
    setIsDeletingComm(true)
    try {
      const ok = await deleteCommunity(deletingComm.id, currentUserId, true)
      if (ok) {
        setCommunities(prev => prev.filter(c => c.id !== deletingComm.id))
        setDeletingComm(null)
      } else {
        alert(lang === 'ar' ? 'فشل حذف المجتمع' : 'Failed to delete community')
      }
    } finally {
      setIsDeletingComm(false)
    }
  }

  const filteredCommunities = communities.filter(c => {
    const matchesType = commTypeFilter === 'ALL' || c.org_type === commTypeFilter
    const q = commSearch.trim().toLowerCase()
    if (!q) return matchesType
    const matchesSearch =
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.name_ar && c.name_ar.toLowerCase().includes(q)) ||
      (c.hub_name && c.hub_name.toLowerCase().includes(q)) ||
      (c.hub_address && c.hub_address.toLowerCase().includes(q))
    return matchesType && matchesSearch
  })

  const kpis: Array<{
    labelAr: string
    labelEn: string
    value: string | number
    icon: any
    color: string
    subtextAr?: string
    subtextEn?: string
  }> = [
    {
      labelAr: 'مستخدمون فريدون',
      labelEn: 'Unique Users',
      value: stats.total_users,
      icon: Users,
      color: 'text-blue-500',
      subtextAr: `+${stats.new_users_today || 0} اليوم`,
      subtextEn: `+${stats.new_users_today || 0} today`,
    },
    {
      labelAr: 'نشطون اليوم (DAU)',
      labelEn: 'Daily Active (DAU)',
      value: stats.dau || stats.active_users,
      icon: Activity,
      color: 'text-emerald-500',
      subtextAr: 'آخر 24 ساعة',
      subtextEn: 'Last 24 hours',
    },
    {
      labelAr: 'نشطون شهرياً (MAU)',
      labelEn: 'Monthly Active (MAU)',
      value: stats.mau || stats.total_users,
      icon: TrendingUp,
      color: 'text-teal-500',
      subtextAr: 'آخر 30 يوماً',
      subtextEn: 'Last 30 days',
    },
    {
      labelAr: 'معدل الاحتفاظ والتفاعل',
      labelEn: 'Stickiness Ratio',
      value: `${stats.stickiness_ratio || 0}%`,
      icon: Star,
      color: 'text-amber-500',
      subtextAr: 'DAU / MAU',
      subtextEn: 'DAU / MAU',
    },
    {
      labelAr: 'الإعلانات النشطة',
      labelEn: 'Active Listings',
      value: stats.active_listings,
      icon: BookOpen,
      color: 'text-green-500',
      subtextAr: `من ${stats.total_listings}`,
      subtextEn: `of ${stats.total_listings}`,
    },
    {
      labelAr: 'المعاملات',
      labelEn: 'Transactions',
      value: stats.total_transactions,
      icon: ShoppingBag,
      color: 'text-purple-500',
      subtextAr: `${stats.completed_transactions} مكتملة`,
      subtextEn: `${stats.completed_transactions} done`,
    },
  ]

  const hideListing = async (id: string) => {
    setActionLoading(id)
    await supabase.from('book_listings').update({ status: 'HIDDEN' }).eq('id', id)
    setActionLoading(null)
    window.location.reload()
  }

  const resolveReport = async (id: string) => {
    setActionLoading(id)
    await supabase.from('reports').update({ status: 'RESOLVED' }).eq('id', id)
    setActionLoading(null)
    window.location.reload()
  }

  const suspendUser = async (id: string) => {
    setActionLoading(id)
    await supabase.from('profiles').update({ is_suspended: true }).eq('id', id)
    setActionLoading(null)
    window.location.reload()
  }

  const featureListing = async (id: string) => {
    setActionLoading(id)
    const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('book_listings').update({
      is_featured: true,
      featured_until: endsAt,
    }).eq('id', id)
    setActionLoading(null)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background flex" dir="ltr">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r bg-card hidden md:flex flex-col">
        <div className="p-5 border-b">
          <Link href="/" className="flex items-center gap-2">
            <WaraqLogo size="sm" showText={true} />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-1.5 py-0.5 rounded">Admin</span>
          </Link>
        </div>
        <nav className="p-3 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left mb-1',
                activeTab === item.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {lang === 'ar' ? item.labelAr : item.labelEn}
              {item.id === 'reports' && stats.pending_reports > 0 && (
                <span className="ms-auto h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {stats.pending_reports}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <Badge variant={adminRole === 'ADMIN' ? 'default' : 'secondary'} className="w-full justify-center">
            <Shield className="h-3 w-3 me-1" />
            {adminRole}
          </Badge>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            {lang === 'ar' ? 'لوحة التحكم' : 'Admin Dashboard'}
          </h1>
          <div className="flex items-center gap-2">
            {/* Mobile nav */}
            <div className="flex md:hidden gap-1">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-colors',
                    activeTab === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">← {lang === 'ar' ? 'الموقع' : 'Site'}</Button>
            </Link>
          </div>
        </div>

        <div className="p-6">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {kpis.map(kpi => (
                  <Card key={kpi.labelEn} className="stat-card">
                    <CardContent className="p-4">
                      <div className={cn('mb-2', kpi.color)}>
                        <kpi.icon className="h-5 w-5" />
                      </div>
                      <p className="text-2xl font-extrabold">
                        {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lang === 'ar' ? kpi.labelAr : kpi.labelEn}
                      </p>
                      {(kpi.subtextAr || kpi.subtextEn) && (
                        <p className="text-[10px] text-muted-foreground/75 mt-0.5 font-medium">
                          {lang === 'ar' ? kpi.subtextAr : kpi.subtextEn}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Listings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {lang === 'ar' ? 'آخر الإعلانات' : 'Recent Listings'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentListings.slice(0, 5).map((listing: Record<string, unknown>) => (
                      <div key={listing.id as string} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {(listing.book as Record<string, string>)?.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(listing.seller as Record<string, string>)?.full_name} • {formatRelativeTime(listing.created_at as string, lang)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ms-3">
                          <Badge variant="muted" className="text-[10px]">{listing.listing_type as string}</Badge>
                          <Button size="icon-sm" variant="ghost" onClick={() => hideListing(listing.id as string)} disabled={actionLoading === listing.id as string}>
                            {listing.status === 'HIDDEN' ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </Button>
                          <Button size="icon-sm" variant="ghost" onClick={() => featureListing(listing.id as string)} disabled={actionLoading === listing.id as string}>
                            <Star className="h-3.5 w-3.5 text-amber-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Reports */}
              {stats.pending_reports > 0 && (
                <Card className="border-red-200 dark:border-red-900/50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      {lang === 'ar' ? 'بلاغات معلقة' : 'Pending Reports'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentReports.map((report: Record<string, unknown>) => (
                        <div key={report.id as string} className="flex items-start justify-between py-2 border-b last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{report.report_reason as string}</p>
                            <p className="text-xs text-muted-foreground">
                              {(report.reporter as Record<string, string>)?.full_name} • {formatRelativeTime(report.created_at as string, lang)}
                            </p>
                            {report.description != null && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{String(report.description)}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-600 ms-2"
                            onClick={() => resolveReport(report.id as string)}
                            disabled={actionLoading === report.id as string}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Analytics & Retention Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Header & GA4 Quick Action */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-primary/20 bg-primary/5">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>{lang === 'ar' ? 'تحليلات المستخدمين النشطين ومعدل الاحتفاظ' : 'Active Users, Unique Users & Retention'}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {lang === 'ar'
                      ? 'مؤشرات حية للنشاط اليومي والأسبوعي والشهري، معدل الالتصاق، وتتبع تنزيل التطبيق عبر Google Analytics 4 (GA4)'
                      : 'Live DAU/WAU/MAU metrics, stickiness ratio, and app download tracking powered by Google Analytics 4 (GA4)'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://analytics.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all"
                  >
                    <span>{lang === 'ar' ? 'فتح Google Analytics 4' : 'Open Google Analytics 4'}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* 1. Active Users Overview (DAU / WAU / MAU) */}
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <span>{lang === 'ar' ? 'المستخدمون النشطون (Active Users)' : 'Active Users (DAU / WAU / MAU)'}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="border border-border/80">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {lang === 'ar' ? 'نشطون اليوم (DAU)' : 'Daily Active Users (DAU)'}
                        </span>
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-3xl font-extrabold text-foreground mt-2">
                        {(stats.dau || stats.active_users || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lang === 'ar' ? 'مستخدمون تفاعلوا خلال آخر 24 ساعة' : 'Users active within last 24 hours'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-border/80">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {lang === 'ar' ? 'نشطون أسبوعياً (WAU)' : 'Weekly Active Users (WAU)'}
                        </span>
                        <Calendar className="h-4 w-4 text-teal-500" />
                      </div>
                      <p className="text-3xl font-extrabold text-foreground mt-2">
                        {(stats.wau || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lang === 'ar' ? 'مستخدمون تفاعلوا خلال آخر 7 أيام' : 'Users active within last 7 days'}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border border-border/80">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {lang === 'ar' ? 'نشطون شهرياً (MAU)' : 'Monthly Active Users (MAU)'}
                        </span>
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-3xl font-extrabold text-foreground mt-2">
                        {(stats.mau || stats.total_users || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {lang === 'ar' ? 'مستخدمون تفاعلوا خلال آخر 30 يوماً' : 'Users active within last 30 days'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* 2. Retention & Stickiness Index */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border border-border/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span>{lang === 'ar' ? 'معدل الالتصاق والاحتفاظ (Stickiness Ratio)' : 'User Stickiness Ratio (DAU / MAU)'}</span>
                      </span>
                      <Badge variant="outline" className="text-xs font-bold text-primary">
                        DAU / MAU
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-extrabold text-foreground">
                        {stats.stickiness_ratio || 0}%
                      </span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {(stats.stickiness_ratio || 0) >= 30
                          ? (lang === 'ar' ? 'تفاعل ممتاز 🚀' : 'Exceptional 🚀')
                          : (stats.stickiness_ratio || 0) >= 15
                          ? (lang === 'ar' ? 'جيد ومستقر ✅' : 'Healthy ✅')
                          : (lang === 'ar' ? 'قيد النمو والتحفيز 🌱' : 'Growing 🌱')}
                      </span>
                    </div>

                    <div className="w-full bg-muted rounded-full h-2.5 mt-3 overflow-hidden">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, stats.stickiness_ratio || 0))}%` }}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                      {lang === 'ar'
                        ? 'معدل الالتصاق يوضح نسبة القراء الذين يعودون يومياً مقارنة بالمستخدمين النشطين شهرياً. المعيار الذهبي للتطبيقات الاجتماعية الناجحة يتراوح بين 20% و 50%.'
                        : 'Stickiness ratio calculates the percentage of monthly users returning daily. A ratio of 20%+ represents healthy habit-forming engagement.'}
                    </p>
                  </CardContent>
                </Card>

                {/* 3. Unique Users & Acquisition */}
                <Card className="border border-border/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <span>{lang === 'ar' ? 'المستخدمون الفريدون ونمو الحسابات' : 'Unique Users & Account Growth'}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {lang === 'ar' ? 'إجمالي المستخدمين الفريدين' : 'Total Unique Users'}
                        </span>
                        <p className="text-xl font-bold mt-1 text-foreground">
                          {stats.total_users.toLocaleString()}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {lang === 'ar' ? 'مستخدمون جدد اليوم' : 'New Users Today'}
                        </span>
                        <p className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
                          +{stats.new_users_today || 0}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {lang === 'ar' ? 'جدد خلال 7 أيام' : 'New Users (7 Days)'}
                        </span>
                        <p className="text-xl font-bold mt-1 text-foreground">
                          +{stats.new_users_week || 0}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-muted/40 border border-border/60">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {lang === 'ar' ? 'جدد خلال 30 يوماً' : 'New Users (30 Days)'}
                        </span>
                        <p className="text-xl font-bold mt-1 text-foreground">
                          +{stats.new_users_month || 0}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-3">
                      {lang === 'ar'
                        ? 'يتم ربط كل مستخدم بحساب ثابت (User-ID) في Google Analytics 4 لمنع تكرار نفس المستخدم عند دخوله من أجهزة مختلفة.'
                        : 'Every user is tied to their User-ID in Google Analytics 4 for cross-device deduplication.'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 4. App Download & PWA Tracking Actions */}
              <Card className="border border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Download className="h-4 w-4 text-primary" />
                    <span>{lang === 'ar' ? 'تتبع تثبيت وتنزيل التطبيق (Google Tag Actions)' : 'PWA App Install & Download Tracking'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                      <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                        <Smartphone className="h-4 w-4 text-primary" />
                        <span>app_install</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {lang === 'ar'
                          ? 'حدث قياسي يتم إرساله إلى GA4 تلقائياً عند إتمام المستخدم تثبيت تطبيق وَرَق على شاشة هاتفه أو حاسوبه.'
                          : 'Standard GA4 event sent automatically when the user confirms app installation on their device.'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                      <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                        <Download className="h-4 w-4 text-emerald-500" />
                        <span>app_download</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {lang === 'ar'
                          ? 'حدث مخصص يسجل النقر على أزرار التنزيل وبانر الـ PWA لمعرفة نسبة تحول الزوار إلى مستخدمين للتطبيق.'
                          : 'Custom event tracking clicks on install buttons & PWA prompts to measure install conversion rate.'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-border/60 bg-muted/20">
                      <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>user_identified (User-ID)</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {lang === 'ar'
                          ? 'ربط جلسة الزائر بهويته الدائمة في GA4 لتتبع رحلة عودته ونسبة احتفاظه (Retention Cohorts).'
                          : 'Links sessions to unique User-ID in GA4 for persistent cohort retention analysis.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 5. Google Analytics 4 (GA4) Practical Guide */}
              <Card className="border border-primary/20 bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center justify-between">
                    <span>{lang === 'ar' ? 'دليل استخراج تقارير الاحتفاظ والمستخدمين من Google Analytics 4' : 'GA4 Step-by-Step Reporting Guide'}</span>
                    <Badge variant="outline" className="text-xs">GA4 Guide</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-muted-foreground">
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <p className="font-bold text-foreground mb-1">
                      {lang === 'ar' ? '1. تقرير الاحتفاظ بالدفعات (Cohort Retention):' : '1. Cohort Retention Report:'}
                    </p>
                    <p>
                      {lang === 'ar'
                        ? 'ادخل إلى GA4 > التقارير (Reports) > دورة الحياة (Lifecycle) > الاحتفاظ (Retention). ستجد رسماً بيانياً يوضح نسبة عودة المستخدمين في اليوم 1، اليوم 7، اليوم 14، واليوم 30.'
                        : 'Navigate to GA4 > Reports > Lifecycle > Retention to view cohort curves for Day 1, Day 7, Day 14, and Day 30.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border">
                    <p className="font-bold text-foreground mb-1">
                      {lang === 'ar' ? '2. توحيد المستخدمين الفريدين (User-ID Reporting Identity):' : '2. Deduplicate Unique Users (User-ID):'}
                    </p>
                    <p>
                      {lang === 'ar'
                        ? 'في GA4 ادخل إلى المسؤول (Admin) > هوية التقارير (Reporting Identity) > اختر "مدمج" (Blended). هذا يدمج زيارات نفس العضو عبر هاتفه والكمبيوتر كشخص فريد واحد.'
                        : 'In GA4 Admin > Reporting Identity, select "Blended" to stitch visits across mobile web, desktop, and installed PWA.'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border">
                    <p className="font-bold text-foreground mb-1">
                      {lang === 'ar' ? '3. إحصائيات تنزيل التطبيق (App Download Events):' : '3. App Download & Install Conversions:'}
                    </p>
                    <p>
                      {lang === 'ar'
                        ? 'في GA4 ادخل إلى التقارير > المشاركة (Engagement) > الأحداث (Events) > ابحث عن حدث app_install أو app_download، ويمكنك تعيينه كـ "هدف / تحويل" (Conversion).'
                        : 'In GA4 Reports > Engagement > Events, inspect app_install and app_download events, and mark them as Key Events / Conversions.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Communities Tab */}
          {activeTab === 'communities' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <span>{lang === 'ar' ? 'إدارة المجتمعات ونقاط اللقاء الآمنة' : 'Manage Communities & Safe Hubs'}</span>
                    <Badge variant="muted" className="text-xs">{filteredCommunities.length}</Badge>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {lang === 'ar'
                      ? 'تعديل وحذف وإدارة جميع مجتمعات القراءة والمكتبات والجامعات ونقاط اللقاء في مصر'
                      : 'Edit, delete, and oversee reading communities, clubs, and safe hub spots'}
                  </p>
                </div>
                <Link href="/communities">
                  <Button size="sm" className="font-bold text-xs gap-1.5 cursor-pointer">
                    <Plus className="h-4 w-4" />
                    <span>{lang === 'ar' ? 'إنشاء مجتمع جديد' : 'New Community'}</span>
                  </Button>
                </Link>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder={lang === 'ar' ? 'بحث بالاسم، الحي، أو نقطة اللقاء...' : 'Search communities, hubs, or areas...'}
                    value={commSearch}
                    onChange={e => setCommSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {commSearch && (
                    <button
                      type="button"
                      onClick={() => setCommSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { val: 'ALL', ar: 'الكل', en: 'All' },
                    { val: 'CLUB', ar: 'نوادي قراءة', en: 'Clubs' },
                    { val: 'NEIGHBORHOOD', ar: 'أحياء', en: 'Neighborhoods' },
                    { val: 'UNIVERSITY', ar: 'جامعات', en: 'Universities' },
                    { val: 'COMPANY', ar: 'شركات', en: 'Companies' },
                  ].map(tab => (
                    <button
                      key={tab.val}
                      type="button"
                      onClick={() => setCommTypeFilter(tab.val)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                        commTypeFilter === tab.val
                          ? 'bg-primary text-primary-foreground font-bold'
                          : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      {lang === 'ar' ? tab.ar : tab.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Communities Table */}
              <div className="rounded-xl border overflow-hidden bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-start p-3 font-semibold text-xs">{lang === 'ar' ? 'المجتمع' : 'Community'}</th>
                      <th className="text-start p-3 font-semibold text-xs">{lang === 'ar' ? 'التصنيف' : 'Type'}</th>
                      <th className="text-start p-3 font-semibold text-xs">{lang === 'ar' ? 'نقطة اللقاء الآمنة' : 'Safe Hub'}</th>
                      <th className="text-start p-3 font-semibold text-xs">{lang === 'ar' ? 'الأعضاء' : 'Members'}</th>
                      <th className="text-start p-3 font-semibold text-xs">{lang === 'ar' ? 'الخصوصية' : 'Access'}</th>
                      <th className="text-start p-3 font-semibold text-xs">{lang === 'ar' ? 'إجراءات الإدارة' : 'Admin Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCommunities.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                          {lang === 'ar' ? 'لم يتم العثور على أي مجتمعات مطابقة' : 'No matching communities found'}
                        </td>
                      </tr>
                    ) : (
                      filteredCommunities.map(c => (
                        <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <Link
                                href={`/communities/${c.slug}`}
                                className="h-9 w-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm overflow-hidden border hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
                                title={c.name}
                              >
                                {c.avatar_url || c.logo_url ? (
                                  <img src={c.avatar_url || c.logo_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  '🌳'
                                )}
                              </Link>
                              <div className="min-w-0">
                                <Link
                                  href={`/communities/${c.slug}`}
                                  className="font-bold text-xs hover:text-primary transition-colors flex items-center gap-1 group"
                                >
                                  <span className="truncate">{lang === 'ar' ? c.name_ar || c.name : c.name || c.name_ar}</span>
                                  <Eye className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                </Link>
                                <p className="text-[11px] text-muted-foreground truncate font-mono">
                                  /communities/{c.slug}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="muted" className="text-[10px] uppercase font-bold">
                              {c.org_type || 'CLUB'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {c.hub_name ? (
                              <div className="text-xs max-w-[200px]">
                                <p className="font-semibold text-foreground flex items-center gap-1 truncate">
                                  <Coffee className="h-3 w-3 text-amber-600 shrink-0" />
                                  <span className="truncate">{c.hub_name}</span>
                                </p>
                                {c.hub_address && (
                                  <p className="text-[10px] text-muted-foreground truncate">{c.hub_address}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="text-xs font-semibold">{c.member_count ?? 1}</span>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={c.requires_approval || c.is_private ? 'warning' : 'success'}
                              className="text-[10px]"
                            >
                              {c.requires_approval || c.is_private
                                ? (lang === 'ar' ? 'خاص (موافقة)' : 'Approval')
                                : (lang === 'ar' ? 'عام' : 'Open')}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <Link href={`/communities/${c.slug}`}>
                                <Button size="icon-sm" variant="ghost" title={lang === 'ar' ? 'عرض المجتمع' : 'View'}>
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => handleOpenEdit(c)}
                                title={lang === 'ar' ? 'تعديل بيانات المجتمع' : 'Edit community'}
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => setDeletingComm(c)}
                                title={lang === 'ar' ? 'حذف المجتمع نهائياً' : 'Delete community'}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">{lang === 'ar' ? 'أحدث المستخدمين' : 'Recent Users'}</h2>
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-start p-3 font-semibold">{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                      <th className="text-start p-3 font-semibold">{lang === 'ar' ? 'الدور' : 'Role'}</th>
                      <th className="text-start p-3 font-semibold">{lang === 'ar' ? 'الكتب' : 'Books'}</th>
                      <th className="text-start p-3 font-semibold">{lang === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</th>
                      <th className="text-start p-3 font-semibold">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((u: Record<string, unknown>) => (
                      <tr key={u.id as string} className="border-t hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <p className="font-medium">{u.full_name as string ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{u.email as string}</p>
                        </td>
                        <td className="p-3">
                          <Badge variant={u.role === 'ADMIN' ? 'default' : 'muted'} className="text-[10px]">
                            {u.role as string}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">{u.total_listings as number ?? 0}</td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {formatRelativeTime(u.created_at as string, lang)}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {!(u.is_suspended as boolean) && (
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => suspendUser(u.id as string)}
                                disabled={actionLoading === u.id as string}
                                title="Suspend user"
                              >
                                <Shield className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {u.is_suspended as boolean && (
                              <Badge variant="destructive" className="text-[10px]">Suspended</Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">{lang === 'ar' ? 'أحدث الإعلانات' : 'Recent Listings'}</h2>
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-start p-3 font-semibold">Book</th>
                      <th className="text-start p-3 font-semibold">Seller</th>
                      <th className="text-start p-3 font-semibold">Type</th>
                      <th className="text-start p-3 font-semibold">Status</th>
                      <th className="text-start p-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentListings.map((listing: Record<string, unknown>) => (
                      <tr key={listing.id as string} className="border-t hover:bg-muted/20 transition-colors">
                        <td className="p-3">
                          <p className="font-medium">{(listing.book as Record<string, string>)?.title}</p>
                        </td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {(listing.seller as Record<string, string>)?.full_name}
                        </td>
                        <td className="p-3">
                          <Badge variant="muted" className="text-[10px]">{listing.listing_type as string}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={listing.status === 'ACTIVE' ? 'success' : listing.status === 'HIDDEN' ? 'warning' : 'muted'}
                            className="text-[10px]"
                          >
                            {listing.status as string}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Button size="icon-sm" variant="ghost" onClick={() => hideListing(listing.id as string)} disabled={actionLoading === listing.id as string}>
                              <EyeOff className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon-sm" variant="ghost" onClick={() => featureListing(listing.id as string)} disabled={actionLoading === listing.id as string}>
                              <Star className="h-3.5 w-3.5 text-amber-500" />
                            </Button>
                            <Link href={`/books/${listing.id as string}`}>
                              <Button size="icon-sm" variant="ghost">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">{lang === 'ar' ? 'البلاغات' : 'Reports'}</h2>
              {recentReports.length === 0 ? (
                <div className="empty-state">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                  <p>{lang === 'ar' ? 'مفيش بلاغات معلقة 🎉' : 'No pending reports 🎉'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentReports.map((report: Record<string, unknown>) => (
                    <Card key={report.id as string} className="border-red-100 dark:border-red-900/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="destructive" className="text-[10px]">{report.report_type as string}</Badge>
                              <Badge variant="warning" className="text-[10px]">{report.report_reason as string}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{report.description as string}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {lang === 'ar' ? 'مُبلَّغ من: ' : 'Reported by: '}
                              {(report.reporter as Record<string, string>)?.full_name}
                              {' • '}{formatRelativeTime(report.created_at as string, lang)}
                            </p>
                          </div>
                          <div className="flex gap-2 ms-3">
                            <Button size="sm" variant="outline" className="text-green-600" onClick={() => resolveReport(report.id as string)} disabled={actionLoading === report.id as string}>
                              <CheckCircle2 className="h-4 w-4 me-1" />
                              {lang === 'ar' ? 'حل' : 'Resolve'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Admin Edit Community Modal */}
      {editingComm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-card border-2 border-border shadow-2xl overflow-hidden text-foreground">
            <div className="p-4 sm:p-5 border-b bg-muted/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-primary" />
                <h3 className="text-base font-black">
                  {lang === 'ar' ? 'تعديل بيانات المجتمع' : 'Edit Community Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingComm(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="m-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCommunity} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    {lang === 'ar' ? 'الاسم بالعربية' : 'Name (Arabic)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name_ar}
                    onChange={e => setEditForm(prev => ({ ...prev, name_ar: e.target.value }))}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    {lang === 'ar' ? 'الاسم بالإنجليزية' : 'Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    {lang === 'ar' ? 'نوع الكيان التنظيمي' : 'Organization Type'}
                  </label>
                  <select
                    value={editForm.org_type}
                    onChange={e => setEditForm(prev => ({ ...prev, org_type: e.target.value as CommunityOrgType }))}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="CLUB">نادي قراءة (Reading Club)</option>
                    <option value="NEIGHBORHOOD">حي سكني (Neighborhood)</option>
                    <option value="UNIVERSITY">جامعة / طلاب (University)</option>
                    <option value="COMPANY">شركة (Company)</option>
                    <option value="SCHOOL">مدرسة (School)</option>
                    <option value="OTHER">أخرى (Other)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    {lang === 'ar' ? 'رابط صورة الغلاف' : 'Cover Image URL'}
                  </label>
                  <input
                    type="url"
                    value={editForm.cover_image_url}
                    onChange={e => setEditForm(prev => ({ ...prev, cover_image_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground block">
                  {lang === 'ar' ? 'وصف المجتمع' : 'Description'}
                </label>
                <textarea
                  rows={2}
                  value={editForm.description_ar}
                  onChange={e => setEditForm(prev => ({ ...prev, description_ar: e.target.value }))}
                  className="w-full rounded-xl border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground block">
                    {lang === 'ar' ? 'المدينة والمنطقة العامة (الموقع)' : 'Location / Area'}
                  </label>
                  <input
                    type="text"
                    value={editForm.location_text}
                    onChange={e => setEditForm(prev => ({ ...prev, location_text: e.target.value }))}
                    placeholder={lang === 'ar' ? 'مثال: المعادي، القاهرة' : 'e.g., Maadi, Cairo'}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="border-t pt-3 space-y-3">
                  <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Coffee className="h-3.5 w-3.5" />
                    <span>{lang === 'ar' ? 'نقطة اللقاء الآمنة (Safe Meetup Hub)' : 'Designated Safe Meetup Hub'}</span>
                  </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground block">
                      {lang === 'ar' ? 'اسم المكان (المقهى / المكتبة)' : 'Hub Name'}
                    </label>
                    <input
                      type="text"
                      value={editForm.hub_name}
                      onChange={e => setEditForm(prev => ({ ...prev, hub_name: e.target.value }))}
                      className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground block">
                      {lang === 'ar' ? 'عنوان المكان' : 'Hub Address'}
                    </label>
                    <input
                      type="text"
                      value={editForm.hub_address}
                      onChange={e => setEditForm(prev => ({ ...prev, hub_address: e.target.value }))}
                      className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground block">
                    {lang === 'ar' ? 'تعليمات وإرشادات المقابلة' : 'Hub Instructions'}
                  </label>
                  <input
                    type="text"
                    value={editForm.hub_instructions}
                    onChange={e => setEditForm(prev => ({ ...prev, hub_instructions: e.target.value }))}
                    className="w-full rounded-xl border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="adminCommApproval"
                  checked={editForm.requires_approval}
                  onChange={e => setEditForm(prev => ({ ...prev, requires_approval: e.target.checked }))}
                  className="rounded accent-primary cursor-pointer"
                />
                <label htmlFor="adminCommApproval" className="text-xs font-semibold text-foreground cursor-pointer">
                  {lang === 'ar' ? 'يتطلب موافقة الأدمن لانضمام الأعضاء (مجتمع خاص)' : 'Requires admin approval for members (Private)'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingComm(null)}
                  className="cursor-pointer text-xs"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={isSavingComm}
                  className="cursor-pointer text-xs font-bold gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Delete Community Modal */}
      {deletingComm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-card border-2 border-red-500/40 shadow-2xl p-6 text-foreground space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black">
                  {lang === 'ar' ? 'تأكيد حذف المجتمع نهائياً' : 'Confirm Delete Community'}
                </h3>
                <p className="text-xs text-muted-foreground">{deletingComm.name_ar || deletingComm.name}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === 'ar'
                ? 'هل أنت متأكد من رغبتك كمسؤول في حذف هذا المجتمع نهائياً؟ سيتم مسح المنشورات ورفوف الكتب وقائمة الأعضاء المرتبطة به.'
                : 'Are you sure you want to delete this community? All posts, shelf books, and member associations will be permanently removed.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingComm(null)}
                className="cursor-pointer text-xs"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                loading={isDeletingComm}
                onClick={handleDeleteCommunityAdmin}
                className="cursor-pointer text-xs font-bold gap-1 bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{lang === 'ar' ? 'تأكيد الحذف النهائي' : 'Confirm Delete'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
