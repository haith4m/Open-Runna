'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Content } from '@/types'
import { HiPlay, HiBookmark, HiInformationCircle } from 'react-icons/hi'
import { useAuth } from '@/contexts/AuthContext'

interface HeroSectionProps {
  content: Content
}

export default function HeroSection({ content }: HeroSectionProps) {
  const { isSaved, toggleSave, user, } = useAuth()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.MouseEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    await toggleSave(content.id)
    setSaving(false)
  }

  const saved = isSaved(content.id)

  return (
    <section className="relative w-full min-h-[92vh] flex items-end overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: imageLoaded ? 1 : 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="w-full h-full"
        >
          <Image
            src={content.thumbnailUrl}
            alt={content.title}
            fill
            priority
            className="object-cover object-center"
            onLoad={() => setImageLoaded(true)}
            sizes="100vw"
          />
        </motion.div>

        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-dhaqan-bg via-dhaqan-bg/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-dhaqan-bg via-dhaqan-bg/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-dhaqan-bg/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-4 sm:px-10 pb-20 pt-32">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="max-w-xl lg:max-w-2xl"
        >
          {/* Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-dhaqan-gold border border-dhaqan-gold/40 px-3 py-1 rounded-full">
              Featured
            </span>
            <span className="text-xs text-dhaqan-muted tracking-widest uppercase">
              {content.category}
            </span>
            {content.year && (
              <span className="text-xs text-dhaqan-muted">{content.year}</span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] text-dhaqan-text mb-2">
            {content.title}
          </h1>
          {content.subtitle && (
            <p className="font-display text-xl sm:text-2xl text-dhaqan-gold/80 italic mb-5">
              {content.subtitle}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-dhaqan-muted mb-6">
            <span>{content.duration}</span>
            <span className="w-1 h-1 rounded-full bg-dhaqan-muted-dark" />
            <span>{content.country}</span>
            <span className="w-1 h-1 rounded-full bg-dhaqan-muted-dark" />
            <span>{content.views.toLocaleString()} views</span>
          </div>

          {/* Description */}
          <p className="text-dhaqan-text/80 text-base leading-relaxed line-clamp-3 mb-8 max-w-lg">
            {content.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {content.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="text-xs text-dhaqan-muted bg-dhaqan-surface/60 border border-dhaqan-border/60 px-2.5 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/watch/${content.id}`}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 bg-dhaqan-gold text-dhaqan-bg font-semibold px-7 py-3.5 rounded-full hover:bg-dhaqan-gold-light transition-colors text-sm"
              >
                <HiPlay className="w-5 h-5" />
                Watch Now
              </motion.button>
            </Link>

            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-full border font-medium text-sm transition-all ${
                saved
                  ? 'bg-dhaqan-gold/20 border-dhaqan-gold text-dhaqan-gold'
                  : 'border-dhaqan-border/60 text-dhaqan-muted hover:border-dhaqan-gold/60 hover:text-dhaqan-gold bg-dhaqan-surface/40'
              }`}
            >
              <HiBookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
              {saved ? 'Saved' : 'Save'}
            </button>

            <Link href={`/watch/${content.id}`}>
              <button className="flex items-center gap-2 px-6 py-3.5 rounded-full border border-dhaqan-border/60 text-dhaqan-muted hover:text-dhaqan-text hover:border-dhaqan-border transition-all text-sm bg-dhaqan-surface/40">
                <HiInformationCircle className="w-4 h-4" />
                More Info
              </button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dhaqan-bg to-transparent pointer-events-none" />
    </section>
  )
}
