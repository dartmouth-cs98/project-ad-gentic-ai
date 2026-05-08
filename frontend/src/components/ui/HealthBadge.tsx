import { useEffect, useState } from 'react';
import { fetchHealth } from '../../api/health';

const POLL_INTERVAL = 30_000; // 30 seconds

export function HealthBadge({ collapsed }: { collapsed?: boolean }) {
    const [healthy, setHealthy] = useState<boolean | null>(null);

    useEffect(() => {
        let mounted = true;

        async function check() {
            const data = await fetchHealth();
            if (mounted) setHealthy(data?.status === 'healthy');
        }

        check();
        const id = setInterval(check, POLL_INTERVAL);
        return () => {
            mounted = false;
            clearInterval(id);
        };
    }, []);

    const isOnline = healthy === true;
    const label = healthy === null ? 'Checking…' : isOnline ? 'API Connected' : 'API Offline';
    const dotColor = healthy === null
        ? 'bg-yellow-400'
        : isOnline
            ? 'bg-emerald-400'
            : 'bg-red-400';

    return (
        <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${collapsed ? 'justify-center' : ''}`}
            title={label}
        >
            <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                {isOnline && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor}`} />
            </span>
            {!collapsed && (
                <span className={`text-xs font-medium ${isOnline ? 'text-emerald-400' : healthy === null ? 'text-yellow-400' : 'text-red-400'}`}>
                    {label}
                </span>
            )}
        </div>
    );
}
