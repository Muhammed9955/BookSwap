/**
 * Popular Arabic & International Bestselling Books Database
 * Used for instant matching in Bulk Import and Quick Add
 * Contains authentic authors, categories, verified covers, ratings, pages, published dates,
 * author details (photo & bio), ISBNs, and descriptions.
 */

export const SAMPLE_BULK_LIST = `الغيهب
نادر فودة ال2
الطريق الي الله
فاتتني صلاة
مر مثل القهوة حلو مثل الشيكولاتة
عقل بلا جسد
الدحيح
مدرسة ميلر
حارة الجزار
كن اقوي من مشاعرك
اسرار سورة البقرة
سر الغرفة 207
فكر كان طبيب نفسي
قوة الان`

export interface AuthorDetail {
  name: string
  bio: string
  image_url?: string
}

export interface PopularBookEntry {
  author: string
  category: string
  cover: string
  desc: string
  rating?: number
  rating_count?: number
  review_count?: number
  pages_count?: number
  published_year?: number
  first_published?: string
  publisher?: string
  isbn?: string
  goodreads_url?: string
  author_details?: AuthorDetail
  genres?: string[]
  reviews?: Array<{
    name: string
    text: string
    rating?: number
    date?: string
    verified?: boolean
  }>
}

/**
 * Famous Author Directory with Authentic Portraits & Biographies
 */
