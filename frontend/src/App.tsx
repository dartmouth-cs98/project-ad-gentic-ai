import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LandingPage } from './pages/LandingPage';
import { SignUpPage } from './pages/SignUpPage';
import { SignInPage } from './pages/SignInPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { GenerateAdsPage } from './pages/GenerateAdsPage';
import { ProfilePage } from './pages/ProfilePage';
import { FeaturesPage } from './pages/FeaturesPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PricingPage } from './pages/PricingPage';
import { TeamPage } from './pages/TeamPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CustomerDataPage } from './pages/CustomerDataPage';
import { AllConsumersPage } from './pages/AllConsumersPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProductsPage } from './pages/ProductsPage';
import { UserProvider } from './contexts/UserContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { ConsumerProvider } from './contexts/ConsumerContext';
import { PersonasProvider } from './contexts/PersonasContext';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <CompanyProvider>
          <ConsumerProvider>
            <PersonasProvider>
              <HashRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/sign-up" element={<SignUpPage />} />
                <Route path="/sign-in" element={<SignInPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/customer-data" element={<CustomerDataPage />} />
                <Route path="/campaign/:id" element={<CampaignDetailPage />} />
                <Route path="/generate" element={<GenerateAdsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/workspace" element={<DashboardPage />} />

                {/* New Pages */}
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/all-consumers" element={<AllConsumersPage />} />
              </Routes>
              </HashRouter>
            </PersonasProvider>
          </ConsumerProvider>
        </CompanyProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}
