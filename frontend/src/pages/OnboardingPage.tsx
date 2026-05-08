import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  UploadIcon,
  Loader2Icon,
  SparklesIcon
} from 'lucide-react';
import { saveOnboarding } from '../api/auth';

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

const inputClass = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20';
const selectClass = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-foreground/20';
const labelClass = 'block text-sm font-medium mb-1.5';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [isAutoFilling, setIsAutoFilling] = useState(false);
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

  const handleAIAutofill = () => {
    setIsAutoFilling(true);
    setTimeout(() => {
      setFormData({
        ...formData,
        productDescription:
          'We offer an AI-powered advertising platform that generates psychologically-targeted ad variants for small and medium businesses. Our tool analyzes audience segments and creates personalized creative across Meta, TikTok, YouTube, and more.',
        targetCustomer:
          'Marketing managers and founders at SMBs (10-200 employees) who spend $1K-$20K/month on digital ads and want to improve ROAS without hiring a creative agency. They value data-driven decisions and are frustrated with generic ad templates.',
      });
      setIsAutoFilling(false);
    }, 2000);
  };

  const MultiSelectGrid = ({
    items,
    selected,
    onToggle,
    onSelectAll,
  }: {
    items: { id: string; label: string }[];
    selected: string[];
    onToggle: (id: string) => void;
    onSelectAll: () => void;
  }) => (
    <div>
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={onSelectAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {selected.length === items.length ? 'Deselect all' : 'Select all'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const active = selected.includes(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                active
                  ? 'border-blue-600 bg-blue-600/10 text-foreground'
                  : 'border-border hover:border-foreground/30 text-muted-foreground'
              }`}
            >
              <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-colors ${active ? 'bg-blue-600 border-blue-600' : 'border-border'}`}>
                {active && <CheckIcon className="w-3 h-3 text-white" />}
              </div>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold mb-1">Tell us about your company</h2>
              <p className="text-sm text-muted-foreground">This helps us personalize your ad generation experience.</p>
            </div>

            <div>
              <label className={labelClass}>Company Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg border border-dashed border-border flex items-center justify-center hover:border-foreground/30 transition-colors cursor-pointer">
                  <UploadIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm">Upload your logo</p>
                  <p className="text-xs text-muted-foreground">PNG, SVG, or JPG — max 2MB</p>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Company Name <span className="text-red-500">*</span></label>
              <input
                className={inputClass}
                placeholder="Acme Inc."
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>Industry</label>
              <select
                className={selectClass}
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              >
                <option value="">Select your industry</option>
                {industries.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Company Size</label>
              <select
                className={selectClass}
                value={formData.companySize}
                onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
              >
                <option value="">Select company size</option>
                {companySizes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Website URL</label>
              <input
                className={inputClass}
                placeholder="https://yourcompany.com"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                We'll use your website to auto-populate product details in the next step.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold mb-1">What do you offer?</h2>
              <p className="text-sm text-muted-foreground">Help our AI understand your product or service.</p>
            </div>

            {formData.website && (
              <button
                onClick={handleAIAutofill}
                disabled={isAutoFilling}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                {isAutoFilling ? (
                  <><Loader2Icon className="w-4 h-4 animate-spin text-muted-foreground" /> Analyzing your website...</>
                ) : (
                  <><SparklesIcon className="w-4 h-4 text-blue-600" /> Auto-fill from {formData.website.replace(/^https?:\/\//, '').split('/')[0] || 'your website'}</>
                )}
              </button>
            )}

            <div>
              <label className={labelClass}>What do you sell?</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={4}
                placeholder="e.g., We sell a project management tool for remote teams that helps track tasks, deadlines, and team communication in one place..."
                value={formData.productDescription}
                onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
              />
            </div>

            <div>
              <label className={labelClass}>Who is your target customer?</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={4}
                placeholder="e.g., Marketing managers at mid-size companies (50-500 employees) who spend $5K+/month on ads and want better ROI without hiring an agency..."
                value={formData.targetCustomer}
                onChange={(e) => setFormData({ ...formData, targetCustomer: e.target.value })}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold mb-1">Your marketing goals</h2>
              <p className="text-sm text-muted-foreground">Tell us what you want to achieve with your ads.</p>
            </div>

            <div>
              <label className={labelClass}>Primary Goal <span className="text-red-500">*</span></label>
              <select
                className={selectClass}
                value={formData.primaryGoal}
                onChange={(e) => setFormData({ ...formData, primaryGoal: e.target.value })}
              >
                <option value="">Select your main goal</option>
                {goals.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {formData.primaryGoal === 'other' && (
              <div>
                <label className={labelClass}>Custom Goal</label>
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={3}
                  placeholder="Describe your specific goal in detail..."
                  value={formData.customGoal}
                  onChange={(e) => setFormData({ ...formData, customGoal: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className={labelClass}>Target Platforms <span className="text-red-500">*</span></label>
              <MultiSelectGrid
                items={platforms}
                selected={formData.targetPlatforms}
                onToggle={(id) => setFormData({ ...formData, targetPlatforms: toggleArrayItem(formData.targetPlatforms, id) })}
                onSelectAll={() => setFormData({ ...formData, targetPlatforms: selectAllItems(platforms.map((p) => p.id), formData.targetPlatforms) })}
              />
              <p className="text-xs text-muted-foreground mt-2">We'll optimize ad formats and dimensions for your selected platforms.</p>
            </div>

            <div>
              <label className={labelClass}>Target Regions <span className="text-red-500">*</span></label>
              <MultiSelectGrid
                items={regions}
                selected={formData.targetRegions}
                onToggle={(id) => setFormData({ ...formData, targetRegions: toggleArrayItem(formData.targetRegions, id) })}
                onSelectAll={() => setFormData({ ...formData, targetRegions: selectAllItems(regions.map((r) => r.id), formData.targetRegions) })}
              />
              <p className="text-xs text-muted-foreground mt-2">Ad copy and imagery will be tailored to cultural preferences in these regions.</p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold mb-1">Current strategy <span className="text-muted-foreground font-normal text-base">(optional)</span></h2>
              <p className="text-sm text-muted-foreground">This helps us understand where you're starting from.</p>
            </div>

            <div>
              <label className={labelClass}>Monthly Ad Spend</label>
              <select
                className={selectClass}
                value={formData.adSpend}
                onChange={(e) => setFormData({ ...formData, adSpend: e.target.value })}
              >
                <option value="">Select range (optional)</option>
                {adSpendRanges.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Current Tools</label>
              <MultiSelectGrid
                items={currentTools}
                selected={formData.currentTools}
                onToggle={(id) => setFormData({ ...formData, currentTools: toggleArrayItem(formData.currentTools, id) })}
                onSelectAll={() => setFormData({ ...formData, currentTools: selectAllItems(currentTools.map((t) => t.id), formData.currentTools) })}
              />
              {formData.currentTools.includes('other') && (
                <div className="mt-3">
                  <label className={labelClass}>Other Tools</label>
                  <input
                    className={inputClass}
                    placeholder="What other tools do you use?"
                    value={formData.otherTools || ''}
                    onChange={(e) => setFormData({ ...formData, otherTools: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>Biggest Marketing Challenge</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="What's the biggest challenge you face with advertising today? e.g., low click-through rates, high cost per acquisition, difficulty creating engaging creative..."
                value={formData.biggestChallenge}
                onChange={(e) => setFormData({ ...formData, biggestChallenge: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}% complete</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-8">
          {renderStep()}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {(currentStep === 2 || currentStep === 4) && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40"
              >
                {currentStep === totalSteps ? 'Complete Setup' : 'Continue'}
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