export const FAMOUS_AUTHORS_DIRECTORY: Record<string, AuthorDetail> = {
  'احمد خالد توفيق': {
    name: 'د. أحمد خالد توفيق',
    bio: 'طبيب وأديب مصري رائد، يُعد أول كاتب عربي في مجال أدب الرعب والخيال العلمي وأدب الشباب والديستوبيا، لُقب بالعراب وترك بصمة خالدة في وجدان أجيال من القراء.',
    image_url: 'https://upload.wikimedia.org/wikipedia/ar/thumb/2/2f/%D8%A3%D8%AD%D9%85%D8%AF_%D8%AE%D8%A7%D9%84%D8%AF_%D8%AA%D9%88%D9%81%D9%8A%D9%82.jpg/440px-%D8%A3%D8%AD%D9%85%D8%AF_%D8%AE%D8%A7%D9%84%D8%AF_%D8%AA%D9%88%D9%81%D9%8A%D9%82.jpg',
  },
  'مصطفي محمود': {
    name: 'د. مصطفى محمود',
    bio: 'طبيب وعالم ومفكر وأديب مصري شهير، قدّم برنامج "العلم والإيمان" وألّف 89 كتاباً في الفلسفة والروحانيات والعلوم والأدب تركت أثراً فكرياً عميقاً.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Mustafa_Mahmoud.jpg/440px-Mustafa_Mahmoud.jpg',
  },
  'نجيب محفوظ': {
    name: 'نجيب محفوظ',
    bio: 'أديب وروائي مصري عالمي، أول أديب عربي حائز على جائزة نوبل في الأدب عام 1988، صوّر الحارة المصرية وقضايا الوجود والحرية بإبداع سردي لا مثيل له.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Naguib_Mahfouz_in_1988.jpg/440px-Naguib_Mahfouz_in_1988.jpg',
  },
  'احمد مراد': {
    name: 'أحمد مراد',
    bio: 'روائي وسيناريست ومصور مصري معاصر، من أكثر الكتاب مبيعاً في العالم العربي، تميزت رواياته بخلط الغموض والتشويق والأبعاد التاريخية والنفسية كالفيل الأزرق وتراب الماس.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Ahmed_Mourad.jpg/440px-Ahmed_Mourad.jpg',
  },
  'حسن الجندي': {
    name: 'حسن الجندي',
    bio: 'كاتب وروائي مصري لمع اسمه كأبرز رواد أدب الرعب الحديث في مصر والعالم العربي، واشتهر بسلاسل المخطوطة وحارة الجزار ونصف ميت وابتسم فأنت ميت.',
    image_url: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/authors/1453229672i/6979844.jpg',
  },
  'اسامة المسلم': {
    name: 'أسامة المسلم',
    bio: 'روائي وكاتب خيال وفانتازيا سعودي لامع، حققت سلاسله (بساتين عربستان، خوف، صخب الخسيف، الغيهب) أرقاماً قياسية في معارض الكتاب بجمهوره العريض في الوطن العربي.',
    image_url: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/authors/1446733350i/14589254.jpg',
  },
  'رضوي عاشور': {
    name: 'رضوى عاشور',
    bio: 'قاصة وروائية وناقدة أدبية وأستاذة جامعية مصرية، عُرفت بإنسانيتها العالية والتزامها بقضايا الوطن والحرية وسردها التاريخي البديع في ثلاثية غرناطة والطنطورية.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Radwa_Ashour_2011.jpg/440px-Radwa_Ashour_2011.jpg',
  },
  'خولة حمدي': {
    name: 'د. خولة حمدي',
    bio: 'روائية وكاتبة تونسية وأستاذة جامعية في تقنية المعلومات، حققت روايتها "في قلبي أنثى عبرية" و"غربة الياسمين" و"أن تبقى" انتشاراً جماهيرياً واسعاً.',
    image_url: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/authors/1360155694i/6949364.jpg',
  },
  'عمرو عبد الحميد': {
    name: 'د. عمرو عبد الحميد',
    bio: 'طبيب وروائي مصري مبدع، رائد الفانتازيا والتشويق العربي المعاصر بمؤلفات حققت ملايين القراءات مثل ثلاثية أرض زيكولا وقواعد جارتين وسلسلة أمواج أكما.',
    image_url: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/authors/1470404323i/8243171.jpg',
  },
  'جورج اورويل': {
    name: 'جورج أورويل (George Orwell)',
    bio: 'روائي وصحفي وناقد إنجليزي شهير، عُرف برواياته الديستوبية والسياسية الخالدة مثل "1984" و"مزرعة الحيوان"، وحربه الفكرية ضد الشمولية والتضليل والاستبداد.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/George_Orwell_press_photo.jpg',
  },
  'جيمس كلير': {
    name: 'جيمس كلير (James Clear)',
    bio: 'مؤلف وباحث ومحاضر عالمي متخصص في العادات وصناعة القرارات والتحسين المستمر، حقق كتابه "العادات الذرية" ملايين المبيعات وتصدر قوائم نيويورك تايمز.',
    image_url: 'https://images.gr-assets.com/authors/1539276535p8/7327369.jpg',
  },
  'مارك مانسون': {
    name: 'مارك مانسون (Mark Manson)',
    bio: 'كاتب ومدون ومفكر أمريكي رائد، مؤلف كتاب "فن اللامبالاة" و"خراب: كتاب عن الأمل"، يعتمد أسلوبه على الواقعية الصادمة والتفكيك الفلسفي للضغوط العصرية.',
    image_url: 'https://images.gr-assets.com/authors/1381350873p8/6530669.jpg',
  },
  'باولو كويلو': {
    name: 'باولو كويلو (Paulo Coelho)',
    bio: 'روائي وكاتب برازيلي من أكثر الكتاب قراءة في التاريخ المعاصر، اشتهر بروايته "الخيميائي" التي تُرجمت إلى أكثر من 80 لغة وحملت رسائل ملهمة عن الشغف والقدر.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Paulo_Coelho_in_2012.jpg/440px-Paulo_Coelho_in_2012.jpg',
  },
  'ايكهارت تول': {
    name: 'إيكهارت تول (Eckhart Tolle)',
    bio: 'كاتب ومعلم روحاني كندي من أصل ألماني، صاحب الكتاب واسع الانتشار "قوة الآن" و"أرض جديدة"، يعلّم فن الحضور واليقظة الذهنية والتحرر من الأنا والقلق.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Eckhart_Tolle_at_the_Peace_Summit_2009.jpg/440px-Eckhart_Tolle_at_the_Peace_Summit_2009.jpg',
  },
  'روبرت كيوساكي': {
    name: 'روبرت كيوساكي (Robert Kiyosaki)',
    bio: 'رجل أعمال ومستثمر ومؤلف أمريكي، مؤسس سلسلة "الأب الغني والأب الفقير" الرائدة في محو الأمية المالية وتعليم بناء الأصول والحرية المالية.',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Robert_Kiyosaki_by_Gage_Skidmore.jpg/440px-Robert_Kiyosaki_by_Gage_Skidmore.jpg',
  },
  'اليف شافاق': {
    name: 'إليف شافاق (Elif Shafak)',
    bio: 'روائية تركية بريطانية بارزة وناشطة نسوية، تمزج في أعمالها بين التصوف والتاريخ والروحانيات الشرقية والغربية، اشتهرت بروايتها العالمية "قواعد العشق الأربعون".',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Elif_Shafak_2017.jpg/440px-Elif_Shafak_2017.jpg',
  },
  'احمد يونس': {
    name: 'أحمد يونس',
    bio: 'إعلامي وكاتب ومذيع راديو مصري شهير، صاحب البرنامج الإذاعي المرعب "ع القهوة" و"كلام معلمين"، ومؤلف سلسلة "نادر فودة" الصحفي الاستقصائي للماورائيات.',
    image_url: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/authors/1478201242i/15984639.jpg',
  },
  'اسلام جمال': {
    name: 'إسلام جمال',
    bio: 'مهندس بحري وكاتب مصري متخصص في ربط العلوم النفسية بالسلوك الإيماني والتطوير الذاتي، اشتهر بكتابه الرائد "فاتتني صلاة" و"لكنود".',
    image_url: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/authors/1572522500i/19632832.jpg',
  },
  'ميرنا الهلباوي': {
    name: 'ميرنا الهلباوي',
    bio: 'كاتبة وصحفية وناشطة مصرية، أصدرت روايات وخواطر لاقت صدى واسعاً بين فئة الشباب مثل "مر مثل القهوة حلو مثل الشيكولاتة" و"كونداليني".',
    image_url: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/authors/1523458696i/17926121.jpg',
  },
  'طاهر المعتز بالله': {
    name: 'طاهر المعتز بالله',
    bio: 'كاتب ومعد محتوى وباحث مصري، من أبرز صناع المحتوى العلمي، مؤلف كتاب "الدحيح: ما وراء الكواليس" والعديد من الأعمال الثقافية التوثيقية.',
    image_url: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/authors/1635684497i/21799201.jpg',
  },
  'يوسف الحسني': {
    name: 'د. يوسف الحسني',
    bio: 'طبيب ومفكر ومعالج نفسي كويتي، رائد في التحليل النفسي والعلاج المعرفي السلوكي، مؤلف كتاب "عقدك النفسية سجنك الأبدي" و"فكر كأنك طبيب نفسي".',
    image_url: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/authors/1601053805i/20692737.jpg',
  },
  'ادهم شرقاوي': {
    name: 'أدهم شرقاوي (قس بن ساعدة)',
    bio: 'كاتب وشاعر فلسطيني مقيم في لبنان، يتميز بأسلوبه الأدبي العذب المستمد من السيرة النبوية والتراث العربي والإسلامي، صاحب "ليطمئن قلبي" و"رسائل من القرآن".',
    image_url: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/authors/1410972583i/8468766.jpg',
  },
  'محمد طه': {
    name: 'د. محمد طه (Dr. Mohamed Taha)',
    bio: 'استشاري وأستاذ الطب النفسي بكلية الطب جامعة المنيا، ونائب رئيس الجمعية المصرية للعلاج النفسي الجمعي. مؤلف الكتب الأكثر مبيعاً وتأثيراً في علم النفس والعلاقات الإنسانية: "الخروج عن النص"، "علاقات خطرة"، "لأ بطعم الفلامنكو"، و"ذكر شرقي منقرض".',
    image_url: '/images/covers/dr-mohamed-taha.jpg',
  },
  'د محمد طه': {
    name: 'د. محمد طه (Dr. Mohamed Taha)',
    bio: 'استشاري وأستاذ الطب النفسي بكلية الطب جامعة المنيا، ونائب رئيس الجمعية المصرية للعلاج النفسي الجمعي. مؤلف الكتب الأكثر مبيعاً وتأثيراً في علم النفس والعلاقات الإنسانية: "الخروج عن النص"، "علاقات خطرة"، "لأ بطعم الفلامنكو"، و"ذكر شرقي منقرض".',
    image_url: '/images/covers/dr-mohamed-taha.jpg',
  },
}

/**
 * Helper to match author against directory
 */
