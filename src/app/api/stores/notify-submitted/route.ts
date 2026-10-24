import { NextResponse } from 'next/server'
import { sendStoreSubmittedEmail } from '@/lib/email/resend-service'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { to, ownerName, storeName, phone, whatsapp, city, storeType } = body

    if (!to || !storeName) {
      return NextResponse.json({ error: 'Missing required email or store details' }, { status: 400 })
    }

    const res = await sendStoreSubmittedEmail({
      to,
      ownerName: ownerName || 'شريكنا العزيز',
      storeName,
      phone,
      whatsapp,
      city,
      storeType,
    })

    return NextResponse.json(res)
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || 'Internal Server Error' }, { status: 500 })
  }
}
