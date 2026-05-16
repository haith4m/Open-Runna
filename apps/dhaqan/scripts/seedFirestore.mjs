/**
 * Seed script — populates Firestore with DHAQAN content and creator data
 *
 * Usage:
 *   1. Download your Firebase service account key from:
 *      Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Save as apps/dhaqan/serviceAccountKey.json
 *   3. Run: node scripts/seedFirestore.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

let serviceAccount
try {
  serviceAccount = JSON.parse(readFileSync(join(__dirname, '..', 'serviceAccountKey.json'), 'utf8'))
} catch {
  console.error('❌  Could not read serviceAccountKey.json')
  console.error('   Download it from Firebase Console → Project Settings → Service Accounts')
  process.exit(1)
}

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// ═══════════════════════════════════════════════════════════════
// CREATORS
// ═══════════════════════════════════════════════════════════════

const creators = [
  {
    id: 'lula-ali-ismail',
    name: 'Lula Ali Ismail',
    bio: 'Finnish-Somali filmmaker and the first Somali woman to direct a feature film. Her debut Dhalinyaro premiered at the Göteborg International Film Festival.',
    country: 'Finland',
    image: '',
    contentCount: 3,
    socials: { instagram: '@lulaaliismail', twitter: '@LulaAliIsmail' },
    tags: ['director', 'filmmaker', 'diaspora', 'Finland'],
    verified: true,
  },
  {
    id: 'knaan',
    name: "K'naan",
    fullName: 'Keinan Abdi Warsame',
    bio: "Somali-Canadian rapper, singer, songwriter, and poet. His anthem 'Wavin' Flag' became the 2010 FIFA World Cup song.",
    country: 'Canada',
    image: '',
    contentCount: 8,
    socials: { instagram: '@knaan', twitter: '@K_naan' },
    tags: ['music', 'rap', 'poetry', 'Somalia', 'Canada'],
    verified: true,
  },
  {
    id: 'warsan-shire',
    name: 'Warsan Shire',
    bio: "Somali-British poet born in Kenya, raised in London. First Young Poet Laureate for London (2013-14). Her poem 'Home' is an anthem for the diaspora.",
    country: 'UK',
    image: '',
    contentCount: 5,
    socials: { instagram: '@warsanshire', twitter: '@warsan_shire' },
    tags: ['poet', 'writer', 'spoken word', 'UK', 'London'],
    verified: true,
  },
  {
    id: 'waayaha-cusub',
    name: 'Waayaha Cusub',
    bio: "Pioneering Somali music collective from Mogadishu. Blend traditional Somali music with contemporary production.",
    country: 'Somalia',
    image: '',
    contentCount: 12,
    socials: { youtube: 'WaayahaCusub' },
    tags: ['music', 'group', 'traditional', 'contemporary', 'Somalia'],
    verified: true,
  },
  {
    id: 'al-jazeera-101-east',
    name: 'Al Jazeera 101 East',
    bio: "Al Jazeera's flagship current affairs programme with extensive coverage of Somalia and Somaliland.",
    country: 'Somalia',
    image: '',
    contentCount: 150,
    socials: { youtube: 'AlJazeera', twitter: '@AJ101East' },
    tags: ['news', 'documentary', 'journalism'],
    verified: true,
  },
]

// ═══════════════════════════════════════════════════════════════
// CONTENT
// ═══════════════════════════════════════════════════════════════

const content = [
  {
    id: 'dhalinyaro-2013',
    title: 'Dhalinyaro',
    subtitle: 'Growing Up',
    description: 'The first Somali feature film. Three young women navigate love, family, and cultural identity in the Finnish-Somali diaspora.',
    youtubeId: 'aGqMLOoRcB0',
    thumbnailUrl: 'https://img.youtube.com/vi/aGqMLOoRcB0/maxresdefault.jpg',
    creatorId: 'lula-ali-ismail',
    category: 'Film',
    country: 'Finland',
    tags: ['feature film', 'diaspora', 'drama', 'women', 'identity'],
    duration: '1h 20m',
    views: 145000,
    year: 2013,
    featured: true,
    isTrending: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'knaan-wavin-flag',
    title: "Wavin' Flag",
    subtitle: 'Celebration Mix',
    description: "K'naan's iconic anthem rooted in Somali oral poetry tradition became the 2010 FIFA World Cup official song.",
    youtubeId: 'gGCPVTTlAN0',
    thumbnailUrl: 'https://img.youtube.com/vi/gGCPVTTlAN0/maxresdefault.jpg',
    creatorId: 'knaan',
    category: 'Music',
    country: 'Canada',
    tags: ['music', 'hip hop', 'anthem', 'diaspora', 'World Cup'],
    duration: '3:47',
    views: 8700000,
    year: 2010,
    isTrending: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'somaliland-documentary-aj',
    title: "Somaliland: The Country That Doesn't Exist",
    subtitle: 'Al Jazeera 101 East',
    description: "Al Jazeera examines the self-declared republic of Somaliland — its democracy, and the diaspora that rebuilt it.",
    youtubeId: 'K8YkS_vy5M4',
    thumbnailUrl: 'https://img.youtube.com/vi/K8YkS_vy5M4/maxresdefault.jpg',
    creatorId: 'al-jazeera-101-east',
    category: 'Documentary',
    country: 'Somaliland',
    tags: ['documentary', 'Somaliland', 'politics', 'Al Jazeera', 'governance'],
    duration: '26m',
    views: 650000,
    year: 2019,
    isTrending: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'warsan-home-poem',
    title: 'Home',
    subtitle: 'Warsan Shire reads her iconic poem',
    description: '"No one leaves home unless home is the mouth of a shark." Warsan Shire reads her defining diaspora poem.',
    youtubeId: 'ux0BCJ_BQOA',
    thumbnailUrl: 'https://img.youtube.com/vi/ux0BCJ_BQOA/maxresdefault.jpg',
    creatorId: 'warsan-shire',
    category: 'Spoken Word',
    country: 'UK',
    tags: ['poetry', 'spoken word', 'diaspora', 'refugee', 'identity'],
    duration: '3:21',
    views: 450000,
    year: 2015,
    isTrending: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'waayaha-cusub-maanso',
    title: 'Maanso Wadani',
    subtitle: 'Waayaha Cusub',
    description: 'Waayaha Cusub delivers a powerful blend of traditional Somali music with contemporary sounds.',
    youtubeId: 'tFZWrFjNs_M',
    thumbnailUrl: 'https://img.youtube.com/vi/tFZWrFjNs_M/maxresdefault.jpg',
    creatorId: 'waayaha-cusub',
    category: 'Music',
    country: 'Somalia',
    tags: ['music', 'Somali music', 'traditional', 'Mogadishu', 'cultural'],
    duration: '4:56',
    views: 520000,
    year: 2018,
    isTrending: false,
    createdAt: new Date().toISOString(),
  },
]

// ═══════════════════════════════════════════════════════════════
// SEED
// ═══════════════════════════════════════════════════════════════

async function seed() {
  console.log('🌱  Seeding DHAQAN Firestore...\n')

  // Seed creators
  console.log('👤  Seeding creators...')
  for (const creator of creators) {
    await db.collection('creators').doc(creator.id).set(creator, { merge: true })
    console.log(`   ✓ ${creator.name}`)
  }

  // Seed content
  console.log('\n🎬  Seeding content...')
  for (const item of content) {
    await db.collection('content').doc(item.id).set(item, { merge: true })
    console.log(`   ✓ ${item.title}`)
  }

  console.log('\n✅  DHAQAN seed complete!')
  console.log(`   ${creators.length} creators • ${content.length} content items`)
  console.log('\n   "Af Soomaali waa guri" — Somali is home.')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
