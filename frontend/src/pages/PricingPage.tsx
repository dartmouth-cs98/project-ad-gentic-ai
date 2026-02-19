import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  SparklesIcon,
  CheckIcon,
  TwitterIcon,
  LinkedinIcon,
  GithubIcon,
  ChevronDownIcon,
  ChevronUpIcon } from
'lucide-react';
export function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };
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
                className="text-sm font-medium text-slate-900 transition-colors">

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
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 hover:bg-slate-50 hover:text-slate-900">

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
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 text-center bg-slate-50">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
          Start free, upgrade when you are ready to scale.
        </p>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <span
            className={`text-sm font-medium ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>

            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-14 h-8 bg-slate-200 rounded-full relative transition-colors hover:bg-slate-300">

            <div
              className={`absolute top-1 w-6 h-6 bg-white shadow-sm rounded-full transition-all duration-300 ${isAnnual ? 'left-7' : 'left-1'}`} />

          </button>
          <span
            className={`text-sm font-medium ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>

            Annual{' '}
            <span className="text-emerald-600 text-xs ml-1 font-bold">
              (Save 20%)
            </span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 text-left">
          {/* Basic */}
          <Card
            variant="elevated"
            padding="lg"
            className="flex flex-col border-t-4 border-t-slate-200">

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Basic
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">Free</span>
              </div>
              <p className="text-slate-500 text-sm mt-2">
                Perfect for trying out Ad-gentic AI
              </p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
              '3 version histories per chat',
              '20 chats per month',
              '3 ad campaigns',
              '10 downloads per month',
              'Limited reach',
              'Community support',
              'Basic analytics'].
              map((item, i) =>
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-slate-600">

                  <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              )}
            </ul>
            <Link to="/sign-up" className="block">
              <Button variant="secondary" className="w-full">
                Get Started
              </Button>
            </Link>
          </Card>

          {/* Premium */}
          <Card
            variant="elevated"
            padding="lg"
            className="flex flex-col ring-2 ring-orange-500 relative shadow-orange-100">

            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-full shadow-lg">
              Most Popular
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Premium
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">
                  ${isAnnual ? '79' : '99'}
                </span>
                <span className="text-slate-500">/mo</span>
              </div>
              <p className="text-slate-500 text-sm mt-2">
                For growing businesses ready to scale
              </p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
              'Everything in Basic',
              'Unlimited version history',
              'Unlimited chats',
              'Unlimited campaigns',
              'Unlimited downloads',
              'Full reach + automated posting',
              'Priority support',
              'Advanced analytics',
              'A/B testing',
              'Custom brand voice'].
              map((item, i) =>
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-slate-600">

                  <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              )}
            </ul>
            <Link to="/sign-up" className="block">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-none shadow-lg shadow-orange-500/25">
                Start Free Trial
              </Button>
            </Link>
          </Card>

          {/* Enterprise */}
          <Card
            variant="elevated"
            padding="lg"
            className="flex flex-col border-t-4 border-t-blue-500">

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                Enterprise
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">
                  Custom
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-2">
                For large teams with specific needs
              </p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {[
              'Everything in Premium',
              'Dedicated account manager',
              'Custom integrations',
              'SLA guarantee',
              'Team workspaces',
              'Custom AI training',
              'White-label options'].
              map((item, i) =>
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-slate-600">

                  <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              )}
            </ul>
            <Link to="/team#contact" className="block">
              <Button variant="secondary" className="w-full">
                Contact Sales
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white text-slate-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
            {
              q: 'Can I switch plans anytime?',
              a: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.'
            },
            {
              q: 'Is there a free trial for Premium?',
              a: 'Yes! We offer a 14-day free trial for the Premium plan so you can test out all the advanced features.'
            },
            {
              q: 'What payment methods do you accept?',
              a: 'We accept all major credit cards (Visa, Mastercard, Amex) and PayPal.'
            },
            {
              q: 'Can I cancel anytime?',
              a: 'Absolutely. There are no long-term contracts or cancellation fees. You can cancel your subscription at any time.'
            },
            {
              q: 'Do you offer refunds?',
              a: 'We offer a 30-day money-back guarantee if you are not satisfied with our service.'
            }].
            map((faq, i) =>
            <div
              key={i}
              className="border border-slate-200 rounded-lg overflow-hidden">

                <button
                onClick={() => toggleFaq(i)}
                className="w-full flex items-center justify-between p-4 text-left bg-slate-50 hover:bg-slate-100 transition-colors">

                  <span className="font-medium text-slate-900">{faq.q}</span>
                  {openFaq === i ?
                <ChevronUpIcon className="w-4 h-4 text-slate-500" /> :

                <ChevronDownIcon className="w-4 h-4 text-slate-500" />
                }
                </button>
                {openFaq === i &&
              <div className="p-4 bg-white text-slate-600 text-sm border-t border-slate-200">
                    {faq.a}
                  </div>
              }
              </div>
            )}
          </div>
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