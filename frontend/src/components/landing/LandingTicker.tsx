// LandingTicker — CSS marquee of product metrics, no JS animation state
const ITEMS: [string, string][] = [
  ['6',       'VARIANTS PER BRIEF'],
  ['< 15s',   'TIME TO FIRST VARIANT'],
  ['5+',      'AD PLATFORMS'],
  ['3.2×',    'AVERAGE ROAS LIFT'],
  ['AI',      'PERSONA SCORING'],
  ['0 ETL',   'NO DATA PIPELINE NEEDED'],
  ['+312%',   'CTR IMPROVEMENT'],
  ['1 tab',   'BRIEF TO LIVE CAMPAIGN'],
];

// Duplicate for seamless looping: CSS animation moves -50% on the doubled track
const ROW = [...ITEMS, ...ITEMS];

export function LandingTicker() {
  return (
    <section className="lp-ticker-section" id="metrics">
      <div className="lp-ticker-head lp-container">
        <span className="lp-eyebrow lp-mono" style={{ margin: 0 }}>— 04 · BY THE NUMBERS</span>
        <span className="lp-mono lp-small lp-muted">
          WHAT ADGENTIC DELIVERS
        </span>
      </div>

      <div className="lp-ticker">
        <div className="lp-ticker-track">
          {ROW.map(([val, label], i) => (
            <div className="lp-ticker-item" key={i}>
              <span className="lp-ticker-val">{val}</span>
              <span className="lp-ticker-label lp-mono">{label}</span>
              <span className="lp-ticker-sep">/</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
