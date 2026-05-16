'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { HiX, HiMail, HiLockClosed } from 'react-icons/hi'
import { FcGoogle } from 'react-icons/fc'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()

  async function handleGoogle() {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
      onClose()
    } catch (e: any) {
      setError('Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password)
      } else {
        await signInWithEmail(email, password)
      }
      onClose()
    } catch (e: any) {
      const msg = e?.code === 'auth/user-not-found'
        ? 'No account found with this email.'
        : e?.code === 'auth/wrong-password'
        ? 'Incorrect password.'
        : e?.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists.'
        : 'Authentication failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md bg-dhaqan-surface border border-dhaqan-border rounded-2xl p-8 shadow-2xl">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-dhaqan-muted hover:text-dhaqan-text transition-colors"
              >
                <HiX className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-8">
                <span className="font-display text-2xl font-bold text-dhaqan-gold tracking-widest">
                  DHAQAN
                </span>
                <p className="mt-2 text-dhaqan-muted text-sm">
                  {mode === 'signin' ? 'Welcome back' : 'Join the community'}
                </p>
              </div>

              {/* Google */}
              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-dhaqan-card border border-dhaqan-border hover:border-dhaqan-gold/40 text-dhaqan-text py-3 rounded-xl transition-all text-sm font-medium mb-6 disabled:opacity-50"
              >
                <FcGoogle className="w-5 h-5" />
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-dhaqan-border" />
                <span className="text-xs text-dhaqan-muted-dark">or</span>
                <div className="flex-1 h-px bg-dhaqan-border" />
              </div>

              {/* Email form */}
              <form onSubmit={handleEmail} className="space-y-4">
                <div className="relative">
                  <HiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dhaqan-muted" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-dhaqan-card border border-dhaqan-border text-dhaqan-text text-sm pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-dhaqan-gold placeholder:text-dhaqan-muted-dark transition-colors"
                  />
                </div>
                <div className="relative">
                  <HiLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dhaqan-muted" />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full bg-dhaqan-card border border-dhaqan-border text-dhaqan-text text-sm pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-dhaqan-gold placeholder:text-dhaqan-muted-dark transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-xs text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-dhaqan-gold text-dhaqan-bg font-semibold py-3 rounded-xl hover:bg-dhaqan-gold-light transition-colors text-sm disabled:opacity-50"
                >
                  {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              {/* Switch mode */}
              <p className="text-center text-xs text-dhaqan-muted mt-6">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
                  className="text-dhaqan-gold hover:text-dhaqan-gold-light transition-colors font-medium"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
