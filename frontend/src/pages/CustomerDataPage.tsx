// CustomerDataPage — Swiss/Linear editorial theme
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { useConsumers, useUploadConsumersCsv, useAssignPersonas } from '../hooks/useConsumers';
import { usePersonas } from '../hooks/usePersonas';
import type { Consumer, Persona } from '../types';
import { CLIENT_ID_KEY } from '../api/config';
import { UploadProgressView } from '../components/customer/UploadProgressView';
import type { UploadPhase } from '../components/customer/UploadProgressView';

const PERSONA_STROKES = [
  '#2B3FE0', '#f97316', '#8b5cf6', '#94a3b8', '#10b981', '#ec4899',
];
function getStroke(i: number) { return PERSONA_STROKES[i % PERSONA_STROKES.length]; }


function formatRelativeDate(dateString: string) {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatKey(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()
    .split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function TraitTags({ traits }: { traits: Record<string, unknown> | null }) {
  if (!traits || Object.keys(traits).length === 0) return null;
  const keys = Object.keys(traits);
  const shown = keys.slice(0, 2);
  const rest = keys.length - shown.length;
  return (
    <div style={{ marginTop: 4 }}>
      {shown.map((k) => (
        <span key={k} className="cust-trait-tag">
          <b>{formatKey(k)}:</b>{' '}
          {Array.isArray(traits[k]) ? (traits[k] as unknown[]).join(', ') : String(traits[k])}
        </span>
      ))}
      {rest > 0 && <span className="cust-trait-tag">+{rest}</span>}
    </div>
  );
}


function UploadIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={13} height={13}>
      <path d="M7 9V3M5 5l2-2 2 2" />
      <path d="M2 11h10" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width={11} height={11}>
      <path d="M2 2l8 8M10 2L2 10" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" width={34} height={34}>
      <circle cx="13" cy="11" r="5" />
      <path d="M4 28c0-5 4-9 9-9s9 4 9 9" />
      <circle cx="24" cy="11" r="3.5" />
      <path d="M24 19c4 0 6 2.5 6 6" />
    </svg>
  );
}


