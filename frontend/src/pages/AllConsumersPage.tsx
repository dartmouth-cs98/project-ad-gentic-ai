import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
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
} from 'lucide-react';
import { useConsumerContext } from '../contexts/ConsumerContext';

export function AllConsumersPage() {
    const { consumers, loading, error, refetch } = useConsumerContext();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredConsumers = consumers.filter((consumer) => {
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

    const renderTraits = (consumer: any) => {
        const traits = consumer.traits;
        if (!traits || Object.keys(traits).length === 0) {
            return <span className="text-slate-400 italic text-xs">No traits defined</span>;
        }

        const keys = Object.keys(traits);
        const displayKeys = keys.slice(0, 2);
        const remainingCount = keys.length - displayKeys.length;

        return (
            <div className="relative group/traits">
                <div className="flex flex-wrap gap-1.5 items-center cursor-help">
                    {displayKeys.map((key) => (
                        <span
                            key={key}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200"
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

                {/* Hover Popover */}
                <div className="absolute bottom-full left-0 mb-2 w-64 p-4 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 opacity-0 invisible group-hover/traits:opacity-100 group-hover/traits:visible transition-all duration-200 pointer-events-none">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                        <TagIcon className="w-4 h-4 text-blue-500" />
                        <h4 className="text-sm font-bold text-slate-800">All Traits</h4>
                    </div>
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2">
                        {Object.entries(traits).map(([key, val]) => (
                            <div key={key} className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{formatKey(key)}</span>
                                <span className="text-xs text-slate-700 font-medium">
                                    {Array.isArray(val) ? (
                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                            {val.map((v, i) => (
                                                <span key={i} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{v}</span>
                                            ))}
                                        </div>
                                    ) : String(val)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="absolute -bottom-1.5 left-6 w-3 h-3 bg-white border-r border-b border-slate-200 rotate-45" />
                </div>
            </div>
        );
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />

            <main className="ml-64 flex-1 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">All Consumers</h1>
                            <p className="text-slate-500">
                                {filteredConsumers.length} of {consumers.length} consumers
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="secondary" leftIcon={<DownloadIcon className="w-4 h-4" />}>
                                Export
                            </Button>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <Card variant="elevated" padding="md" className="mb-6">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, email, or phone..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <Button variant="secondary" leftIcon={<FilterIcon className="w-4 h-4" />}>
                                Filters
                            </Button>
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
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Consumer
                                            </th>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Traits
                                            </th>
                                            <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Added
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {filteredConsumers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center">
                                                    <UsersIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                                    <p className="text-slate-500 font-medium">
                                                        {searchQuery ? 'No consumers found' : 'No consumers yet'}
                                                    </p>
                                                    <p className="text-slate-400 text-sm mt-1">
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
                                                    className="hover:bg-slate-50 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <UserIcon className="w-5 h-5 text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-slate-900">
                                                                    {consumer.first_name} {consumer.last_name}
                                                                </p>
                                                                <p className="text-xs text-slate-500">ID: {consumer.id}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                                <MailIcon className="w-3.5 h-3.5 text-slate-400" />
                                                                {consumer.email}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                                <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                                                                {consumer.phone}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {renderTraits(consumer)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
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
            </main>
        </div>
    );
}
