import { Montserrat, Montserrat_Alternates } from 'next/font/google'

/** Font brand từ Figma: body/button = Montserrat, footer = Montserrat Alternates. */
export const montserrat = Montserrat({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '700'],
  variable: '--font-montserrat',
})

export const montserratAlternates = Montserrat_Alternates({
  subsets: ['latin', 'vietnamese'],
  weight: ['700'],
  variable: '--font-montserrat-alt',
})
