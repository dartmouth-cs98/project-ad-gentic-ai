import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  SparklesIcon,
  LinkedinIcon,
  TwitterIcon,
  GithubIcon,
  HeartIcon,
  EyeIcon,
  ZapIcon } from
'lucide-react';
export function TeamPage() {
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
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors">

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
                className="text-sm font-medium text-slate-900 transition-colors">

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
            The Minds Behind Ad-gentic AI
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            We are a team of marketers, engineers, and psychologists building
            the future of advertising.
          </p>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Sarah */}
            <Card
              variant="elevated"
              padding="lg"
              className="flex flex-col sm:flex-row gap-6 items-start">

              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex-shrink-0 flex items-center justify-center text-white text-3xl font-bold">
                SJ
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Sarah Johnson
                </h3>
                <p className="text-blue-600 font-medium mb-3">
                  CEO & Co-founder
                </p>
                <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                  Former VP of Marketing at Shopify. 15 years in digital
                  advertising. Passionate about making ads that respect the
                  viewer.
                </p>
                <a
                  href="#"
                  className="text-slate-400 hover:text-blue-600 transition-colors">

                  <LinkedinIcon className="w-5 h-5" />
                </a>
              </div>
            </Card>

            {/* Michael */}
            <Card
              variant="elevated"
              padding="lg"
              className="flex flex-col sm:flex-row gap-6 items-start">

              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex-shrink-0 flex items-center justify-center text-white text-3xl font-bold">
                MC
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Michael Chen
                </h3>
                <p className="text-purple-600 font-medium mb-3">
                  CTO & Co-founder
                </p>
                <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                  Ex-Google AI researcher. Built ML systems processing 1B+ data
                  points daily. Believes AI should augment human creativity, not
                  replace it.
                </p>
                <a
                  href="#"
                  className="text-slate-400 hover:text-blue-600 transition-colors">

                  <LinkedinIcon className="w-5 h-5" />
                </a>
              </div>
            </Card>

            {/* Emily */}
            <Card
              variant="elevated"
              padding="lg"
              className="flex flex-col sm:flex-row gap-6 items-start">

              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-600 flex-shrink-0 flex items-center justify-center text-white text-3xl font-bold">
                EP
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Emily Park</h3>
                <p className="text-pink-600 font-medium mb-3">
                  Head of AI Research
                </p>
                <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                  PhD in Computational Psychology from MIT. Published 20+ papers
                  on behavioral prediction models. Leads our persona engine
                  development.
                </p>
                <a
                  href="#"
                  className="text-slate-400 hover:text-blue-600 transition-colors">

                  <LinkedinIcon className="w-5 h-5" />
                </a>
              </div>
            </Card>

            {/* David */}
            <Card
              variant="elevated"
              padding="lg"
              className="flex flex-col sm:flex-row gap-6 items-start">

              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex-shrink-0 flex items-center justify-center text-white text-3xl font-bold">
                DR
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  David Rodriguez
                </h3>
                <p className="text-emerald-600 font-medium mb-3">
                  Head of Psychology
                </p>
                <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                  Clinical psychologist turned ad-tech innovator. 10 years
                  studying consumer decision-making. Ensures our AI truly
                  understands human motivation.
                </p>
                <a
                  href="#"
                  className="text-slate-400 hover:text-blue-600 transition-colors">

                  <LinkedinIcon className="w-5 h-5" />
                </a>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Our Values
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
                <HeartIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Human-First AI
              </h3>
              <p className="text-slate-600">
                We build technology that enhances human connection rather than
                exploiting it.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6">
                <EyeIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Radical Transparency
              </h3>
              <p className="text-slate-600">
                We believe in open algorithms and clear data usage policies.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
                <ZapIcon className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Creative Excellence
              </h3>
              <p className="text-slate-600">
                We never settle for "good enough." Every ad should be a piece of
                art.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Join Us</h2>
          <p className="text-lg text-slate-600 mb-8">
            We are always looking for exceptional people to join our mission.
          </p>
          <Button variant="secondary" size="lg">
            View Open Positions
          </Button>
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