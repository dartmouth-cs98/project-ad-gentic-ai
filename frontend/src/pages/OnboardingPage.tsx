import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import {
  SparklesIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  UploadIcon,
  Loader2Icon,
  InfoIcon } from
'lucide-react';
const industries = [
{
  value: 'saas',
  label: 'SaaS / Software'
},
{
  value: 'ecommerce',
  label: 'E-commerce / Retail'
},
{
  value: 'finance',
  label: 'Finance / Fintech'
},
{
  value: 'healthcare',
  label: 'Healthcare'
},
{
  value: 'education',
  label: 'Education'
},
{
  value: 'agency',
  label: 'Marketing Agency'
},
{
  value: 'other',
  label: 'Other'
}];

const companySizes = [
{
  value: '1-10',
  label: '1-10 employees'
},
{
  value: '11-50',
  label: '11-50 employees'
},
{
  value: '51-200',
  label: '51-200 employees'
},
{
  value: '201-500',
  label: '201-500 employees'
},
{
  value: '500+',
  label: '500+ employees'
}];

const goals = [
{
  value: 'awareness',
  label: 'Brand Awareness'
},
{
  value: 'leads',
  label: 'Lead Generation'
},
{
  value: 'sales',
  label: 'Direct Sales'
},
{
  value: 'engagement',
  label: 'Engagement & Community'
},
{
  value: 'other',
  label: 'Other'
}];

const platforms = [
{
  id: 'meta',
  label: 'Meta (Facebook/Instagram)'
},
{
  id: 'tiktok',
  label: 'TikTok'
},
{
  id: 'youtube',
  label: 'YouTube'
},
{
  id: 'linkedin',
  label: 'LinkedIn'
},
{
  id: 'twitter',
  label: 'Twitter/X'
},
{
  id: 'google',
  label: 'Google Ads'
}];

const regions = [
{
  id: 'na',
  label: 'North America'
},
{
  id: 'eu',
  label: 'Europe'
},
{
  id: 'apac',
  label: 'Asia Pacific'
},
{
  id: 'latam',
  label: 'Latin America'
},
{
  id: 'mena',
  label: 'Middle East & Africa'
},
{
  id: 'global',
  label: 'Global'
}];

const adSpendRanges = [
{
  value: '0-1k',
  label: '$0 - $1,000/month'
},
{
  value: '1k-5k',
  label: '$1,000 - $5,000/month'
},
{
  value: '5k-20k',
  label: '$5,000 - $20,000/month'
},
{
  value: '20k-100k',
  label: '$20,000 - $100,000/month'
},
{
  value: '100k+',
  label: '$100,000+/month'
},
{
  value: 'prefer-not',
  label: 'Prefer not to say'
}];

