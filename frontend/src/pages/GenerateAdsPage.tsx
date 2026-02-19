import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useCompany } from '../contexts/CompanyContext';
import {
  SendIcon,
  SparklesIcon,
  LayoutDashboardIcon,
  FolderIcon,
  DatabaseIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  CheckIcon,
  ImageIcon,
  VideoIcon,
  LayoutIcon,
  PlusIcon,
  MinusIcon,
  SlidersHorizontalIcon,
  SearchIcon,
  XIcon,
  BrainIcon,
  UsersIcon,
  CopyIcon,
  EyeOffIcon,
  Trash2Icon,
  MessageSquareIcon,
  ClockIcon,
  GlobeIcon,
} from
  'lucide-react';
// ─── Types ───────────────────────────────────────────────────────
type Phase = 'idle' | 'generating' | 'results';
type AdFormat = 'image' | 'video' | 'carousel';
type PersonalizationRange = 'individual' | 'group' | 'broad';
type Tone = 'formal' | 'playful' | 'bold' | 'minimal';
type BudgetTier = 'low' | 'mid' | 'premium';
type CtaStyle = 'soft' | 'direct' | 'urgency';
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
interface Variant {
  id: string;
  headline: string;
  description: string;
  image: string;
  format: AdFormat;
  score: number;
  subProfile: string;
}
interface PersonaGroup {
  id: string;
  name: string;
  ageRange: string;
  description: string;
  color: string;
  colorBg: string;
  colorText: string;
  colorBorder: string;
  variants: Variant[];
}
interface Campaign {
  id: string;
  name: string;
  product: string;
  lastEdited: string;
}
interface Version {
  id: string;
  label: string;
  timestamp: string;
  variantCount: number;
}
// ─── Default filter values (for reset) ──────────────────────────
const DEFAULT_FILTERS = {
  personalizationRange: 'group' as PersonalizationRange,
  variantsPerGroup: 4,
  adFormats: new Set(['images', 'videos'] as ('images' | 'videos')[]),
  colorMode: 'brand' as 'brand' | 'custom',
  customColor: '#3B82F6',
  selectedPlatforms: new Set(['Facebook Feed', 'Instagram Story']),
  tone: 'bold' as Tone,
  budgetTier: 'mid' as BudgetTier,
  ctaStyle: 'direct' as CtaStyle,
  language: 'English (US)'
};
// ─── Mock Data ───────────────────────────────────────────────────
const mockCampaigns: Campaign[] = [
  {
    id: 'c1',
    name: 'Nova Wireless Earbuds — Q1 Launch',
    product: 'Nova Earbuds',
    lastEdited: 'Feb 18, 2026'
  },
  {
    id: 'c2',
    name: 'Summer Sale 2026',
    product: 'Premium Subscription',
    lastEdited: 'Feb 15, 2026'
  },
  {
    id: 'c3',
    name: 'Product Launch — AI Features',
    product: 'Enterprise Plan',
    lastEdited: 'Feb 12, 2026'
  },
  {
    id: 'c4',
    name: 'Brand Awareness Q1',
    product: 'All Products',
    lastEdited: 'Feb 10, 2026'
  },
  {
    id: 'c5',
    name: 'Holiday Retargeting',
    product: 'Gift Bundles',
    lastEdited: 'Jan 28, 2026'
  }];

const mockVersionHistory: Version[] = [
  {
    id: 'v3',
    label: 'v3',
    timestamp: 'Feb 18, 3:45 PM',
    variantCount: 10
  },
  {
    id: 'v2',
    label: 'v2',
    timestamp: 'Feb 17, 10:30 AM',
    variantCount: 8
  },
  {
    id: 'v1',
    label: 'v1',
    timestamp: 'Feb 16, 4:02 PM',
    variantCount: 6
  }];

