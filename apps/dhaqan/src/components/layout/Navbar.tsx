'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/auth/AuthModal'
import { HiSearch, HiMenuAlt3, HiX } from 'react-icons/hi'
import { useRouter, usePathname } from 'next/navigation'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isHome = pathname === '/'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearch(false)
      setSearchQuery('')
    }
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/explore', label: 'Explore' },
    { href: '/explore?category=Documentary', label: 'Docs' },
    { href: '/explore?category=Comedy', label: 'Comedy' },
    { href: '/explore?category=Music', label: 'Music' },
  ]

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || !isHome
            ? 'bg-dhaqan-bg/95 backdrop-blur-md border-b border-dhaqan-border/50'
            : 'bg-gradient-to-b from-black/80 to-transparent'
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <div className="relative">
                <span className="font-display text-2xl font-bold tracking-widest text-dhaqan-gold group-hover:text-dhaqan-gold-light transition-colors">
                  DHAQAN
                </span>
                <div className="absolute -bottom-0.5 left-0 h-px bg-dhaqan-gold w-0 group-hover:w-full transition-all duration-300" />
              </div>
              <div className="hidden sm:block w-px h-5 bg-dhaqan-border ml-1" />
              <span className="hidden sm:block text-[10px] text-dhaqan-muted tracking-[0.2em] uppercase leading-tight">
                Somali<br />Stories
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium tracking-wide transition-colors hover:text-dhaqan-gold ${
                    pathname === link.href ? 'text-dhaqan-gold' : 'text-dhaqan-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search */}
              <AnimatePresence>
                {showSearch ? (
                  <motion.form
                    key="search-form"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '220px', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSearch}
                    className="overflow-hidden"
                  >
                    <input
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Somali content..."
                      className="w-full bg-dhaqan-surface border border-dhaqan-border text-dhaqan-text text-sm px-3 py-1.5 rounded-full focus:outline-none focus:border-dhaqan-gold placeholder:text-dhaqan-muted"
                      onBlur={() => !searchQuery && setShowSearch(false)}
                    />
                  </motion.form>
                ) : null}
              </AnimatePresence>
              <button
                onClick={() => setShowSearch((v) => !v)}
                className="p-2 text-dhaqan-muted hover:text-dhaqan-gold transition-colors"
                aria-label="Search"
              >
                <HiSearch className="w-5 h-5" />
              </button>

              {user ? (
                <div className="flex items-center gap-2">
                  <Link href="/profile">
                    <div className="w-8 h-8 rounded-full bg-dhaqan-gold/20 border border-dhaqan-gold/40 flex items-center justify-center text-dhaqan-gold text-sm font-semibold">
                      {user.displayName?.[0] ?? user.email?.[0] ?? 'U'}
                    </div>
                  </Link>
                  <button
                    onClick={signOut}
                    className="hidden sm:block text-xs text-dhaqan-muted hover:text-dhaqan-text transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="text-sm bg-dhaqan-gold text-dhaqan-bg font-semibold px-4 py-1.5 rounded-full hover:bg-dhaqan-gold-light transition-colors"
                >
                  Sign in
                </button>
              )}

              {/* Mobile menu toggle */}
              <button
                className="lg:hidden p-2 text-dhaqan-muted hover:text-dhaqan-gold"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Menu"
              >
                {mobileOpen ? <HiX className="w-5 h-5" /> : <HiMenuAlt3 className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden bg-dhaqan-surface border-t border-dhaqan-border"
            >
              <nav className="flex flex-col px-4 py-4 gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="text-dhaqan-text hover:text-dhaqan-gold transition-colors font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
                {!user && (
                  <button
                    onClick={() => { setShowAuth(true); setMobileOpen(false) }}
                    className="text-left text-dhaqan-gold font-semibold"
                  >
                    Sign in
                  </button>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  )
}
