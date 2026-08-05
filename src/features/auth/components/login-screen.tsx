'use client'

import { useTranslations } from 'next-intl'
import { LoginHeader } from './login-header'
import { GoogleLoginButton } from './google-login-button'
import { montserrat, montserratAlternates } from '../fonts'
import { PageContainer } from '@/components/page-container'

/** Gradient overlay từ Figma (Rectangle 57 = tối bên trái, Cover = tối dưới đáy). */
const LEFT_DARK = 'linear-gradient(90deg,#00101A 0%,#00101A 25.41%,rgba(0,16,26,0) 100%)'
const BOTTOM_DARK = 'linear-gradient(0deg,#00101A 22.48%,rgba(0,19,32,0) 51.74%)'

export function LoginScreen({ error = false }: { error?: boolean }) {
  const t = useTranslations('login')

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#00101A] text-white">
      {/* Nền: keyvisual artwork + 2 lớp gradient (trang trí, không tương tác).
          Dùng z-0 (không âm) để không lọt sau bg màu của container. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/images/login/keyvisual.png)',
          backgroundSize: 'auto 100%',
          backgroundPosition: 'top right',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0" style={{ background: LEFT_DARK }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0" style={{ background: BOTTOM_DARK }} />

      <LoginHeader logoAlt={t('logoAlt')} />

      <main className="relative z-10 flex flex-1 flex-col justify-center py-16">
        <PageContainer>
          {/* Frame 487: ROOT FURTHER heading + body (gap 80) */}
          <div className="flex flex-col gap-6 lg:px-28">

            {/*
              ROOT FURTHER heading — 1 line at all viewports.
              Figma: Montserrat 700, ~120px desktop (full artboard width).
              clamp() scales from 48px (mobile) to 120px (desktop) so it
              never wraps. white-space:nowrap enforces single-line.
              color: #E8DFD0 matches the faded-cream tone in the Figma frame.
            */}
            <h1
              className={`${montserrat.className} whitespace-nowrap font-bold leading-none tracking-tight`}
              style={{
                fontSize: 'clamp(2.5rem, 8.5vw, 7.5rem)',
                color: '#E8DFD0',
                letterSpacing: '-0.02em',
              }}
              aria-label={t('headingAlt')}
            >
              ROOT FURTHER
            </h1>

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
