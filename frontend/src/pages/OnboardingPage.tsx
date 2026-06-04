import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  UploadIcon,
  Loader2Icon,
  SparklesIcon,
} from 'lucide-react';
import { saveOnboarding } from '../api/auth';
import '../landing.css';

const STEP_LABELS = ['Company', 'Product', 'Goals', 'Strategy'];

const industries = [
  { value: 'saas', label: 'SaaS / Software' },
  { value: 'ecommerce', label: 'E-commerce / Retail' },
  { value: 'finance', label: 'Finance / Fintech' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'agency', label: 'Marketing Agency' },
  { value: 'other', label: 'Other' },
];

const companySizes = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '500+', label: '500+ employees' },
];

const goals = [
  { value: 'awareness', label: 'Brand Awareness' },
  { value: 'leads', label: 'Lead Generation' },
  { value: 'sales', label: 'Direct Sales' },
  { value: 'engagement', label: 'Engagement & Community' },
  { value: 'other', label: 'Other' },
];

const platforms = [
  { id: 'meta', label: 'Meta (Facebook/Instagram)' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'twitter', label: 'Twitter/X' },
  { id: 'google', label: 'Google Ads' },
];

const regions = [
  { id: 'na', label: 'North America' },
  { id: 'eu', label: 'Europe' },
  { id: 'apac', label: 'Asia Pacific' },
  { id: 'latam', label: 'Latin America' },
  { id: 'mena', label: 'Middle East & Africa' },
  { id: 'global', label: 'Global' },
];

const adSpendRanges = [
  { value: '0-1k', label: '$0 - $1,000/month' },
  { value: '1k-5k', label: '$1,000 - $5,000/month' },
  { value: '5k-20k', label: '$5,000 - $20,000/month' },
  { value: '20k-100k', label: '$20,000 - $100,000/month' },
  { value: '100k+', label: '$100,000+/month' },
  { value: 'prefer-not', label: 'Prefer not to say' },
];

const currentTools = [
  { id: 'canva', label: 'Canva' },
  { id: 'figma', label: 'Figma' },
  { id: 'adobe', label: 'Adobe Creative Suite' },
  { id: 'meta-ads', label: 'Meta Ads Manager' },
  { id: 'google-ads', label: 'Google Ads' },
  { id: 'hootsuite', label: 'Hootsuite/Buffer' },
  { id: 'other', label: 'Other' },
];

