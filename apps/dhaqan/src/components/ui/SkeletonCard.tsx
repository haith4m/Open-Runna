export default function SkeletonCard({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const widths = { sm: 'w-48 sm:w-52', md: 'w-56 sm:w-64', lg: 'w-64 sm:w-80' }

  return (
    <div className={`${widths[size]} shrink-0`}>
      <div className="w-full aspect-video rounded-lg skeleton" />
      <div className="mt-2.5 space-y-1.5">
        <div className="h-3.5 w-3/4 rounded skeleton" />
        <div className="h-3 w-1/2 rounded skeleton" />
      </div>
    </div>
  )
}

export function SkeletonRow({ count = 5, size = 'md' }: { count?: number; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="scroll-row px-4 sm:px-10">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} size={size} />
      ))}
    </div>
  )
}

export function SkeletonHero() {
  return (
    <div className="relative w-full min-h-[92vh] flex items-end overflow-hidden">
      <div className="absolute inset-0 skeleton" />
      <div className="relative z-10 w-full max-w-screen-2xl mx-auto px-10 pb-20 pt-32 space-y-4">
        <div className="h-4 w-20 skeleton rounded-full" />
        <div className="h-14 w-96 skeleton rounded-lg" />
        <div className="h-6 w-64 skeleton rounded-lg" />
        <div className="h-4 w-80 skeleton rounded" />
        <div className="h-4 w-72 skeleton rounded" />
        <div className="flex gap-3 mt-6">
          <div className="h-11 w-32 skeleton rounded-full" />
          <div className="h-11 w-24 skeleton rounded-full" />
        </div>
      </div>
    </div>
  )
}
