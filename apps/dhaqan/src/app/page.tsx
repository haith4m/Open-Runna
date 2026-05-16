import { Suspense } from 'react'
import HeroSection from '@/components/home/HeroSection'
import ContentRow from '@/components/home/ContentRow'
import { SkeletonHero, SkeletonRow } from '@/components/ui/SkeletonCard'
import { CONTENT, CONTENT_ROWS } from '@/data/content'
import { getCreatorById } from '@/data/creators'

export const dynamic = 'force-static'

export default function HomePage() {
  const featured = CONTENT.find((c) => c.featured) ?? CONTENT[0]
  const featuredWithCreator = {
    ...featured,
    creator: getCreatorById(featured.creatorId),
  }

  const rows = CONTENT_ROWS.map((row) => ({
    ...row,
    items: CONTENT.filter(row.filter).map((c) => ({
      ...c,
      creator: getCreatorById(c.creatorId),
    })),
  })).filter((row) => row.items.length > 0)

  return (
    <div className="bg-dhaqan-bg">
      {/* Hero */}
      <Suspense fallback={<SkeletonHero />}>
        <HeroSection content={featuredWithCreator} />
      </Suspense>

      {/* Content rows */}
      <div className="space-y-10 pb-16 -mt-4 relative z-10">
        {rows.map((row, i) => (
          <Suspense key={row.id} fallback={<SkeletonRow />}>
            <ContentRow
              title={row.title}
              items={row.items}
              size={i === 0 ? 'lg' : 'md'}
              accent={i === 0}
            />
          </Suspense>
        ))}
      </div>

      {/* Cultural tagline */}
      <div className="text-center py-16 px-4 border-t border-dhaqan-border/30">
        <p className="font-display text-xl sm:text-2xl text-dhaqan-muted italic">
          "Af Soomaali waa guri" — Somali is home.
        </p>
        <p className="text-dhaqan-muted-dark text-sm mt-2 tracking-widest uppercase">
          Stories from the diaspora, for the diaspora
        </p>
      </div>
    </div>
  )
}
