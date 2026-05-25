// LandingFooter — brand column + 3 link columns + legal rule
const COLS = [
  {
    heading: 'Product',
    links: ['Generate', 'Score', 'Launch', 'Measure', 'Personas'],
  },
  {
    heading: 'Company',
    links: ['Approach', 'Team', 'Writing', 'Careers', 'Contact'],
  },
  {
    heading: 'Resources',
    links: ['Changelog', 'Status', 'Docs', 'Security', 'Privacy'],
  },
];

export function LandingFooter() {
  return (
    <footer className="lp-site-footer">
      <div className="lp-container lp-footer-grid">
        {/* Brand column */}
        <div>
          <a href="#top" className="lp-brand" aria-label="Adgentic home">
            <span className="lp-brand-mark" aria-hidden="true" />
            <span className="lp-brand-word lp-mono">ADGENTIC</span>
          </a>
          <p className="lp-footer-tag">
            AI-powered ad generation for teams that ship.
            <br />Brief to live campaign in minutes.
          </p>
          <div className="lp-mono lp-small lp-muted" style={{ marginTop: 8 }}>
            N 40°45′ W 73°59′
          </div>
        </div>

        {/* Link columns */}
        {COLS.map((col) => (
          <div className="lp-footer-col" key={col.heading}>
            <div className="lp-footer-col-h lp-mono lp-muted">
              {col.heading.toUpperCase()}
            </div>
            <ul>
              {col.links.map((label) => (
                <li key={label}>
                  <a href="#">{label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Legal rule */}
      <div className="lp-container lp-footer-rule">
        <div className="lp-mono lp-small lp-muted">
          © 2026 ADGENTIC · ALL RIGHTS RESERVED
        </div>
        <div className="lp-mono lp-small lp-muted">v 1.4.2 · BUILD 0a3f</div>
      </div>
    </footer>
  );
}
