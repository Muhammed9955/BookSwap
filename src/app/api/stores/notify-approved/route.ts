import { NextResponse } from 'next/server'
import { sendStoreApprovedEmail } from '@/lib/email/resend-service'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { to, ownerName, storeName, storeSlug } = body

    if (!to || !storeName) {
      return NextResponse.json({ error: 'Missing required email or store details' }, { status: 400 })
    }

    const host = req.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const dashboardUrl = `${protocol}://${host}/store-dashboard`

    const res = await sendStoreApprovedEmail({
      to,
      ownerName: ownerName || 'شريكنا العزيز',
      storeName,
      storeSlug: storeSlug || 'your-store',
      dashboardUrl,
    })

    return NextResponse.json(res)
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || 'Internal Server Error' }, { status: 500 })
  }
}
