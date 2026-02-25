import React, { useState, useRef } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  UploadIcon,
  CheckCircleIcon,
  UsersIcon,
  PieChartIcon,
  ClockIcon,
  XIcon,
  BrainIcon,
  MessageSquareIcon,
  ImageIcon,
  TrendingUpIcon,
  InfoIcon,
  Loader2Icon,
  SparklesIcon,
  TargetIcon,
  ZapIcon,
  ShieldIcon,
  SearchIcon,
  HeartIcon,
  ArrowRightIcon
} from
  'lucide-react';
import { useConsumerContext } from '../contexts/ConsumerContext';
import type { Consumer } from '../types';
interface PersonaProfile {
  name: string;
  color: string;
  colorBg: string;
  colorText: string;
  percentage: number;
  count: string;
  traits: string[];
  adFormats: string[];
  messagingTone: string;
  description: string;
  exampleAds: {
    headline: string;
    ctr: string;
  }[];
  icon: React.ElementType;
}
const personas: PersonaProfile[] = [
  {
    name: 'The Skeptic',
    color: 'bg-sky-500',
    colorBg: 'bg-sky-50',
    colorText: 'text-sky-600',
    percentage: 34,
    count: '4,368',
    traits: [
      'Analytical',
      'Risk-averse',
      'Detail-oriented',
      'Comparison-driven'],

    adFormats: [
      'Data-heavy infographics',
      'Comparison tables',
      'Testimonial videos',
      'Case studies'],

    messagingTone:
      'Transparent, evidence-based, and direct. Avoid hype — lead with proof, stats, and third-party validation.',
    description:
      'Skeptics need to see hard evidence before committing. They research extensively, read reviews, and distrust flashy marketing.',
    exampleAds: [
      {
        headline: "Stop Wasting Money on Ads That Don't Convert",
        ctr: '4.2%'
      },
      {
        headline: "12,847 Verified Reviews Can't Be Wrong",
        ctr: '4.5%'
      }],

    icon: ShieldIcon
  },
  {
    name: 'Impulse Buyer',
    color: 'bg-orange-500',
    colorBg: 'bg-orange-50',
    colorText: 'text-orange-600',
    percentage: 28,
    count: '3,597',
    traits: [
      'Spontaneous',
      'Emotion-driven',
      'FOMO-susceptible',
      'Visual-first'],

    adFormats: [
      'Flash sale banners',
      'Countdown timers',
      'Short-form video',
      'Story ads'],

    messagingTone:
      'Urgent, exciting, and emotionally charged. Use scarcity, social proof, and bold visuals to trigger action.',
    description:
      'Impulse Buyers act on emotion and urgency. They respond to limited-time offers, social proof, and visually striking creative.',
    exampleAds: [
      {
        headline: "🔥 Flash Sale: 48 Hours Only — Don't Miss Out",
        ctr: '5.8%'
      },
      {
        headline: 'Last Chance — 73% Already Sold Out',
        ctr: '6.2%'
      }],

    icon: ZapIcon
  },
  {
    name: 'The Researcher',
    color: 'bg-violet-500',
    colorBg: 'bg-violet-50',
    colorText: 'text-violet-600',
    percentage: 22,
    count: '2,826',
    traits: [
      'Methodical',
      'Patient',
      'Feature-focused',
      'Long consideration cycle'],

    adFormats: [
      'Feature comparison charts',
      'Long-form content',
      'Whitepapers',
      'Product demos'],

    messagingTone:
      'Informative, thorough, and structured. Provide comprehensive details, specs, and side-by-side comparisons.',
    description:
      'Researchers take their time. They compare every option, read documentation, and want to understand the full picture before deciding.',
    exampleAds: [
      {
        headline: 'Side-by-Side: How We Compare to 5 Competitors',
        ctr: '3.1%'
      },
      {
        headline: '14-Feature Comparison: The Complete Breakdown',
        ctr: '2.9%'
      }],

    icon: SearchIcon
  },
  {
    name: 'The Loyalist',
    color: 'bg-slate-400',
    colorBg: 'bg-slate-50',
    colorText: 'text-slate-600',
    percentage: 16,
    count: '2,056',
    traits: [
      'Brand-attached',
      'Repeat buyer',
      'Community-oriented',
      'Referral-prone'],

    adFormats: [
      'Loyalty rewards',
      'Referral programs',
      'Behind-the-scenes content',
      'Exclusive previews'],

    messagingTone:
      'Warm, appreciative, and exclusive. Make them feel valued — insider access, early releases, and community belonging.',
    description:
      "Loyalists already love your brand. They buy repeatedly, refer friends, and engage with community content. Nurture, don't sell.",
    exampleAds: [
      {
        headline: "You're One of Our First 1,000 — Here's a Thank You",
        ctr: '3.8%'
      },
      {
        headline: 'Exclusive Early Access: See It Before Anyone Else',
        ctr: '4.1%'
      }],

    icon: HeartIcon
  }];


