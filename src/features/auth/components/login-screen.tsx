'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { LoginHeader } from './login-header'
import { GoogleLoginButton } from './google-login-button'
import { montserrat, montserratAlternates } from '../fonts'
import { PageContainer } from '@/components/page-container'

/** Gradient overlays — values from Figma node 662:14392 (Rectangle 57) and 662:14390 (Cover).
 *  Rectangle 57: width=1442px, height=1024px, startX=1, startY=0 → inset-0 OK.
 *  Cover: width=1440px, height=1093px, startY=138 → positioned at top=138, height=1093 (NOT inset-0).
 */
const LEFT_DARK = 'linear-gradient(90deg,#00101A 0%,#00101A 25.41%,rgba(0,16,26,0) 100%)'
const BOTTOM_DARK = 'linear-gradient(0deg,#00101A 22.48%,rgba(0,19,32,0) 51.74%)'

export function LoginScreen({ error = false }: { error?: boolean }) {
  const t = useTranslations('login')

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#00101A] text-white">
      {/* Layer 1: keyvisual artwork (node 662:14389 "image 1", 1441×1022px).
          keyvisual-v2.png = artwork recovered from Figma frame reference by inverting
          gradient overlays (corrected Cover element startY=138, height=1093). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/images/login/keyvisual-v2.png)',
          backgroundSize: '100% 100%',
          backgroundPosition: '0 0',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Layer 2: Rectangle 57 (node 662:14392) — LEFT dark gradient, inset-0, height=1024. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0" style={{ background: LEFT_DARK }} />
      {/* Layer 3: Cover (node 662:14390) — BOTTOM dark gradient.
          Figma: startY=138, height=1093px → position absolute, top=138px, height=1093px.
          NOT inset-0 (that would stretch gradient over full page height → wrong stops). */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 z-0"
        style={{ top: 138, height: 1093, background: BOTTOM_DARK }}
      />

      <LoginHeader logoAlt={t('logoAlt')} />

      {/* Figma: mms_B_Bìa startY=88, padding-top=96px → Frame 487 at y=184.
          Frame 487 height=653px with justifyContent:center → Key Visual (200px) + gap(80) + Frame550(164px) centered.
          Key Visual starts at y=288 (absolute). Header is fixed (out of flow) → pt = 288px. */}
      <main className="relative z-10 flex flex-1 flex-col pb-16 pt-[288px]">
        <PageContainer>
          {/* Frame 487 (662:14394): gap=80px between Key Visual and Frame 550.
              Figma: title starts at x=144. PageContainer left = 80px auto + md:px-8=32px → 80+32+32=144. */}
          <div className="flex flex-col gap-20 lg:px-8">

            {/*
              Key Visual (662:14395) — ROOT FURTHER wordmark asset.
              Figma: 451×200px, RGBA cream (#EEE9E2) on transparent.
              Asset: public/images/login/root-further.png (451×200px).
              Render at natural 451×200px — CẤM dựng lại bằng text/font.
            */}
            {/* mm:root-further-wordmark */}
            <Image
              src="/images/login/root-further.png"
              alt={t('headingAlt')}
              width={451}
              height={200}
              priority
              className="h-auto w-[min(451px,70vw)]"
            />

            {/* Frame 550: body text + login button (gap 24, pl 16) */}
            <div className={`${montserrat.className} flex flex-col gap-6 pl-4`}>
              <p className="max-w-lg whitespace-pre-line text-xl font-bold leading-10 tracking-[0.5px]">
                {`${t('intro1')}\n${t('intro2')}`}
              </p>

              <div className="flex flex-col gap-2">
                <GoogleLoginButton label={t('googleButton')} loadingLabel={t('signingIn')} />
                {error && (
                  <p role="alert" className="text-sm font-semibold text-red-300">
                    {t('error')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </PageContainer>
      </main>

      <footer className="relative z-10 w-full border-t border-[#2E3940] px-6 py-10 md:px-[90px]">
        <p className={`${montserratAlternates.className} text-center text-base font-bold leading-6`}>
          {t('footer')}
        </p>
      </footer>
    </div>
  )
}
