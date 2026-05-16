'use client'

import { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { CONTENT, searchContent } from '@/data/content'
import { getCreatorById } from '@/data/creators'
import { Content, ContentCategory, ContentCountry } from '@/types'
import { HiSearch, HiX, HiPlay, HiBookmark } from 'react-icons/hi'
import { useAuth } from '@/contexts/AuthContext'

const CATEGORIES: ContentCategory[] = [
  'Film', 'Short Film', 'Documentary', 'Comedy', 'Music', 'Spoken Word', 'Podcast', 'Interview', 'Culture', 'Series',
]
const COUNTRIES: (ContentCountry | string)[] = [
  'UK', 'US', 'Canada', 'Sweden', 'Somalia', 'Somaliland', 'Finland', 'Norway',
]

function ExploreContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isSaved, toggleSave, user } = useAuth()

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [activeCategory, setActiveCategory] = useState<string>(searchParams.get('category') ?? '')
  const [activeCountry, setActiveCountry] = useState<string>(searchParams.get('country') ?? '')

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
    setActiveCategory(searchParams.get('category') ?? '')
    setActiveCountry(searchParams.get('country') ?? '')
  }, [searchParams])

  function updateParams(newQ: string, newCat: string, newCountry: string) {
    const params = new URLSearchParams()
    if (newQ) params.set('q', newQ)
    if (newCat) params.set('category', newCat)
    if (newCountry) params.set('country', newCountry)
    router.replace(`/explore${params.toString() ? '?' + params.toString() : ''}`, { scroll: false })
  }

  const results = useMemo(() => {
    let items = query ? searchContent(query) : [...CONTENT]
    if (activeCategory) items = items.filter((c) => c.category === activeCategory)
    if (activeCountry) items = items.filter((c) => c.country === activeCountry)
    return items.map((c) => ({ ...c, creator: getCreatorById(c.creatorId) }))
  }, [query, activeCategory, activeCountry])

  function clearFilters() {
    setQuery('')
    setActiveCategory('')
    setActiveCountry('')
    router.replace('/explore', { scroll: false })
  }

  const hasFilters = query || activeCategory || activeCountry

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-10 max-w-screen-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-dhaqan-text mb-2">
          Explore
        </h1>
        <p className="text-dhaqan-muted">
          Discover Somali stories from across the diaspora
        </p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative mb-8 max-w-2xl"
      >
        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dhaqan-muted" />
        <input
          type="text"
          placeholder="Search Somali films, documentaries, music, podcasts..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            updateParams(e.target.value, activeCategory, activeCountry)
          }}
          className="w-full bg-dhaqan-surface border border-dhaqan-border text-dhaqan-text placeholder:text-dhaqan-muted text-sm pl-12 pr-12 py-4 rounded-2xl focus:outline-none focus:border-dhaqan-gold transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); updateParams('', activeCategory, activeCountry) }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-dhaqan-muted hover:text-dhaqan-text"
          >
            <HiX className="w-4 h-4" />
          </button>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="flex flex-col gap-4 mb-10"
      >
        {/* Categories */}
        <div>
          <p className="text-xs text-dhaqan-muted-dark tracking-widest uppercase mb-2">Category</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  const next = activeCategory === cat ? '' : cat
                  setActiveCategory(next)
                  updateParams(query, next, activeCountry)
                }}
                className={`text-xs px-3.5 py-1.5 rounded-full border transition-all font-medium ${
                  activeCategory === cat
                    ? 'bg-dhaqan-gold text-dhaqan-bg border-dhaqan-gold'
                    : 'border-dhaqan-border text-dhaqan-muted hover:border-dhaqan-gold/50 hover:text-dhaqan-gold'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Countries */}
        <div>
          <p className="text-xs text-dhaqan-muted-dark tracking-widest uppercase mb-2">Country</p>
          <div className="flex flex-wrap gap-2">
            {COUNTRIES.map((country) => (
              <button
                key={country}
                onClick={() => {
                  const next = activeCountry === country ? '' : country
                  setActiveCountry(next)
                  updateParams(query, activeCategory, next)
                }}
                className={`text-xs px-3.5 py-1.5 rounded-full border transition-all font-medium ${
                  activeCountry === country
                    ? 'bg-dhaqan-gold/20 border-dhaqan-gold text-dhaqan-gold'
                    : 'border-dhaqan-border text-dhaqan-muted hover:border-dhaqan-gold/50 hover:text-dhaqan-gold'
                }`}
              >
                {country}
              </button>
            ))}
          </div>
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-xs text-dhaqan-muted hover:text-dhaqan-gold transition-colors w-fit"
          >
            <HiX className="w-3.5 h-3.5" />
            Clear all filters
          </button>
        )}
      </motion.div>

      {/* Results count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-dhaqan-muted">
          {results.length} {results.length === 1 ? 'result' : 'results'}
          {query && <span> for <span className="text-dhaqan-text">"{query}"</span></span>}
        </p>
      </div>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        {results.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-20"
          >
            <p className="text-dhaqan-muted text-lg mb-2">No content found</p>
            <p className="text-dhaqan-muted-dark text-sm">Try a different search or clear filters</p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6"
          >
            {results.map((item, i) => (
              <ExploreCard key={item.id} content={item} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ExploreCard({ content, index }: { content: Content & { creator?: ReturnType<typeof getCreatorById> }; index: number }) {
  const { isSaved, toggleSave, user } = useAuth()
  const [imgError, setImgError] = useState(false)
  const saved = isSaved(content.id)

  const thumb = imgError
    ? `https://img.youtube.com/vi/${content.youtubeId}/hqdefault.jpg`
    : content.thumbnailUrl

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.4) }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Link href={`/watch/${content.id}`} prefetch={false}>
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-dhaqan-card">
          <Image
            src={thumb}
            alt={content.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
            loading="lazy"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-dhaqan-gold/90 flex items-center justify-center">
              <HiPlay className="w-4 h-4 text-dhaqan-bg ml-0.5" />
            </div>
          </div>
          <div className="absolute top-1.5 left-1.5 text-[9px] font-semibold tracking-wider uppercase text-dhaqan-gold bg-dhaqan-bg/80 px-1.5 py-0.5 rounded">
            {content.category}
          </div>
          {user && (
            <button
              onClick={(e) => { e.preventDefault(); toggleSave(content.id) }}
              className={`absolute top-1.5 right-1.5 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all ${
                saved ? 'bg-dhaqan-gold text-dhaqan-bg' : 'bg-black/50 text-white'
              }`}
            >
              <HiBookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
        <div className="mt-2">
          <h3 className="text-xs sm:text-sm font-semibold text-dhaqan-text line-clamp-1 group-hover:text-dhaqan-gold transition-colors">
            {content.title}
          </h3>
          <p className="text-[11px] text-dhaqan-muted mt-0.5">
            {content.country} · {content.year}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-dhaqan-muted">Loading...</div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  )
}
