import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  SparklesIcon,
  UploadIcon,
  UsersIcon,
  WandIcon,
  BarChart3Icon,
  TwitterIcon,
  LinkedinIcon,
  GithubIcon,
  ArrowRightIcon } from
'lucide-react';
export function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg text-slate-900">
                Ad-gentic AI
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link
                to="/features"
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors">

                Features
              </Link>
              <Link
                to="/how-it-works"
                className="text-sm font-medium text-slate-900 transition-colors">

                How It Works
              </Link>
              <Link
                to="/pricing"
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors">

                Pricing
              </Link>
              <Link
                to="/team"
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors">

                Team
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/sign-in">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/sign-up">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-none shadow-md shadow-orange-500/20">

                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Four Steps to Ads That Actually Connect
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Our streamlined process makes ad creation effortless, from data
            upload to deployment.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Step 1 */}
          <Card
            variant="elevated"
            className="overflow-hidden border-l-4 border-l-blue-500">

            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
                  <UploadIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Step 1: Upload Your Data
                </h2>
                <p className="text-slate-600 mb-6">
                  Simply upload your customer data via CSV or connect directly
                  to your CRM. We support all major data formats and handle the
                  cleaning automatically.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full w-fit">
                  <SparklesIcon className="w-3 h-3" />
                  Average setup time: 4 minutes
                </div>
              </div>
              <div className="bg-blue-50 p-8 md:p-12 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm border border-blue-100 border-dashed border-2">
                  <div className="flex flex-col items-center text-center py-8">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                      <UploadIcon className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="font-medium text-slate-900">
                      Drag & drop files here
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      CSV, JSON, or Excel
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 2 */}
          <Card
            variant="elevated"
            className="overflow-hidden border-l-4 border-l-purple-500">

            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center order-2 md:order-1">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                  <UsersIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Step 2: AI Builds Personas
                </h2>
                <p className="text-slate-600 mb-6">
                  Our AI analyzes your data to identify distinct audience
                  segments and builds detailed psychological profiles for each
                  one.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-full w-fit">
                  <SparklesIcon className="w-3 h-3" />
                  Analyzed 2.4M+ ad interactions
                </div>
              </div>
              <div className="bg-purple-50 p-8 md:p-12 flex items-center justify-center order-1 md:order-2">
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                  <div className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
                    <div className="h-20 bg-purple-100 rounded mb-2"></div>
                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-md transform scale-105 border border-purple-200">
                    <div className="h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded mb-2"></div>
                    <div className="h-4 bg-slate-800 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
                    <div className="h-20 bg-purple-100 rounded mb-2"></div>
                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
                    <div className="h-20 bg-purple-100 rounded mb-2"></div>
                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 3 */}
          <Card
            variant="elevated"
            className="overflow-hidden border-l-4 border-l-pink-500">

            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center mb-6">
                  <WandIcon className="w-6 h-6 text-pink-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Step 3: Generate & Iterate
                </h2>
                <p className="text-slate-600 mb-6">
                  Chat with the AI to refine your ads. Request changes to tone,
                  imagery, or copy and see updates instantly.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-50 text-pink-700 text-sm font-medium rounded-full w-fit">
                  <SparklesIcon className="w-3 h-3" />
                  Average: 3 iterations to perfection
                </div>
              </div>
              <div className="bg-pink-50 p-8 md:p-12 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-sm border border-pink-100">
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <div className="bg-pink-500 text-white px-3 py-2 rounded-lg rounded-tr-none text-xs max-w-[80%]">
                        Make it more energetic!
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-slate-100 text-slate-800 px-3 py-2 rounded-lg rounded-tl-none text-xs max-w-[80%]">
                        Sure! Here's a high-energy version for the Impulse Buyer
                        persona.
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 mt-2">
                      <div className="h-24 bg-gradient-to-r from-orange-400 to-red-400 rounded mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 4 */}
          <Card
            variant="elevated"
            className="overflow-hidden border-l-4 border-l-emerald-500">

            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center order-2 md:order-1">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                  <BarChart3Icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Step 4: Deploy & Measure
                </h2>
                <p className="text-slate-600 mb-6">
                  Launch campaigns across all platforms with one click. Track
                  performance in real-time from a single dashboard.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full w-fit">
                  <SparklesIcon className="w-3 h-3" />
                  Real-time results in under 60 seconds
                </div>
              </div>
              <div className="bg-emerald-50 p-8 md:p-12 flex items-center justify-center order-1 md:order-2">
                <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-sm border border-emerald-100">
                  <div className="flex items-end gap-2 h-32 pb-2 border-b border-slate-100">
                    <div className="w-1/5 bg-emerald-200 h-[40%] rounded-t"></div>
                    <div className="w-1/5 bg-emerald-300 h-[60%] rounded-t"></div>
                    <div className="w-1/5 bg-emerald-400 h-[50%] rounded-t"></div>
                    <div className="w-1/5 bg-emerald-500 h-[80%] rounded-t"></div>
                    <div className="w-1/5 bg-emerald-600 h-[90%] rounded-t"></div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <div className="text-xs text-slate-500">CTR</div>
                    <div className="text-xs font-bold text-emerald-600">
                      +124%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            Ready to get started?
          </h2>
          <Link to="/sign-up">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-none shadow-lg shadow-orange-500/25"
              rightIcon={<ArrowRightIcon className="w-4 h-4" />}>

              Start your first campaign
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A1628] text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-lg">Ad-gentic AI</span>
              </div>
              <p className="text-white/60 text-sm">
                Making advertising better for everyone through AI-powered
                psychological profiling.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <Link
                    to="/features"
                    className="hover:text-white transition-colors">

                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pricing"
                    className="hover:text-white transition-colors">

                    Pricing
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Integrations
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <Link
                    to="/team"
                    className="hover:text-white transition-colors">

                    About
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <Link
                    to="/team#contact"
                    className="hover:text-white transition-colors">

                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © 2026 Ad-gentic AI. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-white/40 hover:text-white transition-colors">

                <TwitterIcon className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-white/40 hover:text-white transition-colors">

                <LinkedinIcon className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-white/40 hover:text-white transition-colors">

                <GithubIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>);

}