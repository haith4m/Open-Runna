'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Content } from '@/types'
import { HiPlay, HiBookmark, HiClock } from 'react-icons/hi'
import { useAuth } from '@/contexts/AuthContext'

interface ContentCardProps {
  content: Content
  size?: 'sm' | 'md' | 'lg'
}

export default function ContentCard({ content, size = 'md' }: ContentCardProps) {
  const { isSaved, toggleSave, user } = useAuth()
  const [imgError, setImgError] = useState(false)
  const [saving, setSaving] = useState(false)

  const saved = isSaved(content.id)

  const widths = { sm: 'w-48 sm:w-52', md: 'w-56 sm:w-64', lg: 'w-64 sm:w-80' }
  const cardWidth = widths[size]

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return
    setSaving(true)
    await toggleSave(content.id)
    setSaving(false)
  }

  const thumbnailSrc = imgError
    ? `https://img.youtube.com/vi/${content.youtubeId}/hqdefault.jpg`
    : content.thumbnailUrl

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`${cardWidth} shrink-0 group cursor-pointer`}
    >
      <Link href={`/watch/${content.id}`} prefetch={false}>
        {/* Thumbnail */}
        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-dhaqan-card shadow-card group-hover:shadow-card-hover transition-shadow duration-300">
          <Image
            src={thumbnailSrc}
            alt={content.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
            sizes="(max-width: 640px) 200px, (max-width: 1024px) 256px, 320px"
            loading="lazy"
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-12 h-12 rounded-full bg-dhaqan-gold/90 backdrop-blur-sm flex items-center justify-center shadow-gold"
            >
              <HiPlay className="w-5 h-5 text-dhaqan-bg ml-0.5" />
            </motion.div>
          </div>

          {/* Duration badge */}
          {content.duration && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-white/90 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
              <HiClock className="w-3 h-3" />
              {content.duration}
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-2 left-2 text-[10px] font-semibold tracking-widest uppercase text-dhaqan-gold bg-dhaqan-bg/70 backdrop-blur-sm px-2 py-0.5 rounded">
            {content.category}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 ${
              saved
                ? 'bg-dhaqan-gold text-dhaqan-bg'
                : 'bg-black/50 text-white hover:bg-dhaqan-gold hover:text-dhaqan-bg'
            }`}
            aria-label={saved ? 'Remove from saved' : 'Save'}
          >
            <HiBookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Info */}
        <div className="mt-2.5 px-0.5">
          <h3 className="text-sm font-semibold text-dhaqan-text line-clamp-1 group-hover:text-dhaqan-gold transition-colors">
            {content.title}
          </h3>
          {content.subtitle && (
            <p className="text-xs text-dhaqan-muted line-clamp-1 mt-0.5">{content.subtitle}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-dhaqan-muted-dark">{content.country}</span>
            {content.year && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-dhaqan-muted-dark" />
                <span className="text-xs text-dhaqan-muted-dark">{content.year}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
