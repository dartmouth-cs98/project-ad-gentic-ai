import React, { useState, useRef, useMemo } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { useSidebar } from '../contexts/SidebarContext';
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
  TrendingUpIcon,
  InfoIcon,
  Loader2Icon,
  SparklesIcon,
  TargetIcon,
  AlertCircleIcon,
  ArrowRightIcon,
} from 'lucide-react';
import { useConsumerContext } from '../contexts/ConsumerContext';
import { usePersonasContext } from '../contexts/PersonasContext';
import type { Consumer, Persona } from '../types';

// ─── Color palette (cycles for >6 personas) ─────────────────────────────────
const PERSONA_COLORS = [
  { stroke: '#0ea5e9', dot: 'bg-sky-500',     bg: 'bg-sky-50',     text: 'text-sky-600'     },
  { stroke: '#f97316', dot: 'bg-orange-500',  bg: 'bg-orange-50',  text: 'text-orange-600'  },
  { stroke: '#8b5cf6', dot: 'bg-violet-500',  bg: 'bg-violet-50',  text: 'text-violet-600'  },
  { stroke: '#94a3b8', dot: 'bg-slate-400',   bg: 'bg-slate-50',   text: 'text-slate-600'   },
  { stroke: '#10b981', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  { stroke: '#ec4899', dot: 'bg-pink-500',    bg: 'bg-pink-50',    text: 'text-pink-600'    },
];
function getColor(index: number) {
  return PERSONA_COLORS[index % PERSONA_COLORS.length];
}

const completenessScore = 72;
const completenessItems = [
  { label: 'Contact info',       done: true  },
  { label: 'Purchase history',   done: true  },
  { label: 'Engagement data',    done: true  },
  { label: 'Demographic data',   done: false },
  { label: 'Behavioral signals', done: false },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
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
          <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[120px]">
            <span className="font-bold mr-1">{formatKey(key)}:</span>
            <span className="truncate">
              {Array.isArray(traits[key]) ? (traits[key] as unknown[]).join(', ') : String(traits[key])}
            </span>
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="text-[9px] text-blue-600 font-medium self-center ml-0.5 whitespace-nowrap bg-blue-50 px-1 rounded border border-blue-100">
            +{remainingCount}
          </span>
        )}
      </div>
      <div className="absolute bottom-full left-0 mb-2 w-48 p-3 bg-slate-900 text-white rounded-lg shadow-xl z-50 opacity-0 invisible group-hover/traits:opacity-100 group-hover/traits:visible transition-all duration-200 pointer-events-none text-[10px]">
        <div className="space-y-1.5">
          {Object.entries(traits).map(([key, val]) => (
            <div key={key} className="flex flex-col">
              <span className="font-bold text-slate-400 uppercase text-[8px]">{formatKey(key)}</span>
              <span className="font-medium truncate">{Array.isArray(val) ? (val as unknown[]).join(', ') : String(val)}</span>
            </div>
          ))}
        </div>
        <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-900 rotate-45" />
      </div>
    </div>
  );
}

