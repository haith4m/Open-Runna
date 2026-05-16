'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getContentById } from '@/data/content'
import { getCreatorById } from '@/data/creators'
import ContentCard from '@/components/content/ContentCard'
import AuthModal from '@/components/auth/AuthModal'
import { HiBookmark, HiClock, HiPlay, HiLogout } from 'react-icons/hi'

type Tab = 'saved' | 'recent' | 'continue'

export default function ProfilePage() {
  const { user, firebaseUser, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('saved')

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-sm"
        >
          <span className="font-display text-3xl text-dhaqan-gold tracking-widest">DHAQAN</span>
          <h1 className="font-display text-2xl font-bold text-dhaqan-text mt-4 mb-3">
            Sign in to your profile
          </h1>
          <p className="text-dhaqan-muted text-sm mb-8 leading-relaxed">
            Save content, track what you've watched, and pick up where you left off.
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-dhaqan-gold text-dhaqan-bg font-semibold px-8 py-3 rounded-full hover:bg-dhaqan-gold-light transition-colors"
          >
            Sign in
          </button>
        </motion.div>
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
      </div>
    )
  }

  const savedItems = (user.savedContent ?? [])
    .map((id) => getContentById(id))
    .filter(Boolean)
    .map((c) => ({ ...c!, creator: getCreatorById(c!.creatorId) }))

  const recentItems = (user.recentlyViewed ?? [])
    .slice(0, 12)
    .map((id) => getContentById(id))
    .filter(Boolean)
    .map((c) => ({ ...c!, creator: getCreatorById(c!.creatorId) }))

  const continueItems = (user.continueWatching ?? [])
    .slice(0, 8)
    .map((item) => {
      const c = getContentById(item.contentId)
      return c ? { ...c, creator: getCreatorById(c.creatorId), progress: item.progress } : null
    })
    .filter(Boolean) as Array<ReturnType<typeof getContentById> & { creator: any; progress: number }>

  const tabs: { id: Tab; label: string; icon: typeof HiBookmark; count: number }[] = [
    { id: 'saved', label: 'Saved', icon: HiBookmark, count: savedItems.length },
    { id: 'recent', label: 'Recently Viewed', icon: HiClock, count: recentItems.length },
    { id: 'continue', label: 'Continue Watching', icon: HiPlay, count: continueItems.length },
  ]

  const activeItems =
    activeTab === 'saved' ? savedItems :
    activeTab === 'recent' ? recentItems : continueItems

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-10 max-w-screen-2xl mx-auto">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-6 mb-12 p-6 bg-dhaqan-surface border border-dhaqan-border rounded-2xl"
      >
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-dhaqan-gold/20 border-2 border-dhaqan-gold/40 flex items-center justify-center shrink-0 overflow-hidden">
          {firebaseUser?.photoURL ? (
            <Image
              src={firebaseUser.photoURL}
              alt={user.displayName ?? 'User'}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-2xl font-display font-bold text-dhaqan-gold">
              {user.displayName?.[0] ?? user.email?.[0] ?? 'U'}
            </span>
          )}
        </div>

        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold text-dhaqan-text">
            {user.displayName ?? 'Somali Viewer'}
          </h1>
          <p className="text-dhaqan-muted text-sm mt-0.5">{user.email}</p>
          <p className="text-xs text-dhaqan-muted-dark mt-1">
            {savedItems.length} saved · {recentItems.length} watched
          </p>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-2 text-sm text-dhaqan-muted hover:text-dhaqan-gold transition-colors"
        >
          <HiLogout className="w-4 h-4" />
          <span className="hidden sm:block">Sign out</span>
        </button>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex gap-2 mb-8"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-dhaqan-gold text-dhaqan-bg'
                : 'bg-dhaqan-surface border border-dhaqan-border text-dhaqan-muted hover:text-dhaqan-text hover:border-dhaqan-border'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-dhaqan-bg/20' : 'bg-dhaqan-border'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          {activeItems.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-dhaqan-muted mb-2">
                {activeTab === 'saved'
                  ? 'No saved content yet'
                  : activeTab === 'recent'
                  ? 'No recently viewed content'
                  : 'Nothing to continue watching'}
              </p>
              <Link href="/explore" className="text-dhaqan-gold text-sm hover:text-dhaqan-gold-light transition-colors">
                Explore content →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {activeItems.map((item, i) => (
                <motion.div
                  key={item!.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                >
                  <ContentCard content={item!} size="md" />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
