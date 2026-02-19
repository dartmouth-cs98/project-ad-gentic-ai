import React, { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  UploadIcon,
  FileIcon,
  CheckCircleIcon,
  DownloadIcon,
  UsersIcon,
  PieChartIcon,
  ActivityIcon,
  ClockIcon,
  XIcon,
  BrainIcon,
  MessageSquareIcon,
  ImageIcon,
  TrendingUpIcon,
  InfoIcon,
  RefreshCwIcon,
  Loader2Icon,
  SparklesIcon,
  TargetIcon,
  ZapIcon,
  ShieldIcon,
  SearchIcon,
  HeartIcon
} from
  'lucide-react';
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

const uploadFiles = [
  {
    name: 'q1_leads_2026.csv',
    date: '2 days ago',
    status: 'Processed' as const,
    size: '2.4 MB'
  },
  {
    name: 'newsletter_subs.xlsx',
    date: '1 week ago',
    status: 'Processed' as const,
    size: '1.1 MB'
  },
  {
    name: 'raw_export_jan.json',
    date: '2 weeks ago',
    status: 'Failed' as const,
    size: '5.2 MB',
    errorReason:
      'File contains malformed JSON at line 4,218. Fix the syntax error or re-export from your CRM.'
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

export function CustomerDataPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'success'>(
      'idle');
  const [selectedPersona, setSelectedPersona] = useState<PersonaProfile | null>(
    null
  );
  const [retryingFile, setRetryingFile] = useState<string | null>(null);
  const [showErrorTooltip, setShowErrorTooltip] = useState<string | null>(null);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleUpload();
  };
  const handleUpload = () => {
    setUploadStatus('uploading');
    setTimeout(() => setUploadStatus('success'), 2000);
  };
  const handleRetry = (fileName: string) => {
    setRetryingFile(fileName);
    setTimeout(() => setRetryingFile(null), 2000);
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
              onClick={handleUpload}>

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
              <p className="text-2xl font-bold text-slate-900">12,847</p>
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <ActivityIcon className="w-3 h-3" /> +12% this month
              </p>
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
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer mb-8 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={handleUpload}>

                  {uploadStatus === 'uploading' ?
                    <>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Loader2Icon className="w-6 h-6 text-blue-600 animate-spin" />
                      </div>
                      <h3 className="font-semibold text-slate-900">
                        Processing file...
                      </h3>
                      <p className="text-slate-500 text-sm mt-1">
                        Analyzing and building persona segments
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
                        <p className="text-slate-500 text-sm mt-1">
                          Persona segments updated successfully
                        </p>
                      </> :

                      <>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <UploadIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900">
                          Upload Customer File
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">
                          Drag & drop CSV, JSON, or Excel
                        </p>
                      </>
                  }
                </div>

                <h3 className="font-semibold text-slate-900 mb-4">
                  Recent Uploads
                </h3>
                <div className="space-y-3">
                  {uploadFiles.map((file, i) =>
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                          <FileIcon className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {file.date} • {file.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {file.status === 'Failed' ?
                          <>
                            <div className="relative">
                              <button
                                onMouseEnter={() =>
                                  setShowErrorTooltip(file.name)
                                }
                                onMouseLeave={() => setShowErrorTooltip(null)}
                                className="p-1 rounded hover:bg-red-50 transition-colors">

                                <InfoIcon className="w-4 h-4 text-red-400" />
                              </button>
                              {showErrorTooltip === file.name &&
                                file.errorReason &&
                                <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-20">
                                  <p className="font-medium mb-1">
                                    Upload failed
                                  </p>
                                  <p className="text-slate-300 leading-relaxed">
                                    {file.errorReason}
                                  </p>
                                  <div className="absolute bottom-0 right-4 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900" />
                                </div>
                              }
                            </div>
                            <Badge variant="danger">Failed</Badge>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRetry(file.name)}
                              disabled={retryingFile === file.name}>

                              {retryingFile === file.name ?
                                <Loader2Icon className="w-3.5 h-3.5 animate-spin" /> :

                                <RefreshCwIcon className="w-3.5 h-3.5" />
                              }
                              <span className="ml-1">
                                {retryingFile === file.name ?
                                  'Retrying...' :
                                  'Retry'}
                              </span>
                            </Button>
                          </> :

                          <>
                            <Badge variant="success">{file.status}</Badge>
                            <Button variant="ghost" size="sm">
                              <DownloadIcon className="w-4 h-4" />
                            </Button>
                          </>
                        }
                      </div>
                    </div>
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