export function CustomerDataPage() {
  const { collapsed } = useSidebar();
  const { consumers, loading: consumersLoading, error: consumersError, uploadCsv, refetch } = useConsumerContext();
  const { personas, personasLoading } = usePersonasContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadResult, setUploadResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadTick, setUploadTick] = useState(0);
  const [selectedPersonaDetail, setSelectedPersonaDetail] = useState<{ persona: Persona; colorIdx: number } | null>(null);

  const recentConsumers = consumers.slice(-5).reverse();

  const personaStats = useMemo(() => {
    const stats: Record<string, { primary: number; secondary: number }> = {};
    for (const c of consumers) {
      if (c.primary_persona) {
        const id = c.primary_persona.id;
        stats[id] = stats[id] ?? { primary: 0, secondary: 0 };
        stats[id].primary++;
      }
      if (c.secondary_persona) {
        const id = c.secondary_persona.id;
        stats[id] = stats[id] ?? { primary: 0, secondary: 0 };
        stats[id].secondary++;
      }
    }
    return stats;
  }, [consumers]);

  const activeSegments = useMemo(() => {
    const primary = consumers.filter((c) => c.primary_persona).length;
    const secondary = consumers.filter((c) => c.secondary_persona).length;
    return primary + secondary;
  }, [consumers]);

  const uniquePersonasAssigned = useMemo(() => {
    const ids = new Set<string>();
    consumers.forEach((c) => {
      if (c.primary_persona) ids.add(c.primary_persona.id);
      if (c.secondary_persona) ids.add(c.secondary_persona.id);
    });
    return ids.size;
  }, [consumers]);

  const topPersona = useMemo(() => {
    if (!personas.length || !consumers.length) return null;
    let topId: string | null = null;
    let topCount = 0;
    for (const [id, s] of Object.entries(personaStats)) {
      if (s.primary > topCount) { topCount = s.primary; topId = id; }
    }
    if (!topId) return null;
    const idx = personas.findIndex((p) => p.id === topId);
    if (idx === -1) return null;
    const pct = Math.round((topCount / consumers.length) * 100);
    return { persona: personas[idx], pct, colorIdx: idx };
  }, [personas, personaStats, consumers]);

  const lastUploadInfo = useMemo(() => {
    try {
      const raw = localStorage.getItem('adgentic_last_upload');
      if (raw) return JSON.parse(raw) as { filename: string; date: string };
    } catch { /* ignore */ }
    if (consumers.length > 0) {
      const latest = consumers.reduce((a, b) =>
        new Date(a.created_at) > new Date(b.created_at) ? a : b,
      );
      return { filename: null, date: latest.created_at };
    }
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consumers, uploadTick]);

  // ── Donut chart segments ────────────────────────────────────────────────────
  const circumference = 2 * Math.PI * 40; // ≈ 251.33
  const donutSegments = useMemo(() => {
    const total = consumers.length || 1;
    let cumulative = 0;
    return personas.map((p, i) => {
      const count = personaStats[p.id]?.primary ?? 0;
      const dashLength = (count / total) * circumference;
      const offset = -cumulative;
      cumulative += dashLength;
      return {
        persona: p,
        pct: Math.round((count / total) * 100),
        dashLength,
        offset,
        color: PERSONA_COLORS[i % PERSONA_COLORS.length].stroke,
      };
    });
  }, [personas, personaStats, consumers.length, circumference]);

  // ── Upload handlers ─────────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) doUpload(file);
  };
  const handleClickUpload = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    e.target.value = '';
  };
  const doUpload = (file: File) => {
    setUploadStatus('uploading');
    setUploadError(null);
    setUploadResult(null);
    uploadCsv.mutate(file, {
      onSuccess: (data) => {
        localStorage.setItem('adgentic_last_upload', JSON.stringify({
          filename: file.name,
          date: new Date().toISOString(),
        }));
        setUploadTick((t) => t + 1);
        setUploadResult({ created: data.created, skipped: data.skipped, errors: data.errors });
        setUploadStatus(data.errors.length > 0 ? 'error' : 'success');
        refetch();
      },
      onError: (err) => {
        setUploadError(err.message);
        setUploadStatus('error');
      },
    });
  };

  const isLoading = consumersLoading || personasLoading;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className={`${collapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 flex-1 p-8`}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Customer Data Platform</h1>
              <p className="text-slate-500">Manage audience segments and insights.</p>
            </div>
            <Button leftIcon={<UploadIcon className="w-4 h-4" />} onClick={handleClickUpload}>
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
                  <h3 className="text-sm font-semibold text-slate-900">Audience Profile Completeness</h3>
                  <p className="text-xs text-slate-500">Upload more data to improve persona accuracy and ad targeting.</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-slate-900">{completenessScore}%</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700" style={{ width: `${completenessScore}%` }} />
            </div>
            <div className="flex items-center gap-4">
              {completenessItems.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs">
                  {item.done
                    ? <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                    : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300" />}
                  <span className={item.done ? 'text-slate-600' : 'text-slate-400'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            {/* Total Contacts */}
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UsersIcon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-500">Total Contacts</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {consumersLoading ? '—' : consumers.length.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">From uploaded CSVs</p>
            </Card>

            {/* Active Segments */}
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PieChartIcon className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-slate-500">Active Segments</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {isLoading ? '—' : activeSegments}
              </p>
              <p className="text-xs text-slate-500">
                Across {uniquePersonasAssigned} persona{uniquePersonasAssigned !== 1 ? 's' : ''}
              </p>
            </Card>

            {/* Top Persona */}
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-slate-500">Top Persona</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 truncate">
                {isLoading ? '—' : (topPersona?.persona.name ?? 'None')}
              </p>
              <p className="text-xs text-slate-500">
                {topPersona ? `${topPersona.pct}% of audience` : 'No assignments yet'}
              </p>
            </Card>

            {/* Last Upload */}
            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-slate-500">Last Upload</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {consumersLoading ? '—' : (lastUploadInfo ? formatRelativeDate(lastUploadInfo.date) : 'Never')}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {lastUploadInfo?.filename ?? '—'}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* ── Persona Distribution ── */}
            <Card variant="elevated" padding="lg" className="col-span-1">
              <h3 className="font-semibold text-slate-900 mb-1">Persona Distribution</h3>
              <p className="text-xs text-slate-400 mb-6">Click a persona to view detailed profile</p>

              {/* Donut */}
              <div className="relative aspect-square max-w-[240px] mx-auto mb-6">
                <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                  {personasLoading || donutSegments.length === 0 ? (
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                  ) : (
                    donutSegments.map((seg) => (
                      <circle
                        key={seg.persona.id}
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="20"
                        strokeDasharray={`${seg.dashLength} ${circumference}`}
                        strokeDashoffset={seg.offset}
                      />
                    ))
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-bold text-slate-900">
                    {personasLoading ? '—' : personas.length}
                  </span>
                  <span className="text-xs text-slate-500">Personas</span>
                </div>
              </div>

              {/* Legend */}
              {personasLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2Icon className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
              ) : personas.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">No personas available</p>
              ) : (
                <div className="space-y-2">
                  {personas.map((persona, i) => {
                    const color = getColor(i);
                    const count = personaStats[persona.id]?.primary ?? 0;
                    const pct = consumers.length > 0 ? Math.round((count / consumers.length) * 100) : 0;
                    return (
                      <button
                        key={persona.id}
                        onClick={() => setSelectedPersonaDetail({ persona, colorIdx: i })}
                        className="w-full flex items-center justify-between text-sm p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${color.dot}`} />
                          <span className="text-slate-600 group-hover:text-slate-900 transition-colors truncate max-w-[120px]">
                            {persona.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{pct}%</span>
                          <span className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs">→</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* ── Upload Area + Recent Consumers ── */}
            <div className="col-span-2 space-y-6">
              <Card variant="elevated" padding="lg">
                {/* Hidden file input */}
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />

                {/* Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer mb-8 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={handleClickUpload}
                >
                  {uploadStatus === 'uploading' ? (
                    <>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Loader2Icon className="w-6 h-6 text-blue-600 animate-spin" />
                      </div>
                      <h3 className="font-semibold text-slate-900">Uploading to server...</h3>
                      <p className="text-slate-500 text-sm mt-1">Processing your CSV file</p>
                    </>
                  ) : uploadStatus === 'success' ? (
                    <>
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900">Upload complete!</h3>
                      {uploadResult && (
                        <p className="text-slate-500 text-sm mt-1">
                          {uploadResult.created} created, {uploadResult.skipped} skipped
                        </p>
                      )}
                    </>
                  ) : uploadStatus === 'error' ? (
                    <>
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <AlertCircleIcon className="w-6 h-6 text-red-600" />
                      </div>
                      <h3 className="font-semibold text-red-700">Upload failed</h3>
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
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <UploadIcon className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900">Upload Customer File</h3>
                      <p className="text-slate-500 text-sm mt-1">Drag & drop a CSV file, or click to browse</p>
                    </>
                  )}
                </div>

                {/* Recent Consumers */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-900">Recent Consumers</h3>
                  <Link to="/all-consumers" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-1">
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
                      <Button variant="secondary" size="sm" onClick={() => refetch()} className="mt-2">Retry</Button>
                    </div>
                  ) : recentConsumers.length === 0 ? (
                    <div className="text-center py-6">
                      <UsersIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No consumers yet</p>
                      <p className="text-xs text-slate-400 mt-1">Upload a CSV to get started</p>
                    </div>
                  ) : (
                    recentConsumers.map((consumer: Consumer) => (
                      <div key={consumer.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <UsersIcon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate">
                              {consumer.first_name} {consumer.last_name}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{consumer.email}</p>
                            {renderTraits(consumer.traits)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">{formatRelativeDate(consumer.created_at)}</span>
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

      {/* ── Persona Detail Modal ── */}
      {selectedPersonaDetail && (() => {
        const { persona, colorIdx } = selectedPersonaDetail;
        const color = getColor(colorIdx);
        const count = personaStats[persona.id]?.primary ?? 0;
        const pct = consumers.length > 0 ? Math.round((count / consumers.length) * 100) : 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedPersonaDetail(null)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">

              {/* Modal Header */}
              <div className={`${color.bg} px-8 pt-8 pb-6 rounded-t-2xl relative`}>
                <button onClick={() => setSelectedPersonaDetail(null)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                  <XIcon className="w-5 h-5 text-slate-500" />
                </button>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl ${color.bg} border-2 border-white shadow-sm flex items-center justify-center`}>
                    <BrainIcon className={`w-7 h-7 ${color.text}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-xl font-bold text-slate-900">{persona.name}</h2>
                      <span className={`text-sm font-bold ${color.text}`}>{pct}% of audience</span>
                    </div>
                    <p className="text-sm text-slate-500">{count.toLocaleString()} contacts</p>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 space-y-6">
                <p className="text-sm text-slate-600 leading-relaxed">{persona.description}</p>

                {/* Key Motivators */}
                {persona.key_motivators.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <TrendingUpIcon className="w-4 h-4 text-slate-400" />
                      Key Motivators
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {persona.key_motivators.map((m) => (
                        <span key={m} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${color.bg} ${color.text} border border-current/10`}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pain Points */}
                {persona.pain_points.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <InfoIcon className="w-4 h-4 text-slate-400" />
                      Pain Points
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {persona.pain_points.map((p) => (
                        <span key={p} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ad Tone Preferences */}
                {persona.ad_tone_preferences && persona.ad_tone_preferences.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <MessageSquareIcon className="w-4 h-4 text-slate-400" />
                      Ad Tone Preferences
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex flex-wrap gap-2">
                        {persona.ad_tone_preferences.map((tone) => (
                          <span key={tone} className={`px-3 py-1 rounded-full text-xs font-medium ${color.bg} ${color.text}`}>
                            {tone}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs text-slate-400">Based on {count.toLocaleString()} contacts in this segment</p>
                  <Button size="sm" leftIcon={<SparklesIcon className="w-3.5 h-3.5" />}>
                    Generate Ads for {persona.name}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
