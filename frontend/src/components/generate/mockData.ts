// TODO: Replace with API data when generation endpoint exists

import type { PersonaGroup, Version } from './types';

export const mockVersionHistory: Version[] = [
  { id: 'v3', label: 'v3', timestamp: 'Feb 18, 3:45 PM', variantCount: 10 },
  { id: 'v2', label: 'v2', timestamp: 'Feb 17, 10:30 AM', variantCount: 8 },
  { id: 'v1', label: 'v1', timestamp: 'Feb 16, 4:02 PM', variantCount: 6 },
];

export const personaGroups: PersonaGroup[] = [
  {
    id: 'young-pros',
    name: 'Young Professionals',
    ageRange: '25–35',
    description: 'Career-focused, tech-savvy urbanites who value efficiency and status.',
    color: 'bg-blue-500',
    colorBg: 'bg-blue-50',
    colorText: 'text-blue-700',
    colorBorder: 'border-blue-200',
    variants: [
      { id: 'yp-1', headline: 'Level Up Your Morning Routine', description: 'The productivity tool that ambitious professionals swear by. Start every day with intention.', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop', format: 'image', score: 94, subProfile: 'Early Adopter' },
      { id: 'yp-2', headline: '60 Seconds to a Smarter Workflow', description: 'Watch how top performers are cutting busywork in half with one simple change.', image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop', format: 'video', score: 91, subProfile: 'Side Hustler' },
      { id: 'yp-3', headline: 'Your Network Is Your Net Worth', description: 'See how 10,000+ professionals are building connections that actually convert.', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=300&fit=crop', format: 'carousel', score: 87, subProfile: 'Career Climber' },
      { id: 'yp-4', headline: 'Stop Scrolling. Start Scaling.', description: 'The data-backed approach to growing your personal brand while you sleep.', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop', format: 'image', score: 89, subProfile: 'Content Creator' },
    ],
  },
  {
    id: 'budget-parents',
    name: 'Budget-Conscious Parents',
    ageRange: '30–45',
    description: 'Value-driven, family-first decision makers who research before they buy.',
    color: 'bg-emerald-500',
    colorBg: 'bg-emerald-50',
    colorText: 'text-emerald-700',
    colorBorder: 'border-emerald-200',
    variants: [
      { id: 'bp-1', headline: 'Save $200/Month Without Sacrificing Quality', description: 'Real families share how they cut costs without cutting corners. See the breakdown.', image: 'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=400&h=300&fit=crop', format: 'image', score: 92, subProfile: 'Coupon Strategist' },
      { id: 'bp-2', headline: 'The 5-Minute Meal Prep That Changed Everything', description: 'How busy parents are feeding their families better for less. Step-by-step guide inside.', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop', format: 'video', score: 88, subProfile: 'Time Optimizer' },
      { id: 'bp-3', headline: "Rated #1 by Parents — Here's Why", description: 'Over 8,000 verified parent reviews. See what makes this the top-rated choice for families.', image: 'https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=400&h=300&fit=crop', format: 'carousel', score: 85, subProfile: 'Review Reader' },
    ],
  },
  {
    id: 'tech-enthusiasts',
    name: 'Tech Enthusiasts',
    ageRange: '18–40',
    description: 'Early adopters obsessed with specs, benchmarks, and being first.',
    color: 'bg-violet-500',
    colorBg: 'bg-violet-50',
    colorText: 'text-violet-700',
    colorBorder: 'border-violet-200',
    variants: [
      { id: 'te-1', headline: 'Benchmarked: 3x Faster Than the Competition', description: 'Independent lab results are in. See the full performance breakdown across 14 metrics.', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop', format: 'image', score: 96, subProfile: 'Spec Junkie' },
      { id: 'te-2', headline: "Unboxing + Teardown: What's Really Inside", description: "We took it apart so you don't have to. Full hardware analysis and component breakdown.", image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop', format: 'video', score: 93, subProfile: 'Early Adopter' },
      { id: 'te-3', headline: 'The API Developers Actually Want to Use', description: 'Clean docs, 99.99% uptime, and a developer community that ships fast.', image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop', format: 'image', score: 90, subProfile: 'Builder' },
    ],
  },
];

export const platformOptions = [
  'Instagram Story',
  'LinkedIn Banner',
  'Facebook Feed',
  'TikTok Feed',
  'YouTube Pre-roll',
];

export const languageOptions = [
  'English (US)',
  'English (UK)',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Japanese',
];

export const formatBadgeColors: Record<string, { bg: string; text: string }> = {
  image: { bg: 'bg-sky-50', text: 'text-sky-700' },
  video: { bg: 'bg-rose-50', text: 'text-rose-700' },
  carousel: { bg: 'bg-amber-50', text: 'text-amber-700' },
};

export const progressMessages = [
  'Analyzing persona segments...',
  'Generating ad variants...',
  'Optimizing for platforms...',
];
