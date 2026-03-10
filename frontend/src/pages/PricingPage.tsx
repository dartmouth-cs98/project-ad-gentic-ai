import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Sun,
  Moon,
} from 'lucide-react';

export function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/">
              <Logo size="md" />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link to="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </Link>
              <Link to="/pricing" className="text-sm text-foreground font-medium">
                Pricing
              </Link>
              <Link to="/team" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Team
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/sign-in">
                <button className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
                  Sign In
                </button>
              </Link>
              <Link to="/sign-up">
                <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Get Started
                </button>
              </Link>
              <button
                onClick={toggleTheme}
                className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center bg-muted">
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Start free, upgrade when you are ready to scale.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center bg-muted border border-border rounded-lg p-1 mb-16">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${!isAnnual ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${isAnnual ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Annual
            <span className={`text-xs font-semibold ${isAnnual ? 'text-blue-400' : 'text-blue-600'}`}>Save 20%</span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 text-left">
          {/* Basic */}
          <div className="bg-card border border-border rounded-xl p-6 hover:border-foreground/20 transition-colors flex flex-col">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Basic
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">Free</span>
              </div>
              <p className="text-muted-foreground text-sm mt-2">
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
                'Basic analytics',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/sign-up" className="block">
              <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
                Get Started
              </button>
            </Link>
          </div>

          {/* Premium */}
          <div className="bg-card border border-border rounded-xl p-6 hover:border-foreground/20 transition-colors flex flex-col ring-2 ring-blue-600 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
              Most Popular
            </div>
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Premium
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">
                  ${isAnnual ? '79' : '99'}
                </span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <p className="text-muted-foreground text-sm mt-2">
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
                'Custom brand voice',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/sign-up" className="block">
              <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Start Free Trial
              </button>
            </Link>
          </div>

          {/* Enterprise */}
          <div className="bg-card border border-border rounded-xl p-6 hover:border-foreground/20 transition-colors flex flex-col">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Enterprise
              </h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">
                  Custom
                </span>
              </div>
              <p className="text-muted-foreground text-sm mt-2">
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
                'White-label options',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/team#contact" className="block">
              <button className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
                Contact Sales
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I switch plans anytime?',
                a: 'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
              },
              {
                q: 'Is there a free trial for Premium?',
                a: 'Yes! We offer a 14-day free trial for the Premium plan so you can test out all the advanced features.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards (Visa, Mastercard, Amex) and PayPal.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Absolutely. There are no long-term contracts or cancellation fees. You can cancel your subscription at any time.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a 30-day money-back guarantee if you are not satisfied with our service.',
              },
            ].map((faq, i) => (
              <div key={i} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between p-4 text-left bg-card hover:bg-muted transition-colors">
                  <span className="font-medium text-foreground">{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUpIcon className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="p-4 bg-background text-muted-foreground text-sm border-t border-border">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {['Privacy', 'Terms', 'Contact', 'Careers'].map((label) => (
              <a key={label} href="#" className="hover:text-foreground transition-colors">{label}</a>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Ad-gentic. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
