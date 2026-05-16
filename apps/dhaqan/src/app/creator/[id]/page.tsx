'use client'

import { use, useState } from 'react'
import { notFound } from 'next/navigation'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { getCreatorById } from '@/data/creators'
import { getContentByCreator } from '@/data/content'
import ContentCard from '@/components/content/ContentCard'
import {
  HiGlobe,
  HiFilm,
  HiLocationMarker,
} from 'react-icons/hi'
import { FaYoutube, FaInstagram, FaTwitter, FaSpotify } from 'react-icons/fa'

export default function CreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const creator = getCreatorById(id)
  if (!creator) notFound()

  const content = getContentByCreator(id).map((c) => ({ ...c, creator }))
  const [imgError, setImgError] = useState(false)

  const heroThumb = content[0]
    ? `https://img.youtube.com/vi/${content[0].youtubeId}/maxresdefault.jpg`
    : null

  return (
    <div className="min-h-screen bg-dhaqan-bg">
      {/* Hero banner */}
      <div className="relative h-56 sm:h-72 overflow-hidden">
        {heroThumb && (
          <Image
            src={heroThumb}
            alt={creator.name}
            fill
            className="object-cover object-center blur-sm scale-110"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-dhaqan-bg/60 via-dhaqan-bg/40 to-dhaqan-bg" />
        <div className="absolute inset-0 bg-gradient-to-r from-dhaqan-bg/80 to-transparent" />
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10 -mt-24 relative z-10 pb-20">
        {/* Creator profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row items-start sm:items-end gap-6 mb-10"
        >
          {/* Avatar */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-dhaqan-card border-2 border-dhaqan-border shrink-0 shadow-card">
            <Image
              src={imgError || !creator.image
                ? (content[0] ? `https://img.youtube.com/vi/${content[0].youtubeId}/default.jpg` : '/placeholder.jpg')
                : creator.image}
              alt={creator.name}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-dhaqan-text">
                {creator.name}
              </h1>
              {creator.verified && (
                <span className="text-xs text-dhaqan-gold border border-dhaqan-gold/50 px-2.5 py-0.5 rounded-full">
                  Verified Creator
                </span>
              )}
            </div>
            {creator.fullName && creator.fullName !== creator.name && (
              <p className="text-dhaqan-muted font-display italic text-sm mb-2">{creator.fullName}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-dhaqan-muted">
              <span className="flex items-center gap-1.5">
                <HiLocationMarker className="w-4 h-4" />
                {creator.country}
              </span>
              <span className="w-1 h-1 rounded-full bg-dhaqan-muted-dark" />
              <span className="flex items-center gap-1.5">
                <HiFilm className="w-4 h-4" />
                {content.length} video{content.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-3">
              {creator.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-dhaqan-muted bg-dhaqan-surface border border-dhaqan-border px-2.5 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Socials */}
            <div className="flex items-center gap-3 mt-4">
              {creator.socials.youtube && (
                <a
                  href={`https://youtube.com/@${creator.socials.youtube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dhaqan-muted hover:text-red-500 transition-colors"
                  aria-label="YouTube"
                >
                  <FaYoutube className="w-5 h-5" />
                </a>
              )}
              {creator.socials.instagram && (
                <a
                  href={`https://instagram.com/${creator.socials.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dhaqan-muted hover:text-pink-400 transition-colors"
                  aria-label="Instagram"
                >
                  <FaInstagram className="w-5 h-5" />
                </a>
              )}
              {creator.socials.twitter && (
                <a
                  href={`https://twitter.com/${creator.socials.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dhaqan-muted hover:text-sky-400 transition-colors"
                  aria-label="Twitter/X"
                >
                  <FaTwitter className="w-5 h-5" />
                </a>
              )}
              {creator.socials.spotify && (
                <a
                  href={`https://open.spotify.com/show/${creator.socials.spotify}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dhaqan-muted hover:text-green-400 transition-colors"
                  aria-label="Spotify"
                >
                  <FaSpotify className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bio */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="max-w-3xl mb-12 p-5 bg-dhaqan-surface border border-dhaqan-border rounded-xl"
        >
          <p className="text-dhaqan-text/80 text-sm leading-relaxed">{creator.bio}</p>
        </motion.div>

        {/* Content grid */}
        {content.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <h2 className="text-sm font-semibold tracking-widest uppercase text-dhaqan-muted mb-6">
              Content · {content.length} videos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {content.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
                >
                  <ContentCard content={item} size="md" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <p className="text-dhaqan-muted">No content available yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
