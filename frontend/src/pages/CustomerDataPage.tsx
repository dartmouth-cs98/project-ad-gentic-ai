import React, { useState, useRef, useMemo } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';
import { useSidebar } from '../contexts/SidebarContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { useConsumers, useUploadConsumersCsv } from '../hooks/useConsumers';
import { usePersonas } from '../hooks/usePersonas';
import type { Consumer, Persona } from '../types';
import { CLIENT_ID_KEY } from '../api/config';

// ─── Color palette ───────────────────────────────────────────────────────────
const PERSONA_COLORS = [
  { stroke: '#0ea5e9', dot: 'bg-sky-500',     bg: 'bg-sky-500/10',     text: 'text-sky-500'     },
  { stroke: '#f97316', dot: 'bg-orange-500',  bg: 'bg-orange-500/10',  text: 'text-orange-500'  },
  { stroke: '#8b5cf6', dot: 'bg-violet-500',  bg: 'bg-violet-500/10',  text: 'text-violet-500'  },
  { stroke: '#94a3b8', dot: 'bg-muted-foreground', bg: 'bg-muted',     text: 'text-muted-foreground'   },
  { stroke: '#10b981', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  { stroke: '#ec4899', dot: 'bg-pink-500',    bg: 'bg-pink-500/10',    text: 'text-pink-500'    },
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
          <span key={key} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground border border-border truncate max-w-[120px]">
            <span className="font-bold mr-1">{formatKey(key)}:</span>
            <span className="truncate">
              {Array.isArray(traits[key]) ? (traits[key] as unknown[]).join(', ') : String(traits[key])}
            </span>
          </span>
        ))}
        {remainingCount > 0 && (
          <span className="text-[9px] text-blue-500 font-medium self-center ml-0.5 whitespace-nowrap bg-blue-600/10 px-1 rounded border border-blue-600/20">
            +{remainingCount}
          </span>
        )}
      </div>
      <div className="absolute bottom-full left-0 mb-2 w-48 p-3 bg-foreground text-background rounded-lg shadow-xl z-50 opacity-0 invisible group-hover/traits:opacity-100 group-hover/traits:visible transition-all duration-200 pointer-events-none text-[10px]">
        <div className="space-y-1.5">
          {Object.entries(traits).map(([key, val]) => (
            <div key={key} className="flex flex-col">
              <span className="font-bold opacity-50 uppercase text-[8px]">{formatKey(key)}</span>
              <span className="font-medium truncate">{Array.isArray(val) ? (val as unknown[]).join(', ') : String(val)}</span>
            </div>
          ))}
        </div>
        <div className="absolute -bottom-1 left-4 w-2 h-2 bg-foreground rotate-45" />
      </div>
    </div>
  );
}