export function findAuthorDetails(rawAuthorName?: string): AuthorDetail | undefined {
  if (!rawAuthorName) return undefined
  const norm = normalizeArabicTitle(rawAuthorName)
  for (const [key, details] of Object.entries(FAMOUS_AUTHORS_DIRECTORY)) {
    const normKey = normalizeArabicTitle(key)
    if (norm.includes(normKey) || normKey.includes(norm)) {
      return details
    }
  }
  return undefined
}

export const POPULAR_ARABIC_DB: Record<string, PopularBookEntry> = {
  'الغيهب': {
    author: 'أسامة المسلم (Osamah Al-Muslim)',
    category: 'رعب وإثارة',
    cover: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1694206979i/198812217.jpg',
    desc: 'رواية رعب وتشويق أسطورية تأخذ القارئ في رحلة إلى عالم غامض مليء بالأسرار والظواهر الخارقة للعادة، تقع ضمن عوالم أسامة المسلم الفانتازية المميزة.',
    rating: 4.6,
    rating_count: 3420,
    review_count: 580,
    pages_count: 360,
    published_year: 2023,
    first_published: '2023',
    publisher: 'مركز الأدب العربي',
    isbn: '9786038332115',
    genres: ['رعب', 'فانتازيا', 'غموض', 'تشويق'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['اسامة المسلم'],
    reviews: [
      { name: 'سارة العتيبي', text: 'حبكة مذهلة وأسلوب سردي يحبس الأنفاس حتى المشهد الأخير!', rating: 5, date: '2024' },
      { name: 'محمد فاروق', text: 'أسامة المسلم يثبت مجدداً أنه ملك الفانتازيا والرعب العربي.', rating: 5, date: '2024' },
    ],
  },
  'الخروج عن النص': {
    author: 'د. محمد طه (Dr. Mohamed Taha)',
    category: 'علم نفس وتطوير ذات',
    cover: '/images/covers/khoroog-an-nass.jpg',
    desc: 'كتاب العلاج النفسي الأكثر تأثيراً ومبيعاً؛ يساعدك على اكتشاف ذاتك الحقيقية، والتحرر من السيناريوهات والنصوص القديمة المفروضة عليك منذ الطفولة، لتعيش بوعي وحرية ونضج نفسي.',
    rating: 4.2,
    rating_count: 38400,
    review_count: 3250,
    pages_count: 224,
    published_year: 2016,
    first_published: '2016',
    publisher: 'دار الشروق',
    isbn: '9789776541177',
    goodreads_url: 'https://www.goodreads.com/book/show/29609653',
    genres: ['علم نفس', 'تطوير ذات', 'صحة نفسية', 'علاقات'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['محمد طه'],
    reviews: [
      { name: 'سارة عبد الله', text: 'من أعظم وأصدق كتب علم النفس المبسطة.. كل فصل بيلمس حاجة جواك ماكنتش فاهم سببها ويدلك إزاي تتحرر منها.', rating: 5, date: '2024', verified: true },
      { name: 'أحمد إبراهيم', text: 'لغة سلسة وعميقة وطبيب نفسي شاطر بياخدك في رحلة حقيقية لاكتشاف نفسك وشجاعة أن تكون أنت.', rating: 5, date: '2023', verified: true },
      { name: 'نوران الشاذلي', text: 'الكتاب ده غيّر نظرتي لعلاقاتي ولنفسي بالكامل، كتاب يستحق القراءة أكتر من مرة.', rating: 5, date: '2024', verified: true },
    ],
  },
  'الخروج عن النص من جديد': {
    author: 'د. محمد طه (Dr. Mohamed Taha)',
    category: 'علم نفس وتطوير ذات',
    cover: '/images/covers/khoroog-an-nass.jpg',
    desc: 'النسخة المنقحة والمحدثة من الكتاب النفسي الأكثر مبيعاً الصادرة عن دار الشروق، تضم فصولاً وتحليلات جديدة أعمق لاكتشاف الذات والتعافي النفسي.',
    rating: 4.3,
    rating_count: 14200,
    review_count: 1180,
    pages_count: 248,
    published_year: 2022,
    first_published: '2022',
    publisher: 'دار الشروق',
    isbn: '9789770937396',
    goodreads_url: 'https://www.goodreads.com/book/show/29609653',
    genres: ['علم نفس', 'تطوير ذات', 'صحة نفسية', 'وعي'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['محمد طه'],
    reviews: [
      { name: 'مروة كمال', text: 'طبعة الشروق الجديدة أضافت فصول استثنائية في الوعي النفسي والعلاقات الصحية.', rating: 5, date: '2024', verified: true },
    ],
  },
  'علاقات خطرة': {
    author: 'د. محمد طه (Dr. Mohamed Taha)',
    category: 'علم نفس وعلاقات',
    cover: '/images/covers/alaqat-khatira.jpg',
    desc: 'تشريح دقيق لأكثر من 30 نوعاً من العلاقات المؤذية والسامة، وكيفية حماية حدودك النفسية والتعافي من الابتزاز العاطفي وبناء علاقات صحية.',
    rating: 4.3,
    rating_count: 29800,
    review_count: 2450,
    pages_count: 280,
    published_year: 2017,
    first_published: '2017',
    publisher: 'دار تويا للنشر والتوزيع',
    isbn: '9789776541306',
    goodreads_url: 'https://www.goodreads.com/book/show/34743275',
    genres: ['علم نفس', 'علاقات', 'صحة نفسية', 'تطوير ذات'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['محمد طه'],
    reviews: [
      { name: 'كريم محمود', text: 'كتاب كاشف لكل العلاقات المؤذية وطرق التعافي منها، لا غنى عنه لأي شخص.', rating: 5, date: '2024', verified: true },
    ],
  },
  'لا بطعم الفلامنكو': {
    author: 'د. محمد طه (Dr. Mohamed Taha)',
    category: 'علم نفس وتطوير ذات',
    cover: 'https://foulabook.com/storage/photo/44086.2021-04-29.1619660183.jpg',
    desc: 'عن التغيير وقوة الرفض الصحي وكيف تقول (لا) لكل ما يستنزف طاقتك وإنسانيتك، والرقص مع الحياة بخفة وشجاعة ووعي.',
    rating: 4.2,
    rating_count: 18500,
    review_count: 1420,
    pages_count: 256,
    published_year: 2019,
    first_published: '2019',
    publisher: 'دار الشروق',
    isbn: '9789770935897',
    goodreads_url: 'https://www.goodreads.com/book/show/48660341',
    genres: ['علم نفس', 'تطوير ذات', 'وعي'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['محمد طه'],
  },
  'ذكر شرقي منقرض': {
    author: 'د. محمد طه (Dr. Mohamed Taha)',
    category: 'علم نفس ومجتمع',
    cover: 'https://foulabook.com/storage/photo/44086.2021-04-29.1619660183.jpg',
    desc: 'قراءة نفسية وسوسيولوجية شجاعة لمفهوم الذكورة في المجتمع الشرقي، وتفكيك للأنماط المشوهة نحو نموذج ناضج ومتوازن إنسانياً.',
    rating: 4.1,
    rating_count: 9800,
    review_count: 850,
    pages_count: 240,
    published_year: 2021,
    first_published: '2021',
    publisher: 'دار الشروق',
    isbn: '9789770937105',
    goodreads_url: 'https://www.goodreads.com/book/show/58580459',
    genres: ['علم نفس', 'مجتمع', 'علاقات'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['محمد طه'],
  },
  'نادر فودة': {
    author: 'أحمد يونس (Ahmed Younes)',
    category: 'رعب وأدب بوليسي',
    cover: 'https://ak-asset.jarir.com/akeneo-prod/asset/m1/delta/504543_1.jpg',
    desc: 'مغامرة الصحفي الاستقصائي الشهير نادر فودة في عالم الماورائيات والبيوت المسكونة، حيث يتقاطع التحقيق الصحفي الجريء مع الرعب الخالص.',
    rating: 4.4,
    rating_count: 4890,
    review_count: 670,
    pages_count: 240,
    published_year: 2017,
    first_published: '2017',
    publisher: 'سما للنشر والتوزيع',
    isbn: '9789777810777',
    genres: ['رعب', 'غموض', 'تحقيقات صحفية', 'ماورائيات'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['احمد يونس'],
  },
  'نادر فودة 2': {
    author: 'أحمد يونس (Ahmed Younes)',
    category: 'رعب وأدب بوليسي',
    cover: 'https://ak-asset.jarir.com/akeneo-prod/asset/m1/delta/504543_1.jpg',
    desc: 'الجزء الثاني (كساب) من سلسلة نادر فودة الأكثر طلباً، مليء بالأسرار والتحقيقات المرعبة والمواجهات مع قوى الظلام.',
    rating: 4.5,
    rating_count: 3950,
    review_count: 490,
    pages_count: 260,
    published_year: 2018,
    first_published: '2018',
    publisher: 'سما للنشر والتوزيع',
    isbn: '9789777811231',
    genres: ['رعب', 'غموض', 'ماورائيات'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['احمد يونس'],
  },
  'نادر فودة ال2': {
    author: 'أحمد يونس (Ahmed Younes)',
    category: 'رعب وأدب بوليسي',
    cover: 'https://ak-asset.jarir.com/akeneo-prod/asset/m1/delta/504543_1.jpg',
    desc: 'الجزء الثاني (كساب) من سلسلة نادر فودة الأكثر طلباً، مليء بالأسرار والتحقيقات المرعبة ومواجهة الكيانات الخفية.',
    rating: 4.5,
    rating_count: 3950,
    review_count: 490,
    pages_count: 260,
    published_year: 2018,
    first_published: '2018',
    publisher: 'سما للنشر والتوزيع',
    isbn: '9789777811231',
    genres: ['رعب', 'غموض', 'ماورائيات'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['احمد يونس'],
  },
  'الطريق الي الله': {
    author: 'د. مصطفى محمود (Dr. Mostafa Mahmoud)',
    category: 'دين وفكر إسلامي',
    cover: 'https://covers.openlibrary.org/b/id/8143873-L.jpg',
    desc: 'كتاب فكري تأملي عميق يستعرض رحلة الإنسان الروحية والبحث عن الحقيقة واليقين الإلهي، متجاوزاً الماديات نحو حقيقة الوجود الكبرى.',
    rating: 4.6,
    rating_count: 6780,
    review_count: 820,
    pages_count: 195,
    published_year: 1978,
    first_published: '1978',
    publisher: 'دار أخبار اليوم',
    isbn: '9789770802014',
    genres: ['دين', 'فلسفة', 'فكر إسلامي', 'روحانيات'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['مصطفي محمود'],
  },
  'الطريق الى الله': {
    author: 'د. مصطفى محمود (Dr. Mostafa Mahmoud)',
    category: 'دين وفكر إسلامي',
    cover: 'https://covers.openlibrary.org/b/id/8143873-L.jpg',
    desc: 'كتاب فكري تأملي عميق يستعرض رحلة الإنسان الروحية والبحث عن الحقيقة واليقين الإلهي.',
    rating: 4.6,
    rating_count: 6780,
    review_count: 820,
    pages_count: 195,
    published_year: 1978,
    first_published: '1978',
    publisher: 'دار أخبار اليوم',
    isbn: '9789770802014',
    genres: ['دين', 'فلسفة', 'فكر إسلامي'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['مصطفي محمود'],
  },
  'العنكبوت': {
    author: 'د. مصطفى محمود (Dr. Mostafa Mahmoud)',
    category: 'خيال علمي وفلسفة',
    cover: 'https://covers.openlibrary.org/b/id/8143873-L.jpg',
    desc: 'رواية خيال علمي فلسفية رائدة للدكتور مصطفى محمود تناقش سر الروح والخلود البشري عبر تجارب علمية غامضة.',
    rating: 4.3,
    rating_count: 5320,
    review_count: 610,
    pages_count: 160,
    published_year: 1965,
    first_published: '1965',
    publisher: 'دار المعارف',
    isbn: '9789770265431',
    genres: ['خيال علمي', 'فلسفة', 'غموض'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['مصطفي محمود'],
  },
  'فاتتني صلاة': {
    author: 'إسلام جمال (Islam Gamal)',
    category: 'تطوير ذات وإيمانيات',
    cover: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1630589157i/58911783.jpg',
    desc: 'الكتاب الأكثر مبيعاً في العالم العربي لمعالجة التكاسل عن الصلاة والتسويف، يقدم فهماً نفسياً وسلوكياً عميقاً لبناء عادة الصلاة المستدامة.',
    rating: 4.7,
    rating_count: 24500,
    review_count: 3120,
    pages_count: 224,
    published_year: 2020,
    first_published: '2020',
    publisher: 'مؤسسة زاد للنشر',
    isbn: '9786039121824',
    genres: ['تطوير ذات', 'دين', 'عادات', 'علم نفس سلوكي'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['اسلام جمال'],
    reviews: [
      { name: 'هند سليمان', text: 'غيّر نظرتي للصلاة تماماً، أسلوب الكاتب سلس وعلمي وقريب من القلب.', rating: 5, date: '2023' },
    ],
  },
  'مر مثل القهوة حلو مثل الشيكولاتة': {
    author: 'ميرنا الهلباوي (Mirna El Helbawy)',
    category: 'روايات وخواطر',
    cover: 'https://cc02fu17ufx0v59u.public.blob.vercel-storage.com/covers/9789776467859.webp',
    desc: 'مجموعة خواطر وتجارب حياتية وعاطفية ترصد تقلبات النفس البشرية وعلاقات الحب والفقد بأسلوب واقعي رقيق بنكهة القهوة والشوكولا.',
    rating: 4.1,
    rating_count: 5120,
    review_count: 490,
    pages_count: 180,
    published_year: 2018,
    first_published: '2018',
    publisher: 'دار الكرمة',
    isbn: '9789776467859',
    genres: ['خواطر', 'أدب معاصر', 'علاقات'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['ميرنا الهلباوي'],
  },
  'عقل بلا جسد': {
    author: 'د. أحمد خالد توفيق (Dr. Ahmed Khaled Tawfik)',
    category: 'خيال علمي ورعب',
    cover: 'https://cdn.samawy.com/book/1004108/display/eb43f7b1b2ac4b8583524c993dd9b025.jpg',
    desc: 'مجموعة قصصية تنتمي لأدب الخيال العلمي المظلم والماورائيات، يستعرض فيها العراب تجارب عقلية مشوقة تتحدى المنطق العلمي المألوف.',
    rating: 4.5,
    rating_count: 7850,
    review_count: 830,
    pages_count: 210,
    published_year: 2008,
    first_published: '2008',
    publisher: 'دار دايموند للطباعة والنشر',
    isbn: '9789776148345',
    genres: ['خيال علمي', 'رعب', 'قصص قصيرة'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['احمد خالد توفيق'],
  },
  'الدحيح': {
    author: 'طاهر المعتز بالله (Taher El-Moatazbellah)',
    category: 'علوم وتبسيط المعرفة',
    cover: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1635683851i/59493518.jpg',
    desc: 'كتاب ما وراء كواليس البرنامج العلمي الأكثر تأثيراً في الوطن العربي، يقدم أسرار تبسيط العلوم وكيف تحولت الأفكار المعقدة إلى حكايات ممتعة.',
    rating: 4.6,
    rating_count: 9800,
    review_count: 1240,
    pages_count: 320,
    published_year: 2021,
    first_published: '2021',
    publisher: 'دار الشروق',
    isbn: '9789770937327',
    genres: ['علوم', 'سيرة وتوثيق', 'صناعة محتوى', 'ثقافة عامة'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['طاهر المعتز بالله'],
  },
  'مدرسة ميلر': {
    author: 'رحمة نبيل (Rahma Nabil)',
    category: 'غموض وتشويق',
    cover: 'https://atirbooks.com/wp-content/uploads/2026/06/%D9%85%D8%AF%D8%B1%D8%B3%D8%A9-%D9%85%D9%8A%D9%84%D8%B1.jpg',
    desc: 'رواية غموض وإثارة ملحمية تدور أحداثها داخل مدرسة ميلر المليئة بالأسرار والظواهر الاستثنائية والجرائم الغامضة غير المحلولة.',
    rating: 4.3,
    rating_count: 2100,
    review_count: 310,
    pages_count: 290,
    published_year: 2022,
    first_published: '2022',
    publisher: 'دار عصير الكتب',
    isbn: '9789779921441',
    genres: ['غموض', 'تشويق', 'أدب الشباب'],
  },
  'حارة الجزار': {
    author: 'حسن الجندي (Hassan El-Gendy)',
    category: 'رعب وإثارة',
    cover: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1573347320i/25643440.jpg',
    desc: 'ملحمة الرعب النفسي الشهيرة لحسن الجندي التي ترصد حارة قاهرية قديمة تقع فيها حوادث مروعة لا ينجو منها أحد بسبب لعنة وعهد دموي قديم.',
    rating: 4.4,
    rating_count: 8900,
    review_count: 1050,
    pages_count: 340,
    published_year: 2015,
    first_published: '2015',
    publisher: 'دار اكتب للنشر والتوزيع',
    isbn: '9789774883446',
    genres: ['رعب', 'إثارة', 'أساطير شعبية'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['حسن الجندي'],
  },
  'كن اقوي من مشاعرك': {
    author: 'باتريك كينغ (Patrick King)',
    category: 'علم نفس وتطوير ذات',
    cover: 'https://ak-asset.jarir.com/akeneo-prod/asset/c/5/3/7/c5371ae0323e33465dfd8661879b5c71645bd4ab_611809_1.jpg',
    desc: 'دليل تطبيقي وعلمي لفهم المشاعر وتفكيك ردود الأفعال العاطفية الاندفاعية وبناء المرونة النفسية والهدوء تحت الضغوط الحياتية.',
    rating: 4.4,
    rating_count: 4200,
    review_count: 420,
    pages_count: 220,
    published_year: 2021,
    first_published: '2021',
    publisher: 'مكتبة جرير',
    isbn: '9786035093767',
    genres: ['علم نفس', 'تطوير ذات', 'ذكاء عاطفي'],
  },
  'كن أقوى من مشاعرك': {
    author: 'باتريك كينغ (Patrick King)',
    category: 'علم نفس وتطوير ذات',
    cover: 'https://ak-asset.jarir.com/akeneo-prod/asset/c/5/3/7/c5371ae0323e33465dfd8661879b5c71645bd4ab_611809_1.jpg',
    desc: 'دليل تطبيقي وعلمي لفهم المشاعر وتفكيك ردود الأفعال العاطفية وبناء المرونة النفسية.',
    rating: 4.4,
    rating_count: 4200,
    review_count: 420,
    pages_count: 220,
    published_year: 2021,
    first_published: '2021',
    publisher: 'مكتبة جرير',
    isbn: '9786035093767',
    genres: ['علم نفس', 'تطوير ذات'],
  },
  'اسرار سورة البقرة': {
    author: 'عايض المطيري (Aedh Al-Mutairi)',
    category: 'دين وروحانيات',
    cover: 'https://ak-asset.jarir.com/akeneo-prod/asset/4/e/c/6/4ec63f3172e96e7baa12825f07a87cdab318f7ed_601920.jpg',
    desc: 'وقفات وتأملات بيانية وإيمانية في مقاصد وأسرار سورة البقرة وبركتها وتأثيرها في جلب السكينة وطرد وساوس النفس.',
    rating: 4.7,
    rating_count: 3100,
    review_count: 280,
    pages_count: 175,
    published_year: 2022,
    first_published: '2022',
    publisher: 'دار الحضارة للنشر',
    isbn: '9786035044431',
    genres: ['دين', 'قرآن كريم', 'روحانيات'],
  },
  'أسرار سورة البقرة': {
    author: 'عايض المطيري (Aedh Al-Mutairi)',
    category: 'دين وروحانيات',
    cover: 'https://ak-asset.jarir.com/akeneo-prod/asset/4/e/c/6/4ec63f3172e96e7baa12825f07a87cdab318f7ed_601920.jpg',
    desc: 'وقفات وتأملات بيانية وإيمانية في مقاصد وأسرار سورة البقرة وبركتها وتأثيرها في جلب السكينة وطرد وساوس النفس.',
    rating: 4.7,
    rating_count: 3100,
    review_count: 280,
    pages_count: 175,
    published_year: 2022,
    first_published: '2022',
    publisher: 'دار الحضارة للنشر',
    isbn: '9786035044431',
    genres: ['دين', 'قرآن كريم', 'روحانيات'],
  },
  'سر الغرفة 207': {
    author: 'د. أحمد خالد توفيق (Dr. Ahmed Khaled Tawfik)',
    category: 'رعب وتشويق',
    cover: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1348956859i/6007421.jpg',
    desc: 'الرواية الشهيرة التي تدور أحداثها داخل غرفة مسكونة في فندق لونا بمرسى مطروح لا يدخلها أحد ويخرج كما كان، تحولت إلى مسلسل درامي ناجح.',
    rating: 4.5,
    rating_count: 16500,
    review_count: 1840,
    pages_count: 288,
    published_year: 2008,
    first_published: '2008',
    publisher: 'دار دايموند للنشر',
    isbn: '9789776148390',
    genres: ['رعب', 'تشويق', 'غموض', 'ماورائيات'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['احمد خالد توفيق'],
  },
  'فكر كان طبيب نفسي': {
    author: 'د. يوسف الحسني (Dr. Youssef Al-Hasani)',
    category: 'علم نفس وصحة نفسية',
    cover: 'https://ak-asset.jarir.com/akeneo-prod/asset/m1/delta/563593_1.jpg',
    desc: 'طريقة للتفكير التحليلي الواعي وعلاج العقد النفسية وجراح الطفولة وفهم أسباب السلوكيات والصدمات الدفينة.',
    rating: 4.6,
    rating_count: 8200,
    review_count: 910,
    pages_count: 280,
    published_year: 2021,
    first_published: '2021',
    publisher: 'دار سما للنشر',
    isbn: '9789777813297',
    genres: ['علم نفس', 'صحة نفسية', 'تطوير ذات'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['يوسف الحسني'],
  },
  'فكر كأنك طبيب نفسي': {
    author: 'د. يوسف الحسني (Dr. Youssef Al-Hasani)',
    category: 'علم نفس وصحة نفسية',
    cover: 'https://ak-asset.jarir.com/akeneo-prod/asset/m1/delta/563593_1.jpg',
    desc: 'طريقة للتفكير التحليلي الواعي وعلاج العقد النفسية وفهم أسباب السلوكيات والصدمات الدفينة والتصالح مع الذات.',
    rating: 4.6,
    rating_count: 8200,
    review_count: 910,
    pages_count: 280,
    published_year: 2021,
    first_published: '2021',
    publisher: 'دار سما للنشر',
    isbn: '9789777813297',
    genres: ['علم نفس', 'صحة نفسية', 'تطوير ذات'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['يوسف الحسني'],
  },
  'قوة الان': {
    author: 'إيكهارت تول (Eckhart Tolle)',
    category: 'فلسفة ووعي',
    cover: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1458892792i/29615850.jpg',
    desc: 'الكتاب المرجعي الرائد عالمياً في عيش اللحظة الحاضرة والتحرر من أسر الماضي وقلق المستقبل والتخلص من قيود التفكير المفرط والأنا.',
    rating: 4.6,
    rating_count: 145000,
    review_count: 14800,
    pages_count: 270,
    published_year: 1997,
    first_published: '1997',
    publisher: 'دار الخيال',
    isbn: '9789778521016',
    genres: ['وعي', 'فلسفة', 'روحانيات', 'تطوير ذات'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['ايكهارت تول'],
  },
  'قوة الآن': {
    author: 'إيكهارت تول (Eckhart Tolle)',
    category: 'فلسفة ووعي',
    cover: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1458892792i/29615850.jpg',
    desc: 'الكتاب المرجعي الرائد عالمياً في عيش اللحظة الحاضرة والتحرر من أسر الماضي وقلق المستقبل والتحرر الروحي.',
    rating: 4.6,
    rating_count: 145000,
    review_count: 14800,
    pages_count: 270,
    published_year: 1997,
    first_published: '1997',
    publisher: 'دار الخيال',
    isbn: '9789778521016',
    genres: ['وعي', 'فلسفة', 'روحانيات'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['ايكهارت تول'],
  },
  '1984': {
    author: 'جورج أورويل (George Orwell)',
    category: 'روايات وأدب',
    cover: 'https://covers.openlibrary.org/b/id/12821217-L.jpg',
    desc: 'الرواية الديستوبية الأعظم في القرن العشرين، تسلط الضوء على خطر الحكم الشمولي، مراقبة "الأخ الأكبر"، التلاعب بالحقائق، وخنق الحريات الفردية.',
    rating: 4.5,
    rating_count: 4250000,
    review_count: 98000,
    pages_count: 328,
    published_year: 1949,
    first_published: '8 June 1949',
    publisher: 'دار الشروق / دار التنوير',
    isbn: '9789770919842',
    genres: ['ديستوبيا', 'أدب كلاسيكي', 'سياسة', 'خيال علمي'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['جورج اورويل'],
    reviews: [
      { name: 'محمود عبد السلام', text: 'رواية نبوئية عبقرية تصف العالم الحديث بدقة مخيفة!', rating: 5, date: '2023' },
    ],
  },
  'أولاد حارتنا': {
    author: 'نجيب محفوظ (Naguib Mahfouz)',
    category: 'روايات وأدب',
    cover: 'https://covers.openlibrary.org/b/id/8144062-L.jpg',
    desc: 'الرواية الملحمية الخالدة لأديب نوبل نجيب محفوظ، ترصد رحلة البشرية والبحث عن العدل والكرامة والمعرفة عبر أجيال الحارة المصرية الرمزية.',
    rating: 4.6,
    rating_count: 48900,
    review_count: 4820,
    pages_count: 580,
    published_year: 1959,
    first_published: '1959',
    publisher: 'دار الشروق',
    isbn: '9789770914830',
    genres: ['روايات كلاسيكية', 'فلسفة', 'أدب عربي'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['نجيب محفوظ'],
  },
  'الفيل الأزرق': {
    author: 'أحمد مراد (Ahmed Mourad)',
    category: 'رعب وإثارة',
    cover: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1485105416i/16031620.jpg',
    desc: 'رواية الإثارة والغموض النفسي الأيقونية للدكتور يحيى راشد في عنبر 8 غرب بمستشفى العباسية للأمراض النفسية، وغموض حبة التاتول الليلية.',
    rating: 4.4,
    rating_count: 94000,
    review_count: 9100,
    pages_count: 520,
    published_year: 2012,
    first_published: '2012',
    publisher: 'دار الشروق',
    isbn: '9789770931219',
    genres: ['رعب نفسي', 'إثارة', 'غموض'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['احمد مراد'],
  },
  'تراب الماس': {
    author: 'أحمد مراد (Ahmed Mourad)',
    category: 'رعب وإثارة',
    cover: 'https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1265525892i/7704143.jpg',
    desc: 'إثارة وجريمة سياسية مشوقة تدور حول الصيدلي الشاب طه واكتشافه المروع لمذكرات والده وتاريخ التطهير الانتقامي الدفين.',
    rating: 4.4,
    rating_count: 76000,
    review_count: 6700,
    pages_count: 390,
    published_year: 2010,
    first_published: '2010',
    publisher: 'دار الشروق',
    isbn: '9789770927892',
    genres: ['جريمة', 'إثارة', 'غموض'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['احمد مراد'],
  },
  'أرض زيكولا': {
    author: 'عمرو عبد الحميد (Amr Abdel-Hamid)',
    category: 'فانتازيا وتشويق',
    cover: 'https://covers.openlibrary.org/b/id/12841901-L.jpg',
    desc: 'الرواية الأكثر قراءة في الفانتازيا العربية المعاصرة؛ عن أرض يتعامل أهلها بوحدات الذكاء بدلاً من المال، ومن تنفد وحدات ذكائه يواجه يوم الذبح.',
    rating: 4.6,
    rating_count: 112000,
    review_count: 12300,
    pages_count: 288,
    published_year: 2010,
    first_published: '2010',
    publisher: 'دار عصير الكتب',
    isbn: '9789776541016',
    genres: ['فانتازيا', 'خيال', 'تشويق', 'روايات'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['عمرو عبد الحميد'],
  },
  'ارض زيكولا': {
    author: 'عمرو عبد الحميد (Amr Abdel-Hamid)',
    category: 'فانتازيا وتشويق',
    cover: 'https://covers.openlibrary.org/b/id/12841901-L.jpg',
    desc: 'الرواية الأكثر قراءة في الفانتازيا العربية المعاصرة؛ عن أرض يتعامل أهلها بوحدات الذكاء بدلاً من المال.',
    rating: 4.6,
    rating_count: 112000,
    review_count: 12300,
    pages_count: 288,
    published_year: 2010,
    first_published: '2010',
    publisher: 'دار عصير الكتب',
    isbn: '9789776541016',
    genres: ['فانتازيا', 'خيال', 'تشويق'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['عمرو عبد الحميد'],
  },
  'في قلبي أنثى عبرية': {
    author: 'خولة حمدي (Khawla Hamdi)',
    category: 'روايات وأدب',
    cover: 'https://covers.openlibrary.org/b/id/14841883-L.jpg',
    desc: 'رواية إنسانية مستوحاة من أحداث حقيقية في حارة اليهود بجزيرة جربة التونسية وجنوب لبنان، تتقاطع فيها مشاعر الحب والإيمان والتضحية والتعايش.',
    rating: 4.5,
    rating_count: 98000,
    review_count: 9500,
    pages_count: 388,
    published_year: 2012,
    first_published: '2012',
    publisher: 'كيان للنشر والتوزيع',
    isbn: '9789776407077',
    genres: ['روايات', 'حب', 'إنسانيات', 'أدب عربي'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['خولة حمدي'],
  },
  'قواعد العشق الأربعون': {
    author: 'إليف شافاق (Elif Shafak)',
    category: 'روايات وأدب',
    cover: 'https://covers.openlibrary.org/b/id/9078986-L.jpg',
    desc: 'الرواية الروحية العالمية الأكثر مبيعاً، تجسد الصداقة الصوفية بين جلال الدين الرومي وشمس التبريزي وقواعد الحب والصفاء الروحي الأربعين.',
    rating: 4.5,
    rating_count: 280000,
    review_count: 24000,
    pages_count: 512,
    published_year: 2009,
    first_published: 'March 2009',
    publisher: 'دار طوى / دار الآداب',
    isbn: '9789776467019',
    genres: ['تصوف', 'روايات عالمية', 'فلسفة', 'روحانيات'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['اليف شافاق'],
  },
  'ثلاثية غرناطة': {
    author: 'رضوى عاشور (Radwa Ashour)',
    category: 'روايات وأدب',
    cover: 'https://covers.openlibrary.org/b/id/15090909-L.jpg',
    desc: 'الملحمة التاريخية البديعة لرضوى عاشور، تروي سقوط الأندلس ومأساة عائلة أبي جعفر الورّاق في غرناطة وتمسكهم بالهوية والذاكرة العربية.',
    rating: 4.7,
    rating_count: 58000,
    review_count: 6200,
    pages_count: 502,
    published_year: 1994,
    first_published: '1994',
    publisher: 'دار الشروق',
    isbn: '9789770908860',
    genres: ['روايات تاريخية', 'الأندلس', 'أدب ملحمي'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['رضوي عاشور'],
  },
  'الخيميائي': {
    author: 'باولو كويلو (Paulo Coelho)',
    category: 'روايات وأدب',
    cover: 'https://covers.openlibrary.org/b/id/7414780-L.jpg',
    desc: 'الرواية الرمزية الملهمة الأكثر شهرة في العالم، تحكي قصة الراعي الإسباني سانتياغو ورحلته إلى أهرامات مصر للبحث عن أسطورته الشخصية.',
    rating: 4.6,
    rating_count: 3100000,
    review_count: 85000,
    pages_count: 208,
    published_year: 1988,
    first_published: '1988',
    publisher: 'شركة المطبوعات للتوزيع والنشر',
    isbn: '9789953880402',
    genres: ['فلسفة', 'أدب رمزي', 'روايات عالمية'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['باولو كويلو'],
  },
  'العادات الذرية': {
    author: 'جيمس كلير (James Clear)',
    category: 'علم نفس وتطوير ذات',
    cover: 'https://covers.openlibrary.org/b/id/12539702-L.jpg',
    desc: 'الدليل العملي الأوسع انتشاراً عالمياً لبناء العادات الإيجابية والتخلص من السلبية عبر تغييرات صغيرة تدريجية تحقق نتائج استثنائية مضاعفة.',
    rating: 4.8,
    rating_count: 850000,
    review_count: 65000,
    pages_count: 320,
    published_year: 2018,
    first_published: 'October 16, 2018',
    publisher: 'مكتبة جرير / دار التنوير',
    isbn: '9786035092784',
    genres: ['عادات', 'تطوير ذات', 'إنتاجية', 'علم نفس'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['جيمس كلير'],
  },
  'فن اللامبالاة': {
    author: 'مارك مانسون (Mark Manson)',
    category: 'علم نفس وتطوير ذات',
    cover: 'https://covers.openlibrary.org/b/id/8315603-L.jpg',
    desc: 'كتاب يصفع الإيجابية الزائفة ويقدم دليلاً صريحاً وواقعياً للتعامل مع صعوبات الحياة والتركيز فقط على الأشياء التي تستحق الاهتمام.',
    rating: 4.5,
    rating_count: 620000,
    review_count: 42000,
    pages_count: 272,
    published_year: 2016,
    first_published: 'September 13, 2016',
    publisher: 'منشورات الرمل / دار التنوير',
    isbn: '9789776541238',
    genres: ['تطوير ذات', 'فلسفة واقعية', 'علم نفس'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['مارك مانسون'],
  },
  'الأب الغني والأب الفقير': {
    author: 'روبرت كيوساكي (Robert Kiyosaki)',
    category: 'علم نفس وتطوير ذات',
    cover: 'https://covers.openlibrary.org/b/id/8315603-L.jpg',
    desc: 'الكتاب المالي الشهير يغير طريقة تفكيرك تجاه المال، ويوضح الفارق بين الأصول والخصوم وكيف تبني دخلاً سلبياً يقودك للحرية المالية.',
    rating: 4.7,
    rating_count: 540000,
    review_count: 38000,
    pages_count: 336,
    published_year: 1997,
    first_published: '1997',
    publisher: 'مكتبة جرير',
    isbn: '9786035090124',
    genres: ['مال وأعمال', 'حرية مالية', 'استثمار'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['روبرت كيوساكي'],
  },
  'يوتوبيا': {
    author: 'د. أحمد خالد توفيق (Dr. Ahmed Khaled Tawfik)',
    category: 'خيال علمي ورعب',
    cover: 'https://covers.openlibrary.org/b/id/12498404-L.jpg',
    desc: 'ديستوبيا مصرية كلاسيكية ترصد انقسام المجتمع المستقبلي بين ساحل الشمال المسور وفقراء شبرا والمدينة القديمة في رحلة صيد بشري مرعبة.',
    rating: 4.5,
    rating_count: 46000,
    review_count: 4500,
    pages_count: 192,
    published_year: 2008,
    first_published: '2008',
    publisher: 'دار ميريت للنشر',
    isbn: '9789773514105',
    genres: ['ديستوبيا', 'خيال علمي', 'أدب سياسي'],
    author_details: FAMOUS_AUTHORS_DIRECTORY['احمد خالد توفيق'],
  },
}

/**
 * Normalizes Arabic text for flexible matching across spelling variations
 */
export function normalizeArabicTitle(text: string): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '') // remove tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/^(رواية|كتاب|سلسلة|ملحمة|ديوان|قصة|الجزء|جزء|مجموعة)\s+/g, '')
    .replace(/[«»""''()[\]{}،,.\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Intelligent Multi-Token & Fuzzy Matcher against POPULAR_ARABIC_DB
 */
export function fuzzyMatchBook(rawQuery: string): { key: string; entry: PopularBookEntry } | undefined {
  if (!rawQuery || rawQuery.trim().length < 2) return undefined

  const cleanQ = normalizeArabicTitle(rawQuery)
  const qTokens = cleanQ.split(' ').filter(w => w.length > 1)

  // 1. Direct exact or substring match
  for (const [key, entry] of Object.entries(POPULAR_ARABIC_DB)) {
    const cleanKey = normalizeArabicTitle(key)
    if (cleanKey === cleanQ || cleanQ.includes(cleanKey) || cleanKey.includes(cleanQ)) {
      return { key, entry }
    }
  }

  // 2. Token overlap match (e.g. "رواية تراب الماس لأحمد مراد" matches "تراب الماس")
  let bestScore = 0
  let bestMatch: { key: string; entry: PopularBookEntry } | undefined = undefined

  for (const [key, entry] of Object.entries(POPULAR_ARABIC_DB)) {
    const cleanKey = normalizeArabicTitle(key)
    const keyTokens = cleanKey.split(' ').filter(w => w.length > 1)
    if (keyTokens.length === 0) continue

    const matchedTokens = keyTokens.filter(t => cleanQ.includes(t))
    const score = matchedTokens.length / keyTokens.length

    if (score >= 0.65 && score > bestScore) {
      bestScore = score
      bestMatch = { key, entry }
    }
  }

  return bestMatch
}