export function CustomerDataPage() {
  const { data: consumers = [], isLoading: consumersLoading, error: consumersQueryError, refetch } = useConsumers(0, 1000, true);
  const { data: personas = [], isLoading: personasLoading } = usePersonas(true);
  const uploadCsv = useUploadConsumersCsv();
  const assignPersonas = useAssignPersonas();
  const consumersError = consumersQueryError ? (consumersQueryError as Error).message : null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<'idle' | UploadPhase | 'error'>('idle');
  const [uploadResult, setUploadResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadTick, setUploadTick] = useState(0);
  const [progressIdx, setProgressIdx] = useState(0);
  const [selectedPersonaDetail, setSelectedPersonaDetail] = useState<{ persona: Persona; colorIdx: number } | null>(null);

  const startProgress = () => {
    setProgressIdx(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = setInterval(() => setProgressIdx((n) => n + 1), 1200);
  };
  const stopProgress = () => {
    if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
  };
  useEffect(() => () => stopProgress(), []);

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
    return consumers.filter((c) => c.primary_persona).length
      + consumers.filter((c) => c.secondary_persona).length;
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
    return { persona: personas[idx], pct };
  }, [personas, personaStats, consumers]);

  const lastUploadInfo = useMemo(() => {
    try {
      const clientId = localStorage.getItem(CLIENT_ID_KEY);
      if (clientId) {
        const raw = localStorage.getItem(`adgentic_last_upload_${clientId}`);
        if (raw) return JSON.parse(raw) as { filename: string; date: string };
      }
    } catch { /* ignore */ }
    if (consumers.length > 0) {
      const latest = consumers.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b);
      return { filename: null, date: latest.created_at };
    }
    return null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consumers, uploadTick]);

  const circumference = 2 * Math.PI * 40;
  const hasPersonaAssignments = activeSegments > 0;

  const donutSegments = useMemo(() => {
    if (!hasPersonaAssignments) return [];
    const total = consumers.length;
    let cumulative = 0;
    return personas.map((p, i) => {
      const count = personaStats[p.id]?.primary ?? 0;
      const dashLength = (count / total) * circumference;
      const offset = -cumulative;
      cumulative += dashLength;
      return { persona: p, pct: Math.round((count / total) * 100), dashLength, offset, color: getStroke(i) };
    });
  }, [personas, personaStats, consumers.length, circumference, hasPersonaAssignments]);

  const downloadTemplate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rows = [
      'email,first_name,last_name,phone,traits',
      'jane@example.com,Jane,Doe,+1234567890,"{""age"":30,""city"":""New York""}"',
      'john@example.com,John,Smith,+0987654321,"{""age"":25,""city"":""Chicago""}"',
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'customer_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

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
    setUploadPhase('uploading');
    setUploadError(null);
    setUploadResult(null);
    startProgress();
    uploadCsv.mutate(file, {
      onSuccess: (data) => {
        const clientId = localStorage.getItem(CLIENT_ID_KEY);
        const key = clientId ? `adgentic_last_upload_${clientId}` : 'adgentic_last_upload';
        localStorage.setItem(key, JSON.stringify({ filename: file.name, date: new Date().toISOString() }));
        setUploadTick((t) => t + 1);
        setUploadResult({ created: data.created, skipped: data.skipped, errors: data.errors });

        const hasRowErrors = data.errors.length > 0;
        if (data.created === 0 && hasRowErrors) {
          stopProgress(); setUploadError('Upload failed — no records were imported.'); setUploadPhase('error');
          return;
        }

        setProgressIdx(0);
        setUploadPhase('assigning');
        assignPersonas.mutate(undefined, {
          onSuccess: () => {
            if (hasRowErrors) {
              stopProgress();
              setUploadError('Upload completed with row-level errors. Review the dropped rows below.');
              setUploadPhase('error');
              refetch();
              return;
            }
            setTimeout(() => { stopProgress(); setUploadPhase('complete'); refetch(); }, 1800);
          },
          onError: (err) => {
            stopProgress();
            setUploadError(err.message || 'Persona assignment failed. Please try again.');
            setUploadPhase('error');
          },
        });
      },
      onError: (err) => { stopProgress(); setUploadError(err.message); setUploadPhase('error'); },
    });
  };

  const isProcessing = uploadPhase === 'uploading' || uploadPhase === 'assigning';

  const STAT_CARDS = [
    { label: 'Total Contacts', value: consumersLoading ? '—' : consumers.length.toLocaleString(), sub: 'From uploaded CSVs' },
    { label: 'Active Segments', value: consumersLoading ? '—' : String(activeSegments), sub: `Across ${uniquePersonasAssigned} persona${uniquePersonasAssigned !== 1 ? 's' : ''}` },
    { label: 'Top Persona', value: (consumersLoading || personasLoading) ? '—' : (topPersona?.persona.name ?? 'None'), sub: topPersona ? `${topPersona.pct}% of audience` : 'No assignments yet' },
    { label: 'Last Upload', value: consumersLoading ? '—' : (lastUploadInfo ? formatRelativeDate(lastUploadInfo.date) : 'Never'), sub: lastUploadInfo?.filename ?? '—' },
  ];

  return (
    <AppShell>
      <div className="as-main">
        <div className="as-canvas">

          {/* Header */}
          <div className="as-page-head">
            <div>
              <span className="as-eyebrow">— CUSTOMER DATA</span>
              <h1>Audience</h1>
            </div>
            <button
              className="as-btn-solid"
              onClick={handleClickUpload}
              disabled={isProcessing}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px' }}
            >
              <UploadIcon /> Upload Data
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />

          {/* Stat cards */}
          <div className="cust-stats">
            {STAT_CARDS.map(({ label, value, sub }) => (
              <div key={label} className="cust-stat">
                <div className="cust-stat-label">{label}</div>
                <div className="cust-stat-val">{value}</div>
                <div className="cust-stat-sub">{sub}</div>
              </div>
            ))}
          </div>

          {/* Two-column body */}
          <div className="cust-cols">

            {/* Left: Persona distribution */}
            <div className="cust-panel">
              <div className="cust-panel-head">Persona Distribution</div>
              <div className="cust-panel-sub">Click a persona to view details</div>

              {/* Donut */}
              <div className="cust-donut-wrap">
                <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  {personasLoading || donutSegments.length === 0 ? (
                    <circle cx="50" cy="50" r="40" fill="none" stroke="var(--as-rule-strong)" strokeWidth="18" />
                  ) : (
                    donutSegments.map((seg) => (
                      <circle
                        key={seg.persona.id}
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="18"
                        strokeDasharray={`${seg.dashLength} ${circumference}`}
                        strokeDashoffset={seg.offset}
                      />
                    ))
                  )}
                </svg>
                <div className="cust-donut-center">
                  <span className="cust-donut-num">{personasLoading ? '—' : personas.length}</span>
                  <span className="cust-donut-unit">Personas</span>
                </div>
              </div>

              {/* Legend */}
              {personasLoading ? (
                <div className="prd-state" style={{ padding: '16px 0' }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={16} height={16} style={{ animation: 'as-spin 0.8s linear infinite' }}>
                    <circle cx="8" cy="8" r="6" strokeDasharray="18 8" />
                  </svg>
                </div>
              ) : personas.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--as-ink-3)', textAlign: 'center', padding: '8px 0' }}>No personas available</p>
              ) : (
                <div className="cust-legend">
                  {personas.map((persona, i) => {
                    const count = personaStats[persona.id]?.primary ?? 0;
                    const pct = consumers.length > 0 ? Math.round((count / consumers.length) * 100) : 0;
                    return (
                      <button
                        key={persona.id}
                        className="cust-legend-row"
                        onClick={() => setSelectedPersonaDetail({ persona, colorIdx: i })}
                      >
                        <div className="cust-legend-left">
                          <div className="cust-legend-dot" style={{ background: getStroke(i) }} />
                          <span className="cust-legend-name">{persona.name}</span>
                        </div>
                        <span className="cust-legend-pct">{pct}%</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Upload + Recent */}
            <div className="cust-panel-right">

              {/* Upload zone */}
              <div className="cust-panel">
                <div
                  className={`cust-drop${isProcessing ? ' processing' : uploadPhase === 'complete' ? ' done' : uploadPhase === 'error' ? ' error' : isDragging ? ' dragging' : ''}`}
                  onDragOver={isProcessing ? undefined : handleDragOver}
                  onDragLeave={isProcessing ? undefined : () => setIsDragging(false)}
                  onDrop={isProcessing ? undefined : handleDrop}
                  onClick={isProcessing ? undefined : (uploadPhase === 'error' ? handleClickUpload : handleClickUpload)}
                >
                  {uploadPhase === 'uploading' || uploadPhase === 'assigning' || uploadPhase === 'complete' ? (
                    <UploadProgressView
                      phase={uploadPhase}
                      progressIdx={progressIdx}
                      uploadedCount={uploadResult?.created}
                      personaCount={personas.length}
                    />
                  ) : uploadPhase === 'error' ? (
                    <>
                      <div className="cust-drop-err-title">Upload failed</div>
                      <div className="cust-drop-err-msg">{uploadError || 'There were errors processing the file.'}</div>
                      {uploadResult && uploadResult.errors.length > 0 && (
                        <div className="cust-drop-err-list">
                          {uploadResult.errors.map((err, i) => <p key={i}>{err}</p>)}
                        </div>
                      )}
                      {uploadResult && uploadResult.created > 0 && (
                        <div className="cust-drop-retry" style={{ color: 'var(--as-ink-2)' }}>
                          ({uploadResult.created} rows were still imported successfully)
                        </div>
                      )}
                      <div className="cust-drop-retry">Click to try again</div>
                    </>
                  ) : (
                    <>
                      <div className="cust-drop-title">Upload Customer File</div>
                      <div className="cust-drop-sub">Drag & drop a CSV file, or click to browse</div>
                      <div className="cust-drop-cols">
                        {[
                          { name: 'email', required: true },
                          { name: 'first_name', required: false },
                          { name: 'last_name', required: false },
                          { name: 'phone', required: false },
                          { name: 'traits', required: false },
                        ].map(({ name, required }) => (
                          <span key={name} className={`cust-col-tag${required ? ' required' : ''}`}>
                            {name}{required ? ' *' : ''}
                          </span>
                        ))}
                      </div>
                      <div className="cust-drop-hint">
                        Only <strong>email</strong> is required. Column names are flexible.
                      </div>
                      <button className="cust-drop-tmpl" onClick={downloadTemplate}>
                        Download template →
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Recent consumers */}
              <div className="cust-panel">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div className="cust-panel-head" style={{ marginBottom: 0 }}>Recent Contacts</div>
                  <Link to="/customer-data/all-consumers" className="cust-view-all">
                    View all →
                  </Link>
                </div>

                {consumersLoading ? (
                  <div className="prd-state" style={{ padding: '24px 0' }}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={16} height={16} style={{ animation: 'as-spin 0.8s linear infinite' }}>
                      <circle cx="8" cy="8" r="6" strokeDasharray="18 8" />
                    </svg>
                  </div>
                ) : consumersError ? (
                  <div className="prd-state" style={{ padding: '16px 0' }}>
                    <p style={{ fontSize: 13, color: 'var(--as-danger)', marginBottom: 10 }}>{consumersError}</p>
                    <button className="as-btn-ghost" onClick={() => refetch()} style={{ padding: '6px 14px' }}>Retry</button>
                  </div>
                ) : recentConsumers.length === 0 ? (
                  <div className="prd-state" style={{ padding: '24px 0' }}>
                    <div className="prd-state-icon"><UsersIcon /></div>
                    <p style={{ fontSize: 13, color: 'var(--as-ink-2)' }}>No contacts yet. Upload a CSV to get started.</p>
                  </div>
                ) : (
                  recentConsumers.map((consumer: Consumer) => (
                    <div key={consumer.id} className="cust-consumer-row">
                      <div className="cust-avatar">
                        {consumer.first_name?.charAt(0) ?? '?'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="cust-consumer-name">
                          {consumer.first_name} {consumer.last_name}
                        </div>
                        <div className="cust-consumer-email">{consumer.email}</div>
                        <TraitTags traits={consumer.traits} />
                      </div>
                      <div className="cust-consumer-meta">
                        <span className="cust-consumer-date">{formatRelativeDate(consumer.created_at)}</span>
                        <span className="cust-tag-active">Active</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Persona detail modal */}
      {selectedPersonaDetail && (() => {
        const { persona, colorIdx } = selectedPersonaDetail;
        const color = getStroke(colorIdx);
        const count = personaStats[persona.id]?.primary ?? 0;
        const pct = consumers.length > 0 ? Math.round((count / consumers.length) * 100) : 0;
        return (
          <div className="as-modal-overlay" onClick={() => setSelectedPersonaDetail(null)}>
            <div className="as-modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>

              <div className="cust-modal-persona-head">
                <div className="cust-modal-persona-avatar" style={{ color, borderColor: color + '40' }}>
                  {persona.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 2 }}>
                    <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--as-ink)' }}>{persona.name}</span>
                    <span style={{ fontSize: 12, fontFamily: "'Geist Mono', monospace", color }}>{pct}%</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--as-ink-3)' }}>{count.toLocaleString()} contacts</div>
                </div>
                <button className="as-modal-close" onClick={() => setSelectedPersonaDetail(null)}>
                  <XIcon />
                </button>
              </div>

              <div className="as-modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                {persona.description && (
                  <p style={{ fontSize: 13, color: 'var(--as-ink-2)', lineHeight: 1.6 }}>{persona.description}</p>
                )}

                {persona.key_motivators.length > 0 && (
                  <div className="cust-modal-section">
                    <div className="cust-modal-section-label">Key Motivators</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {persona.key_motivators.map((m) => (
                        <span key={m} className="cust-modal-tag" style={{ border: `1px solid ${color}40`, color, background: color + '0d' }}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {persona.pain_points.length > 0 && (
                  <div className="cust-modal-section">
                    <div className="cust-modal-section-label">Pain Points</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {persona.pain_points.map((p) => (
                        <span key={p} className="cust-modal-tag" style={{ border: '1px solid var(--as-rule-strong)', color: 'var(--as-ink-2)' }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {persona.ad_tone_preferences && persona.ad_tone_preferences.length > 0 && (
                  <div className="cust-modal-section">
                    <div className="cust-modal-section-label">Ad Tone Preferences</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {persona.ad_tone_preferences.map((tone) => (
                        <span key={tone} className="cust-modal-tag" style={{ border: `1px solid ${color}40`, color, background: color + '0d' }}>
                          {tone}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="as-modal-foot">
                <span style={{ fontSize: 11, color: 'var(--as-ink-3)' }}>
                  {count.toLocaleString()} contacts in this segment
                </span>
                <button className="as-btn-solid" style={{ padding: '8px 16px', fontSize: 12 }}>
                  Generate Ads for {persona.name}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </AppShell>
  );
}