const personaGroups: PersonaGroup[] = [
  {
    id: 'young-pros',
    name: 'Young Professionals',
    ageRange: '25–35',
    description:
      'Career-focused, tech-savvy urbanites who value efficiency and status.',
    color: 'bg-blue-500',
    colorBg: 'bg-blue-50',
    colorText: 'text-blue-700',
    colorBorder: 'border-blue-200',
    variants: [
      {
        id: 'yp-1',
        headline: 'Level Up Your Morning Routine',
        description:
          'The productivity tool that ambitious professionals swear by. Start every day with intention.',
        image:
          'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
        format: 'image',
        score: 94,
        subProfile: 'Early Adopter'
      },
      {
        id: 'yp-2',
        headline: '60 Seconds to a Smarter Workflow',
        description:
          'Watch how top performers are cutting busywork in half with one simple change.',
        image:
          'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop',
        format: 'video',
        score: 91,
        subProfile: 'Side Hustler'
      },
      {
        id: 'yp-3',
        headline: 'Your Network Is Your Net Worth',
        description:
          'See how 10,000+ professionals are building connections that actually convert.',
        image:
          'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=300&fit=crop',
        format: 'carousel',
        score: 87,
        subProfile: 'Career Climber'
      },
      {
        id: 'yp-4',
        headline: 'Stop Scrolling. Start Scaling.',
        description:
          'The data-backed approach to growing your personal brand while you sleep.',
        image:
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
        format: 'image',
        score: 89,
        subProfile: 'Content Creator'
      }]

  },
  {
    id: 'budget-parents',
    name: 'Budget-Conscious Parents',
    ageRange: '30–45',
    description:
      'Value-driven, family-first decision makers who research before they buy.',
    color: 'bg-emerald-500',
    colorBg: 'bg-emerald-50',
    colorText: 'text-emerald-700',
    colorBorder: 'border-emerald-200',
    variants: [
      {
        id: 'bp-1',
        headline: 'Save $200/Month Without Sacrificing Quality',
        description:
          'Real families share how they cut costs without cutting corners. See the breakdown.',
        image:
          'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=400&h=300&fit=crop',
        format: 'image',
        score: 92,
        subProfile: 'Coupon Strategist'
      },
      {
        id: 'bp-2',
        headline: 'The 5-Minute Meal Prep That Changed Everything',
        description:
          'How busy parents are feeding their families better for less. Step-by-step guide inside.',
        image:
          'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
        format: 'video',
        score: 88,
        subProfile: 'Time Optimizer'
      },
      {
        id: 'bp-3',
        headline: "Rated #1 by Parents — Here's Why",
        description:
          'Over 8,000 verified parent reviews. See what makes this the top-rated choice for families.',
        image:
          'https://images.unsplash.com/photo-1491013516836-7db643ee125a?w=400&h=300&fit=crop',
        format: 'carousel',
        score: 85,
        subProfile: 'Review Reader'
      }]

  },
  {
    id: 'tech-enthusiasts',
    name: 'Tech Enthusiasts',
    ageRange: '18–40',
    description:
      'Early adopters obsessed with specs, benchmarks, and being first.',
    color: 'bg-violet-500',
    colorBg: 'bg-violet-50',
    colorText: 'text-violet-700',
    colorBorder: 'border-violet-200',
    variants: [
      {
        id: 'te-1',
        headline: 'Benchmarked: 3x Faster Than the Competition',
        description:
          'Independent lab results are in. See the full performance breakdown across 14 metrics.',
        image:
          'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
        format: 'image',
        score: 96,
        subProfile: 'Spec Junkie'
      },
      {
        id: 'te-2',
        headline: "Unboxing + Teardown: What's Really Inside",
        description:
          "We took it apart so you don't have to. Full hardware analysis and component breakdown.",
        image:
          'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop',
        format: 'video',
        score: 93,
        subProfile: 'Early Adopter'
      },
      {
        id: 'te-3',
        headline: 'The API Developers Actually Want to Use',
        description:
          'Clean docs, 99.99% uptime, and a developer community that ships fast.',
        image:
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop',
        format: 'image',
        score: 90,
        subProfile: 'Builder'
      }]

  }];

const platformOptions = [
  'Instagram Story',
  'LinkedIn Banner',
  'Facebook Feed',
  'TikTok Feed',
  'YouTube Pre-roll'];

const formatBadgeColors: Record<
  AdFormat,
  {
    bg: string;
    text: string;
  }> =
{
  image: {
    bg: 'bg-sky-50',
    text: 'text-sky-700'
  },
  video: {
    bg: 'bg-rose-50',
    text: 'text-rose-700'
  },
  carousel: {
    bg: 'bg-amber-50',
    text: 'text-amber-700'
  }
};
const formatIcons: Record<AdFormat, React.ElementType> = {
  image: ImageIcon,
  video: VideoIcon,
  carousel: LayoutIcon
};
const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboardIcon
  },
  {
    path: '/campaigns',
    label: 'Campaigns',
    icon: FolderIcon
  },
  {
    path: '/generate',
    label: 'Generate Ads',
    icon: SparklesIcon,
    highlight: true
  },
  {
    path: '/customer-data',
    label: 'Customer Data',
    icon: DatabaseIcon
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: SettingsIcon
  }];

const progressMessages = [
  'Analyzing persona segments...',
  'Generating ad variants...',
  'Optimizing for platforms...'];

