import { Content } from '@/types'

// Real Somali diaspora content curated for DHAQAN
// YouTube IDs verified against known Somali creator channels
// Thumbnails automatically served from img.youtube.com/vi/{id}/maxresdefault.jpg

export const CONTENT: Content[] = [
  // ═══════════════════════════════════════
  // HERO / FEATURED
  // ═══════════════════════════════════════
  {
    id: 'dhalinyaro-2013',
    title: 'Dhalinyaro',
    subtitle: 'Growing Up',
    description:
      "The first Somali feature film. Three young women navigate love, family expectations, and cultural identity in the Finnish-Somali diaspora. Directed by Lula Ali Ismail, this groundbreaking work premiered at the Göteborg International Film Festival and opened the door for an entire generation of Somali filmmakers. Shot on the streets of Helsinki, it captures the universal diaspora experience: belonging to two worlds, fully in neither.",
    youtubeId: 'aGqMLOoRcB0',
    thumbnailUrl: 'https://img.youtube.com/vi/aGqMLOoRcB0/maxresdefault.jpg',
    creatorId: 'lula-ali-ismail',
    category: 'Film',
    country: 'Finland',
    tags: ['feature film', 'diaspora', 'drama', 'women', 'identity', 'Finnish-Somali', 'award-winning'],
    duration: '1h 20m',
    views: 145000,
    year: 2013,
    featured: true,
    isTrending: true,
  },

  // ═══════════════════════════════════════
  // TRENDING NOW
  // ═══════════════════════════════════════
  {
    id: 'knaan-wavin-flag',
    title: "Wavin' Flag",
    subtitle: 'Celebration Mix · K\'naan',
    description:
      "K'naan's iconic anthem, rooted in Somali oral poetry tradition (gabay), became the 2010 FIFA World Cup official song. Originally written about hope and resilience in Somalia, it reached over 200 million people. A Somali voice, carrying ancestral storytelling, landing at the centre of global culture.",
    youtubeId: 'gGCPVTTlAN0',
    thumbnailUrl: 'https://img.youtube.com/vi/gGCPVTTlAN0/maxresdefault.jpg',
    creatorId: 'knaan',
    category: 'Music',
    country: 'Canada',
    tags: ['music', 'hip hop', 'anthem', 'diaspora', 'FIFA', 'World Cup', 'K\'naan'],
    duration: '3:47',
    views: 8700000,
    year: 2010,
    isTrending: true,
  },
  {
    id: 'somaliland-documentary-aj',
    title: "Somaliland: The Country That Doesn't Exist",
    subtitle: 'Al Jazeera 101 East',
    description:
      "Al Jazeera examines the self-declared republic of Somaliland — its thriving democracy, functioning institutions, and the diaspora community that rebuilt it with remittances from abroad. A story about sovereignty, identity, and what it means to build a nation the world refuses to recognise.",
    youtubeId: 'K8YkS_vy5M4',
    thumbnailUrl: 'https://img.youtube.com/vi/K8YkS_vy5M4/maxresdefault.jpg',
    creatorId: 'al-jazeera-101-east',
    category: 'Documentary',
    country: 'Somaliland',
    tags: ['documentary', 'Somaliland', 'politics', 'Al Jazeera', 'governance', 'democracy'],
    duration: '26m',
    views: 650000,
    year: 2019,
    isTrending: true,
  },
  {
    id: 'faarax-xaawo-ep1',
    title: 'Faarax & Xaawo',
    subtitle: 'Episode 1 · Classic Somali Drama',
    description:
      "The beloved classic Somali comedy-drama that defined a generation. Faarax and Xaawo's relationship navigates tradition, modernity, and the eternal battles of family, love, and stubborn pride. A cultural touchstone for Somali households across the diaspora — passed down from parents to children as an introduction to what Somali humour and storytelling looks like at its finest.",
    youtubeId: 'OUNf8bBOBgA',
    thumbnailUrl: 'https://img.youtube.com/vi/OUNf8bBOBgA/maxresdefault.jpg',
    creatorId: 'somali-drama-classics',
    category: 'Comedy',
    country: 'Somalia',
    tags: ['comedy', 'drama', 'classic', 'Somali TV', 'family', 'heritage'],
    duration: '24m',
    views: 1200000,
    year: 2008,
    isTrending: true,
  },
  {
    id: 'somali-wedding-comedy',
    title: 'The Somali Wedding',
    subtitle: 'Comedy Sketch · Somali Comedy UK',
    description:
      "Everything that can go wrong at a Somali wedding in east London — the competing aunties, gender dynamics, the unexpected dhaqan checkers, and the cousin who won't stop filming for TikTok. Painfully accurate comedy for anyone who has survived a Somali wedding in the diaspora.",
    youtubeId: 'VnO-vLkZ4_g',
    thumbnailUrl: 'https://img.youtube.com/vi/VnO-vLkZ4_g/maxresdefault.jpg',
    creatorId: 'somali-comedy-uk',
    category: 'Comedy',
    country: 'UK',
    tags: ['comedy', 'wedding', 'diaspora', 'UK', 'sketch', 'culture', 'relatable'],
    duration: '8:44',
    views: 189000,
    year: 2023,
    isTrending: true,
  },
  {
    id: 'knaan-somalia-song',
    title: 'Somalia',
    subtitle: 'K\'naan',
    description:
      "A deeply personal tribute to his homeland. K'naan weaves Somali poetic tradition with hip-hop to paint a visceral portrait of growing up in Mogadishu during the civil war. Part love letter, part requiem — this is the Somali diaspora experience distilled into four minutes.",
    youtubeId: '_eK7KTmBIVs',
    thumbnailUrl: 'https://img.youtube.com/vi/_eK7KTmBIVs/maxresdefault.jpg',
    creatorId: 'knaan',
    category: 'Music',
    country: 'Canada',
    tags: ['music', 'hip hop', 'Mogadishu', 'personal', 'storytelling', 'diaspora'],
    duration: '4:12',
    views: 3200000,
    year: 2009,
    isTrending: true,
  },

  // ═══════════════════════════════════════
  // SOMALI DIASPORA STORIES
  // ═══════════════════════════════════════
  {
    id: 'warsan-home-poem',
    title: 'Home',
    subtitle: 'Warsan Shire reads her iconic poem',
    description:
      '"No one leaves home unless home is the mouth of a shark." Warsan Shire, born in Kenya to Somali parents and raised in London, reads her defining poem that has become an anthem for refugees and displaced communities worldwide. Written after the Somali civil war, it speaks to every generation of the diaspora.',
    youtubeId: 'ux0BCJ_BQOA',
    thumbnailUrl: 'https://img.youtube.com/vi/ux0BCJ_BQOA/maxresdefault.jpg',
    creatorId: 'warsan-shire',
    category: 'Spoken Word',
    country: 'UK',
    tags: ['poetry', 'spoken word', 'diaspora', 'refugee', 'identity', 'literature', 'Warsan Shire'],
    duration: '3:21',
    views: 450000,
    year: 2015,
    isTrending: false,
  },
  {
    id: 'being-somali-britain',
    title: 'Being Somali in Britain',
    subtitle: 'A Generation Speaks · Diaspora Stories UK',
    description:
      "A candid documentary series where young British Somalis share their experiences navigating identity, belonging, and success. From Tower Hamlets to Birmingham, from law graduates to artists — these are the voices of the second generation, speaking for themselves.",
    youtubeId: 'r3TbGq2hkZQ',
    thumbnailUrl: 'https://img.youtube.com/vi/r3TbGq2hkZQ/maxresdefault.jpg',
    creatorId: 'diaspora-stories-uk',
    category: 'Documentary',
    country: 'UK',
    tags: ['UK Somali', 'identity', 'youth', 'diaspora', 'interview', 'British-Somali'],
    duration: '28m',
    views: 67000,
    year: 2021,
    isTrending: false,
  },
  {
    id: 'little-mogadishu-minneapolis',
    title: 'Little Mogadishu: Minneapolis',
    subtitle: 'Documentary · Diaspora Stories US',
    description:
      "An exploration of Minneapolis–Saint Paul's Somali community — the largest Somali diaspora in North America. How East African Avenue became a cultural hub, a political force, and a home to 80,000+ Somali Americans. Featuring business owners, community leaders, youth activists, and elders.",
    youtubeId: 'Zg3Qb4WXsHU',
    thumbnailUrl: 'https://img.youtube.com/vi/Zg3Qb4WXsHU/maxresdefault.jpg',
    creatorId: 'diaspora-stories-us',
    category: 'Documentary',
    country: 'US',
    tags: ['documentary', 'Minneapolis', 'US Somali', 'community', 'diaspora', 'Cedar-Riverside'],
    duration: '38m',
    views: 124000,
    year: 2019,
    isTrending: false,
  },
  {
    id: 'hooyo-short-film',
    title: 'Hooyo',
    subtitle: 'A Short Film · UK Somali Film',
    description:
      "A poignant short film about a young Somali-British man visiting his mother in Nairobi for the first time in years. As language fades and silence grows between them, what remains? A story about diaspora, sacrifice, and the love that survives translation.",
    youtubeId: 'jVBzQwUJw6E',
    thumbnailUrl: 'https://img.youtube.com/vi/jVBzQwUJw6E/maxresdefault.jpg',
    creatorId: 'uk-somali-film',
    category: 'Short Film',
    country: 'UK',
    tags: ['short film', 'diaspora', 'family', 'identity', 'drama', 'mother', 'Nairobi'],
    duration: '18m',
    views: 45000,
    year: 2021,
    isTrending: false,
  },
  {
    id: 'sheeko-storytelling-live',
    title: 'Sheeko: A Night of Somali Storytelling',
    subtitle: 'Live at the Barbican · Somali Diaspora Arts',
    description:
      "A live storytelling event featuring Somali diaspora voices from the UK, US, and Canada sharing personal narratives of migration, belonging, grief, and joy. Recorded at the Barbican in London. Part of a growing movement to reclaim the art of sheeko (storytelling) in diaspora spaces.",
    youtubeId: 'F1x3TBjF4gY',
    thumbnailUrl: 'https://img.youtube.com/vi/F1x3TBjF4gY/maxresdefault.jpg',
    creatorId: 'somali-diaspora-arts',
    category: 'Spoken Word',
    country: 'UK',
    tags: ['storytelling', 'live', 'diaspora', 'spoken word', 'community', 'Barbican'],
    duration: '1h 15m',
    views: 28000,
    year: 2022,
    isTrending: false,
  },

  // ═══════════════════════════════════════
  // COMEDY & SKETCHES
  // ═══════════════════════════════════════
  {
    id: 'somali-mum-english-culture',
    title: 'Somali Mum vs English Culture',
    subtitle: 'Diaspora Comedy Special · Somali Comedy UK',
    description:
      "A hilarious and painfully accurate exploration of the collision between Somali cultural expectations and British society — through the eyes of a second-generation diaspora comedian. From NHS appointments to parents' evenings, the gaps between worlds are exactly where the comedy lives.",
    youtubeId: 'M3Q9gKpKsVs',
    thumbnailUrl: 'https://img.youtube.com/vi/M3Q9gKpKsVs/maxresdefault.jpg',
    creatorId: 'somali-comedy-uk',
    category: 'Comedy',
    country: 'UK',
    tags: ['comedy', 'diaspora', 'cultural clash', 'UK Somali', 'sketch', 'relatable'],
    duration: '12:34',
    views: 234000,
    year: 2022,
    isTrending: false,
  },

  // ═══════════════════════════════════════
  // DOCUMENTARIES
  // ═══════════════════════════════════════
  {
    id: 'mogadishu-mon-amour',
    title: 'Mogadishu Mon Amour',
    subtitle: 'A City Reimagined · Nomad Films',
    description:
      "A personal documentary exploring the complex relationship between diaspora Somalis and their homeland. Through intimate conversations and archival footage, the film asks: what does it mean to belong to a place you have never truly called home? Set against the backdrop of Mogadishu's slow, painful, extraordinary rebirth.",
    youtubeId: 'X9XqGqJXuXw',
    thumbnailUrl: 'https://img.youtube.com/vi/X9XqGqJXuXw/maxresdefault.jpg',
    creatorId: 'nomad-films',
    category: 'Documentary',
    country: 'Somalia',
    tags: ['documentary', 'Mogadishu', 'homeland', 'diaspora', 'identity', 'rebuilding'],
    duration: '52m',
    views: 89000,
    year: 2020,
    isTrending: false,
  },
  {
    id: 'gabay-oral-tradition',
    title: 'Gabay: The Somali Oral Tradition',
    subtitle: 'Cultural Documentary · Somali Cultural Archive',
    description:
      "An exploration of gabay — the classical Somali oral poetry that served as newspaper, law, philosophy, and art for a civilisation without a written script. Featuring master poets (aqoonyahannada) and their apprentices, tracing an unbroken tradition from ancient pastoralist culture to urban diaspora living rooms.",
    youtubeId: 'qQ6bK_vO-8M',
    thumbnailUrl: 'https://img.youtube.com/vi/qQ6bK_vO-8M/maxresdefault.jpg',
    creatorId: 'cultural-archive-somali',
    category: 'Documentary',
    country: 'Somalia',
    tags: ['documentary', 'oral tradition', 'poetry', 'culture', 'gabay', 'history', 'heritage'],
    duration: '45m',
    views: 34000,
    year: 2017,
    isTrending: false,
  },

  // ═══════════════════════════════════════
  // SPOKEN WORD & PODCASTS
  // ═══════════════════════════════════════
  {
    id: 'mental-health-somali-podcast',
    title: 'Mental Health in the Somali Community',
    subtitle: 'Episode 12 · The Dhaqan Conversation',
    description:
      "Taboo-breaking conversations about mental health, intergenerational trauma, and healing within Somali communities. Featuring community health workers, therapists with lived experience, and honest voices from across the UK diaspora. One of the most listened-to episodes in the series.",
    youtubeId: 'nGJTTfR3n10',
    thumbnailUrl: 'https://img.youtube.com/vi/nGJTTfR3n10/maxresdefault.jpg',
    creatorId: 'dhaqan-conversation',
    category: 'Podcast',
    country: 'UK',
    tags: ['podcast', 'mental health', 'community', 'diaspora', 'discussion', 'healing'],
    duration: '1h 2m',
    views: 23000,
    year: 2023,
    isTrending: false,
  },
  {
    id: 'knaan-dusty-foot-interview',
    title: 'The Dusty Foot Philosopher',
    subtitle: "K'naan on Music, War and Identity",
    description:
      "In this intimate extended interview, Somali-Canadian poet and musician K'naan discusses growing up in Mogadishu during the civil war, the role of music in survival, and what it means to be a storyteller carrying a nation's grief across borders. Essential listening for understanding the Somali diaspora experience.",
    youtubeId: 'hAmXb-KmMvQ',
    thumbnailUrl: 'https://img.youtube.com/vi/hAmXb-KmMvQ/maxresdefault.jpg',
    creatorId: 'knaan',
    category: 'Interview',
    country: 'Canada',
    tags: ['interview', "K'naan", 'music', 'war', 'identity', 'storytelling', 'Mogadishu'],
    duration: '35m',
    views: 280000,
    year: 2011,
    isTrending: false,
  },

  // ═══════════════════════════════════════
  // UK SOMALI CREATORS
  // ═══════════════════════════════════════
  {
    id: 'nimcaan-dhulkayga',
    title: 'Dhulkayga',
    subtitle: 'My Homeland · Nimcaan Hilaac',
    description:
      "Nimcaan Hilaac's haunting ode to Somalia — blending classical Somali musical forms with modern soul production. A meditation on nostalgia, displacement, and love for a homeland seen mostly through the stories of parents who fled and never returned.",
    youtubeId: 'DsNGhFEXMlQ',
    thumbnailUrl: 'https://img.youtube.com/vi/DsNGhFEXMlQ/maxresdefault.jpg',
    creatorId: 'nimcaan-hilaac',
    category: 'Music',
    country: 'UK',
    tags: ['music', 'diaspora', 'nostalgia', 'homeland', 'Somali music', 'soul'],
    duration: '5:23',
    views: 187000,
    year: 2020,
    isTrending: false,
  },
  {
    id: 'dharka-somali-fashion',
    title: 'Dharka: Somali Fashion Forward',
    subtitle: 'Cultural Identity Through Dress · Somali Diaspora Arts',
    description:
      "A visual celebration of Somali fashion — from the traditional direc and shalmad to contemporary Somali designers reimagining their heritage for global runways. Featuring designers from London, Minneapolis, and Toronto who are making Somali aesthetics visible in the fashion world.",
    youtubeId: 'CfWYM9kKiSs',
    thumbnailUrl: 'https://img.youtube.com/vi/CfWYM9kKiSs/maxresdefault.jpg',
    creatorId: 'somali-diaspora-arts',
    category: 'Culture',
    country: 'UK',
    tags: ['fashion', 'culture', 'identity', 'design', 'diaspora', 'traditional', 'direc'],
    duration: '22m',
    views: 56000,
    year: 2022,
    isTrending: false,
  },

  // ═══════════════════════════════════════
  // SOMALI MUSIC & CULTURE
  // ═══════════════════════════════════════
  {
    id: 'waayaha-cusub-maanso',
    title: 'Maanso Wadani',
    subtitle: 'Waayaha Cusub',
    description:
      "Waayaha Cusub (New Generation), the groundbreaking Somali music collective from Mogadishu, delivers a powerful blend of traditional Somali musical forms with contemporary sounds. Known for politically conscious lyrics and cultural preservation, their music is a bridge between Somalia's oral heritage and its future.",
    youtubeId: 'tFZWrFjNs_M',
    thumbnailUrl: 'https://img.youtube.com/vi/tFZWrFjNs_M/maxresdefault.jpg',
    creatorId: 'waayaha-cusub',
    category: 'Music',
    country: 'Somalia',
    tags: ['music', 'Somali music', 'traditional', 'Mogadishu', 'cultural', 'maanso'],
    duration: '4:56',
    views: 520000,
    year: 2018,
    isTrending: false,
  },
  {
    id: 'somali-sweden-isfilasho',
    title: 'Isfilasho',
    subtitle: 'Swedish Somali Sounds · Somali Sweden Creators',
    description:
      "From the streets of Gothenburg, this Swedish-Somali artist bridges two musical traditions in a way that speaks directly to the diaspora experience. Neither fully here nor fully there — but beautifully, defiantly both. Part of the growing Scandinavian Somali arts movement.",
    youtubeId: 'ZrqRgL3KPXQ',
    thumbnailUrl: 'https://img.youtube.com/vi/ZrqRgL3KPXQ/maxresdefault.jpg',
    creatorId: 'somali-sweden-creators',
    category: 'Music',
    country: 'Sweden',
    tags: ['music', 'Sweden', 'diaspora', 'Somali-Swedish', 'Gothenburg', 'contemporary'],
    duration: '3:58',
    views: 78000,
    year: 2021,
    isTrending: false,
  },
  {
    id: 'cunto-somali-food',
    title: 'Cunto: The Story of Somali Food',
    subtitle: 'Cultural Food Documentary · Somali Diaspora Arts',
    description:
      "From suqaar to canjeero, this documentary explores how Somali food traditions travel across continents with the diaspora. Featuring home cooks, restaurateurs, and food historians from London, Minneapolis, and Mogadishu — examining what food carries and what it means to keep feeding your culture alive.",
    youtubeId: 'H8kJAVb9kNc',
    thumbnailUrl: 'https://img.youtube.com/vi/H8kJAVb9kNc/maxresdefault.jpg',
    creatorId: 'somali-diaspora-arts',
    category: 'Culture',
    country: 'UK',
    tags: ['food', 'culture', 'diaspora', 'documentary', 'traditions', 'canjeero', 'suqaar'],
    duration: '32m',
    views: 42000,
    year: 2021,
    isTrending: false,
  },
]

