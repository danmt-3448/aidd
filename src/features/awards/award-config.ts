/**
 * Canonical award definitions for SAA 2025 (MoMorph screen zFYDgyj_pD).
 *
 * Single source of truth (DRY) consumed by:
 *  - Prize page  (/awards)         → <AwardsShowcase awards={AWARDS} />
 *  - Homepage 6-card grid (screen 11, future) → same AWARDS import
 *
 * `slug` / `hashtagAnchor` are the deep-link contract: Homepage card → `/awards#{slug}`.
 * Slugs are unique + kebab-case and MUST stay stable.
 *
 * Display strings (description, quantityUnit, navLabel) live in
 * messages/{locale}/awards.json under `awards.categories.{i18nKey}`.
 */
import type { Award } from './types'

export const AWARDS: Award[] = [
  {
    slug: 'top-talent',
    i18nKey: 'topTalent',
    title: 'Top Talent',
    icon: '/awards/icon-target.svg',
    image: '/awards/top-talent.png',
    quantity: 10,
    prize: '10.000.000 VNĐ',
    hashtagAnchor: 'top-talent',
    imageLeft: true,
  },
  {
    slug: 'top-project',
    i18nKey: 'topProject',
    title: 'Top Project',
    icon: '/awards/icon-target.svg',
    image: '/awards/top-project.png',
    quantity: 10,
    prize: '15.000.000 VNĐ',
    hashtagAnchor: 'top-project',
    imageLeft: false,
  },
  {
    slug: 'top-project-leader',
    i18nKey: 'topProjectLeader',
    title: 'Top Project Leader',
    icon: '/awards/icon-target.svg',
    image: '/awards/top-project-leader.png',
    quantity: 3,
    prize: '7.000.000 VNĐ',
    hashtagAnchor: 'top-project-leader',
    imageLeft: true,
  },
  {
    slug: 'best-manager',
    i18nKey: 'bestManager',
    title: 'Best Manager',
    icon: '/awards/icon-target.svg',
    image: '/awards/best-manager.png',
    quantity: 2,
    prize: '10.000.000 VNĐ',
    hashtagAnchor: 'best-manager',
    imageLeft: false,
  },
  {
    slug: 'signature-2025-creator',
    i18nKey: 'signature2025Creator',
    title: 'Signature 2025 Creator',
    icon: '/awards/icon-target.svg',
    image: '/awards/signature-creator.png',
    quantity: 1,
    // Figma screen zFYDgyj_pD shows two prize tiers for this category
    prize: '5.000.000 – 8.000.000 VNĐ',
    hashtagAnchor: 'signature-2025-creator',
    imageLeft: true,
  },
  {
    slug: 'mvp',
    i18nKey: 'mvp',
    title: 'MVP',
    icon: '/awards/icon-target.svg',
    image: '/awards/mvp.png',
    quantity: 1,
    prize: '15.000.000 VNĐ',
    hashtagAnchor: 'mvp',
    imageLeft: false,
  },
]