const languageOptions = [
  'English (US)',
  'English (UK)',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Japanese'];

function getSelectedGroupNames(
  selectedIds: Set<string>,
  groups: PersonaGroup[])
  : string[] {
  const names: string[] = [];
  for (const g of groups) {
    if (g.variants.some((v) => selectedIds.has(v.id))) names.push(g.name);
  }
  return names;
}
// ─── Main Component ──────────────────────────────────────────────
export function GenerateAdsPage() {
  const location = useLocation();
  const { profile } = useCompany();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const campaignSearchRef = useRef<HTMLInputElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  // Core state
  const [phase, setPhase] = useState<Phase>('idle');
  const [sidebarManualExpand, setSidebarManualExpand] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hey! Tell me what product or service you want to advertise, and I'll generate persona-targeted ad variants for you."
    }]
  );
  const [input, setInput] = useState('');
  const [progressIdx, setProgressIdx] = useState(0);
  // Resizable split state
  const [chatPanelWidth, setChatPanelWidth] = useState(380);
  const [isDragging, setIsDragging] = useState(false);
  const [variantCols, setVariantCols] = useState(2);
  // Campaign & version state
  const [activeCampaign, setActiveCampaign] = useState<Campaign>(
    mockCampaigns[0]
  );
  const [showCampaignDropdown, setShowCampaignDropdown] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [activeVersion, setActiveVersion] = useState<Version>(
    mockVersionHistory[0]
  );
  const [versionCounter, setVersionCounter] = useState(3);
  const [showVersionPopover, setShowVersionPopover] = useState(false);
  // Filter panel state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  // Controls / filter state (shared between filter panel and results toolbar)
  const [personalizationRange, setPersonalizationRange] =
    useState<PersonalizationRange>('group');
  const [variantsPerGroup, setVariantsPerGroup] = useState(4);
  const [adFormats, setAdFormats] = useState<Set<'images' | 'videos'>>(
    new Set(['images', 'videos'])
  );
  const [colorMode, setColorMode] = useState<'brand' | 'custom'>('brand');
  const [customColor, setCustomColor] = useState('#3B82F6');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(['Facebook Feed', 'Instagram Story'])
  );
  const [tone, setTone] = useState<Tone>('bold');
  const [budgetTier, setBudgetTier] = useState<BudgetTier>('mid');
  const [ctaStyle, setCtaStyle] = useState<CtaStyle>('direct');
  const [language, setLanguage] = useState('English (US)');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showFilterLanguageDropdown, setShowFilterLanguageDropdown] =
    useState(false);
  // Variants state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['young-pros'])
  );
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(
    new Set()
  );

  const sidebarCollapsed = phase !== 'idle' && !sidebarManualExpand;
  // Count active (non-default) filters
  const activeFilterCount = [
    personalizationRange !== DEFAULT_FILTERS.personalizationRange,
    variantsPerGroup !== DEFAULT_FILTERS.variantsPerGroup,
    !(
      adFormats.size === 2 &&
      adFormats.has('images') &&
      adFormats.has('videos')),

    colorMode !== DEFAULT_FILTERS.colorMode,
    tone !== DEFAULT_FILTERS.tone,
    budgetTier !== DEFAULT_FILTERS.budgetTier,
    ctaStyle !== DEFAULT_FILTERS.ctaStyle,
    language !== DEFAULT_FILTERS.language,
    !(
      selectedPlatforms.size === 2 &&
      selectedPlatforms.has('Facebook Feed') &&
      selectedPlatforms.has('Instagram Story'))].

    filter(Boolean).length;
  // Filtered campaigns
  const filteredCampaigns = mockCampaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(campaignSearch.toLowerCase()) ||
      c.product.toLowerCase().includes(campaignSearch.toLowerCase())
  );
  // ─── Drag resize logic ─────────────────────────────────────────
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!splitContainerRef.current) return;
      const containerRect = splitContainerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const minWidth = 280;
      const maxWidth = containerRect.width * 0.6;
      setChatPanelWidth(Math.min(maxWidth, Math.max(minWidth, newWidth)));
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);
  // ─── Responsive variant grid columns ───────────────────────────
  useEffect(() => {
    if (!rightPanelRef.current || phase !== 'results') return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w < 500) setVariantCols(1); else
          if (w < 800) setVariantCols(2); else
            if (w < 1100) setVariantCols(3); else
              setVariantCols(4);
      }
    });
    observer.observe(rightPanelRef.current);
    return () => observer.disconnect();
  }, [phase]);
  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-campaign-dropdown]')) {
        setShowCampaignDropdown(false);
        setCampaignSearch('');
      }
      if (!target.closest('[data-version-popover]'))
        setShowVersionPopover(false);
      if (!target.closest('[data-language-dropdown]'))
        setShowLanguageDropdown(false);
      if (!target.closest('[data-filter-language-dropdown]'))
        setShowFilterLanguageDropdown(false);
      if (
        !target.closest('[data-filter-panel]') &&
        !target.closest('[data-filter-trigger]'))

        setShowFilterPanel(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
  // Focus campaign search when dropdown opens
  useEffect(() => {
    if (showCampaignDropdown) {
      setTimeout(() => campaignSearchRef.current?.focus(), 50);
    }
  }, [showCampaignDropdown]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);
  useEffect(() => {
    if (phase !== 'generating') return;
    setProgressIdx(0);
    const interval = setInterval(() => {
      setProgressIdx((prev) => {
        if (prev >= progressMessages.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [phase]);
  useEffect(() => {
    if (phase !== 'generating') return;
    const timer = setTimeout(() => {
      setPhase('results');
      const newV = versionCounter + 1;
      setVersionCounter(newV);
      const newVersion: Version = {
        id: `v${newV}`,
        label: `v${newV}`,
        timestamp: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        }),
        variantCount: personaGroups.reduce((s, g) => s + g.variants.length, 0)
      };
      setActiveVersion(newVersion);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Done! I've generated 10 ad variants across 3 persona groups (${newVersion.label}). Use the controls to refine, or tell me what to change.`
        }]
      );
    }, 4000);
    return () => clearTimeout(timer);
  }, [phase]);
  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        content: input
      }]
    );
    setInput('');
    setShowFilterPanel(false);
    if (phase === 'idle') {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: 'Got it! Generating persona-targeted variants now...'
          }]
        );
        setPhase('generating');
      }, 600);
    } else if (phase === 'results') {
      setPhase('generating');
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content:
              "Updated! I've refined the variants based on your feedback."
          }]
        );
      }, 600);
    }
  };
  const handleCampaignSelect = (campaign: Campaign) => {
    setActiveCampaign(campaign);
    setShowCampaignDropdown(false);
    setCampaignSearch('');
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Switched to "${campaign.name}". What would you like to generate?`
      }]
    );
    if (phase === 'results') setSelectedVariants(new Set());
  };
  const handleVersionSelect = (version: Version) => {
    setActiveVersion(version);
    setShowVersionPopover(false);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Loaded ${version.label} (${version.timestamp}) with ${version.variantCount} variants.`
      }]
    );
  };
  const handleReviseSelected = () => {
    const groupNames = getSelectedGroupNames(selectedVariants, personaGroups);
    const count = selectedVariants.size;
    const groupLabel =
      groupNames.length === 1 ?
        `in ${groupNames[0]}` :
        `across ${groupNames.join(', ')}`;
    setInput(
      `Revise ${count} selected variant${count > 1 ? 's' : ''} ${groupLabel}: `
    );
    chatInputRef.current?.focus();
  };
  const handleDuplicateSelected = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Duplicated ${selectedVariants.size} variant${selectedVariants.size > 1 ? 's' : ''}. You can find the copies in each persona group.`
      }]
    );
    setSelectedVariants(new Set());
  };
  const handleExcludeSelected = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Marked ${selectedVariants.size} variant${selectedVariants.size > 1 ? 's' : ''} as excluded from export.`
      }]
    );
    setSelectedVariants(new Set());
  };
  const handleDeleteSelected = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Removed ${selectedVariants.size} variant${selectedVariants.size > 1 ? 's' : ''} from this version.`
      }]
    );
    setSelectedVariants(new Set());
  };
  const handleResetFilters = () => {
    setPersonalizationRange(DEFAULT_FILTERS.personalizationRange);
    setVariantsPerGroup(DEFAULT_FILTERS.variantsPerGroup);
    setAdFormats(new Set(DEFAULT_FILTERS.adFormats));
    setColorMode(DEFAULT_FILTERS.colorMode);
    setCustomColor(DEFAULT_FILTERS.customColor);
    setSelectedPlatforms(new Set(DEFAULT_FILTERS.selectedPlatforms));
    setTone(DEFAULT_FILTERS.tone);
    setBudgetTier(DEFAULT_FILTERS.budgetTier);
    setCtaStyle(DEFAULT_FILTERS.ctaStyle);
    setLanguage(DEFAULT_FILTERS.language);
  };
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const n = new Set(prev);
      if (n.has(groupId)) {
        n.delete(groupId);
      } else {
        n.add(groupId);
      }
      return n;
    });
  };
  const toggleVariant = (variantId: string) => {
    setSelectedVariants((prev) => {
      const n = new Set(prev);
      if (n.has(variantId)) {
        n.delete(variantId);
      } else {
        n.add(variantId);
      }
      return n;
    });
  };
  const toggleGroupSelect = (group: PersonaGroup) => {
    const allSelected = group.variants.every((v) => selectedVariants.has(v.id));
    setSelectedVariants((prev) => {
      const n = new Set(prev);
      group.variants.forEach((v) => {
        if (allSelected) {
          n.delete(v.id);
        } else {
          n.add(v.id);
        }
      });
      return n;
    });

  };
  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) => {
      const n = new Set(prev);
      if (n.has(p)) {
        n.delete(p);
      } else {
        n.add(p);
      }
      return n;
    });
  };
  const toggleAdFormat = (f: 'images' | 'videos') => {
    setAdFormats((prev) => {
      const n = new Set(prev);
      if (n.has(f) && n.size > 1) n.delete(f); else
        n.add(f);
      return n;
    });
  };
  // ─── Shared filter controls renderer ───────────────────────────
  const renderFilterControls = (compact: boolean) => {
    const labelClass =
      'block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5';
    const sectionGap = compact ? 'gap-x-5 gap-y-2' : 'gap-x-6 gap-y-4';
    return (
      <>
        <div className={`flex flex-wrap items-end ${sectionGap}`}>
          {/* Range */}
          <div className="flex-shrink-0">
            <label className={labelClass}>Range</label>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {(['individual', 'group', 'broad'] as PersonalizationRange[]).map(
                (r) =>
                  <button
                    key={r}
                    onClick={() => setPersonalizationRange(r)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${personalizationRange === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                    {r}
                  </button>

              )}
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200 flex-shrink-0 self-end" />

          {/* Per Group */}
          <div className="flex-shrink-0">
            <label className={labelClass}>Per Group</label>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  setVariantsPerGroup(Math.max(2, variantsPerGroup - 1))
                }
                className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">

                <MinusIcon className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-sm font-bold text-slate-900">
                {variantsPerGroup}
              </span>
              <button
                onClick={() =>
                  setVariantsPerGroup(Math.min(10, variantsPerGroup + 1))
                }
                className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">

                <PlusIcon className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200 flex-shrink-0 self-end" />

          {/* Format */}
          <div className="flex-shrink-0">
            <label className={labelClass}>Format</label>
            <div className="flex gap-1.5">
              {(['images', 'videos'] as const).map((f) =>
                <button
                  key={f}
                  onClick={() => toggleAdFormat(f)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${adFormats.has(f) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>

                  {f}
                </button>
              )}
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200 flex-shrink-0 self-end" />

          {/* Colors */}
          <div className="flex-shrink-0">
            <label className={labelClass}>Colors</label>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setColorMode('brand')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${colorMode === 'brand' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>

                Brand
              </button>
              <button
                onClick={() => setColorMode('custom')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${colorMode === 'custom' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>

                Custom
                {colorMode === 'custom' &&
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-4 h-4 rounded border-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()} />

                }
              </button>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200 flex-shrink-0 self-end" />

          {/* Tone */}
          <div className="flex-shrink-0">
            <label className={labelClass}>Tone</label>
            <div className="flex gap-1">
              {(['formal', 'playful', 'bold', 'minimal'] as Tone[]).map((t) =>
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${tone === t ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>

                  {t}
                </button>
              )}
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200 flex-shrink-0 self-end" />

          {/* Budget */}
          <div className="flex-shrink-0">
            <label className={labelClass}>Budget</label>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {(['low', 'mid', 'premium'] as BudgetTier[]).map((b) =>
                <button
                  key={b}
                  onClick={() => setBudgetTier(b)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${budgetTier === b ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

                  {b}
                </button>
              )}
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200 flex-shrink-0 self-end" />

          {/* CTA */}
          <div className="flex-shrink-0">
            <label className={labelClass}>CTA</label>
            <div className="flex gap-1">
              {[
                {
                  value: 'soft' as CtaStyle,
                  label: 'Soft'
                },
                {
                  value: 'direct' as CtaStyle,
                  label: 'Direct'
                },
                {
                  value: 'urgency' as CtaStyle,
                  label: 'Urgency'
                }].
                map((c) =>
                  <button
                    key={c.value}
                    onClick={() => setCtaStyle(c.value)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${ctaStyle === c.value ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>

                    {c.label}
                  </button>
                )}
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200 flex-shrink-0 self-end" />

          {/* Language */}
          <div
            className="relative flex-shrink-0"
            data-filter-language-dropdown={!compact}
            data-language-dropdown={compact}>

            <label className={labelClass}>Language</label>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (compact) {
                  setShowLanguageDropdown(!showLanguageDropdown);
                } else {
                  setShowFilterLanguageDropdown(!showFilterLanguageDropdown);
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:border-slate-300 transition-colors">

              <GlobeIcon className="w-3 h-3 text-slate-400" />
              {language}
              <ChevronDownIcon className="w-3 h-3 text-slate-400" />
            </button>
            {(compact ? showLanguageDropdown : showFilterLanguageDropdown) &&
              <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-xl z-40 py-1 overflow-hidden">
                {languageOptions.map((l) =>
                  <button
                    key={l}
                    onClick={() => {
                      setLanguage(l);
                      setShowLanguageDropdown(false);
                      setShowFilterLanguageDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors ${language === l ? 'text-blue-700 font-semibold bg-blue-50' : 'text-slate-700'}`}>

                    {l}
                  </button>
                )}
              </div>
            }
          </div>
        </div>

        {/* Platforms row */}
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-100">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1 flex-shrink-0">
            Platforms
          </span>
          {platformOptions.map((p) =>
            <button
              key={p}
              onClick={() => togglePlatform(p)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${selectedPlatforms.has(p) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'}`}>

              {p}
            </button>
          )}
        </div>
      </>);

  };
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ─── Mini Sidebar ─── */}
      <aside
        className={`fixed left-0 top-0 h-full bg-[#0A1628] text-white flex flex-col z-50 transition-all duration-500 ease-out group/sidebar ${sidebarCollapsed ? 'w-16 hover:w-64' : 'w-64'}`}>

        <div className="h-14 flex items-center justify-between px-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <span
              className={`font-semibold text-sm whitespace-nowrap transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>

              {profile.companyName}
            </span>
          </div>
          <button
            onClick={() =>
              phase !== 'idle' ?
                setSidebarManualExpand(!sidebarManualExpand) :
                undefined
            }
            className={`p-1 rounded-lg hover:bg-white/10 transition-all flex-shrink-0 ${phase === 'idle' ? 'hidden' : ''} ${sidebarCollapsed ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}
            aria-label={
              sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
            }>

            <ChevronLeftIcon
              className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />

          </button>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 overflow-hidden ${isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'} ${item.highlight && !isActive ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}>

                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${item.highlight && !isActive ? 'text-blue-400' : ''}`} />

                <span
                  className={`text-sm font-medium whitespace-nowrap transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>

                  {item.label}
                </span>
              </Link>);

          })}
        </nav>
        <div className="p-2 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm font-medium flex-shrink-0">
              {profile.userName.charAt(0)}
            </div>
            <div
              className={`flex-1 min-w-0 transition-opacity duration-300 ${sidebarCollapsed ? 'opacity-0 group-hover/sidebar:opacity-100' : 'opacity-100'}`}>

              <p className="text-sm font-medium truncate">{profile.userName}</p>
              <p className="text-xs text-white/40 truncate capitalize">
                {profile.plan} Plan
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div
        ref={splitContainerRef}
        className={`flex flex-1 h-full transition-all duration-500 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>

        {/* ─── Chat Panel ─── */}
        <div
          className={`flex flex-col h-full bg-white border-r border-slate-200 relative ${phase === 'idle' ? 'flex-1' : 'flex-shrink-0'}`}
          style={
            phase !== 'idle' ?
              {
                width: chatPanelWidth
              } :
              undefined
          }>

          {/* Chat Header */}
          <header className="border-b border-slate-100 px-4 py-2.5 flex-shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <h2
                  className={`font-semibold text-slate-900 truncate ${phase !== 'idle' ? 'text-sm' : ''}`}>

                  Ad Studio
                </h2>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Filter button */}
                <button
                  data-filter-trigger
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFilterPanel(!showFilterPanel);
                  }}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${showFilterPanel ? 'border-blue-500 bg-blue-50 text-blue-700' : activeFilterCount > 0 ? 'border-blue-300 bg-blue-50/50 text-blue-600' : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}
                  aria-label="Generation preferences">

                  <SlidersHorizontalIcon className="w-3.5 h-3.5" />
                  {phase === 'idle' && <span>Filters</span>}
                  {activeFilterCount > 0 &&
                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold">
                      {activeFilterCount}
                    </span>
                  }
                </button>

                {phase === 'results' &&
                  <>
                    <Badge variant="success" className="text-[10px]">
                      {personaGroups.reduce(
                        (sum, g) => sum + g.variants.length,
                        0
                      )}{' '}
                      variants
                    </Badge>
                    <div className="relative" data-version-popover>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowVersionPopover(!showVersionPopover);
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 transition-colors text-xs font-semibold text-slate-700">

                        <ClockIcon className="w-3 h-3 text-slate-400" />
                        {activeVersion.label}
                        <ChevronDownIcon className="w-3 h-3 text-slate-400" />
                      </button>
                      {showVersionPopover &&
                        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-xl z-30 py-1.5">
                          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Version History
                          </div>
                          {mockVersionHistory.map((v) =>
                            <button
                              key={v.id}
                              onClick={() => handleVersionSelect(v)}
                              className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${activeVersion.id === v.id ? 'bg-blue-50' : ''}`}>

                              <div>
                                <span
                                  className={`text-sm font-semibold ${activeVersion.id === v.id ? 'text-blue-700' : 'text-slate-900'}`}>

                                  {v.label}
                                </span>
                                <p className="text-[10px] text-slate-400">
                                  {v.timestamp}
                                </p>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {v.variantCount} variants
                              </span>
                            </button>
                          )}
                        </div>
                      }
                    </div>
                  </>
                }
              </div>
            </div>

            {/* Campaign selector */}
            <div className="relative mt-2" data-campaign-dropdown>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCampaignDropdown(!showCampaignDropdown);
                }}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors text-left">

                <div className="flex items-center gap-2 min-w-0">
                  <FolderIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-xs font-medium text-slate-700 truncate">
                    {activeCampaign.name}
                  </span>
                </div>
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${showCampaignDropdown ? 'rotate-180' : ''}`} />

              </button>
              {showCampaignDropdown &&
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-xl z-30 py-1.5 overflow-hidden">
                  {/* Search input */}
                  <div className="px-2.5 pb-1.5 pt-0.5">
                    <div className="relative">
                      <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        ref={campaignSearchRef}
                        type="text"
                        value={campaignSearch}
                        onChange={(e) => setCampaignSearch(e.target.value)}
                        placeholder="Search campaigns..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                        onClick={(e) => e.stopPropagation()} />

                      {campaignSearch &&
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCampaignSearch('');
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-200 transition-colors">

                          <XIcon className="w-3 h-3 text-slate-400" />
                        </button>
                      }
                    </div>
                  </div>
                  <div className="border-t border-slate-100" />
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCampaigns.length === 0 ?
                      <div className="px-3 py-4 text-center text-xs text-slate-400">
                        No campaigns found
                      </div> :

                      filteredCampaigns.map((c) =>
                        <button
                          key={c.id}
                          onClick={() => handleCampaignSelect(c)}
                          className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors ${activeCampaign.id === c.id ? 'bg-blue-50' : ''}`}>

                          <p
                            className={`text-sm font-medium truncate ${activeCampaign.id === c.id ? 'text-blue-700' : 'text-slate-900'}`}>

                            {c.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {c.product} · Edited {c.lastEdited}
                          </p>
                        </button>
                      )
                    }
                  </div>
                  <div className="border-t border-slate-100 mt-0.5 pt-0.5">
                    <button className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2 text-blue-600">
                      <PlusIcon className="w-3.5 h-3.5" />
                      <span className="text-sm font-medium">New Campaign</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          </header>

          {/* ─── Filter Panel (overlay below header) ─── */}
          {showFilterPanel &&
            <div
              data-filter-panel
              className="absolute left-0 right-0 top-[calc(100%_*_0)] z-20 bg-white border-b border-slate-200 shadow-lg"
              style={{
                top: 'auto',
                position: 'relative'
              }}>

              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontalIcon className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Generation Preferences
                  </h3>
                  {activeFilterCount > 0 &&
                    <span className="text-[10px] text-blue-600 font-medium">
                      {activeFilterCount} customized
                    </span>
                  }
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors">

                    Reset
                  </button>
                  <Button size="sm" onClick={() => setShowFilterPanel(false)}>
                    Apply
                  </Button>
                </div>
              </div>
              <div className="px-4 py-3 max-h-[50vh] overflow-y-auto">
                {renderFilterControls(false)}
              </div>
            </div>
          }

          {/* Active filter chips (idle state, when filters are set) */}
          {phase === 'idle' && activeFilterCount > 0 && !showFilterPanel &&
            <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Active:
              </span>
              {personalizationRange !==
                DEFAULT_FILTERS.personalizationRange &&
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100 capitalize">
                  {personalizationRange}
                </span>
              }
              {tone !== DEFAULT_FILTERS.tone &&
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100 capitalize">
                  {tone}
                </span>
              }
              {budgetTier !== DEFAULT_FILTERS.budgetTier &&
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100 capitalize">
                  {budgetTier} budget
                </span>
              }
              {ctaStyle !== DEFAULT_FILTERS.ctaStyle &&
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100 capitalize">
                  {ctaStyle} CTA
                </span>
              }
              {language !== DEFAULT_FILTERS.language &&
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100">
                  {language}
                </span>
              }
              {variantsPerGroup !== DEFAULT_FILTERS.variantsPerGroup &&
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100">
                  {variantsPerGroup}/group
                </span>
              }
              <button
                onClick={() => setShowFilterPanel(true)}
                className="text-[10px] text-blue-600 hover:text-blue-700 font-medium">

                Edit
              </button>
            </div>
          }

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) =>
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium ${msg.role === 'assistant' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>

                  {msg.role === 'assistant' ?
                    <SparklesIcon className="w-3.5 h-3.5" /> :

                    profile.userName.charAt(0)
                  }
                </div>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'assistant' ? 'bg-slate-50 border border-slate-100 text-slate-700' : 'bg-blue-600 text-white'}`}>

                  {msg.content}
                </div>
              </div>
            )}
            {phase === 'generating' &&
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot" />
                  <span
                    className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"
                    style={{
                      animationDelay: '0.2s'
                    }} />

                  <span
                    className="w-1.5 h-1.5 bg-slate-400 rounded-full typing-dot"
                    style={{
                      animationDelay: '0.4s'
                    }} />

                </div>
              </div>
            }
            <div ref={messagesEndRef} />
          </div>

          {/* Revision context */}
          {selectedVariants.size > 0 && phase === 'results' &&
            <div className="px-3 pt-2 flex-shrink-0">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                <MessageSquareIcon className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium truncate">
                  Revising {selectedVariants.size} variant
                  {selectedVariants.size > 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => {
                    setSelectedVariants(new Set());
                    setInput('');
                  }}
                  className="ml-auto p-0.5 rounded hover:bg-blue-100">

                  <XIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          }

          {/* Input */}
          <div className="p-3 border-t border-slate-100 flex-shrink-0">
            <div className="relative">
              <textarea
                ref={chatInputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  phase === 'idle' ?
                    'Describe what you want to advertise...' :
                    'Tell me what to change...'
                }
                className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                rows={1}
                disabled={phase === 'generating'} />

              <button
                onClick={handleSend}
                disabled={!input.trim() || phase === 'generating'}
                className="absolute right-2 bottom-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message">

                <SendIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Resize Handle ─── */}
        {phase !== 'idle' &&
          <div
            className={`relative flex-shrink-0 z-10 group/handle ${isDragging ? '' : ''}`}
            style={{
              width: '6px',
              marginLeft: '-3px',
              marginRight: '-3px'
            }}>

            <div
              onMouseDown={handleDragStart}
              className={`absolute inset-0 flex items-center justify-center cursor-col-resize transition-colors ${isDragging ? 'bg-blue-500/20' : 'hover:bg-slate-300/40'}`}>

              <div
                className={`w-1 h-8 rounded-full transition-colors ${isDragging ? 'bg-blue-500' : 'bg-slate-300 group-hover/handle:bg-slate-400'}`} />

            </div>
          </div>
        }

        {/* ─── Right Panel ─── */}
        {phase !== 'idle' &&
          <div
            ref={rightPanelRef}
            className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

            {/* GENERATING */}
            {phase === 'generating' &&
              <div className="flex-1 flex flex-col items-center justify-center p-8 fade-up">
                <div className="mb-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <BrainIcon className="w-6 h-6 text-blue-600 progress-pulse" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900 mb-1">
                    Creating Your Ads
                  </p>
                  <p
                    className="text-sm text-blue-600 font-medium progress-pulse"
                    key={progressIdx}>

                    {progressMessages[progressIdx]}
                  </p>
                </div>
                <div className="w-full max-w-2xl space-y-4">
                  {personaGroups.map((group, i) =>
                    <div
                      key={group.id}
                      className="deal-in"
                      style={{
                        animationDelay: `${i * 400}ms`
                      }}>

                      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-hidden relative">
                        <div
                          className={`absolute inset-0 ${group.colorBg} color-fill`}
                          style={{
                            animationDelay: `${i * 400 + 600}ms`,
                            animationFillMode: 'forwards',
                            opacity: 0.5
                          }} />

                        <div className="relative z-10">
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className={`w-10 h-10 rounded-xl ${group.color} flex items-center justify-center`}>

                              <UsersIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="h-4 w-36 shimmer-bg rounded mb-1.5" />
                              <div className="h-3 w-48 shimmer-bg rounded" />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            {Array.from({
                              length: group.variants.length
                            }).map((_, j) =>
                              <div
                                key={j}
                                className="deal-in"
                                style={{
                                  animationDelay: `${i * 400 + 800 + j * 150}ms`
                                }}>

                                <div className="aspect-[4/3] shimmer-bg rounded-lg" />
                                <div className="mt-2 h-3 w-full shimmer-bg rounded" />
                                <div className="mt-1 h-2.5 w-2/3 shimmer-bg rounded" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            }

            {/* RESULTS */}
            {phase === 'results' &&
              <>
                {/* Controls Toolbar */}
                <div className="flex-shrink-0 bg-white border-b border-slate-200 px-5 py-3">
                  {renderFilterControls(true)}
                </div>

                {/* Selection Action Bar */}
                {selectedVariants.size > 0 &&
                  <div className="flex-shrink-0 bg-blue-50 border-b border-blue-100 px-5 py-2.5 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-sm font-medium text-blue-700">
                      {selectedVariants.size} variant
                      {selectedVariants.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<MessageSquareIcon className="w-3.5 h-3.5" />}
                        onClick={handleReviseSelected}>

                        Revise Selected
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<CopyIcon className="w-3.5 h-3.5" />}
                        onClick={handleDuplicateSelected}>

                        Duplicate
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<EyeOffIcon className="w-3.5 h-3.5" />}
                        onClick={handleExcludeSelected}>

                        Exclude
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        leftIcon={<Trash2Icon className="w-3.5 h-3.5" />}
                        onClick={handleDeleteSelected}>

                        Delete
                      </Button>
                      <div className="w-px h-5 bg-blue-200 mx-0.5" />
                      <button
                        onClick={() => setSelectedVariants(new Set())}
                        className="p-1 rounded hover:bg-blue-100 transition-colors"
                        aria-label="Clear selection">

                        <XIcon className="w-4 h-4 text-blue-400" />
                      </button>
                    </div>
                  </div>
                }

                {/* Grouped Variants */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {personaGroups.map((group, gi) => {
                    const isExpanded = expandedGroups.has(group.id);
                    const allSelected = group.variants.every((v) =>
                      selectedVariants.has(v.id)
                    );
                    const someSelected = group.variants.some((v) =>
                      selectedVariants.has(v.id)
                    );
                    return (
                      <div
                        key={group.id}
                        className="fade-up bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                        style={{
                          animationDelay: `${gi * 100}ms`
                        }}>

                        <div
                          className="flex items-center gap-4 p-4 cursor-pointer"
                          onClick={() => toggleGroup(group.id)}>

                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroupSelect(group);
                            }}>

                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${allSelected ? 'bg-blue-600 border-blue-600' : someSelected ? 'border-blue-400 bg-blue-100' : 'border-slate-300 hover:border-slate-400'}`}>

                              {(allSelected || someSelected) &&
                                <CheckIcon className="w-3 h-3 text-white" />
                              }
                            </div>
                          </div>
                          <div
                            className={`w-10 h-10 rounded-xl ${group.color} flex items-center justify-center flex-shrink-0`}>

                            <UsersIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-semibold text-slate-900">
                                {group.name}
                              </h3>
                              <span className="text-xs text-slate-400">
                                {group.ageRange}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                              {group.description}
                            </p>
                          </div>
                          <Badge variant="default" className="flex-shrink-0">
                            {group.variants.length} variants
                          </Badge>
                          <ChevronDownIcon
                            className={`w-5 h-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />

                        </div>
                        <div
                          className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>

                          <div
                            className="px-4 pb-4 grid gap-3"
                            style={{
                              gridTemplateColumns: `repeat(${variantCols}, minmax(0, 1fr))`
                            }}>

                            {group.variants.map((variant) => {
                              const isSelected = selectedVariants.has(
                                variant.id
                              );
                              const FormatIcon = formatIcons[variant.format];
                              const fColors = formatBadgeColors[variant.format];
                              return (
                                <div
                                  key={variant.id}
                                  className={`rounded-xl border overflow-hidden transition-all cursor-pointer ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}`}
                                  onClick={() => toggleVariant(variant.id)}>

                                  <div className="relative aspect-[16/10] bg-slate-100">
                                    <img
                                      src={variant.image}
                                      alt={variant.headline}
                                      className="w-full h-full object-cover" />

                                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-[10px] text-white font-bold flex items-center gap-1">
                                      <SparklesIcon className="w-2.5 h-2.5 text-amber-400" />
                                      {variant.score}%
                                    </div>
                                    <div
                                      className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize flex items-center gap-1 ${fColors.bg} ${fColors.text}`}>

                                      <FormatIcon className="w-2.5 h-2.5" />
                                      {variant.format}
                                    </div>
                                    <div className="absolute top-2 left-2">
                                      <div
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-white/80 bg-black/20 backdrop-blur-sm'}`}>

                                        {isSelected &&
                                          <CheckIcon className="w-3 h-3 text-white" />
                                        }
                                      </div>
                                    </div>
                                  </div>
                                  <div className="p-3">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${group.colorBg} ${group.colorText}`}>

                                        {variant.subProfile}
                                      </span>
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-900 leading-snug mb-1 line-clamp-2">
                                      {variant.headline}
                                    </h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                      {variant.description}
                                    </p>
                                  </div>
                                </div>);

                            })}
                          </div>
                        </div>
                      </div>);

                  })}
                </div>
              </>
            }
          </div>
        }
      </div>
    </div>);
}