const completenessScore = 72;
const completenessItems = [
  {
    label: 'Contact info',
    done: true
  },
  {
    label: 'Purchase history',
    done: true
  },
  {
    label: 'Engagement data',
    done: true
  },
  {
    label: 'Demographic data',
    done: false
  },
  {
    label: 'Behavioral signals',
    done: false
  }];

function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatKey(key: string) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function renderTraits(traits: Record<string, unknown> | null) {
  if (!traits || Object.keys(traits).length === 0) return null;

  const keys = Object.keys(traits);
  const displayKeys = keys.slice(0, 2);
  const remainingCount = keys.length - displayKeys.length;

  return (
    <div className="relative group/traits">
      <div className="flex flex-wrap gap-1 mt-2 cursor-help">
        {displayKeys.map((key) => (
          <span
            key={key}
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[120px]"
          >
            <span className="font-bold mr-1">{formatKey(key)}:</span>
            <span className="truncate">
              {Array.isArray(traits[key]) ? (traits[key] as any[]).join(', ') : String(traits[key])}
            </span>
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="text-[9px] text-blue-600 font-medium self-center ml-0.5 whitespace-nowrap bg-blue-50 px-1 rounded border border-blue-100">
            +{remainingCount}
          </span>
        )}
      </div>

      {/* Mini Hover Tooltip for Dashboard */}
      <div className="absolute bottom-full left-0 mb-2 w-48 p-3 bg-slate-900 text-white rounded-lg shadow-xl z-50 opacity-0 invisible group-hover/traits:opacity-100 group-hover/traits:visible transition-all duration-200 pointer-events-none text-[10px]">
        <div className="space-y-1.5">
          {Object.entries(traits).map(([key, val]) => (
            <div key={key} className="flex flex-col">
              <span className="font-bold text-slate-400 uppercase text-[8px]">{formatKey(key)}</span>
              <span className="font-medium truncate">{Array.isArray(val) ? val.join(', ') : String(val)}</span>
            </div>
          ))}
        </div>
        <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-900 rotate-45" />
      </div>
    </div>
  );
}

export function CustomerDataPage() {
  const { consumers, loading: consumersLoading, error: consumersError, uploadCsv, refetch } = useConsumerContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'success' | 'error'>(
      'idle');
  const [uploadResult, setUploadResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<PersonaProfile | null>(
    null
  );

  const recentConsumers = consumers.slice(-5).reverse();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file);
  };
  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };
  const doUpload = (file: File) => {
    setUploadStatus('uploading');
    setUploadError(null);
    setUploadResult(null);
    uploadCsv.mutate(file, {
      onSuccess: (data) => {
        setUploadResult({ created: data.created, skipped: data.skipped, errors: data.errors });
        if (data.errors.length > 0) {
          setUploadStatus('error');
        } else {
          setUploadStatus('success');
        }
        refetch();
      },
      onError: (err) => {
        setUploadError(err.message);
        setUploadStatus('error');
      },
    });
  };
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Customer Data Platform
              </h1>
              <p className="text-slate-500">
                Manage audience segments and insights.
              </p>
            </div>
            <Button
              leftIcon={<UploadIcon className="w-4 h-4" />}
              onClick={handleClickUpload}>

              Upload New Data
            </Button>
          </div>

          {/* Data Completeness Bar */}
          <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <TargetIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Audience Profile Completeness
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload more data to improve persona accuracy and ad
                    targeting.
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-slate-900">
                {completenessScore}%
              </span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700"
                style={{
                  width: `${completenessScore}%`
                }} />

            </div>
            <div className="flex items-center gap-4">
              {completenessItems.map((item) =>
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 text-xs">

                  {item.done ?
                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" /> :

                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />
                  }
                  <span
                    className={item.done ? 'text-slate-600' : 'text-slate-400'}>

                    {item.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Insights Grid */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UsersIcon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-500">
                  Total Contacts
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {consumersLoading ? '—' : consumers.length.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">From uploaded CSVs</p>
            </Card>

            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PieChartIcon className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-slate-500">
                  Active Segments
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">8</p>
              <p className="text-xs text-slate-500">Across 4 personas</p>
            </Card>

            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-slate-500">
                  Top Persona
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">The Skeptic</p>
              <p className="text-xs text-slate-500">34% of audience</p>
            </Card>

            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-slate-500">
                  Last Upload
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">2 days ago</p>
              <p className="text-xs text-slate-500">q1_leads.csv</p>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Persona Breakdown Chart */}
            <Card variant="elevated" padding="lg" className="col-span-1">
              <h3 className="font-semibold text-slate-900 mb-1">
                Persona Distribution
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Click a persona to view detailed profile
              </p>
              <div className="relative aspect-square max-w-[240px] mx-auto mb-6">
                <svg
                  viewBox="0 0 100 100"
                  className="transform -rotate-90 w-full h-full">

                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="20"
                    strokeDasharray="34 100"
                    strokeDashoffset="0" />

                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="20"
                    strokeDasharray="28 100"
                    strokeDashoffset="-34" />

                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="20"
                    strokeDasharray="22 100"
                    strokeDashoffset="-62" />

                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="20"
                    strokeDasharray="16 100"
                    strokeDashoffset="-84" />

                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold text-slate-900">4</span>
                  <span className="text-xs text-slate-500">Personas</span>
                </div>
              </div>
              <div className="space-y-2">
                {personas.map((persona) =>
                  <button
                    key={persona.name}
                    onClick={() => setSelectedPersona(persona)}
                    className="w-full flex items-center justify-between text-sm p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer">

                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${persona.color}`} />

                      <span className="text-slate-600 group-hover:text-slate-900 transition-colors">
                        {persona.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {persona.percentage}%
                      </span>
                      <span className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                        →
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </Card>

            {/* Recent Uploads & Upload Area */}
            <div className="col-span-2 space-y-6">
              <Card variant="elevated" padding="lg">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer mb-8 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={handleClickUpload}>

                  {uploadStatus === 'uploading' ?
                    <>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Loader2Icon className="w-6 h-6 text-blue-600 animate-spin" />
                      </div>
                      <h3 className="font-semibold text-slate-900">
                        Uploading to server...
                      </h3>
                      <p className="text-slate-500 text-sm mt-1">
                        Processing your CSV file
                      </p>
                    </> :
                    uploadStatus === 'success' ?
                      <>
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900">
                          Upload complete!
                        </h3>
                        {uploadResult && (
                          <p className="text-slate-500 text-sm mt-1">
                            {uploadResult.created} created, {uploadResult.skipped} skipped
                          </p>
                        )}
                      </> :
                      uploadStatus === 'error' ?
                        <>
                          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <InfoIcon className="w-6 h-6 text-red-600" />
                          </div>
                          <h3 className="font-semibold text-red-700">
                            Upload failed
                          </h3>
                          <p className="text-red-500 text-sm mt-1">
                            {uploadError || 'There were errors processing the file.'}
                          </p>
                          {uploadResult && uploadResult.errors.length > 0 && (
                            <div className="mt-3 text-left bg-red-50 border border-red-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                              {uploadResult.errors.map((err, i) => (
                                <p key={i} className="text-xs text-red-600 mb-1">{err}</p>
                              ))}
                            </div>
                          )}
                          {uploadResult && uploadResult.created > 0 && (
                            <p className="text-slate-500 text-xs mt-2">
                              ({uploadResult.created} rows were still imported successfully)
                            </p>
                          )}
                        </> :

                        <>
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <UploadIcon className="w-6 h-6 text-blue-600" />
                          </div>
                          <h3 className="font-semibold text-slate-900">
                            Upload Customer File
                          </h3>
                          <p className="text-slate-500 text-sm mt-1">
                            Drag & drop a CSV file, or click to browse
                          </p>
                        </>
                  }
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">
                    Recent Consumers
                  </h3>
                  <Link
                    to="/all-consumers"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-1">
                    View All
                    <ArrowRightIcon className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {consumersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2Icon className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                  ) : consumersError ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-red-500">{consumersError}</p>
                      <Button variant="secondary" size="sm" onClick={() => refetch()} className="mt-2">
                        Retry
                      </Button>
                    </div>
                  ) : recentConsumers.length === 0 ? (
                    <div className="text-center py-6">
                      <UsersIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No consumers yet</p>
                      <p className="text-xs text-slate-400 mt-1">Upload a CSV to get started</p>
                    </div>
                  ) : (
                    recentConsumers.map((consumer: Consumer) => (
                      <div
                        key={consumer.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <UsersIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {consumer.first_name} {consumer.last_name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {consumer.email}
                            </p>
                            {renderTraits(consumer.traits)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">
                            {formatRelativeDate(consumer.created_at)}
                          </span>
                          <Badge variant="success">Active</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Persona Detail Modal */}
      {selectedPersona &&
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSelectedPersona(null)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div
              className={`${selectedPersona.colorBg} px-8 pt-8 pb-6 rounded-t-2xl relative`}>

              <button
                onClick={() => setSelectedPersona(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 transition-colors">

                <XIcon className="w-5 h-5 text-slate-500" />
              </button>
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl ${selectedPersona.colorBg} border-2 border-white shadow-sm flex items-center justify-center`}>

                  <selectedPersona.icon
                    className={`w-7 h-7 ${selectedPersona.colorText}`} />

                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-slate-900">
                      {selectedPersona.name}
                    </h2>
                    <span
                      className={`text-sm font-bold ${selectedPersona.colorText}`}>

                      {selectedPersona.percentage}% of audience
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    {selectedPersona.count} contacts
                  </p>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 space-y-6">
              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed">
                {selectedPersona.description}
              </p>

              {/* Psychological Traits */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <BrainIcon className="w-4 h-4 text-slate-400" />
                  Psychological Traits
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedPersona.traits.map((trait) =>
                    <span
                      key={trait}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${selectedPersona.colorBg} ${selectedPersona.colorText} border border-current/10`}>

                      {trait}
                    </span>
                  )}
                </div>
              </div>

              {/* Preferred Ad Formats */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  Preferred Ad Formats
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPersona.adFormats.map((format) =>
                    <div
                      key={format}
                      className="flex items-center gap-2 text-sm text-slate-600 p-2 bg-slate-50 rounded-lg">

                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {format}
                    </div>
                  )}
                </div>
              </div>

              {/* Messaging Tone */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <MessageSquareIcon className="w-4 h-4 text-slate-400" />
                  Messaging Tone
                </h3>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    "{selectedPersona.messagingTone}"
                  </p>
                </div>
              </div>

              {/* Example Ads That Worked */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <TrendingUpIcon className="w-4 h-4 text-slate-400" />
                  Top Performing Ads
                </h3>
                <div className="space-y-3">
                  {selectedPersona.exampleAds.map((ad, idx) =>
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">

                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg ${selectedPersona.colorBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>

                          <SparklesIcon
                            className={`w-4 h-4 ${selectedPersona.colorText}`} />

                        </div>
                        <p className="text-sm font-medium text-slate-900 leading-snug">
                          {ad.headline}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="text-lg font-bold text-slate-900">
                          {ad.ctr}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                          CTR
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Based on {selectedPersona.count} contacts in this segment
                </p>
                <Button
                  size="sm"
                  leftIcon={<SparklesIcon className="w-3.5 h-3.5" />}>

                  Generate Ads for {selectedPersona.name.replace('The ', '')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>);

}