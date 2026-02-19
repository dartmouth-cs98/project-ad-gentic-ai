import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  SparklesIcon,
  BrainIcon,
  Share2Icon,
  ShieldCheckIcon,
  ArrowRightIcon,
  TwitterIcon,
  LinkedinIcon,
  GithubIcon,
  CheckIcon } from
'lucide-react';
export function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
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
                className="text-sm font-medium text-slate-900 transition-colors">

                Features
              </Link>
              <Link
                to="/how-it-works"
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors">

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
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            Features
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Everything you need to create ads that resonate with real humans.
          </p>
        </div>
      </section>

      {/* Feature 1: AI Psychological Profiling */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
                <BrainIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                AI Psychological Profiling
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Our AI goes beyond basic demographics. It analyzes millions of
                data points to build comprehensive psychological profiles of
                your target audience, understanding their motivations, fears,
                and desires.
              </p>
              <ul className="space-y-4">
                {[
                '10+ distinct persona types including The Skeptic, The Impulse Buyer, and The Researcher',
                'Real-time adaptation based on current market trends and sentiment',
                'Cultural context awareness for global campaigns',
                'Emotional trigger mapping for higher conversion rates'].
                map((item, i) =>
                <li key={i} className="flex items-start gap-3">
                    <CheckIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                )}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl transform rotate-3" />
              <Card
                variant="elevated"
                className="relative bg-white p-8 transform -rotate-2 transition-transform hover:rotate-0 duration-500">

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold">
                        S
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          The Skeptic
                        </p>
                        <p className="text-xs text-slate-500">
                          Needs data & proof
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-teal-600">
                        98% Match
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                        I
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          The Impulse Buyer
                        </p>
                        <p className="text-xs text-slate-500">Needs urgency</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-orange-600">
                        85% Match
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        R
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          The Researcher
                        </p>
                        <p className="text-xs text-slate-500">
                          Needs comparison
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">
                        92% Match
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Multi-Platform Deployment */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl transform -rotate-3" />
              <Card
                variant="elevated"
                className="relative bg-white p-12 flex items-center justify-center min-h-[400px]">

                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Central Hub */}
                  <div className="w-24 h-24 bg-slate-900 rounded-2xl flex items-center justify-center z-10 shadow-xl">
                    <SparklesIcon className="w-10 h-10 text-white" />
                  </div>

                  {/* Connected Platforms */}
                  {[
                  {
                    icon: 'M',
                    color: 'bg-blue-600',
                    pos: 'top-0 left-1/2 -translate-x-1/2 -translate-y-16'
                  },
                  {
                    icon: 'Tk',
                    color: 'bg-black',
                    pos: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-16'
                  },
                  {
                    icon: 'G',
                    color: 'bg-green-500',
                    pos: 'top-1/2 right-0 translate-x-16 -translate-y-1/2'
                  },
                  {
                    icon: 'Y',
                    color: 'bg-red-600',
                    pos: 'top-1/2 left-0 -translate-x-16 -translate-y-1/2'
                  }].
                  map((p, i) =>
                  <Fragment key={i}>
                      <div
                      className={`absolute ${p.pos} w-16 h-16 rounded-xl ${p.color} flex items-center justify-center text-white font-bold shadow-lg z-10`}>

                        {p.icon}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                        className={`w-32 h-0.5 bg-slate-200 absolute ${i === 0 ? 'rotate-90 -translate-y-12' : i === 1 ? 'rotate-90 translate-y-12' : i === 2 ? 'translate-x-12' : '-translate-x-12'}`} />

                      </div>
                    </Fragment>
                  )}
                </div>
              </Card>
            </div>
            <div className="order-1 lg:order-2">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Share2Icon className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Multi-Platform Deployment
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Stop manually resizing and reformatting ads. Create once and
                deploy everywhere with a single click. Our system automatically
                adjusts creative assets to match the best practices of each
                platform.
              </p>
              <ul className="space-y-4">
                {[
                'One-click publishing to Meta, TikTok, Instagram, YouTube, and Google',
                'Automatic aspect ratio adjustment (9:16, 1:1, 16:9)',
                'Platform-specific caption and hashtag generation',
                'Unified analytics dashboard for all channels'].
                map((item, i) =>
                <li key={i} className="flex items-start gap-3">
                    <CheckIcon className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Human-Verified Creative */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                <ShieldCheckIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Human-Verified Creative
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                AI is powerful, but human intuition is irreplaceable. That's why
                every ad generated by Ad-gentic passes through a human review
                layer to ensure brand safety, tone accuracy, and creative
                quality.
              </p>
              <ul className="space-y-4">
                {[
                'Expert human review for every campaign',
                'Brand safety and compliance checks',
                'Tone and voice consistency verification',
                'Quality scoring before any ad goes live'].
                map((item, i) =>
                <li key={i} className="flex items-start gap-3">
                    <CheckIcon className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                )}
              </ul>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-3xl transform rotate-3" />
              <Card variant="elevated" className="relative bg-white p-8">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-medium text-slate-600">
                        Review in progress
                      </span>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                      Quality Score: 9.8/10
                    </span>
                  </div>
                  <div className="aspect-video bg-slate-200 rounded-lg mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      Ad Preview
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-none">
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 text-red-500 hover:text-red-600 border-red-200 hover:bg-red-50">

                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0A1628] text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to see it in action?
          </h2>
          <p className="text-lg text-white/60 mb-8">
            Join 500+ brands using Ad-gentic AI to transform their advertising.
          </p>
          <Link to="/sign-up">
            <Button
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-none shadow-lg shadow-orange-500/25">

              Start Your Growth Engine
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