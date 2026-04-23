import { GoogleOAuthProvider } from '@react-oauth/google';
import { HashRouter, Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GOOGLE_CLIENT_ID } from './api/config';
import { LandingPage } from './pages/LandingPage';
import { SimpleLanding } from './pages/SimpleLanding';
import { SignUpPage } from './pages/SignUpPage';
import { SignInPage } from './pages/SignInPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
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
import { UserProvider, useUser } from './contexts/UserContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { ThemeProvider } from './contexts/ThemeContext';

const queryClient = new QueryClient();

function AuthenticatedAppProviders() {
  return (
    <UserProvider>
      <CompanyProvider>
        <SidebarProvider>
          <Outlet />
        </SidebarProvider>
      </CompanyProvider>
    </UserProvider>
  );
}

function ProtectedLayout() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading your workspace...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}

function DataPagesLayout() {
  return (
    <Outlet />
  );
}

export function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <HashRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<SimpleLanding />} />
            <Route path="/old-landing" element={<LandingPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/team" element={<TeamPage />} />

            <Route element={<AuthenticatedAppProviders />}>
              <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/campaign/:id" element={<CampaignDetailPage />} />
                <Route path="/generate" element={<GenerateAdsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/workspace" element={<DashboardPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route element={<DataPagesLayout />}>
                  <Route path="/customer-data" element={<CustomerDataPage />} />
                  <Route path="/all-consumers" element={<AllConsumersPage />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </HashRouter>
      </ThemeProvider>
    </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}
