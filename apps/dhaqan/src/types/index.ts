export type ContentCategory =
  | 'Film'
  | 'Short Film'
  | 'Documentary'
  | 'Comedy'
  | 'Music'
  | 'Spoken Word'
  | 'Podcast'
  | 'Interview'
  | 'Culture'
  | 'Series'

export type ContentCountry =
  | 'UK'
  | 'US'
  | 'Canada'
  | 'Sweden'
  | 'Somalia'
  | 'Somaliland'
  | 'Finland'
  | 'Norway'
  | 'Netherlands'

export interface Creator {
  id: string
  name: string
  fullName?: string
  bio: string
  country: ContentCountry | string
  image: string
  contentCount: number
  socials: {
    youtube?: string
    instagram?: string
    twitter?: string
    spotify?: string
    vimeo?: string
  }
  tags: string[]
  verified?: boolean
}

export interface Content {
  id: string
  title: string
  subtitle?: string
  description: string
  youtubeId: string
  thumbnailUrl: string
  creatorId: string
  creator?: Creator
  category: ContentCategory
  country: ContentCountry | string
  tags: string[]
  duration: string
  views: number
  year: number
  featured?: boolean
  isTrending?: boolean
  createdAt?: string
}

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  savedContent: string[]
  recentlyViewed: string[]
  continueWatching: ContinueWatchingItem[]
  createdAt: string
}

export interface ContinueWatchingItem {
  contentId: string
  progress: number
  lastWatched: string
}

export type RowCategory =
  | 'trending'
  | 'diaspora-stories'
  | 'comedy'
  | 'documentary'
  | 'spoken-word'
  | 'uk-creators'
  | 'music'
  | 'new-uploads'
