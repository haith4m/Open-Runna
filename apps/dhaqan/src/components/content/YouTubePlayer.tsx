'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { HiPlay } from 'react-icons/hi'

interface YouTubePlayerProps {
  youtubeId: string
  title: string
  thumbnailUrl?: string
  autoplay?: boolean
}

export default function YouTubePlayer({ youtubeId, title, thumbnailUrl, autoplay = false }: YouTubePlayerProps) {
  const [playing, setPlaying] = useState(autoplay)
  const [imgError, setImgError] = useState(false)

  const thumb = imgError
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : (thumbnailUrl ?? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`)

  const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&color=white&iv_load_policy=3`

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-dhaqan-card shadow-card">
      <AnimatePresence mode="wait">
        {!playing ? (
          <motion.div
            key="thumbnail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 cursor-pointer group"
            onClick={() => setPlaying(true)}
            role="button"
            aria-label={`Play ${title}`}
          >
            <Image
              src={thumb}
              alt={title}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 900px"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 h-20 rounded-full bg-dhaqan-gold/90 backdrop-blur-sm flex items-center justify-center shadow-gold group-hover:bg-dhaqan-gold transition-colors"
              >
                <HiPlay className="w-9 h-9 text-dhaqan-bg ml-1" />
              </motion.div>
            </div>

            {/* Click to play label */}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="text-xs text-white/60 tracking-widest uppercase">Click to play</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <iframe
              src={embedUrl}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