const currentTools = [
{
  id: 'canva',
  label: 'Canva'
},
{
  id: 'figma',
  label: 'Figma'
},
{
  id: 'adobe',
  label: 'Adobe Creative Suite'
},
{
  id: 'meta-ads',
  label: 'Meta Ads Manager'
},
{
  id: 'google-ads',
  label: 'Google Ads'
},
{
  id: 'hootsuite',
  label: 'Hootsuite/Buffer'
},
{
  id: 'other',
  label: 'Other'
}];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1
    companyName: '',
    industry: '',
    companySize: '',
    website: '',
    // Step 2
    productDescription: '',
    targetCustomer: '',
    // Step 3
    primaryGoal: '',
    customGoal: '',
    targetPlatforms: [] as string[],
    targetRegions: [] as string[],
    // Step 4
    adSpend: '',
    currentTools: [] as string[],
    biggestChallenge: '',
    otherTools: ''
  });
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return !!formData.companyName;
      case 2:
        return true;
      // Now skippable — always valid
      case 3:
        return (
          !!formData.primaryGoal && (
          formData.primaryGoal !== 'other' || !!formData.customGoal) &&
          formData.targetPlatforms.length > 0 &&
          formData.targetRegions.length > 0);

      case 4:
        return true;
      default:
        return false;
    }
  };
  const handleNext = () => {
    if (!isStepValid()) return;
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/dashboard');
    }
  };
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const handleSkip = () => {
    if (currentStep === totalSteps) {
      navigate('/dashboard');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };
  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) ?
    array.filter((i) => i !== item) :
    [...array, item];
  };
  const selectAllItems = (allIds: string[], currentSelection: string[]) => {
    if (currentSelection.length === allIds.length) {
      return []; // Deselect all if all are selected
    }
    return [...allIds];
  };
  const handleAIAutofill = () => {
    setIsAutoFilling(true);
    setTimeout(() => {
      setFormData({
        ...formData,
        productDescription:
        'We offer an AI-powered advertising platform that generates psychologically-targeted ad variants for small and medium businesses. Our tool analyzes audience segments and creates personalized creative across Meta, TikTok, YouTube, and more.',
        targetCustomer:
        'Marketing managers and founders at SMBs (10-200 employees) who spend $1K-$20K/month on digital ads and want to improve ROAS without hiring a creative agency. They value data-driven decisions and are frustrated with generic ad templates.'
      });
      setIsAutoFilling(false);
    }, 2000);
  };
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Tell us about your company
              </h2>
              <p className="text-slate-500">
                This helps us personalize your ad generation experience.
              </p>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer group">
                  <UploadIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Upload your logo</p>
                  <p className="text-xs text-slate-400">
                    PNG, SVG, or JPG — max 2MB
                  </p>
                </div>
              </div>
            </div>

            <Input
              label="Company Name"
              placeholder="Acme Inc."
              value={formData.companyName}
              onChange={(e) =>
              setFormData({
                ...formData,
                companyName: e.target.value
              })
              } />

            <Select
              label="Industry"
              options={industries}
              placeholder="Select your industry"
              value={formData.industry}
              onChange={(e) =>
              setFormData({
                ...formData,
                industry: e.target.value
              })
              } />

            <Select
              label="Company Size"
              options={companySizes}
              placeholder="Select company size"
              value={formData.companySize}
              onChange={(e) =>
              setFormData({
                ...formData,
                companySize: e.target.value
              })
              } />

            <div>
              <Input
                label="Website URL"
                placeholder="https://yourcompany.com"
                value={formData.website}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  website: e.target.value
                })
                } />

              <div className="flex items-start gap-2 mt-2 p-2.5 bg-blue-50/60 rounded-lg">
                <SparklesIcon className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-600">
                  We'll use your website to auto-populate product details and
                  audience info in the next steps — saving you time.
                </p>
              </div>
            </div>
          </div>);

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                What do you offer?
              </h2>
              <p className="text-slate-500">
                Help our AI understand your product or service.
              </p>
            </div>

            {/* AI Autofill Button */}
            {formData.website ?
            <button
              onClick={handleAIAutofill}
              disabled={isAutoFilling}
              className="w-full flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium disabled:opacity-60">

                {isAutoFilling ?
              <>
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                    Analyzing your website...
                  </> :

              <>
                    <SparklesIcon className="w-4 h-4" />
                    Auto-fill from{' '}
                    {formData.website.
                replace(/^https?:\/\//, '').
                split('/')[0] || 'your website'}
                  </>
              }
              </button> :
            null}

            <Textarea
              label="What do you sell?"
              placeholder="e.g., We sell a project management tool for remote teams that helps track tasks, deadlines, and team communication in one place..."
              rows={4}
              value={formData.productDescription}
              onChange={(e) =>
              setFormData({
                ...formData,
                productDescription: e.target.value
              })
              } />

            <Textarea
              label="Who is your target customer?"
              placeholder="e.g., Marketing managers at mid-size companies (50-500 employees) who spend $5K+/month on ads and want better ROI without hiring an agency..."
              rows={4}
              value={formData.targetCustomer}
              onChange={(e) =>
              setFormData({
                ...formData,
                targetCustomer: e.target.value
              })
              } />

          </div>);

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Your marketing goals
              </h2>
              <p className="text-slate-500">
                Tell us what you want to achieve with your ads.
              </p>
            </div>
            <Select
              label="Primary Goal"
              options={goals}
              placeholder="Select your main goal"
              value={formData.primaryGoal}
              onChange={(e) =>
              setFormData({
                ...formData,
                primaryGoal: e.target.value
              })
              } />

            {formData.primaryGoal === 'other' &&
            <Textarea
              label="Custom Goal"
              placeholder="Describe your specific goal in detail..."
              rows={3}
              value={formData.customGoal}
              onChange={(e) =>
              setFormData({
                ...formData,
                customGoal: e.target.value
              })
              } />

            }
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  Target Platforms
                </label>
                <button
                  type="button"
                  onClick={() =>
                  setFormData({
                    ...formData,
                    targetPlatforms: selectAllItems(
                      platforms.map((p) => p.id),
                      formData.targetPlatforms
                    )
                  })
                  }
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium">

                  {formData.targetPlatforms.length === platforms.length ?
                  'Deselect all' :
                  'Select all'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {platforms.map((platform) =>
                <button
                  key={platform.id}
                  type="button"
                  onClick={() =>
                  setFormData({
                    ...formData,
                    targetPlatforms: toggleArrayItem(
                      formData.targetPlatforms,
                      platform.id
                    )
                  })
                  }
                  className={`
                      flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-all
                      ${formData.targetPlatforms.includes(platform.id) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-700'}
                    `}>

                    {formData.targetPlatforms.includes(platform.id) &&
                  <CheckIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  }
                    <span
                    className={
                    !formData.targetPlatforms.includes(platform.id) ?
                    'ml-6' :
                    ''
                    }>

                      {platform.label}
                    </span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                We'll optimize ad formats and dimensions for your selected
                platforms.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  Target Regions
                </label>
                <button
                  type="button"
                  onClick={() =>
                  setFormData({
                    ...formData,
                    targetRegions: selectAllItems(
                      regions.map((r) => r.id),
                      formData.targetRegions
                    )
                  })
                  }
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium">

                  {formData.targetRegions.length === regions.length ?
                  'Deselect all' :
                  'Select all'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {regions.map((region) =>
                <button
                  key={region.id}
                  type="button"
                  onClick={() =>
                  setFormData({
                    ...formData,
                    targetRegions: toggleArrayItem(
                      formData.targetRegions,
                      region.id
                    )
                  })
                  }
                  className={`
                      flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-all
                      ${formData.targetRegions.includes(region.id) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-700'}
                    `}>

                    {formData.targetRegions.includes(region.id) &&
                  <CheckIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  }
                    <span
                    className={
                    !formData.targetRegions.includes(region.id) ?
                    'ml-6' :
                    ''
                    }>

                      {region.label}
                    </span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Ad copy and imagery will be tailored to cultural preferences in
                these regions.
              </p>
            </div>
          </div>);

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Current strategy (optional)
              </h2>
              <p className="text-slate-500">
                This helps us understand where you're starting from.
              </p>
            </div>
            <Select
              label="Monthly Ad Spend"
              options={adSpendRanges}
              placeholder="Select range (optional)"
              value={formData.adSpend}
              onChange={(e) =>
              setFormData({
                ...formData,
                adSpend: e.target.value
              })
              } />

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  Current Tools
                </label>
                <button
                  type="button"
                  onClick={() =>
                  setFormData({
                    ...formData,
                    currentTools: selectAllItems(
                      currentTools.map((t) => t.id),
                      formData.currentTools
                    )
                  })
                  }
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium">

                  {formData.currentTools.length === currentTools.length ?
                  'Deselect all' :
                  'Select all'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {currentTools.map((tool) =>
                <button
                  key={tool.id}
                  type="button"
                  onClick={() =>
                  setFormData({
                    ...formData,
                    currentTools: toggleArrayItem(
                      formData.currentTools,
                      tool.id
                    )
                  })
                  }
                  className={`
                      flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-all
                      ${formData.currentTools.includes(tool.id) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300 text-slate-700'}
                    `}>

                    {formData.currentTools.includes(tool.id) &&
                  <CheckIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  }
                    <span
                    className={
                    !formData.currentTools.includes(tool.id) ? 'ml-6' : ''
                    }>

                      {tool.label}
                    </span>
                  </button>
                )}
              </div>
              {formData.currentTools.includes('other') &&
              <div className="mt-3">
                  <Input
                  label="Other Tools"
                  placeholder="What other tools do you use?"
                  value={formData.otherTools || ''}
                  onChange={(e) =>
                  setFormData({
                    ...formData,
                    otherTools: e.target.value
                  })
                  } />

                </div>
              }
            </div>
            <Textarea
              label="Biggest Marketing Challenge"
              placeholder="What's the biggest challenge you face with advertising today? e.g., low click-through rates, high cost per acquisition, difficulty creating engaging creative..."
              rows={3}
              value={formData.biggestChallenge}
              onChange={(e) =>
              setFormData({
                ...formData,
                biggestChallenge: e.target.value
              })
              } />

          </div>);

      default:
        return null;
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-xl text-slate-900">
            Ad-gentic AI
          </span>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-slate-500">
              {Math.round(currentStep / totalSteps * 100)}% complete
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
              style={{
                width: `${currentStep / totalSteps * 100}%`
              }} />

          </div>
        </div>

        <Card variant="elevated" padding="lg">
          {renderStep()}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            <div>
              {currentStep > 1 &&
              <Button
                variant="ghost"
                onClick={handleBack}
                leftIcon={<ArrowLeftIcon className="w-4 h-4" />}>

                  Back
                </Button>
              }
            </div>
            <div className="flex items-center gap-3">
              {(currentStep === 2 || currentStep === 4) &&
              <Button variant="ghost" onClick={handleSkip}>
                  Skip
                </Button>
              }
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                rightIcon={<ArrowRightIcon className="w-4 h-4" />}>

                {currentStep === totalSteps ? 'Complete Setup' : 'Continue'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>);

}