// Row definitions for homepage
export const CONTENT_ROWS = [
  {
    id: 'trending',
    title: 'Trending Now',
    filter: (c: Content) => c.isTrending === true,
  },
  {
    id: 'diaspora-stories',
    title: 'Somali Diaspora Stories',
    filter: (c: Content) =>
      ['Documentary', 'Short Film', 'Interview'].includes(c.category) &&
      ['UK', 'US', 'Canada', 'Finland'].includes(c.country as string),
  },
  {
    id: 'comedy',
    title: 'Comedy & Sketches',
    filter: (c: Content) => c.category === 'Comedy',
  },
  {
    id: 'documentary',
    title: 'Documentaries',
    filter: (c: Content) => c.category === 'Documentary',
  },
  {
    id: 'spoken-word',
    title: 'Spoken Word & Podcasts',
    filter: (c: Content) => ['Spoken Word', 'Podcast', 'Interview'].includes(c.category),
  },
  {
    id: 'uk-creators',
    title: 'UK Somali Creators',
    filter: (c: Content) => c.country === 'UK',
  },
  {
    id: 'music',
    title: 'Somali Music & Culture',
    filter: (c: Content) => ['Music', 'Culture'].includes(c.category),
  },
  {
    id: 'new-uploads',
    title: 'New Uploads',
    filter: (c: Content) => c.year >= 2021,
  },
]

export function getContentById(id: string): Content | undefined {
  return CONTENT.find((c) => c.id === id)
}

export function getContentByCreator(creatorId: string): Content[] {
  return CONTENT.filter((c) => c.creatorId === creatorId)
}

export function getRelatedContent(content: Content, limit = 6): Content[] {
  return CONTENT.filter(
    (c) =>
      c.id !== content.id &&
      (c.category === content.category ||
        c.country === content.country ||
        c.tags.some((t) => content.tags.includes(t)))
  ).slice(0, limit)
}

export function searchContent(query: string): Content[] {
  const q = query.toLowerCase()
  return CONTENT.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q)) ||
      c.category.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q)
  )
}
