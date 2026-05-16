'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type {
  User as FirebaseUser,
} from 'firebase/auth'
import { User } from '@/types'

interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  toggleSave: (contentId: string) => Promise<void>
  isSaved: (contentId: string) => boolean
  recordView: (contentId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Dynamically import Firebase to avoid SSR issues
    let unsubscribe: (() => void) | undefined

    async function setup() {
      try {
        const { auth } = await import('@/lib/firebase')
        const { onAuthStateChanged } = await import('firebase/auth')
        const { getOrCreateUser } = await import('@/lib/firestore')

        if (!auth) {
          setLoading(false)
          return
        }

        unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          setFirebaseUser(fbUser)
          if (fbUser) {
            try {
              const userData = await getOrCreateUser(fbUser.uid, fbUser.email, fbUser.displayName, fbUser.photoURL)
              setUser(userData)
            } catch {
              setUser(null)
            }
          } else {
            setUser(null)
          }
          setLoading(false)
        })
      } catch {
        setLoading(false)
      }
    }

    setup()
    return () => unsubscribe?.()
  }, [])

  async function signInWithGoogle() {
    const { auth } = await import('@/lib/firebase')
    const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth')
    const { getOrCreateUser } = await import('@/lib/firestore')
    if (!auth) return
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const userData = await getOrCreateUser(result.user.uid, result.user.email, result.user.displayName, result.user.photoURL)
    setUser(userData)
  }

  async function signInWithEmail(email: string, password: string) {
    const { auth } = await import('@/lib/firebase')
    const { signInWithEmailAndPassword } = await import('firebase/auth')
    if (!auth) return
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signUpWithEmail(email: string, password: string) {
    const { auth } = await import('@/lib/firebase')
    const { createUserWithEmailAndPassword } = await import('firebase/auth')
    const { getOrCreateUser } = await import('@/lib/firestore')
    if (!auth) return
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const userData = await getOrCreateUser(result.user.uid, result.user.email, null, null)
    setUser(userData)
  }

  async function signOut() {
    const { auth } = await import('@/lib/firebase')
    const { signOut: firebaseSignOut } = await import('firebase/auth')
    if (!auth) return
    await firebaseSignOut(auth)
    setUser(null)
  }

  async function toggleSave(contentId: string) {
    if (!user || !firebaseUser) return
    const { saveContent, unsaveContent } = await import('@/lib/firestore')
    if (user.savedContent.includes(contentId)) {
      await unsaveContent(firebaseUser.uid, contentId)
      setUser((prev) => prev ? { ...prev, savedContent: prev.savedContent.filter((id) => id !== contentId) } : null)
    } else {
      await saveContent(firebaseUser.uid, contentId)
      setUser((prev) => prev ? { ...prev, savedContent: [...prev.savedContent, contentId] } : null)
    }
  }

  function isSaved(contentId: string): boolean {
    return user?.savedContent.includes(contentId) ?? false
  }

  async function recordView(contentId: string) {
    if (!user || !firebaseUser) return
    const { addToRecentlyViewed } = await import('@/lib/firestore')
    await addToRecentlyViewed(firebaseUser.uid, contentId)
    setUser((prev) =>
      prev
        ? {
            ...prev,
            recentlyViewed: [contentId, ...prev.recentlyViewed.filter((id) => id !== contentId)].slice(0, 20),
          }
        : null
    )
  }

  return (
    <AuthContext.Provider
      value={{ firebaseUser, user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, toggleSave, isSaved, recordView }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
