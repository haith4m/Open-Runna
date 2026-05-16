'use client'

import { use, useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { getContentById, getRelatedContent } from '@/data/content'
import { getCreatorById } from '@/data/creators'
import YouTubePlayer from '@/components/content/YouTubePlayer'
import ContentCard from '@/components/content/ContentCard'
import { useAuth } from '@/contexts/AuthContext'
import { HiBookmark, HiExternalLink, HiEye, HiClock, HiTag } from 'react-icons/hi'

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { isSaved, toggleSave, user, recordView } = useAuth()
  const [saving, setSaving] = useState(false)

  const contentData = getContentById(id)
  if (!contentData) notFound()

  // contentData is guaranteed non-null after notFound()
  const content = contentData!
  const creator = getCreatorById(content.creatorId)
  const related = getRelatedContent(content, 8).map((c) => ({
    ...c,
    creator: getCreatorById(c.creatorId),
  }))
  const saved = isSaved(content.id)

  useEffect(() => {
    recordView(content.id)
  }, [content.id])

  async function handleSave() {
    if (!user) return
    setSaving(true)
    await toggleSave(content.id)
    setSaving(false)
  }

  return (
    <div className="min-h-screen pt-18 bg-dhaqan-bg">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10 pt-6 pb-20">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Main content */}
          <div className="xl:col-span-2">
            {/* Player */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <YouTubePlayer
                youtubeId={content.youtubeId}
                title={content.title}
                thumbnailUrl={content.thumbnailUrl}
              />
            </motion.div>

            {/* Title & Meta */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold tracking-widest uppercase text-dhaqan-gold border border-dhaqan-gold/40 px-2.5 py-0.5 rounded-full">
                      {content.category}
                    </span>
                    <span className="text-xs text-dhaqan-muted">{content.country}</span>
                    {content.year && <span className="text-xs text-dhaqan-muted">· {content.year}</span>}
                  </div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-dhaqan-text leading-tight">
                    {content.title}
                  </h1>
                  {content.subtitle && (
                    <p className="text-dhaqan-gold/70 font-display italic mt-1">{content.subtitle}</p>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || !user}
                  className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
                    saved
                      ? 'bg-dhaqan-gold/20 border-dhaqan-gold text-dhaqan-gold'
                      : 'border-dhaqan-border text-dhaqan-muted hover:border-dhaqan-gold/60 hover:text-dhaqan-gold'
                  } disabled:opacity-50`}
                >
                  <HiBookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                  {saved ? 'Saved' : 'Save'}
                </button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-dhaqan-muted">
                <span className="flex items-center gap-1.5">
                  <HiEye className="w-4 h-4" />
                  {content.views.toLocaleString()} views
                </span>
                <span className="flex items-center gap-1.5">
                  <HiClock className="w-4 h-4" />
                  {content.duration}
                </span>
              </div>

              {/* Description */}
              <div className="mt-6 p-5 bg-dhaqan-surface border border-dhaqan-border rounded-xl">
                <p className="text-dhaqan-text/80 text-sm leading-relaxed whitespace-pre-line">
                  {content.description}
                </p>
              </div>

              {/* Tags */}
              <div className="mt-4 flex flex-wrap gap-2">
                {content.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/explore?q=${encodeURIComponent(tag)}`}
                    className="flex items-center gap-1 text-xs text-dhaqan-muted bg-dhaqan-surface border border-dhaqan-border px-2.5 py-1 rounded-full hover:border-dhaqan-gold/50 hover:text-dhaqan-gold transition-colors"
                  >
                    <HiTag className="w-3 h-3" />
                    {tag}
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Creator */}
            {creator && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="mt-8 p-5 bg-dhaqan-surface border border-dhaqan-border rounded-xl"
              >
                <Link href={`/creator/${creator.id}`} className="flex items-start gap-4 group">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden bg-dhaqan-card shrink-0 border border-dhaqan-border">
                    <Image
                      src={creator.image || `https://img.youtube.com/vi/${content.youtubeId}/default.jpg`}
                      alt={creator.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${content.youtubeId}/default.jpg`
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-dhaqan-text group-hover:text-dhaqan-gold transition-colors">
                        {creator.name}
                      </h3>
                      {creator.verified && (
                        <span className="text-[10px] text-dhaqan-gold border border-dhaqan-gold/40 px-1.5 py-0.5 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-dhaqan-muted mt-0.5">
                      {creator.country} · {creator.contentCount} videos
                    </p>
                    <p className="text-xs text-dhaqan-muted/80 mt-2 line-clamp-2">{creator.bio}</p>
                  </div>
                  <HiExternalLink className="w-4 h-4 text-dhaqan-muted shrink-0 mt-1 group-hover:text-dhaqan-gold transition-colors" />
                </Link>
              </motion.div>
            )}
          </div>

          {/* Sidebar: Related */}
          <div className="xl:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-sm font-semibold tracking-wide text-dhaqan-muted mb-4 uppercase tracking-widest">
                Related Content
              </h2>
              <div className="space-y-4">
                {related.map((item) => (
                  <RelatedItem key={item.id} content={item} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RelatedItem({ content }: { content: ReturnType<typeof getRelatedContent>[0] & { creator?: ReturnType<typeof getCreatorById> } }) {
  const [imgError, setImgError] = useState(false)
  const thumb = imgError
    ? `https://img.youtube.com/vi/${content.youtubeId}/hqdefault.jpg`
    : content.thumbnailUrl

  return (
    <Link href={`/watch/${content.id}`} prefetch={false}>
      <motion.div
        whileHover={{ x: 4 }}
        className="flex gap-3 group cursor-pointer"
      >
        <div className="relative w-40 h-24 rounded-lg overflow-hidden bg-dhaqan-card shrink-0">
          <Image
            src={thumb}
            alt={content.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
            loading="lazy"
            sizes="160px"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
        </div>
        <div className="flex-1 min-w-0 py-0.5">
          <h4 className="text-xs font-semibold text-dhaqan-text group-hover:text-dhaqan-gold transition-colors line-clamp-2 leading-tight">
            {content.title}
          </h4>
          <p className="text-[11px] text-dhaqan-muted mt-1">{content.category}</p>
          <p className="text-[11px] text-dhaqan-muted-dark mt-0.5">{content.duration}</p>
        </div>
      </motion.div>
    </Link>
  )
}
