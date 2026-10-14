import { NextRequest, NextResponse } from 'next/server'

interface ScannedBookResult {
  title: string
  author: string
  isbn?: string
  publisher?: string
  language?: 'ARABIC' | 'ENGLISH' | 'FRENCH' | 'GERMAN' | 'OTHER'
  category_name?: string
  description?: string
  condition_estimate?: 'NEW' | 'LIKE_NEW' | 'VERY_GOOD' | 'GOOD' | 'ACCEPTABLE'
  estimated_price: number
  suggested_deposit: number
  suggested_fee_weekly: number
  is_expensive_book: boolean
  confidence: number
  source: 'gemini_vision' | 'google_books' | 'openlibrary' | 'barcode'
}

/**
 * Calculate dynamic borrowing deposit and fee based on book value
 */
function calculateBorrowTerms(price: number) {
  const is_expensive = price >= 300
  // Deposit protects owner 100% for high value books
  const suggested_deposit = Math.max(50, Math.round(price))
  
  // Weekly borrowing fee scaled to book value
  let suggested_fee_weekly = 15
  if (price > 500) {
    suggested_fee_weekly = Math.round(price * 0.08) // e.g. 80 EGP/week for 1,000 EGP book
  } else if (price > 250) {
    suggested_fee_weekly = Math.round(price * 0.10) // e.g. 35 EGP/week for 350 EGP book
  } else if (price > 100) {
    suggested_fee_weekly = Math.round(price * 0.12) // e.g. 20 EGP/week for 150 EGP book
  } else {
    suggested_fee_weekly = 15
  }

  return {
    suggested_deposit,
    suggested_fee_weekly,
    is_expensive_book: is_expensive,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { imageBase64, mimeType = 'image/jpeg', filename, isbn, queryText } = body

    // ========================================================
    // 1. Google Gemini AI Vision
    // ========================================================
    const geminiKey = 
      req.headers.get('x-gemini-key') || 
      body.geminiKey ||
      process.env.GEMINI_API_KEY || 
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GOOGLE_AI_KEY

    let geminiError: string | null = null
    if (!geminiKey && imageBase64) {
      geminiError = 'MISSING_API_KEY'
    }

    if (geminiKey && imageBase64) {
      try {
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')
        const candidateModels = [
          'gemini-3.1-flash-lite',
          'gemini-3.5-flash',
          'gemini-flash-latest',
          'gemini-2.5-pro'
        ]

        for (const modelName of candidateModels) {
          try {
            const geminiRes = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey.trim()}`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        {
                          inline_data: {
                            mime_type: mimeType,
                            data: cleanBase64,
                          },
                        },
                        {
                          text: `You are an expert literary AI assistant for a book exchange platform.
Inspect this book image and identify the book title and author.
Even if certain details (like publisher, synopsis description, standard ISBN, or category) are NOT explicitly printed on the front cover, USE YOUR EXTENSIVE LITERARY KNOWLEDGE OF THIS BOOK to provide COMPLETE, high-quality metadata so the user does not have to type anything manually:
{
  "title": "exact official title of the book in its original language",
  "author": "official author full name",
  "isbn": "Real standard 13-digit ISBN (e.g. 9789959853905 or 9780143127741) or standard 10-digit ISBN",
  "publisher": "The most prominent or original publisher for this book (e.g. Dar El Shorouk, Kayan, Penguin, HarperCollins, etc.)",
  "edition": "Edition (e.g. الأولى, الثانية, 1st Edition, 2nd Edition) - default to 'الأولى' if unknown",
  "language": "ARABIC or ENGLISH or FRENCH or GERMAN or OTHER",
  "category": "One of: Fiction, Self Development, Business, Psychology, Programming, History, Science, Children, Academic, Language, Comics, Philosophy, Religion, Health, Other",
  "description": "An engaging, well-written 2-4 sentence summary/synopsis of the book in the same language as the book (Arabic for Arabic books, English for English books)",
  "condition": "GOOD",
  "estimated_market_price": estimated fair market/retail price in Egyptian Pounds EGP (number, e.g. 150 for standard novel, 450 for hardcover, 800-1500 for medical/academic textbook)
}
Return ONLY valid JSON.`,
                        },
                      ],
                    },
                  ],
                  generationConfig: {
                    temperature: 0.2,
                    response_mime_type: 'application/json',
                  },
                }),
              }
            )

            if (geminiRes.ok) {
              const aiData = await geminiRes.json()
              const rawText = aiData.candidates?.[0]?.content?.parts?.[0]?.text
              if (rawText) {
                const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim())
                if (parsed.title) {
                  const estimatedPrice = parsed.estimated_market_price || 120
                  const terms = calculateBorrowTerms(estimatedPrice)

                  return NextResponse.json({
                    success: true,
                    data: {
                      title: parsed.title,
                      author: parsed.author || '',
                      isbn: parsed.isbn || '',
                      publisher: parsed.publisher || '',
                      edition: parsed.edition || 'الأولى',
                      language: parsed.language || 'ARABIC',
                      category_name: parsed.category || '',
                      description: parsed.description || '',
                      condition_estimate: parsed.condition || 'GOOD',
                      estimated_price: estimatedPrice,
                      suggested_deposit: terms.suggested_deposit,
                      suggested_fee_weekly: terms.suggested_fee_weekly,
                      is_expensive_book: terms.is_expensive_book,
                      confidence: 0.98,
                      source: 'gemini_vision',
                    },
                  })
                }
              }
            } else {
              const errBody = await geminiRes.text()
              console.warn(`Gemini model ${modelName} returned status ${geminiRes.status}:`, errBody.slice(0, 150))
            }
          } catch (modelErr) {
            console.warn(`Gemini model ${modelName} call error:`, modelErr)
          }
        }
      } catch (err) {
        console.error('Gemini Vision AI extraction error:', err)
      }
    }

    // ========================================================
    // 2. Barcode & ISBN Direct Recognition (OpenLibrary & Google)
    // ========================================================
    let detectedIsbn = isbn
    if (!detectedIsbn && filename) {
      const isbnMatch = filename.match(/(?:97[89][-\s]?)?[0-9]{9}[0-9X]/i)
      if (isbnMatch) {
        detectedIsbn = isbnMatch[0].replace(/[-\s]/g, '')
      }
    }

    if (detectedIsbn && detectedIsbn.length >= 10) {
      try {
        const googleRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(detectedIsbn)}`
        )
        if (googleRes.ok) {
          const gData = await googleRes.json()
          const item = gData.items?.[0]?.volumeInfo
          if (item) {
            const langCode = (item.language || '').toLowerCase()
            const language = langCode.startsWith('ar')
              ? 'ARABIC'
              : langCode.startsWith('en')
              ? 'ENGLISH'
              : langCode.startsWith('fr')
              ? 'FRENCH'
              : 'OTHER'

            const estimatedPrice = item.pageCount
              ? Math.min(1200, Math.max(60, Math.round(item.pageCount * 0.45)))
              : 140

            const terms = calculateBorrowTerms(estimatedPrice)

            return NextResponse.json({
              success: true,
              data: {
                title: item.title || '',
                author: item.authors?.[0] || '',
                isbn: detectedIsbn,
                publisher: item.publisher || '',
                description: item.description || '',
                language,
                category_name: item.categories?.[0] || '',
                condition_estimate: 'VERY_GOOD',
                estimated_price: estimatedPrice,
                suggested_deposit: terms.suggested_deposit,
                suggested_fee_weekly: terms.suggested_fee_weekly,
                is_expensive_book: terms.is_expensive_book,
                confidence: 0.95,
                source: 'google_books',
              },
            })
          }
        }
      } catch (err) {
        console.error('Google Books ISBN lookup error:', err)
      }

      // Fallback OpenLibrary
      try {
        const olRes = await fetch(
          `https://openlibrary.org/api/books?bibkeys=ISBN:${detectedIsbn}&format=json&jscmd=details`
        )
        if (olRes.ok) {
          const olData = await olRes.json()
          const details = olData[`ISBN:${detectedIsbn}`]?.details
          if (details) {
            const terms = calculateBorrowTerms(120)
            return NextResponse.json({
              success: true,
              data: {
                title: details.title || '',
                author: details.authors?.[0]?.name || '',
                isbn: detectedIsbn,
                publisher: details.publishers?.[0] || '',
                language: 'ENGLISH',
                description: details.description?.value || details.description || '',
                condition_estimate: 'GOOD',
                estimated_price: 120,
                suggested_deposit: terms.suggested_deposit,
                suggested_fee_weekly: terms.suggested_fee_weekly,
                is_expensive_book: terms.is_expensive_book,
                confidence: 0.9,
                source: 'openlibrary',
              },
            })
          }
        }
      } catch (olErr) {
        console.error('OpenLibrary ISBN lookup error:', olErr)
      }

      // Fallback Gemini AI Knowledge Lookup for ISBN (crucial for Egyptian & Arabic publishers)
      if (geminiKey) {
        try {
          const aiIsbnRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey.trim()}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: `You are an expert literary assistant specialized in Arabic, Egyptian, and international publishing.
Identify this book by its ISBN: ${detectedIsbn}.
Provide complete metadata in JSON format:
{
  "title": "exact title of the book in Arabic or original language",
  "author": "author full name",
  "isbn": "${detectedIsbn}",
  "publisher": "publisher name (e.g. عصير الكتب, دار الشروق, كيان, etc.)",
  "edition": "الأولى",
  "language": "ARABIC or ENGLISH or FRENCH or OTHER",
  "category": "One of: Fiction, Self Development, Business, Psychology, Programming, History, Science, Children, Academic, Language, Comics, Philosophy, Religion, Health, Other",
  "description": "2-3 sentence engaging synopsis in the same language as the book",
  "condition": "GOOD",
  "estimated_market_price": estimated price in EGP (e.g. 120)
}
Return ONLY valid JSON.`,
                      },
                    ],
                  },
                ],
                generationConfig: {
                  temperature: 0.1,
                  response_mime_type: 'application/json',
                },
              }),
            }
          )

          if (aiIsbnRes.ok) {
            const aiIsbnData = await aiIsbnRes.json()
            const rawText = aiIsbnData.candidates?.[0]?.content?.parts?.[0]?.text
            if (rawText) {
              const parsed = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim())
              if (parsed.title) {
                const estimatedPrice = parsed.estimated_market_price || 120
                const terms = calculateBorrowTerms(estimatedPrice)

                return NextResponse.json({
                  success: true,
                  data: {
                    title: parsed.title,
                    author: parsed.author || '',
                    isbn: detectedIsbn,
                    publisher: parsed.publisher || '',
                    edition: parsed.edition || 'الأولى',
                    language: parsed.language || 'ARABIC',
                    category_name: parsed.category || '',
                    description: parsed.description || '',
                    condition_estimate: 'GOOD',
                    estimated_price: estimatedPrice,
                    suggested_deposit: terms.suggested_deposit,
                    suggested_fee_weekly: terms.suggested_fee_weekly,
                    is_expensive_book: terms.is_expensive_book,
                    confidence: 0.98,
                    source: 'gemini_vision',
                  },
                })
              }
            }
          }
        } catch (aiIsbnErr) {
          console.error('Gemini ISBN lookup error:', aiIsbnErr)
        }
      }
    }

    // ========================================================
    // 3. Text & Filename Universal Query Extraction
    // ========================================================
    let searchText = queryText
    if (!searchText && filename) {
      searchText = filename
        .replace(/\.[a-zA-Z0-9]+$/, '')
        .replace(/[-_]+/g, ' ')
        .replace(/(?:image|photo|cover|img|scan|pic|front|back|\d{8,}|\(\d+\))/gi, '')
        .trim()
    }

    if (searchText && searchText.length > 2) {
      const gRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchText)}&maxResults=3`
      )
      if (gRes.ok) {
        const gData = await gRes.json()
        const item = gData.items?.[0]?.volumeInfo
        if (item) {
          const langCode = (item.language || '').toLowerCase()
          const language = langCode.startsWith('ar')
            ? 'ARABIC'
            : langCode.startsWith('en')
            ? 'ENGLISH'
            : 'OTHER'

          const isbnIdentifier = item.industryIdentifiers?.find(
            (id: { type: string; identifier: string }) => id.type.includes('ISBN')
          )?.identifier

          const estimatedPrice = item.pageCount
            ? Math.min(1500, Math.max(70, Math.round(item.pageCount * 0.5)))
            : 160

          const terms = calculateBorrowTerms(estimatedPrice)

          return NextResponse.json({
            success: true,
            data: {
              title: item.title || '',
              author: item.authors?.[0] || '',
              isbn: isbnIdentifier || '',
              publisher: item.publisher || '',
              description: item.description || '',
              language,
              category_name: item.categories?.[0] || '',
              condition_estimate: 'VERY_GOOD',
              estimated_price: estimatedPrice,
              suggested_deposit: terms.suggested_deposit,
              suggested_fee_weekly: terms.suggested_fee_weekly,
              is_expensive_book: terms.is_expensive_book,
              confidence: 0.88,
              source: 'google_books',
            },
          })
        }
      }
    }

    if (geminiError === 'MISSING_API_KEY') {
      return NextResponse.json({
        success: false,
        missingApiKey: true,
        message: 'لقراءة غلاف الكتاب بالذكاء الاصطناعي، يرجى إضافة مفتاح Google Gemini API المجاني.',
      })
    }

    return NextResponse.json({
      success: false,
      message: 'لم نتمكن من التعرف على الكتاب تلقائياً. يمكنك كتابة العنوان وسيقوم محرك البحث بإكمال الباقي.',
    })
  } catch (error) {
    console.error('Scan cover error:', error)
    return NextResponse.json(
      { success: false, message: 'حدث خطأ أثناء فحص الصورة' },
      { status: 500 }
    )
  }
}
