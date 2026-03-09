import { useState } from 'react';
import {
  MinusIcon,
  PlusIcon,
  GlobeIcon,
  ChevronDownIcon,
} from 'lucide-react';
import type { FilterState, FilterAction } from '../../hooks/useFilterState';
import type { PersonalizationRange, Tone, BudgetTier, CtaStyle, AdFormatOption, ColorMode } from '../../hooks/useFilterState';
import { platformOptions, languageOptions } from './mockData';

interface FilterControlsProps {
  filterState: FilterState;
  filterDispatch: React.Dispatch<FilterAction>;
  compact: boolean;
}

export function FilterControls({ filterState, filterDispatch, compact }: FilterControlsProps) {
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const labelClass = 'block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5';
  const sectionGap = compact ? 'gap-x-5 gap-y-2' : 'gap-x-6 gap-y-4';

  return (
    <>
      <div className={`flex flex-wrap items-end ${sectionGap}`}>
        {/* Range */}
        <div className="flex-shrink-0">
          <label className={labelClass}>Range</label>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {(['individual', 'group', 'broad'] as PersonalizationRange[]).map((r) => (
              <button
                key={r}
                onClick={() => filterDispatch({ type: 'SET_RANGE', payload: r })}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                  filterState.personalizationRange === r
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200 flex-shrink-0 self-end" />

        {/* Per Group */}
        <div className="flex-shrink-0">
          <label className={labelClass}>Per Group</label>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => filterDispatch({ type: 'SET_VARIANTS_PER_GROUP', payload: Math.max(2, filterState.variantsPerGroup - 1) })}
              className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <MinusIcon className="w-3 h-3" />
            </button>
            <span className="w-6 text-center text-sm font-bold text-slate-900">
              {filterState.variantsPerGroup}
            </span>
            <button
              onClick={() => filterDispatch({ type: 'SET_VARIANTS_PER_GROUP', payload: Math.min(10, filterState.variantsPerGroup + 1) })}
              className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <PlusIcon className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200 flex-shrink-0 self-end" />

        {/* Format */}
        <div className="flex-shrink-0">
          <label className={labelClass}>Format</label>
          <div className="flex gap-1.5">
            {(['images', 'videos'] as AdFormatOption[]).map((f) => (
              <button
                key={f}
                onClick={() => filterDispatch({ type: 'TOGGLE_FORMAT', payload: f })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border ${
                  filterState.adFormats.has(f)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200 flex-shrink-0 self-end" />

        {/* Colors */}
        <div className="flex-shrink-0">
          <label className={labelClass}>Colors</label>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => filterDispatch({ type: 'SET_COLOR_MODE', payload: 'brand' as ColorMode })}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                filterState.colorMode === 'brand'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              Brand
            </button>
            <button
              onClick={() => filterDispatch({ type: 'SET_COLOR_MODE', payload: 'custom' as ColorMode })}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border flex items-center gap-1.5 ${
                filterState.colorMode === 'custom'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              Custom
              {filterState.colorMode === 'custom' && (
                <input
                  type="color"
                  value={filterState.customColor}
                  onChange={(e) => filterDispatch({ type: 'SET_CUSTOM_COLOR', payload: e.target.value })}
                  className="w-4 h-4 rounded border-0 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </button>
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200 flex-shrink-0 self-end" />

        {/* Tone */}
        <div className="flex-shrink-0">
          <label className={labelClass}>Tone</label>
          <div className="flex gap-1">
            {(['formal', 'playful', 'bold', 'minimal'] as Tone[]).map((t) => (
              <button
                key={t}
                onClick={() => filterDispatch({ type: 'SET_TONE', payload: t })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filterState.tone === t
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200 flex-shrink-0 self-end" />

        {/* Budget */}
        <div className="flex-shrink-0">
          <label className={labelClass}>Budget</label>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {(['low', 'mid', 'premium'] as BudgetTier[]).map((b) => (
              <button
                key={b}
                onClick={() => filterDispatch({ type: 'SET_BUDGET', payload: b })}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                  filterState.budgetTier === b
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200 flex-shrink-0 self-end" />

        {/* CTA */}
        <div className="flex-shrink-0">
          <label className={labelClass}>CTA</label>
          <div className="flex gap-1">
            {([
              { value: 'soft' as CtaStyle, label: 'Soft' },
              { value: 'direct' as CtaStyle, label: 'Direct' },
              { value: 'urgency' as CtaStyle, label: 'Urgency' },
            ]).map((c) => (
              <button
                key={c.value}
                onClick={() => filterDispatch({ type: 'SET_CTA', payload: c.value })}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterState.ctaStyle === c.value
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-8 bg-slate-200 flex-shrink-0 self-end" />

        {/* Language */}
        <div className="relative flex-shrink-0" data-language-dropdown>
          <label className={labelClass}>Language</label>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowLanguageDropdown(!showLanguageDropdown);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:border-slate-300 transition-colors"
          >
            <GlobeIcon className="w-3 h-3 text-slate-400" />
            {filterState.language}
            <ChevronDownIcon className="w-3 h-3 text-slate-400" />
          </button>
          {showLanguageDropdown && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-xl z-40 py-1 overflow-hidden">
              {languageOptions.map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    filterDispatch({ type: 'SET_LANGUAGE', payload: l });
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors ${
                    filterState.language === l
                      ? 'text-blue-700 font-semibold bg-blue-50'
                      : 'text-slate-700'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Platforms row */}
      <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-100">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mr-1 flex-shrink-0">
          Platforms
        </span>
        {platformOptions.map((p) => (
          <button
            key={p}
            onClick={() => filterDispatch({ type: 'TOGGLE_PLATFORM', payload: p })}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
              filterState.selectedPlatforms.has(p)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </>
  );
}
