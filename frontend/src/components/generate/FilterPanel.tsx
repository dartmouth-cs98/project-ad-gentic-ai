// FilterPanel — right-side slide-in drawer using gen-filter-drawer CSS
import { FilterControls } from './FilterControls';
import { PreferencesSaveIndicator } from './PreferencesSaveIndicator';
import type { FilterState, FilterAction } from '../../hooks/useFilterState';
import { countActiveFilters } from '../../hooks/useFilterState';
import type { PreferencesSaveStatus } from '../../hooks/usePersistedCampaignPreferences';
import type { Phase } from './types';

interface FilterPanelProps {
  filterState: FilterState;
  filterDispatch: React.Dispatch<FilterAction>;
  isOpen: boolean;
  onClose: () => void;
  phase: Phase;
  onEditClick: () => void;
  preferencesSaveStatus?: PreferencesSaveStatus;
}

function XIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" width={14} height={14}>
      <path d="M2 2l10 10M12 2L2 12" />
    </svg>
  );
}

export function FilterPanel({
  filterState,
  filterDispatch,
  isOpen,
  onClose,
  phase: _phase,
  onEditClick: _onEditClick,
  preferencesSaveStatus: _preferencesSaveStatus = 'idle',
}: FilterPanelProps) {
  const activeCount = countActiveFilters(filterState);

  return (
    <>
      {/* Dimming overlay */}
      <div
        className={`gen-drawer-overlay${isOpen ? ' in' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in drawer */}
      <div
        className={`gen-filter-drawer${isOpen ? ' in' : ''}`}
        role="dialog"
        aria-label="Generation preferences"
        aria-modal="true"
      >
        <div className="gen-drawer-head">
          <div>
            <div className="gen-drawer-eyebrow">
              PREFERENCES{activeCount > 0 ? ` · ${activeCount} ACTIVE` : ''}
            </div>
            <div className="gen-drawer-title">Generation Settings</div>
          </div>
          <button
            className="as-icon-btn"
            onClick={onClose}
            aria-label="Close preferences"
            style={{ width: 32, height: 32 }}
          >
            <XIcon />
          </button>
        </div>

        <div className="gen-drawer-body">
          <FilterControls
            filterState={filterState}
            filterDispatch={filterDispatch}
            compact={false}
          />
        </div>

        <div className="gen-drawer-foot">
          <button
            className="gen-reset-btn"
            onClick={() => filterDispatch({ type: 'RESET' })}
          >
            Reset all
          </button>
          <button className="as-btn-solid" onClick={onClose}>
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
