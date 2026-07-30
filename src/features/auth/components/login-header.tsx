import Image from 'next/image'
import { LanguageSelector } from './language-selector'

/** Header: logo Sun* Annual Awards (trái, không interactive) + language selector (phải). */
export function LoginHeader({ logoAlt }: { logoAlt: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-20 w-full items-center justify-between bg-[#0B0F12]/80 px-6 backdrop-blur md:px-12 lg:px-36">
      <Image
        src="/images/login/header-logo.png"
        alt={logoAlt}
        width={52}
        height={48}
        priority
        className="h-12 w-auto"
      />
      <LanguageSelector />
    </header>
  )
}
