import Image from 'next/image'
import { LanguageSelector } from './language-selector'
import Link from 'next/link'

/** Header: logo Sun* Annual Awards (trái, không interactive) + language selector (phải). */
export function LoginHeader({ logoAlt }: { logoAlt: string }) {
  return (
    <header className="fixed inset-x-0 top-0 z-20 flex h-20 w-full items-center justify-between px-6 md:px-12 lg:px-36"
      style={{
        background: 'rgba(16,20,23,0.8)',
      }}
    >
      <Link href="/" aria-label="Sun* Homepage">
        <Image
          src="/images/login/header-logo.png"
          alt={logoAlt}
          width={52}
          height={48}
          priority
          className="h-12 w-auto"
        />
      </Link>
      <LanguageSelector />
    </header>
  )
}
