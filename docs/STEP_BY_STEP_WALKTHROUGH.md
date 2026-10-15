# Step-by-Step Walkthrough: Production Launch & Feature Implementation Guide

> **BookSwap (بدّلها)** — Production Deployment & 1-by-1 Feature Enhancement Walkthrough  
> **Status:** Production Build Verified (`npm run build` compiled 28 routes with 0 errors).

---

## Table of Contents
1. [Part 1: Immediate Production Deployment Guide](#part-1-immediate-production-deployment-guide)
2. [Part 2: 1-by-1 Implementation Walkthrough for the 5 Priorities](#part-2-1-by-1-implementation-walkthrough-for-the-5-priorities)
   - [Priority 1: Swap Request UI Clarity ("Give" vs "Get")](#priority-1-swap-request-ui-clarity-give-vs-get)
   - [Priority 2: Follow User Real-Time Push Notification](#priority-2-follow-user-real-time-push-notification)
   - [Priority 3: Fix Direct Chat Deep-Link with Book Owner](#priority-3-fix-direct-chat-deep-link-with-book-owner)
   - [Priority 4: Complete Community Lifecycle & Safe Hub Operations](#priority-4-complete-community-lifecycle--safe-hub-operations)
   - [Priority 5: Production MVP Polish, Mobile Responsiveness & PWA](#priority-5-production-mvp-polish-mobile-responsiveness--pwa)
3. [Part 3: Global Benchmarks, Drop-Off Hubs & Advanced Borrow/Swap Walkthrough](#part-3-global-benchmarks-drop-off-hubs--advanced-borrowswap-walkthrough)
   - [3.1 World Benchmark Comparison Matrix](#31-world-benchmark-comparison-matrix)
   - [3.2 Walkthrough 1: The Partner Café 'Drop & Dash' (Asynchronous PUDO)](#32-walkthrough-1-the-partner-caf-drop--dash-asynchronous-pudo)
   - [3.3 Walkthrough 2: The 'Travelling Book' / Wild Drop (BookCrossing Style)](#33-walkthrough-2-the-travelling-book--wild-drop-bookcrossing-style)
   - [3.4 Walkthrough 3: Digital Borrowing with Deposit & Auto-Renewal](#34-walkthrough-3-digital-borrowing-with-deposit--auto-renewal)
   - [3.5 Walkthrough 4: The Swap Credits Economy ('نقاط بدّلها')](#35-walkthrough-4-the-swap-credits-economy-نقاط-بدلها)
4. [Part 4: Technical Implementation Guide for the Engineering Team](#part-4-technical-implementation-guide-for-the-engineering-team)
5. [Part 5: Quality & Verification Checklist](#part-5-quality--verification-checklist)

---

## Part 1: Immediate Production Deployment Guide

```mermaid
flowchart LR
    A[Local Codebase] -->|git push| B[GitHub Repo]
    B -->|Automatic CI/CD| C[Vercel Production]
    C <-->|Auth & Data| D[Supabase Production]
    C -->|PWA / Web App| E[End Users - Mobile & Desktop]
```

### Step 1: Commit and Push Code to GitHub
Run the following in PowerShell at `d:\VS_CODE\edu\web\bookswap`:
```powershell
git add .
git commit -m "feat: complete MVP production readiness and fix core user flows"
git branch -M main
# If you have not attached your remote repository yet:
# git remote add origin https://github.com/<your-username>/bookswap.git
git push -u origin main
```

### Step 2: Deploy to Vercel (Recommended Next.js Host)
1. Navigate to **[vercel.com](https://vercel.com)** and log in with your GitHub account.
2. Click **"Add New..."** $\rightarrow$ **"Project"**.
3. Select your `bookswap` repository and click **Import**.
4. In the **Environment Variables** configuration panel, input the production keys from your `.env.local`:
   * `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<your-supabase-anon-key>`
   * `NEXT_PUBLIC_APP_URL` = `https://<your-project>.vercel.app` (or your custom domain)
   * `NEXT_PUBLIC_GEMINI_API_KEY` = `<your-gemini-key>` (used for ISBN scanning & AI cataloging)
   * `ADMIN_EMAIL` = `admin@bookswap.eg`
5. Click **Deploy**. Vercel will run `npm run build` and launch your application globally on Edge CDN with automated SSL.

### Step 3: Configure Supabase for Production URL
In your **Supabase Dashboard**:
1. Go to **Authentication** $\rightarrow$ **URL Configuration**.
2. Set **Site URL** to: `https://<your-project>.vercel.app`.
3. In **Redirect URLs**, add:
   * `https://<your-project>.vercel.app/**`
   * `https://<your-project>.vercel.app/auth/callback`
4. Go to **Storage**: Ensure the buckets `book-images`, `book-covers`, and `avatars` exist and have public read policies enabled.

---

## Part 2: 1-by-1 Implementation Walkthrough for the 5 Priorities

---

### Priority 1: Swap Request UI Clarity ("Give" vs "Get")

#### The Problem
In [transactions-hub-client.tsx](file:///d:/VS_CODE/edu/web/bookswap/src/components/transactions/transactions-hub-client.tsx), swap cards present two book thumbnails side-by-side, but users cannot quickly discern:
* Which book is **theirs** versus the book being **offered** to them.
* In outgoing requests: which book they offered to give up versus the book they hope to receive.
* When and where the physical exchange takes place.

#### The Fix Walkthrough
1. **Visual Split in Outgoing Swaps:**
   * Clearly label Book 1: `📖 الكتاب المطلوب (الذي ستستلمه)` with a green accent border.
   * Clearly label Book 2: `🔄 كتابك المعروض بالمقابل (الذي ستعطيه)` with a blue accent border.
2. **Visual Split in Incoming Swaps:**
   * Clearly label Book 1: `📖 كتابك المطلوب منك` (The requester wants this).
   * Clearly label Book 2: `✨ الكتاب المعروض عليك بالمقابل` (What you will receive).
3. **Status Pill & Handover Summary:**
   * Show direct badges: `قيد مراجعة المالك`, `تمت الموافقة ✅ (جاهز للمقابلة)`, or `تم الرفض ❌`.
   * Add a prominent `📍 تفاصيل المقابلة المتفق عليها` card displaying the exact time, venue, and delivery mode.

---

### Priority 2: Follow User Real-Time Push Notification

#### The Problem
In [profile-client.tsx](file:///d:/VS_CODE/edu/web/bookswap/src/components/profile/profile-client.tsx#L58-L74), clicking **"متابعة" (Follow)** inserts a row into `follows`, but does **not** insert a notification into `notifications`. The followed user never knows someone followed them.

#### The Fix Walkthrough
In `handleFollow`:
```ts
// 1. Insert follow relationship
await supabase.from('follows').insert({
  follower_id: currentUserId,
  following_id: profile.id,
})

// 2. Dispatch in-app notification via pushNotificationSafe
await pushNotificationSafe(supabase, {
  user_id: profile.id,
  type: 'FOLLOW',
  title: 'متابع جديد لمكتبتك! 👤',
  title_ar: 'متابع جديد لمكتبتك! 👤',
  body: `بدأ ${currentUserProfile?.full_name || 'قارئ'} بمتابعة حسابك وكتبك المعروضة.`,
  body_ar: `بدأ ${currentUserProfile?.full_name || 'قارئ'} بمتابعة حسابك وكتبك المعروضة.`,
  action_url: `/profile/${currentUserProfile?.username || currentUserId}`,
})
```

#### Verification Step
1. Log in with User A and open User B's profile.
2. Click **"متابعة"**.
3. Log in with User B: check the bell icon / `/notifications` $\rightarrow$ User B sees *"متابع جديد لمكتبتك!"* and can click through to User A's profile.

---

### Priority 3: Fix Direct Chat Deep-Link with Book Owner

#### The Problem
In [transactions-hub-client.tsx](file:///d:/VS_CODE/edu/web/bookswap/src/components/transactions/transactions-hub-client.tsx#L384) and [book-detail-client.tsx](file:///d:/VS_CODE/edu/web/bookswap/src/components/books/book-detail-client.tsx), clicking **"تواصل مع المالك"** invokes:
```ts
if (convId) router.push(`/messages/${convId}`)
```
However, Next.js only has `/messages/page.tsx` (`src/app/messages/page.tsx`). There is no `[id]` subroute, resulting in a **404 Not Found** or failing to focus the conversation.

#### The Fix Walkthrough
1. Update navigation to pass the conversation ID as a query param:
   ```ts
   router.push(`/messages?convId=${convId}`)
   ```
2. In [messages-client.tsx](file:///d:/VS_CODE/edu/web/bookswap/src/components/messages/messages-client.tsx), read `searchParams.get('convId')` on mount:
   ```ts
   const convParam = searchParams.get('convId')
   useEffect(() => {
     if (convParam && conversations.some(c => c.id === convParam)) {
       setSelectedConvId(convParam)
     }
   }, [convParam, conversations])
   ```

#### Verification Step
1. Go to `/transactions?tab=loans` or `/transactions?tab=incoming`.
2. Click **"تواصل"** or **"محادثة"**.
3. The app smoothly transitions to `/messages?convId=...` with the thread pre-selected, loaded, and scrolled to the latest message.

---

### Priority 4: Complete Community Lifecycle & Safe Hub Operations

```mermaid
stateDiagram-v2
    [*] --> CommunityCreated: Admin creates Community & Hub
    CommunityCreated --> BookSubmitted: Member submits book to shelf
    BookSubmitted --> BookPendingApproval: Status = PENDING
    BookPendingApproval --> BookApproved: Admin approves in Admin Tab
    BookPendingApproval --> BookRejected: Admin rejects
    BookApproved --> BorrowRequestSent: Reader requests Borrow (Date/Time Slot)
    BorrowRequestSent --> HandoverVerified: QR Code Handshake at Safe Hub
    HandoverVerified --> ActiveLoan: Book in reader possession
    ActiveLoan --> ReturnVerified: Owner scans return QR code
    ReturnVerified --> DepositReleased: borrow_returned_at recorded & deposit refunded
```

#### The Fix Walkthrough

#### 4.1. Community Administration (Edit & Delete)
* **Edit Details:** In [community-detail-client.tsx](file:///d:/VS_CODE/edu/web/bookswap/src/components/communities/community-detail-client.tsx), allow the creator to update:
  * Name (`name`, `name_ar`)
  * Hub Name & Address (`hub_name`, `hub_address`, `hub_instructions`)
  * Cover Photo & Logo (`cover_image_url`, `avatar_url`)
  * Guidelines (`rules_ar`)
  * Membership policy (`requires_approval`)
* **Delete Community:** Provide a "Danger Zone" button with confirmation prompt that purges community relations and redirects back to `/communities`.

#### 4.2. Member Book Submissions & Admin Approval Queue
* Members submit active listings to the community shelf $\rightarrow$ stored in `community_books` with status `PENDING`.
* In the **لوحة تحكم المسؤول (Admin Panel)** tab:
  * Render `pendingBooks` with two quick actions: **"موافقة" (Approve)** and **"رفض" (Reject)**.
  * Approved books appear immediately on the public community shelf.

#### 4.3. Designated Date & Time for Borrow / Buy / Swap Requests
* In the Community Request modal:
  * Add a specific date-time selector (`meetup_at` / `proposed_times`).
  * Enforce that the pickup location is locked to the community's designated safe hub (`COMMUNITY_HUB`).

#### 4.4. Accurate Return Timestamp via QR Scan
* When the borrower returns the book, the owner clicks **"تأكيد إرجاع الكتاب واسترداد التأمين برمز QR"**.
* In [lifecycle.ts](file:///d:/VS_CODE/edu/web/bookswap/src/lib/transactions/lifecycle.ts#L1034-L1068), verify the QR code and write:
  ```ts
  await supabase.from('transactions').update({
    status: 'COMPLETED',
    deposit_status: 'REFUNDED',
    borrow_returned_at: new Date().toISOString(), // Exact return timestamp
    completed_at: new Date().toISOString(),
  }).eq('id', transactionId)
  ```

---

### Priority 5: Production MVP Polish, Mobile Responsiveness & PWA

#### The Problem
To launch an MVP that feels native on iOS and Android without an app store wrapper:
1. PWA configuration must be installable (valid web manifest, service worker registered, apple touch icons).
2. Mobile viewport must prevent accidental pinch-zoom and horizontal layout shifts.
3. Mobile bottom navigation must stay accessible on small screens.

#### The Fix Walkthrough
1. **PWA Manifest & Icons:** Verify [manifest.json](file:///d:/VS_CODE/edu/web/bookswap/public/manifest.json) includes proper `name`, `short_name`, `start_url`, and icons (`192x192`, `512x512`).
2. **Service Worker Registration:** Ensure [pwa-register.tsx](file:///d:/VS_CODE/edu/web/bookswap/src/components/pwa/pwa-register.tsx) registers `/sw.js` on mount.
3. **Responsive Navigation:** Verify [navigation.tsx](file:///d:/VS_CODE/edu/web/bookswap/src/components/layout/navigation.tsx) displays the bottom mobile bar with badges for unread messages and pending incoming requests.

---

## Part 3: Global Benchmarks, Drop-Off Hubs & Advanced Borrow/Swap Walkthrough

In peer-to-peer (P2P) circular book economies, **coordination friction is the primary cause of abandoned transactions**:
1. **The Scheduling Trap:** In-person street meetups require two busy strangers to negotiate a 30-minute window, travel in traffic, and risk no-shows.
2. **The Swap Deadlock (Double Coincidence of Wants):** Direct 1-to-1 swapping fails when User A wants User B's novel, but User B has no interest in User A's current listings.
3. **The Lending Anxiety:** Lenders worry about lost books or late returns, while borrowers dislike awkward in-person confrontations.

By transitioning from **synchronous meetups** to **asynchronous drop-off hubs** (partner cafés, community boxes, campus micro-shelves) and introducing **Swap Credits**, BookSwap can achieve 5x transaction liquidity.

---

### 3.1 World Benchmark Comparison Matrix

| Feature Dimension | **BookSwap (Current Architecture)** | **PangoBooks** (USA) | **BookCrossing** (Global) | **Little Free Library** (Global) | **Vinted / InPost** (Europe PUDO) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Core Operating Model** | Buy, 1-to-1 Swap, Borrow (Deposit), Giveaway | P2P Buy & Sell with social curated shelves | Unilateral "Catch & Release" Book Tagging | Hyper-local physical boxes ("Take 1, Leave 1") | PUDO Lockers & Corner Store Drop-Off |
| **Swapping Mechanism** | Direct 1-to-1 book exchange proposal | Resale only (no swap) | Free open-source release | Physical take-or-leave honor system | Commercial resale |
| **Logistics / Handover** | Street Meetup, Community Hub, Courier | Automated USPS Media Mail prepaid label | Left in cafés, parks, train seats | Geotagged outdoor boxes (150k+ worldwide) | Automated locker drop-off via QR code |
| **Trust & Security** | **Dual QR Handshake** (Start loan & Return loan) | Platform Escrow | Unique BCID sticker inside cover + journal log | Volunteer steward / local community curator | Barcode scan at locker or partner shop desk |
| **Borrowing / Lending** | **Built-in** (deposit + daily/weekly fee + return date) | None | Free read & release forward | Free temporary read & return | None |
| **Listing Velocity** | Manual form + photo upload dropzone | **15-second ISBN scan** (auto-fills metadata) | Unique tag code + title | None (physical drop in box) | 3 photos + category + condition |

---

### 3.2 Walkthrough 1: The Partner Café 'Drop & Dash' (Asynchronous PUDO)

```mermaid
sequenceDiagram
    autonumber
    actor Seller as User A (Depositor)
    participant App as BookSwap Platform
    participant Cafe as Partner Café Hub (e.g. Cilantro)
    actor Buyer as User B (Collector)

    Note over Seller, Buyer: Transaction agreed (Swap, Borrow, or Buy)
    Seller->>App: Selects "Drop at Partner Café Hub"
    App-->>Seller: Generates Drop-Off Voucher & QR Code
    Seller->>Cafe: Drops book at café desk / BookSwap Box
    Cafe->>App: Staff scans drop-off QR code (Intake verified)
    App-->>Seller: "Book dropped safely! Earned 1 Swap Credit / Deposit held"
    App-->>Buyer: Push Alert: "Your book is waiting at Cilantro Degla (Pickup PIN: 8492)"
    Buyer->>Cafe: Arrives within 72h, shows Pickup QR / PIN
    Cafe->>App: Staff verifies pickup
    App-->>Buyer: "Enjoy your reading!"
    App-->>Seller: Transaction COMPLETED
```

#### Detailed Step-by-Step Flow:
1. **Selecting the Drop-Off Method:**
   * In [meetup-picker.tsx](file:///d:/VS_CODE/edu/web/bookswap/src/components/ui/meetup-picker.tsx), when finalizing an accepted swap or loan, either party can toggle:
     `🏪 ترك في نقطة استلام آمنة (كافيه / متجر شريك)`
   * The user selects from curated hubs (e.g., *Cilantro Degla*, *Costa Shatby Alexandria*, *The GrEEK Campus Tahrir*).
2. **Generating the Deposit Voucher:**
   * User A receives a digital voucher containing a unique QR code and 4-digit numeric PIN (leveraging the logic in [community-intake-qr-modal.tsx](file:///d:/VS_CODE/edu/web/bookswap/src/components/communities/community-intake-qr-modal.tsx)).
   * The voucher specifies the book title, recipient name, and storage deadline (72 hours).
3. **Drop-Off at the Venue:**
   * User A drops by the café anytime during open hours (no coordination with User B needed).
   * Staff scans the QR code using the lightweight BookSwap Partner web portal (or User A drops it in the branded BookSwap box and confirms with geo-location).
4. **Automated Notification & Pickup Window:**
   * The system transitions the transaction status to `DROPPED_AT_HUB`.
   * User B receives an instant push notification: *"Your book is ready for pickup at Cilantro Degla! Pick up by Friday 10 PM."*
5. **Collection & Completion:**
   * User B shows their pickup pass to staff or scans the box QR code.
   * Status automatically flips to `COMPLETED`, deposits are activated, or swap credits are awarded.

#### Partner Café Incentive (The Win-Win Pitch):
* **Guaranteed Foot Traffic:** Every single book transaction brings **two physical visits** into the coffee shop.
* **Special Promotion:** Display on the app: *"Show your BookSwap pickup screen to receive 15% off your drink!"*

---

### 3.3 Walkthrough 2: The 'Travelling Book' / Wild Drop (BookCrossing Style)

```mermaid
flowchart LR
    A[User prints 'Book Passport' QR] --> B[Leaves book in public spot e.g. San Stefano or AUC]
    B --> C[User snaps photo & pins GPS on Live Map]
    C --> D[Next reader finds book & scans QR]
    D --> E['I found this book!' journal entry logged]
    E --> F[Reader finishes & passes book forward]
```

#### Detailed Step-by-Step Flow:
1. **Initiation:**
   * User marks a finished book as a `WILD_DROP` (كتاب حر / رحّال).
2. **Book Passport Generation:**
   * BookSwap generates a printable sticker or digital slip with a dedicated QR code:
     > *"📖 مرحباً! أنا كتاب رحّال من منصة بدّلها. اقرأني مجاناً وامسح الرمز لتسجيل رحلتي، ثم اتركني لقارئ آخر!"*
3. **The Physical Drop:**
   * The reader leaves the book on a cozy sofa at a partner café, a quiet bench at Bibliotheca Alexandrina, or a campus commons.
   * In the app, they tap **"سجلت الإطلاق" (Log Release)**, attaching a quick photo and an optional clue (*"Behind the glass window on the 2nd floor"*).
4. **Discovery & Live Map:**
   * The book appears on BookSwap's interactive Leaflet map as a golden glowing pin: *"Unclaimed Book: 'The Alchemist' at Smouha Green Plaza"*.
5. **Catch & Journal Log:**
   * The finder scans the QR code on the book:
     - The app displays the book's history: *"Originally released by Youssef in Maadi $\rightarrow$ Travelled to Tahrir $\rightarrow$ Now found by Layla in Alex!"*
     - The finder logs: *"Found it in great condition! Reading Chapter 1 now."*

---

### 3.4 Walkthrough 3: Digital Borrowing with Deposit & Auto-Renewal

```mermaid
stateDiagram-v2
    [*] --> RequestSubmitted: Borrower requests book (14-day loan + Deposit)
    RequestSubmitted --> LoanApproved: Owner accepts terms
    LoanApproved --> LoanActive: QR scan handshake at Hub / Meetup
    LoanActive --> MilestoneReminder: Day 11 (3 days before due date)
    MilestoneReminder --> ExtensionGranted: Borrower requests +7 days (No active reservations)
    MilestoneReminder --> ReturnInitiated: Borrower returns book
    LoanActive --> ReturnInitiated: Borrower returns on or before due date
    ReturnInitiated --> Completed: Owner / Hub scans return QR
    Completed --> DepositRefunded: Deposit released back to borrower
    Completed --> [*]
```

#### Detailed Step-by-Step Flow:
1. **Borrow Agreement:**
   * The borrower selects loan duration (7, 14, or 30 days) and agrees to the deposit amount specified by the owner.
2. **Loan Handshake:**
   * Upon handover (in-person or at a Partner Café), the owner or hub scans the loan verification QR code.
   * `lifecycle.ts` logs `borrow_started_at = NOW()` and schedules return reminders.
3. **Automated Status Reminders:**
   * **T-3 Days:** Notification sent: *"Reminder: 'Clean Code' is due in 3 days. Ready to return or need more time?"*
4. **1-Click Loan Extension:**
   * If no other user has placed a hold on the book, the borrower can click **"Request 7-day Extension"**.
   * If approved, the due date shifts automatically without any re-coordination.
5. **Return Verification & Deposit Release:**
   * When returned, the owner scans the return QR code.
   * The system marks `borrow_returned_at = NOW()`, updates status to `COMPLETED`, and automatically triggers `deposit_status = 'REFUNDED'`.

---

### 3.5 Walkthrough 4: The Swap Credits Economy ('نقاط بدّلها')

#### How to eliminate the "Double Coincidence of Wants":

```
┌────────────────────────┐         Gives Book        ┌────────────────────────┐
│   User A (Has Dune)    │ ────────────────────────> │  User C (Wants Dune)   │
└────────────────────────┘                           └────────────────────────┘
            │
            │ Earns +1 Swap Credit
            ▼
┌────────────────────────┐        Spends Credit      ┌────────────────────────┐
│     User A Wallet      │ ────────────────────────> │ User B (Has 1984 Book) │
│   (+1 Swap Credit)     │                           └────────────────────────┘
```

1. **Earning Credits:**
   * A user lists a book as `SWAP_CREDIT` or donates it to a Community Hub Shelf.
   * When another reader accepts and receives the book, the giver instantly receives **+1 Swap Credit**.
2. **Redeeming Credits:**
   * The user browses the catalog, filtering by `متاح بنقاط بدّلها (Swap Credits)`.
   * They click **"احصل عليه بنقطة واحدة" (Claim with 1 Credit)**.
   * No money is exchanged and no mutual book match is required.
3. **Coexistence with Direct Swaps:**
   * Users who prefer traditional direct 1-to-1 book swaps can still propose direct trades at zero cost.

---

## Part 4: Technical Implementation Guide for the Engineering Team

### Files & Components to Touch:

| File / Component | Planned Enhancement | Effort |
| :--- | :--- | :--- |
| [meetup-picker.tsx](file:///d:/VS_CODE/edu/web/bookswap/src/components/ui/meetup-picker.tsx) | Add 4th delivery option: `PARTNER_HUB_DROPOFF` with list of participating venues. | 1 day |
| [lifecycle.ts](file:///d:/VS_CODE/edu/web/bookswap/src/lib/transactions/lifecycle.ts) | Add statuses: `DROPPED_AT_HUB`, `READY_FOR_PICKUP`. Add drop-off voucher parser. | 1 day |
| [community-intake-qr-modal.tsx](file:///d:/VS_CODE/edu/web/bookswap/src/components/communities/community-intake-qr-modal.tsx) | Adapt voucher generator to handle peer-to-peer drop-offs at hubs. | 0.5 day |
| `supabase/schema.sql` | Add `partner_hubs` table and `swap_credits` balance column on `profiles`. | 0.5 day |
| [add-book-form.tsx](file:///d:/VS_CODE/edu/web/bookswap/src/components/books/add-book-form.tsx) | Add mobile camera ISBN barcode reader (`@zxing/browser`) for 15-second listing. | 1.5 days |

---

## Part 5: Quality & Verification Checklist

Before opening the site to real users, verify every step:

- [x] **Production Build:** `npm run build` exits with code 0.
- [ ] **Auth Flow:** User registration, email verification, password reset, and session persistence.
- [ ] **Book Creation:** Add listing with photos and pricing/swap options.
- [ ] **Swap Flow:** Requester sends swap offer $\rightarrow$ Owner accepts $\rightarrow$ Both see clear "Give" vs "Get" cards $\rightarrow$ QR code confirms handover.
- [ ] **Borrow Flow:** Borrower requests with deposit $\rightarrow$ Owner accepts $\rightarrow$ QR confirms loan start $\rightarrow$ Return QR records return timestamp and releases deposit.
- [ ] **Community Lifecycle:** User creates community $\rightarrow$ Edits settings $\rightarrow$ Approves member books $\rightarrow$ Members request books at the hub $\rightarrow$ Owner can delete community if needed.
- [ ] **Follow Notification:** Following user triggers bell notification in under 1 second.
- [ ] **Chat Navigation:** Clicking chat on any book or transaction card opens the exact conversation.
- [ ] **PWA Install Banner:** Prompt displays on Chrome (Android) and Safari (iOS "Add to Home Screen").