export function CustomerDataPage() {
  const { collapsed } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const {
    data: consumers = [],
    isLoading: consumersLoading,
    error: consumersQueryError,
    refetch,
  } = useConsumers(0, 1000, true);
  const { data: personas = [], isLoading: personasLoading } = usePersonas(true);
  const uploadCsv = useUploadConsumersCsv();
  const consumersError = consumersQueryError ? (consumersQueryError as Error).message : null;


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

  const hasPersonaAssignments = activeSegments > 0;

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
      const clientId = localStorage.getItem(CLIENT_ID_KEY);
      if (!clientId) return null;
      const raw = localStorage.getItem(`adgentic_last_upload_${clientId}`);
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

  const circumference = 2 * Math.PI * 40;
  const donutSegments = useMemo(() => {
    if (!hasPersonaAssignments) return [];
    const total = consumers.length;
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
  }, [personas, personaStats, consumers.length, circumference, hasPersonaAssignments]);

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
        const clientId = localStorage.getItem(CLIENT_ID_KEY);
        const key = clientId ? `adgentic_last_upload_${clientId}` : 'adgentic_last_upload';
        localStorage.setItem(key, JSON.stringify({
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
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <main className={`${collapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 flex-1 p-8`}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Customer Data</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage audience segments and insights.</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClickUpload}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Upload New Data
              </button>
              <button onClick={toggleTheme} className="p-2 bg-muted rounded-lg hover:bg-border transition-colors text-muted-foreground" aria-label="Toggle theme">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Data Completeness Bar */}
          <div className="mb-8 bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold">Audience Profile Completeness</h3>
                <p className="text-xs text-muted-foreground">Upload more data to improve persona accuracy and ad targeting.</p>
              </div>
              <span className="text-2xl font-bold">{completenessScore}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: `${completenessScore}%` }} />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {completenessItems.map((item) => (
                <div key={item.label} className="flex items-center gap-1.5 text-xs">
                  <span className={item.done ? 'text-emerald-500 font-bold' : 'text-border'}>
                    {item.done ? '✓' : '○'}
                  </span>
                  <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-5 mb-8">
            {[
              { label: 'Total Contacts', value: consumersLoading ? '—' : consumers.length.toLocaleString(), sub: 'From uploaded CSVs' },
              { label: 'Active Segments', value: isLoading ? '—' : String(activeSegments), sub: `Across ${uniquePersonasAssigned} persona${uniquePersonasAssigned !== 1 ? 's' : ''}` },
              { label: 'Top Persona', value: isLoading ? '—' : (topPersona?.persona.name ?? 'None'), sub: topPersona ? `${topPersona.pct}% of audience` : 'No assignments yet' },
              { label: 'Last Upload', value: consumersLoading ? '—' : (lastUploadInfo ? formatRelativeDate(lastUploadInfo.date) : 'Never'), sub: lastUploadInfo?.filename ?? '—' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-2">{label}</p>
                <p className="text-2xl font-semibold truncate">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-8">
            {/* Persona Distribution */}
            <div className="col-span-1 bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-0.5">Persona Distribution</h3>
              <p className="text-xs text-muted-foreground mb-6">Click a persona to view detailed profile</p>

              {/* Donut */}
              <div className="relative aspect-square max-w-[200px] mx-auto mb-6">
                <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                  {personasLoading || donutSegments.length === 0 ? (
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="20" className="text-muted" />
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
                  <span className="text-3xl font-bold">
                    {personasLoading ? '—' : personas.length}
                  </span>
                  <span className="text-xs text-muted-foreground">Personas</span>
                </div>
              </div>

              {/* Legend */}
              {personasLoading ? (
                <div className="flex justify-center py-4">
                  <span className="text-xs text-muted-foreground">Loading...</span>
                </div>
              ) : personas.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">No personas available</p>
              ) : (
                <div className="space-y-1">
                  {personas.map((persona, i) => {
                    const color = getColor(i);
                    const count = personaStats[persona.id]?.primary ?? 0;
                    const pct = consumers.length > 0 ? Math.round((count / consumers.length) * 100) : 0;
                    return (
                      <button
                        key={persona.id}
                        onClick={() => setSelectedPersonaDetail({ persona, colorIdx: i })}
                        className="w-full flex items-center justify-between text-sm p-2 -mx-2 rounded-lg hover:bg-muted transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color.dot}`} />
                          <span className="text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[120px]">
                            {persona.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pct}%</span>
                          <span className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity text-xs">→</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Upload + Recent Consumers */}
            <div className="col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-xl p-5">
                <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />

                {/* Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer mb-6 ${
                    isDragging
                      ? 'border-blue-600 bg-blue-600/5'
                      : 'border-border hover:border-blue-600/50 hover:bg-muted/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={handleClickUpload}
                >
                  {uploadStatus === 'uploading' ? (
                    <>
                      <h3 className="font-semibold">Uploading to server...</h3>
                      <p className="text-muted-foreground text-sm mt-1">Processing your CSV file</p>
                    </>
                  ) : uploadStatus === 'success' ? (
                    <>
                      <p className="text-2xl mb-2 text-emerald-500">✓</p>
                      <h3 className="font-semibold">Upload complete!</h3>
                      {uploadResult && (
                        <p className="text-muted-foreground text-sm mt-1">
                          {uploadResult.created} created, {uploadResult.skipped} skipped
                        </p>
                      )}
                    </>
                  ) : uploadStatus === 'error' ? (
                    <>
                      <h3 className="font-semibold text-red-500">Upload failed</h3>
                      <p className="text-red-500/80 text-sm mt-1">
                        {uploadError || 'There were errors processing the file.'}
                      </p>
                      {uploadResult && uploadResult.errors.length > 0 && (
                        <div className="mt-3 text-left bg-red-500/10 border border-red-500/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                          {uploadResult.errors.map((err, i) => (
                            <p key={i} className="text-xs text-red-500 mb-1">{err}</p>
                          ))}
                        </div>
                      )}
                      {uploadResult && uploadResult.created > 0 && (
                        <p className="text-muted-foreground text-xs mt-2">
                          ({uploadResult.created} rows were still imported successfully)
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold">Upload Customer File</h3>
                      <p className="text-muted-foreground text-sm mt-1">Drag & drop a CSV file, or click to browse</p>
                    </>
                  )}
                </div>

                {/* Recent Consumers */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Recent Consumers</h3>
                  <Link to="/all-consumers" className="text-sm text-blue-500 hover:underline font-medium">
                    View All →
                  </Link>
                </div>
                <div className="space-y-2">
                  {consumersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                  ) : consumersError ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-red-500">{consumersError}</p>
                      <button onClick={() => refetch()} className="mt-2 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors">Retry</button>
                    </div>
                  ) : recentConsumers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground">No consumers yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Upload a CSV to get started</p>
                    </div>
                  ) : (
                    recentConsumers.map((consumer: Consumer) => (
                      <div key={consumer.id} className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium text-muted-foreground border border-border">
                            {consumer.first_name?.charAt(0) ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {consumer.first_name} {consumer.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{consumer.email}</p>
                            {renderTraits(consumer.traits)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">{formatRelativeDate(consumer.created_at)}</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-medium">Active</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Persona Detail Modal */}
      {selectedPersonaDetail && (() => {
        const { persona, colorIdx } = selectedPersonaDetail;
        const color = getColor(colorIdx);
        const count = personaStats[persona.id]?.primary ?? 0;
        const pct = consumers.length > 0 ? Math.round((count / consumers.length) * 100) : 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setSelectedPersonaDetail(null)} />
            <div className="relative bg-card border border-border rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">

              {/* Modal Header */}
              <div className={`${color.bg} px-6 pt-6 pb-5 rounded-t-xl relative border-b border-border`}>
                <button onClick={() => setSelectedPersonaDetail(null)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground text-lg leading-none">
                  ×
                </button>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${color.bg} border border-border flex items-center justify-center text-lg font-semibold ${color.text}`}>
                    {persona.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-0.5">
                      <h2 className="text-lg font-semibold">{persona.name}</h2>
                      <span className={`text-sm font-semibold ${color.text}`}>{pct}% of audience</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{count.toLocaleString()} contacts</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 space-y-5">
                <p className="text-sm text-muted-foreground leading-relaxed">{persona.description}</p>

                {/* Key Motivators */}
                {persona.key_motivators.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Key Motivators</h3>
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
                    <h3 className="text-sm font-semibold mb-3">Pain Points</h3>
                    <div className="flex flex-wrap gap-2">
                      {persona.pain_points.map((p) => (
                        <span key={p} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground border border-border">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ad Tone Preferences */}
                {persona.ad_tone_preferences && persona.ad_tone_preferences.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Ad Tone Preferences</h3>
                    <div className="bg-muted rounded-xl p-4 border border-border flex flex-wrap gap-2">
                      {persona.ad_tone_preferences.map((tone) => (
                        <span key={tone} className={`px-3 py-1 rounded-full text-xs font-medium ${color.bg} ${color.text}`}>
                          {tone}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Based on {count.toLocaleString()} contacts in this segment</p>
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Generate Ads for {persona.name}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
