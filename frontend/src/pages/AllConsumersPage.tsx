// AllConsumersPage — Swiss/Linear editorial theme
import { useState, useRef, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { useAssignPersonas, useConsumers } from '../hooks/useConsumers';
import { usePersonas } from '../hooks/usePersonas';
import type { Consumer } from '../types';


function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatKey(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()
    .split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}


function SearchIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width={12} height={12}>
      <circle cx="5.5" cy="5.5" r="4" />
      <path d="M9 9l3.5 3.5" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={12} height={12}>
      <path d="M1 3h12M3 7h8M5 11h4" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width={10} height={10}>
      <path d="M2 2l8 8M10 2L2 10" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width={12} height={12}>
      <path d="M7 2v8M4 7l3 3 3-3" />
      <path d="M2 12h10" />
    </svg>
  );
}

function UsersEmptyIcon() {
  return (
    <svg viewBox="0 0 34 34" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" width={34} height={34}>
      <circle cx="13" cy="11" r="5" />
      <path d="M4 28c0-5 4-9 9-9s9 4 9 9" />
      <circle cx="24" cy="11" r="3.5" />
      <path d="M24 19c4 0 6 2.5 6 6" />
    </svg>
  );
}


function TraitTagsPreview({ traits }: { traits: Record<string, unknown> }) {
  const keys = Object.keys(traits);
  const shown = keys.slice(0, 2);
  const rest = keys.length - shown.length;
  return (
    <div>
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

function PersonaCell({ consumer }: { consumer: Consumer }) {
  const { primary_persona, secondary_persona } = consumer;
  if (!primary_persona && !secondary_persona) {
    return <span className="cust-none">—</span>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {primary_persona && (
        <span className="cust-persona-primary">{primary_persona.name}</span>
      )}
      {secondary_persona && (
        <span className="cust-persona-secondary">{secondary_persona.name}</span>
      )}
    </div>
  );
}


export function AllConsumersPage() {
  const { data: consumers = [], isLoading: loading, error: consumersError, refetch } = useConsumers(0, 1000, true);
  const { data: personas = [] } = usePersonas(true);
  const assignPersonas = useAssignPersonas();
  const error = consumersError ? (consumersError as Error).message : null;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPersonaId, setFilterPersonaId] = useState<string | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [assignSummary, setAssignSummary] = useState<{
    processed: number; failed: number; skipped: number; low_confidence: number; errors: string[];
  } | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [selectedConsumer, setSelectedConsumer] = useState<Consumer | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredConsumers = consumers.filter((consumer) => {
    if (filterPersonaId) {
      const matchesPrimary = consumer.primary_persona?.id === filterPersonaId;
      const matchesSecondary = consumer.secondary_persona?.id === filterPersonaId;
      if (!matchesPrimary && !matchesSecondary) return false;
    }
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const basicMatch =
      (consumer.email?.toLowerCase() || '').includes(query) ||
      (consumer.first_name?.toLowerCase() || '').includes(query) ||
      (consumer.last_name?.toLowerCase() || '').includes(query) ||
      (consumer.phone?.toLowerCase() || '').includes(query);
    if (basicMatch) return true;
    if (consumer.traits) {
      return Object.entries(consumer.traits).some(([key, val]) => {
        const valStr = Array.isArray(val) ? val.join(', ') : String(val || '');
        return key.toLowerCase().includes(query) || valStr.toLowerCase().includes(query);
      });
    }
    return false;
  });

  return (
    <AppShell>
      <div className="as-main">
        <div className="as-canvas">

          {/* Header */}
          <div className="as-page-head">
            <div>
              <span className="as-eyebrow">— CUSTOMER DATA</span>
              <h1>
                All Consumers
                <span className="muted"> · {filteredConsumers.length}{consumers.length !== filteredConsumers.length && `/${consumers.length}`}</span>
              </h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                className="as-btn-ghost"
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px' }}
              >
                <DownloadIcon /> Export
              </button>
              <button
                className="as-btn-solid"
                onClick={() => {
                  setAssignError(null);
                  setAssignSummary(null);
                  assignPersonas.mutate(undefined, {
                    onSuccess: (summary) => setAssignSummary(summary),
                    onError: (err) => setAssignError(err.message),
                  });
                }}
                disabled={assignPersonas.isPending}
                style={{ padding: '9px 18px' }}
              >
                {assignPersonas.isPending ? 'Assigning…' : 'Assign Personas'}
              </button>
            </div>
          </div>

          {/* Assign result banners */}
          {assignSummary && (
            <div className="cust-assign-bar cust-assign-ok">
              <span>
                Personas assigned — processed {assignSummary.processed}, skipped {assignSummary.skipped}, failed {assignSummary.failed}, low confidence {assignSummary.low_confidence}
                {assignSummary.errors.length > 0 && `: ${assignSummary.errors.join(', ')}`}
              </span>
              <button onClick={() => setAssignSummary(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
                <XIcon />
              </button>
            </div>
          )}
          {assignError && (
            <div className="cust-assign-bar cust-assign-err">
              <span>Failed to assign personas: {assignError}</span>
              <button onClick={() => setAssignError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}>
                <XIcon />
              </button>
            </div>
          )}

          {/* Toolbar: search + persona filter */}
          <div className="cust-toolbar">
            <div className="cust-search-wrap">
              <SearchIcon />
              <input
                className="cust-search"
                type="text"
                placeholder="Search by name, email, phone…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ position: 'relative' }} ref={filterRef}>
              <button
                className={`cust-filter-btn${filterPersonaId ? ' active' : ''}`}
                onClick={() => setShowFilterDropdown((v) => !v)}
              >
                <FilterIcon /> Persona
                {filterPersonaId && <span className="cust-filter-dot" />}
              </button>

              {showFilterDropdown && (
                <div className="cust-dropdown">
                  <div className="cust-dropdown-label">Filter by Persona</div>
                  <button
                    className={`cust-dropdown-item${filterPersonaId === null ? ' on' : ''}`}
                    onClick={() => { setFilterPersonaId(null); setShowFilterDropdown(false); }}
                  >
                    All consumers
                    {filterPersonaId === null && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--as-accent)', display: 'inline-block' }} />}
                  </button>
                  {personas.length === 0 ? (
                    <div className="cust-dropdown-item" style={{ cursor: 'default', fontStyle: 'italic' }}>No personas</div>
                  ) : (
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {personas.map((persona) => (
                        <button
                          key={persona.id}
                          className={`cust-dropdown-item${filterPersonaId === persona.id ? ' on' : ''}`}
                          onClick={() => { setFilterPersonaId(persona.id); setShowFilterDropdown(false); }}
                        >
                          {persona.name}
                          {filterPersonaId === persona.id && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--as-accent)', display: 'inline-block' }} />}
                        </button>
                      ))}
                    </div>
                  )}
                  {filterPersonaId && (
                    <>
                      <div className="cust-dropdown-sep" />
                      <button
                        className="cust-dropdown-item"
                        style={{ color: 'var(--as-danger)' }}
                        onClick={() => { setFilterPersonaId(null); setShowFilterDropdown(false); }}
                      >
                        <XIcon /> Clear filter
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="prd-state">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width={20} height={20} style={{ animation: 'as-spin 0.8s linear infinite' }}>
                <circle cx="8" cy="8" r="6" strokeDasharray="18 8" />
              </svg>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="prd-state">
              <p style={{ fontSize: 13, color: 'var(--as-danger)', marginBottom: 12 }}>{error}</p>
              <button className="as-btn-ghost" onClick={() => refetch()} style={{ padding: '7px 16px' }}>Retry</button>
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <div className="cust-table-wrap">
              <table className="cust-table">
                <thead>
                  <tr>
                    <th>Consumer</th>
                    <th>Contact</th>
                    <th>Traits</th>
                    <th>Personas</th>
                    <th>Added</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConsumers.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="prd-state" style={{ padding: '48px 0' }}>
                          <div className="prd-state-icon"><UsersEmptyIcon /></div>
                          <h2>{searchQuery ? 'No consumers found' : 'No consumers yet'}</h2>
                          <p>{searchQuery ? 'Try adjusting your search or filter.' : 'Upload a CSV on the Customer Data page to get started.'}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredConsumers.map((consumer) => (
                      <tr key={consumer.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="cust-avatar">{consumer.first_name?.charAt(0) ?? '?'}</div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-ink)' }}>
                                {consumer.first_name} {consumer.last_name}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--as-ink-3)', fontFamily: "'Geist Mono', monospace" }}>
                                ID: {consumer.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 12, color: 'var(--as-ink-2)' }}>{consumer.email}</div>
                          {consumer.phone && (
                            <div style={{ fontSize: 12, color: 'var(--as-ink-3)', marginTop: 2 }}>{consumer.phone}</div>
                          )}
                        </td>
                        <td>
                          {consumer.traits && Object.keys(consumer.traits).length > 0 ? (
                            <>
                              <TraitTagsPreview traits={consumer.traits} />
                              <button
                                onClick={() => setSelectedConsumer(consumer)}
                                style={{ fontSize: 11, color: 'var(--as-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4, fontFamily: 'inherit', display: 'block' }}
                              >
                                View details
                              </button>
                            </>
                          ) : (
                            <span className="cust-none">—</span>
                          )}
                        </td>
                        <td><PersonaCell consumer={consumer} /></td>
                        <td>
                          <span style={{ fontSize: 12, color: 'var(--as-ink-3)', fontFamily: "'Geist Mono', monospace" }}>
                            {formatDate(consumer.created_at)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {/* Consumer detail modal */}
      {selectedConsumer && (
        <div className="as-modal-overlay" onClick={() => setSelectedConsumer(null)}>
          <div className="as-modal" onClick={(e) => e.stopPropagation()}>
            <div className="as-modal-head">
              <div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>
                  {selectedConsumer.first_name} {selectedConsumer.last_name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--as-ink-3)', fontFamily: "'Geist Mono', monospace", marginTop: 2 }}>
                  ID: {selectedConsumer.id}
                </div>
              </div>
              <button className="as-modal-close" onClick={() => setSelectedConsumer(null)}>
                <XIcon />
              </button>
            </div>

            <div className="as-modal-body">
              <div className="cust-detail-grid">
                <div className="cust-detail-cell">
                  <div className="cust-detail-cell-label">Email</div>
                  <div className="cust-detail-cell-val">{selectedConsumer.email || '—'}</div>
                </div>
                <div className="cust-detail-cell">
                  <div className="cust-detail-cell-label">Phone</div>
                  <div className="cust-detail-cell-val">{selectedConsumer.phone || '—'}</div>
                </div>
                <div className="cust-detail-cell full">
                  <div className="cust-detail-cell-label">Added</div>
                  <div className="cust-detail-cell-val">{formatDate(selectedConsumer.created_at)}</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div className="cust-modal-section-label" style={{ marginBottom: 8 }}>Personas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {selectedConsumer.primary_persona && (
                    <span className="cust-persona-primary">Primary: {selectedConsumer.primary_persona.name}</span>
                  )}
                  {selectedConsumer.secondary_persona && (
                    <span className="cust-persona-secondary">Secondary: {selectedConsumer.secondary_persona.name}</span>
                  )}
                  {!selectedConsumer.primary_persona && !selectedConsumer.secondary_persona && (
                    <span className="cust-none">No personas assigned</span>
                  )}
                </div>
              </div>

              <div>
                <div className="cust-modal-section-label" style={{ marginBottom: 8 }}>All Traits</div>
                {selectedConsumer.traits && Object.keys(selectedConsumer.traits).length > 0 ? (
                  <table className="cust-traits-table">
                    <tbody>
                      {Object.entries(selectedConsumer.traits).map(([key, val]) => (
                        <tr key={key}>
                          <td>{formatKey(key)}</td>
                          <td>{Array.isArray(val) ? val.join(', ') : String(val)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <span className="cust-none">No traits defined</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