function OnboardingBrand({ currentStep }: { currentStep: number }) {
  return (
    <div className="lp-auth-brand">
      <div>
        <Link to="/" className="lp-auth-brand-link">
          <span className="lp-auth-brand-icon" />
          <span className="lp-auth-brand-word">ADGENTIC</span>
        </Link>
        <h2 className="lp-auth-brand-headline">
          Set up your<br />workspace.
        </h2>
        <p className="lp-auth-brand-sub">
          A few details help us tailor ad generation, personas, and campaign defaults to your business.
        </p>
      </div>
      <ol className="lp-onboard-steps">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const state = stepNum < currentStep ? 'done' : stepNum === currentStep ? 'on' : '';
          return (
            <li key={label} className={`lp-onboard-step-item${state ? ` ${state}` : ''}`}>
              <span className="n">{stepNum < currentStep ? '✓' : stepNum}</span>
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepHead({ title, description, optional }: { title: string; description: string; optional?: boolean }) {
  return (
    <div className="lp-onboard-step-head">
      <h2>
        {title}
        {optional && <span className="optional"> (optional)</span>}
      </h2>
      <p>{description}</p>
    </div>
  );
}

function MultiSelectGrid({
  items,
  selected,
  onToggle,
  onSelectAll,
}: {
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
}) {
  return (
    <div>
      <div className="lp-onboard-check-toolbar">
        <button type="button" onClick={onSelectAll}>
          {selected.length === items.length ? 'Deselect all' : 'Select all'}
        </button>
      </div>
      <div className="lp-onboard-check-grid">
        {items.map((item) => {
          const active = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className={`lp-onboard-check${active ? ' on' : ''}`}
            >
              <span className="lp-onboard-check-box">
                {active && <CheckIcon size={10} strokeWidth={2.5} />}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [autofillError, setAutofillError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    companySize: '',
    website: '',
    productDescription: '',
    targetCustomer: '',
    primaryGoal: '',
    customGoal: '',
    targetPlatforms: [] as string[],
    targetRegions: [] as string[],
    adSpend: '',
    currentTools: [] as string[],
    biggestChallenge: '',
    otherTools: '',
  });

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return !!formData.companyName;
      case 2: return true;
      case 3:
        return !!formData.primaryGoal &&
          (formData.primaryGoal !== 'other' || !!formData.customGoal) &&
          formData.targetPlatforms.length > 0 &&
          formData.targetRegions.length > 0;
      case 4: return true;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (!isStepValid()) return;
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        await saveOnboarding({
          company_name: formData.companyName || undefined,
          industry: formData.industry || undefined,
          company_size: formData.companySize || undefined,
          website: formData.website || undefined,
          product_description: formData.productDescription || undefined,
          target_customer: formData.targetCustomer || undefined,
          primary_goal: formData.primaryGoal || undefined,
          custom_goal: formData.customGoal || undefined,
          target_platforms: formData.targetPlatforms.length > 0 ? formData.targetPlatforms : undefined,
          target_regions: formData.targetRegions.length > 0 ? formData.targetRegions : undefined,
          ad_spend: formData.adSpend || undefined,
          current_tools: formData.currentTools.length > 0 ? formData.currentTools : undefined,
          biggest_challenge: formData.biggestChallenge || undefined,
          other_tools: formData.otherTools || undefined,
        });
      } catch {
        // proceed to dashboard even if save fails
      }
      navigate('/dashboard');
    }
  };

  const handleBack = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };
  const handleSkip = () => {
    if (currentStep === totalSteps) navigate('/dashboard');
    else setCurrentStep(currentStep + 1);
  };

  const toggleArrayItem = (array: string[], item: string) =>
    array.includes(item) ? array.filter((i) => i !== item) : [...array, item];

  const selectAllItems = (allIds: string[], currentSelection: string[]) =>
    currentSelection.length === allIds.length ? [] : [...allIds];

  const handleAIAutofill = async () => {
    const site = formData.website.trim();
    if (!site) return;
    setAutofillError(null);
    setIsAutoFilling(true);
    try {
      const { analyzeBrandUrlForOnboarding, brandPreviewToOnboardingFields } = await import(
        '../utils/brandImportOnboarding'
      );
      const preview = await analyzeBrandUrlForOnboarding(site);
      const { productDescription, targetCustomer } = brandPreviewToOnboardingFields(preview);
      if (!productDescription && !targetCustomer) {
        setAutofillError('Could not extract product details from that website. Try editing the fields manually.');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        productDescription: productDescription || prev.productDescription,
        targetCustomer: targetCustomer || prev.targetCustomer,
      }));
    } catch (e) {
      setAutofillError(
        e instanceof Error ? e.message : 'Could not analyze your website. Check the URL and try again.',
      );
    } finally {
      setIsAutoFilling(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="lp-onboard-fields">
            <StepHead
              title="Tell us about your company"
              description="This helps us personalize your ad generation experience."
            />

            <div className="lp-auth-field">
              <label className="lp-auth-label">Company Logo</label>
              <div className="lp-onboard-upload">
                <div className="lp-onboard-upload-box" role="button" tabIndex={0} aria-label="Upload logo">
                  <UploadIcon size={16} />
                </div>
                <div className="lp-onboard-upload-meta">
                  <p>Upload your logo</p>
                  <p>PNG, SVG, or JPG — max 2MB</p>
                </div>
              </div>
            </div>

            <div className="lp-auth-field">
              <label className="lp-auth-label">Company Name *</label>
              <input
                className="lp-auth-input"
                placeholder="Acme Inc."
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>

            <div className="lp-auth-field">
              <label className="lp-auth-label">Industry</label>
              <select
                className="lp-auth-input"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              >
                <option value="">Select your industry</option>
                {industries.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="lp-auth-field">
              <label className="lp-auth-label">Company Size</label>
              <select
                className="lp-auth-input"
                value={formData.companySize}
                onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
              >
                <option value="">Select company size</option>
                {companySizes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="lp-auth-field">
              <label className="lp-auth-label">Website URL</label>
              <input
                className="lp-auth-input"
                placeholder="https://yourcompany.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
              <p className="lp-auth-hint">We&apos;ll use your website to auto-populate product details in the next step.</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="lp-onboard-fields">
            <StepHead
              title="What do you offer?"
              description="Help our AI understand your product or service."
            />

            {formData.website && (
              <button
                type="button"
                onClick={handleAIAutofill}
                disabled={isAutoFilling}
                className="lp-onboard-autofill"
              >
                {isAutoFilling ? (
                  <><Loader2Icon size={16} className="lp-auth-spinner" /> Analyzing your website…</>
                ) : (
                  <><SparklesIcon size={16} /> Auto-fill from {formData.website.replace(/^https?:\/\//, '').split('/')[0] || 'your website'}</>
                )}
              </button>
            )}

            {autofillError && <div className="lp-auth-banner error">{autofillError}</div>}

            <div className="lp-auth-field">
              <label className="lp-auth-label">What do you sell?</label>
              <textarea
                className="lp-auth-input"
                rows={4}
                placeholder="e.g., We sell a project management tool for remote teams…"
                value={formData.productDescription}
                onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                style={{ resize: 'vertical', minHeight: 96 }}
              />
            </div>

            <div className="lp-auth-field">
              <label className="lp-auth-label">Who is your target customer?</label>
              <textarea
                className="lp-auth-input"
                rows={4}
                placeholder="e.g., Marketing managers at mid-size companies…"
                value={formData.targetCustomer}
                onChange={(e) => setFormData({ ...formData, targetCustomer: e.target.value })}
                style={{ resize: 'vertical', minHeight: 96 }}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="lp-onboard-fields">
            <StepHead
              title="Your marketing goals"
              description="Tell us what you want to achieve with your ads."
            />

            <div className="lp-auth-field">
              <label className="lp-auth-label">Primary Goal *</label>
              <select
                className="lp-auth-input"
                value={formData.primaryGoal}
                onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
              >
                <option value="">Select your main goal</option>
                {goals.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {formData.primaryGoal === 'other' && (
              <div className="lp-auth-field">
                <label className="lp-auth-label">Custom Goal</label>
                <textarea
                  className="lp-auth-input"
                  rows={3}
                  placeholder="Describe your specific goal in detail…"
                  value={formData.customGoal}
                  onChange={(e) => setFormData({ ...formData, customGoal: e.target.value })}
                  style={{ resize: 'vertical' }}
                />
              </div>
            )}

            <div className="lp-auth-field">
              <label className="lp-auth-label">Target Platforms *</label>
              <MultiSelectGrid
                items={platforms}
                selected={formData.targetPlatforms}
                onToggle={(id) => setFormData({ ...formData, targetPlatforms: toggleArrayItem(formData.targetPlatforms, id) })}
                onSelectAll={() => setFormData({ ...formData, targetPlatforms: selectAllItems(platforms.map((p) => p.id), formData.targetPlatforms) })}
              />
              <p className="lp-auth-hint">We&apos;ll optimize ad formats and dimensions for your selected platforms.</p>
            </div>

            <div className="lp-auth-field">
              <label className="lp-auth-label">Target Regions *</label>
              <MultiSelectGrid
                items={regions}
                selected={formData.targetRegions}
                onToggle={(id) => setFormData({ ...formData, targetRegions: toggleArrayItem(formData.targetRegions, id) })}
                onSelectAll={() => setFormData({ ...formData, targetRegions: selectAllItems(regions.map((r) => r.id), formData.targetRegions) })}
              />
              <p className="lp-auth-hint">Ad copy and imagery will be tailored to cultural preferences in these regions.</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="lp-onboard-fields">
            <StepHead
              title="Current strategy"
              description="This helps us understand where you're starting from."
              optional
            />

            <div className="lp-auth-field">
              <label className="lp-auth-label">Monthly Ad Spend</label>
              <select
                className="lp-auth-input"
                value={formData.adSpend}
                onChange={(e) => setFormData({ ...formData, adSpend: e.target.value })}
              >
                <option value="">Select range (optional)</option>
                {adSpendRanges.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="lp-auth-field">
              <label className="lp-auth-label">Current Tools</label>
              <MultiSelectGrid
                items={currentTools}
                selected={formData.currentTools}
                onToggle={(id) => setFormData({ ...formData, currentTools: toggleArrayItem(formData.currentTools, id) })}
                onSelectAll={() => setFormData({ ...formData, currentTools: selectAllItems(currentTools.map((t) => t.id), formData.currentTools) })}
              />
              {formData.currentTools.includes('other') && (
                <div style={{ marginTop: 12 }}>
                  <label className="lp-auth-label">Other Tools</label>
                  <input
                    className="lp-auth-input"
                    placeholder="What other tools do you use?"
                    value={formData.otherTools || ''}
                    onChange={(e) => setFormData({ ...formData, otherTools: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="lp-auth-field">
              <label className="lp-auth-label">Biggest Marketing Challenge</label>
              <textarea
                className="lp-auth-input"
                rows={3}
                placeholder="What's the biggest challenge you face with advertising today?"
                value={formData.biggestChallenge}
                onChange={(e) => setFormData({ ...formData, biggestChallenge: e.target.value })}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const progressPct = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="landing-page lp-auth-layout">
      <OnboardingBrand currentStep={currentStep} />

      <div className="lp-auth-main">
        <div className="lp-onboard-wrap">
          <div className="lp-onboard-progress">
            <div className="lp-onboard-progress-meta">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{progressPct}% complete</span>
            </div>
            <div className="lp-onboard-progress-track">
              <div className="lp-onboard-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {renderStep()}

          <div className="lp-onboard-foot">
            <div>
              {currentStep > 1 && (
                <button type="button" onClick={handleBack} className="lp-auth-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <ArrowLeftIcon size={14} />
                  Back
                </button>
              )}
            </div>
            <div className="lp-onboard-foot-actions">
              {(currentStep === 2 || currentStep === 4) && (
                <button type="button" onClick={handleSkip} className="lp-auth-secondary">
                  Skip
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid()}
                className="lp-auth-submit"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'auto', padding: '11px 20px' }}
              >
                {currentStep === totalSteps ? 'Complete Setup' : 'Continue'}
                <ArrowRightIcon size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
