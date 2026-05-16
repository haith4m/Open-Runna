import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { User } from '@/types'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured. Add your .env.local with Firebase credentials.')
  return db
}

export async function getOrCreateUser(uid: string, email: string | null, displayName: string | null, photoURL: string | null): Promise<User> {
  const database = requireDb()
  const ref = doc(database, 'users', uid)
  const snap = await getDoc(ref)

  if (snap.exists()) {
    return snap.data() as User
  }

  const newUser: User = {
    uid,
    email,
    displayName,
    photoURL,
    savedContent: [],
    recentlyViewed: [],
    continueWatching: [],
    createdAt: new Date().toISOString(),
  }

  await setDoc(ref, { ...newUser, createdAt: serverTimestamp() })
  return newUser
}

export async function getUserData(uid: string): Promise<User | null> {
  const database = requireDb()
  const snap = await getDoc(doc(database, 'users', uid))
  return snap.exists() ? (snap.data() as User) : null
}

export async function saveContent(uid: string, contentId: string): Promise<void> {
  const database = requireDb()
  await updateDoc(doc(database, 'users', uid), {
    savedContent: arrayUnion(contentId),
  })
}

export async function unsaveContent(uid: string, contentId: string): Promise<void> {
  const database = requireDb()
  await updateDoc(doc(database, 'users', uid), {
    savedContent: arrayRemove(contentId),
  })
}

export async function addToRecentlyViewed(uid: string, contentId: string): Promise<void> {
  const database = requireDb()
  const ref = doc(database, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return

  const data = snap.data() as User
  const recent = [contentId, ...(data.recentlyViewed || []).filter((id) => id !== contentId)].slice(0, 20)
  await updateDoc(ref, { recentlyViewed: recent })
}

export async function updateContinueWatching(uid: string, contentId: string, progress: number): Promise<void> {
  const database = requireDb()
  const ref = doc(database, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return

  const data = snap.data() as User
  const existing = (data.continueWatching || []).filter((item) => item.contentId !== contentId)
  const updated = [
    { contentId, progress, lastWatched: new Date().toISOString() },
    ...existing,
  ].slice(0, 10)

  await updateDoc(ref, { continueWatching: updated })
}
