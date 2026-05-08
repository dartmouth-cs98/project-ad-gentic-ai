import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
    UsersIcon,
    SearchIcon,
    FilterIcon,
    DownloadIcon,
    Loader2Icon,
    MailIcon,
    PhoneIcon,
    UserIcon,
    CalendarIcon,
    TagIcon,
    XIcon,
} from 'lucide-react';
import { useAssignPersonas, useConsumers } from '../hooks/useConsumers';
import { usePersonas } from '../hooks/usePersonas';
import type { Consumer } from '../types';

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
        processed: number;
        failed: number;
        skipped: number;
        low_confidence: number;
        errors: string[];
    } | null>(null);
    const [assignError, setAssignError] = useState<string | null>(null);
    const [selectedConsumer, setSelectedConsumer] = useState<Consumer | null>(null);

    // Close dropdown on outside click
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
        // Persona filter
        if (filterPersonaId) {
            const matchesPrimary = consumer.primary_persona?.id === filterPersonaId;
            const matchesSecondary = consumer.secondary_persona?.id === filterPersonaId;
            if (!matchesPrimary && !matchesSecondary) return false;
        }

        // Search filter
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        const basicMatch =
            (consumer.email?.toLowerCase() || '').includes(query) ||
            (consumer.first_name?.toLowerCase() || '').includes(query) ||
            (consumer.last_name?.toLowerCase() || '').includes(query) ||
            (consumer.phone?.toLowerCase() || '').includes(query);

        if (basicMatch) return true;

        // Search traits keys and values
        if (consumer.traits) {
            return Object.entries(consumer.traits).some(([key, val]) => {
                const valStr = Array.isArray(val) ? val.join(', ') : String(val || '');
                return (
                    key.toLowerCase().includes(query) ||
                    valStr.toLowerCase().includes(query)
                );
            });
        }

        return false;
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatKey = (key: string) => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .trim()
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    const renderPersonas = (consumer: Consumer) => {
        const { primary_persona, secondary_persona } = consumer;

        if (!primary_persona && !secondary_persona) {
            return (
                <span className="text-muted-foreground italic text-xs">
                    No persona assigned
                </span>
            );
        }

        return (
            <div className="flex flex-col gap-1">
                {primary_persona && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-100">
                        <span className="truncate max-w-[140px]">{primary_persona.name}</span>
                    </span>
                )}
                {secondary_persona && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-background text-foreground border border-border">
                        <span className="truncate max-w-[140px]">
                            {secondary_persona.name}
                        </span>
                    </span>
                )}
            </div>
        );
    };

    const renderTraitsPreview = (traits: Record<string, unknown>) => {
        const keys = Object.keys(traits);
        const displayKeys = keys.slice(0, 2);
        const remainingCount = keys.length - displayKeys.length;

        return (
            <div>
                <div className="flex flex-wrap gap-1.5 items-center cursor-help">
                    {displayKeys.map((key) => (
                        <span
                            key={key}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-muted text-foreground border border-border"
                        >
                            <span className="font-semibold mr-1">{formatKey(key)}:</span>
                            <span className="truncate max-w-[80px]">
                                {Array.isArray(traits[key]) ? traits[key].join(', ') : String(traits[key])}
                            </span>
                        </span>
                    ))}
                    {remainingCount > 0 && (
                        <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                            +{remainingCount}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const renderTraits = (consumer: Consumer) => {
        const traits = consumer.traits;
        if (!traits || Object.keys(traits).length === 0) {
            return <span className="text-muted-foreground italic text-xs">No traits defined</span>;
        }
        return renderTraitsPreview(traits);
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">All Consumers</h1>
                            <p className="text-muted-foreground">
                                {filteredConsumers.length} of {consumers.length} consumers
                                {consumers.length === 0 && (
                                    <span className="block text-xs text-muted-foreground mt-1">
                                        Upload your customer CSV to populate consumer cards and power persona-based charts.
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="secondary" leftIcon={<DownloadIcon className="w-4 h-4" />}>
                                Export
                            </Button>
                            <Button
                                onClick={() => {
                                    setAssignError(null);
                                    setAssignSummary(null);
                                    assignPersonas.mutate(undefined, {
                                        onSuccess: (summary) => {
                                            setAssignSummary(summary);
                                        },
                                        onError: (err) => {
                                            setAssignError(err.message);
                                        },
                                    });
                                }}
                                disabled={assignPersonas.isPending}
                            >
                                {assignPersonas.isPending ? 'Assigning personas…' : 'Assign personas'}
                            </Button>
                        </div>
                    </div>

                    {assignSummary && (
                        <Card variant="elevated" padding="sm" className="mb-4 border border-blue-100 bg-blue-50">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-blue-900">
                                        Personas assignment completed: processed {assignSummary.processed}, skipped {assignSummary.skipped}, failed {assignSummary.failed}, low confidence {assignSummary.low_confidence}.
                                    </p>
                                    {assignSummary.errors.length > 0 && (
                                        <ul className="mt-1 text-xs text-blue-900 list-disc list-inside space-y-0.5">
                                            {assignSummary.errors.map((msg, idx) => (
                                                <li key={idx}>{msg}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAssignSummary(null)}
                                    className="text-blue-500 hover:text-blue-700 text-xs font-semibold"
                                >
                                    ×
                                </button>
                            </div>
                        </Card>
                    )}

                    {assignError && (
                        <Card variant="elevated" padding="sm" className="mb-4 border border-red-100 bg-red-50">
                            <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-medium text-red-900">
                                    Failed to assign personas: {assignError}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setAssignError(null)}
                                    className="text-red-500 hover:text-red-700 text-xs font-semibold"
                                >
                                    ×
                                </button>
                            </div>
                        </Card>
                    )}

                    {/* Search and Filters */}
                    <Card variant="elevated" padding="md" className="mb-6">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Filter button + dropdown */}
                            <div className="relative" ref={filterRef}>
                                <button
                                    onClick={() => setShowFilterDropdown((v) => !v)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                        filterPersonaId
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-border bg-card text-foreground hover:border-foreground/30'
                                    }`}
                                >
                                    <FilterIcon className="w-4 h-4" />
                                    Filters
                                    {filterPersonaId && (
                                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    )}
                                </button>

                                {showFilterDropdown && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border border-border shadow-lg z-20 py-2">
                                        <p className="px-3 pb-1.5 pt-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                            Filter by Persona
                                        </p>
                                        <button
                                            onClick={() => { setFilterPersonaId(null); setShowFilterDropdown(false); }}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                                                filterPersonaId === null
                                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                                    : 'text-foreground hover:bg-background'
                                            }`}
                                        >
                                            All consumers
                                            {filterPersonaId === null && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                        </button>
                                        {personas.length === 0 ? (
                                            <p className="px-3 py-2 text-xs text-muted-foreground italic">No personas available</p>
                                        ) : (
                                            <div className="max-h-64 overflow-y-auto">
                                                {personas.map((persona) => (
                                                    <button
                                                        key={persona.id}
                                                        onClick={() => { setFilterPersonaId(persona.id); setShowFilterDropdown(false); }}
                                                        className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                                                            filterPersonaId === persona.id
                                                                ? 'bg-blue-50 text-blue-700 font-medium'
                                                                : 'text-foreground hover:bg-background'
                                                        }`}
                                                    >
                                                        {persona.name}
                                                        {filterPersonaId === persona.id && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {filterPersonaId && (
                                            <>
                                                <div className="border-t border-border my-1" />
                                                <button
                                                    onClick={() => { setFilterPersonaId(null); setShowFilterDropdown(false); }}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                                                >
                                                    <XIcon className="w-3.5 h-3.5" />
                                                    Clear filter
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <Loader2Icon className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <Card variant="elevated" padding="lg">
                            <div className="text-center py-8">
                                <p className="text-red-600 font-medium">{error}</p>
                                <Button onClick={() => refetch()} className="mt-4">
                                    Retry
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Consumers Table */}
                    {!loading && !error && (
                        <Card variant="elevated" padding="none">
                            <div className="overflow-x-auto overflow-y-visible">
                                <table className="w-full">
                                    <thead className="bg-background border-b border-border">
                                        <tr>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Consumer
                                            </th>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Traits
                                            </th>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Personas
                                            </th>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Added
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-card divide-y divide-border">
                                        {filteredConsumers.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-12 text-center">
                                                    <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                                    <p className="text-muted-foreground font-medium">
                                                        {searchQuery ? 'No consumers found' : 'No consumers yet'}
                                                    </p>
                                                    <p className="text-muted-foreground text-sm mt-1">
                                                        {searchQuery
                                                            ? 'Try adjusting your search'
                                                            : 'Upload a CSV to get started'}
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredConsumers.map((consumer) => (
                                                <tr
                                                    key={consumer.id}
                                                    className="hover:bg-background transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <UserIcon className="w-5 h-5 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-foreground">
                                                                    {consumer.first_name} {consumer.last_name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">ID: {consumer.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <MailIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                                                {consumer.email}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <PhoneIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                                                {consumer.phone}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-2">
                                                            {renderTraits(consumer)}
                                                            <button
                                                                onClick={() => setSelectedConsumer(consumer)}
                                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                                            >
                                                                View details
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {renderPersonas(consumer)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                                                            {formatDate(consumer.created_at)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
            </div>

            {selectedConsumer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
                        onClick={() => setSelectedConsumer(null)}
                    />
                    <div className="relative w-full max-w-2xl bg-card border border-border rounded-xl max-h-[85vh] overflow-y-auto shadow-lg">
                        <div className="px-5 py-4 border-b border-border">
                            <div className="flex items-start justify-between pr-8">
                                <div>
                                    <h2 className="text-base font-semibold text-foreground">
                                        {selectedConsumer.first_name} {selectedConsumer.last_name}
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Consumer ID: {selectedConsumer.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedConsumer(null)}
                                className="absolute top-3.5 right-3.5 p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
                                aria-label="Close details"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-2.5">
                                <div className="rounded-lg border border-border p-2.5">
                                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                                    <p className="text-sm font-medium">{selectedConsumer.email || '—'}</p>
                                </div>
                                <div className="rounded-lg border border-border p-2.5">
                                    <p className="text-xs text-muted-foreground mb-1">Phone</p>
                                    <p className="text-sm font-medium">{selectedConsumer.phone || '—'}</p>
                                </div>
                                <div className="rounded-lg border border-border p-2.5 col-span-2">
                                    <p className="text-xs text-muted-foreground mb-1">Added</p>
                                    <p className="text-sm font-medium">{formatDate(selectedConsumer.created_at)}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold mb-1.5">Personas</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedConsumer.primary_persona && (
                                        <span className="px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-100">
                                            Primary: {selectedConsumer.primary_persona.name}
                                        </span>
                                    )}
                                    {selectedConsumer.secondary_persona && (
                                        <span className="px-2 py-0.5 rounded text-xs bg-muted text-foreground border border-border">
                                            Secondary: {selectedConsumer.secondary_persona.name}
                                        </span>
                                    )}
                                    {!selectedConsumer.primary_persona && !selectedConsumer.secondary_persona && (
                                        <span className="text-sm text-muted-foreground">No personas assigned</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                                    <TagIcon className="w-4 h-4 text-blue-500" />
                                    All Traits
                                </h3>
                                {selectedConsumer.traits && Object.keys(selectedConsumer.traits).length > 0 ? (
                                    <div className="rounded-lg border border-border divide-y divide-border">
                                        {Object.entries(selectedConsumer.traits).map(([key, val]) => (
                                            <div key={key} className="px-3 py-2">
                                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                                                    {formatKey(key)}
                                                </p>
                                                <p className="text-sm text-foreground">
                                                    {Array.isArray(val) ? val.join(', ') : String(val)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No traits defined</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
