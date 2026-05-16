'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Content } from '@/types'
import ContentCard from '@/components/content/ContentCard'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'

interface ContentRowProps {
  title: string
  items: Content[]
  size?: 'sm' | 'md' | 'lg'
  accent?: boolean
}

export default function ContentRow({ title, items, size = 'md', accent = false }: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  if (!items.length) return null

  function scroll(dir: 'left' | 'right') {
    const el = rowRef.current
    if (!el) return
    const amount = dir === 'right' ? el.clientWidth * 0.8 : -el.clientWidth * 0.8
    el.scrollBy({ left: amount, behavior: 'smooth' })
  }

  function onScroll() {
    const el = rowRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-10">
        <h2
          className={`font-semibold tracking-wide ${
            accent ? 'font-display text-lg text-dhaqan-gold' : 'text-base text-dhaqan-text'
          }`}
        >
          {title}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="p-1.5 rounded-full text-dhaqan-muted hover:text-dhaqan-gold hover:bg-dhaqan-surface transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Scroll left"
          >
            <HiChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="p-1.5 rounded-full text-dhaqan-muted hover:text-dhaqan-gold hover:bg-dhaqan-surface transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Scroll right"
          >
            <HiChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scroll container */}
      <div className="relative">
        {/* Left fade */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-dhaqan-bg to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div
          ref={rowRef}
          onScroll={onScroll}
          className="scroll-row px-4 sm:px-10"
        >
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
            >
              <ContentCard content={item} size={size} />
            </motion.div>
          ))}
        </div>

        {/* Right fade */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-dhaqan-bg to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </div>
    </motion.section>
  )
}
