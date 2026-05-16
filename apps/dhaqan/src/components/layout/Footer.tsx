import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-dhaqan-surface border-t border-dhaqan-border mt-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <span className="font-display text-2xl font-bold tracking-widest text-dhaqan-gold">
              DHAQAN
            </span>
            <p className="mt-3 text-dhaqan-muted text-sm leading-relaxed max-w-sm">
              A home for Somali storytelling. A discovery platform. A cultural archive.
              A creator ecosystem. For the diaspora, by the diaspora.
            </p>
            <p className="mt-4 text-dhaqan-muted-dark text-xs tracking-widest uppercase">
              Dhaqan — ثقافة — Culture
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs tracking-widest uppercase text-dhaqan-muted mb-4">Explore</h3>
            <ul className="space-y-2">
              {[
                { href: '/explore?category=Film', label: 'Films' },
                { href: '/explore?category=Documentary', label: 'Documentaries' },
                { href: '/explore?category=Comedy', label: 'Comedy' },
                { href: '/explore?category=Music', label: 'Music' },
                { href: '/explore?category=Spoken+Word', label: 'Spoken Word' },
                { href: '/explore?category=Podcast', label: 'Podcasts' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-dhaqan-muted hover:text-dhaqan-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Communities */}
          <div>
            <h3 className="text-xs tracking-widest uppercase text-dhaqan-muted mb-4">Communities</h3>
            <ul className="space-y-2">
              {[
                { href: '/explore?country=UK', label: 'UK Somali' },
                { href: '/explore?country=US', label: 'US Somali' },
                { href: '/explore?country=Canada', label: 'Canada Somali' },
                { href: '/explore?country=Sweden', label: 'Sweden Somali' },
                { href: '/explore?country=Somalia', label: 'Somalia' },
                { href: '/explore?country=Somaliland', label: 'Somaliland' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-dhaqan-muted hover:text-dhaqan-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-dhaqan-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-dhaqan-muted-dark">
            © {year} DHAQAN. Built for the Somali diaspora, with love.
          </p>
          <div className="flex items-center gap-1 text-xs text-dhaqan-muted-dark">
            <span>Nabad iyo caano</span>
            <span className="mx-2">·</span>
            <span>Peace and milk</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
