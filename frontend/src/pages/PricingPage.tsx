import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function PricingPage() {
  const { theme, toggleTheme } = useTheme();
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const navLinks = [
    { label: 'Features', to: '/features' },
    { label: 'How It Works', to: '/how-it-works' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Team', to: '/team' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-8">
          <Link to="/"><Logo size="md" /></Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to}
                className={`text-sm transition-colors ${link.label === 'Pricing' ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/sign-in"
              className="hidden md:block px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors">
              Sign In
            </Link>
            <Link to="/sign-up"
              className="hidden md:block px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </Link>
            <button onClick={toggleTheme}
              className="p-2 bg-muted rounded-lg hover:bg-border transition-colors"
              aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 bg-muted rounded-lg hover:bg-border transition-colors">
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border px-4 sm:px-6 py-4 flex flex-col gap-3 bg-background">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.to}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t border-border">
              <Link to="/sign-in" className="px-4 py-2 text-sm text-center border border-border rounded-lg hover:bg-muted transition-colors">Sign In</Link>
              <Link to="/sign-up" className="px-4 py-2 text-sm text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="py-20 px-6 border-b border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight leading-[1.05]">
            Simple, <span className="text-blue-600">transparent</span> pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Start free, upgrade when you're ready to scale.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center bg-card border border-border rounded-xl p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors ${!isAnnual ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${isAnnual ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'}`}>
              Annual
              <span className={`text-xs font-semibold ${isAnnual ? 'text-blue-400' : 'text-blue-600'}`}>Save 20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">

          {/* Basic */}
          <div className="bg-card border border-border rounded-xl p-7 hover:border-foreground/20 transition-colors flex flex-col">
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Basic</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">Free</span>
              </div>
              <p className="text-muted-foreground text-sm mt-2">Perfect for trying out Ad-gentic AI</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
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
            <Link to="/sign-up"
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-border rounded-xl text-sm hover:bg-muted transition-colors">
              Get Started
            </Link>
          </div>

          {/* Premium */}
          <div className="bg-card border border-border rounded-xl p-7 flex flex-col ring-2 ring-blue-600 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
              Most Popular
            </div>
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Premium</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">${isAnnual ? '79' : '99'}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <p className="text-muted-foreground text-sm mt-2">For growing businesses ready to scale</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
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
            <Link to="/sign-up"
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              Start Free Trial
            </Link>
          </div>

          {/* Enterprise */}
          <div className="bg-card border border-border rounded-xl p-7 hover:border-foreground/20 transition-colors flex flex-col">
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-2">Enterprise</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <p className="text-muted-foreground text-sm mt-2">For large teams with specific needs</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
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
            <Link to="/team#contact"
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-border rounded-xl text-sm hover:bg-muted transition-colors">
              Contact Sales
            </Link>
          </div>

        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
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
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center justify-between p-5 text-left bg-card hover:bg-muted transition-colors">
                  <span className="font-medium text-foreground">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUpIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    : <ChevronDownIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 py-4 bg-background text-muted-foreground text-sm border-t border-border leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6">
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
