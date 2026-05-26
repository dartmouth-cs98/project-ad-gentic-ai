import '../landing.css';
import { LandingHeader } from '../components/landing/LandingHeader';
import { LandingHero } from '../components/landing/LandingHero';
import { LandingApproach } from '../components/landing/LandingApproach';
import { LandingWork } from '../components/landing/LandingWork';
import { LandingTicker } from '../components/landing/LandingTicker';
import { LandingCta } from '../components/landing/LandingCta';
import { LandingFooter } from '../components/landing/LandingFooter';

export function LandingPage() {
  return (
    <div className="landing-page">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingApproach />
        <LandingWork />
        <LandingTicker />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
