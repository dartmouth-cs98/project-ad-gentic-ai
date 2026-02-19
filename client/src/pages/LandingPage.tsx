import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import {
  SparklesIcon,
  BrainIcon,
  Share2Icon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckIcon,
  PlayCircleIcon,
  MailIcon,
  PhoneIcon,
  TwitterIcon,
  LinkedinIcon,
  GithubIcon,
  UploadIcon,
  UsersIcon,
  WandIcon,
  BarChart3Icon,
  InstagramIcon,
  YoutubeIcon,
  FacebookIcon,
  Music2Icon,
  SearchIcon,
  FlameIcon,
  FileTextIcon,
  ScaleIcon,
  ClockIcon,
  ZapIcon,
  AwardIcon,
  ActivityIcon,
  HeartIcon,
  ThumbsUpIcon,
  ShoppingCartIcon } from
'lucide-react';
export function LandingPage() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [activePersona, setActivePersona] = useState(0);
  const [isAutoCycling, setIsAutoCycling] = useState(true);
  const [mousePos, setMousePos] = useState({
    x: 0,
    y: 0
  });
  const heroRef = useRef<HTMLDivElement>(null);
  const personas = [
  {
    id: 0,
    name: 'The Skeptic',
    color: 'teal',
    theme: {
      primary: 'from-teal-500 to-cyan-600',
      accent: 'text-teal-500',
      bg: 'bg-teal-50',
      border: 'border-teal-200'
    }
  },
  {
    id: 1,
    name: 'The Impulse Buyer',
    color: 'orange',
    theme: {
      primary: 'from-orange-500 to-red-600',
      accent: 'text-orange-500',
      bg: 'bg-orange-50',
      border: 'border-orange-200'
    }
  },
  {
    id: 2,
    name: 'The Researcher',
    color: 'blue',
    theme: {
      primary: 'from-blue-500 to-indigo-600',
      accent: 'text-blue-500',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    }
  }];

  const currentTheme = personas[activePersona].theme;
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoCycling) {
      interval = setInterval(() => {
        setActivePersona((prev) => (prev + 1) % personas.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isAutoCycling, personas.length]);
  const handlePersonaClick = (index: number) => {
    setActivePersona(index);
    setIsAutoCycling(false);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (heroRef.current) {
      const rect = heroRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };
  return (
    <div className="min-h-screen bg-white overflow-x-hidden transition-colors duration-500">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentTheme.primary} flex items-center justify-center transition-all duration-500`}>

                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-lg text-slate-900">
                Ad-gentic AI
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors">

                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors">

                How It Works
              </a>
              <a
                href="#pricing"
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors">

                Pricing
              </a>
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
                  className={`bg-gradient-to-r ${currentTheme.primary} text-white border-none shadow-md transition-all duration-500`}>

                  Try Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

        {/* Cursor Trail */}
        <div
          className="absolute pointer-events-none w-64 h-64 rounded-full blur-3xl opacity-20 transition-colors duration-500 z-0"
          style={{
            left: mousePos.x - 128,
            top: mousePos.y - 128,
            background:
            activePersona === 0 ?
            '#14b8a6' :
            activePersona === 1 ?
            '#f97316' :
            '#3b82f6'
          }} />


        {/* Neural Network Background Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20">
          <path
            d="M100,100 Q400,50 600,300 T1000,200"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-slate-300 neural-line" />

          <path
            d="M-50,400 Q300,300 500,600 T900,500"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-slate-300 neural-line"
            style={{
              animationDelay: '1s'
            }} />

          <path
            d="M800,50 Q600,400 900,600"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-slate-300 neural-line"
            style={{
              animationDelay: '2s'
            }} />

        </svg>

        {/* Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div
            className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-3xl mesh-blob transition-colors duration-1000 ${activePersona === 0 ? 'bg-teal-500/10' : activePersona === 1 ? 'bg-orange-500/10' : 'bg-blue-500/10'}`}
            style={{
              animationDelay: '0s'
            }} />

          <div
            className={`absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full blur-3xl mesh-blob transition-colors duration-1000 ${activePersona === 0 ? 'bg-cyan-500/10' : activePersona === 1 ? 'bg-red-500/10' : 'bg-indigo-500/10'}`}
            style={{
              animationDelay: '-5s'
            }} />

          <div
            className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] bg-purple-500/10 rounded-full blur-3xl mesh-blob"
            style={{
              animationDelay: '-10s'
            }} />

        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 border transition-all duration-500 ${currentTheme.bg} ${currentTheme.accent} ${currentTheme.border}`}>

                <SparklesIcon className="w-4 h-4" />
                AI-Powered Ad Generation
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Stop Guessing.{' '}
                <span
                  className={`text-transparent bg-clip-text bg-gradient-to-r ${currentTheme.primary} transition-all duration-500`}>

                  Start Resonating.
                </span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
                Ad-gentic AI reads the psychology behind every scroll, click,
                and purchase — then creates ads that speak to each person's
                motivations.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/sign-up">
                  <Button
                    size="lg"
                    rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                    className={`bg-gradient-to-r ${currentTheme.primary} text-white border-none shadow-lg text-shadow-sm transition-all duration-500`}>

                    Start Your Growth Engine
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  size="lg"
                  leftIcon={<PlayCircleIcon className="w-5 h-5" />}>

                  Watch Demo
                </Button>
              </div>
              <div className="mt-10 flex items-center gap-8">
                <div>
                  <p className="text-3xl font-bold text-slate-900">43%</p>
                  <p className="text-sm text-slate-500">Avg. CTR Increase</p>
                </div>
                <div className="w-px h-12 bg-slate-200" />
                <div>
                  <p className="text-3xl font-bold text-slate-900">2.4M+</p>
                  <p className="text-sm text-slate-500">Ads Generated</p>
                </div>
                <div className="w-px h-12 bg-slate-200" />
                <div>
                  <p className="text-3xl font-bold text-slate-900">500+</p>
                  <p className="text-sm text-slate-500">Happy Brands</p>
                </div>
              </div>
            </div>

            {/* Split Personality Showcase */}
            <div className="relative lg:h-[600px] flex flex-col items-center justify-center">
              {/* Abstract Platform Preview Card */}
              <div className="w-64 h-36 bg-white rounded-2xl shadow-lg border border-slate-100 mb-8 p-4 relative z-20 overflow-hidden">
                <div className="w-full h-12 bg-gradient-to-r from-slate-200 via-blue-100 to-purple-100 rounded-lg mb-3" />
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      Your Product Here
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <BrainIcon className="w-2.5 h-2.5 text-teal-500" />
                      <span className="text-[9px] text-teal-600 font-medium">
                        Targeted to: The Skeptic
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <SparklesIcon className="w-2.5 h-2.5 text-amber-500" />
                      <span className="text-xs font-bold text-slate-900">
                        94%
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400">
                      Match Score
                    </span>
                  </div>
                </div>
              </div>

              {/* Persona Tabs */}
              <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 relative z-20">
                {personas.map((persona, index) =>
                <button
                  key={persona.id}
                  onClick={() => handlePersonaClick(index)}
                  className={`
                      px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300
                      ${activePersona === index ? `bg-gradient-to-r ${persona.theme.primary} text-white shadow-lg scale-105` : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}
                    `}>

                    {persona.name}
                  </button>
                )}
              </div>

              {/* Ad Variant Cards Container */}
              <div className="relative w-full max-w-md h-56 sm:h-80 perspective-1000">
                {/* The Skeptic Variant - BLUEPRINT STYLE */}
                <div
                  className={`
                    absolute inset-0 bg-slate-900 bg-gradient-to-br from-slate-900 to-teal-950 rounded-2xl border border-teal-800 shadow-2xl p-4 sm:p-6 transition-all duration-500 ease-out blueprint-grid overflow-hidden flex flex-col
                    ${activePersona === 0 ? 'opacity-100 scale-100 z-30 translate-x-0 persona-glow' : 'opacity-40 scale-90 z-10 translate-x-12 translate-y-4 blur-[1px]'}
                  `}
                  style={
                  {
                    '--persona-glow': 'rgba(20, 184, 166, 0.3)',
                    backgroundColor: '#0f1d2e',
                    backgroundImage:
                    'linear-gradient(to bottom right, #0f172a, #042f2e), linear-gradient(rgba(20, 184, 166, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 184, 166, 0.08) 1px, transparent 1px)',
                    backgroundSize: '100% 100%, 20px 20px, 20px 20px'
                  } as React.CSSProperties
                  }>

                  <div className="hidden sm:flex absolute top-4 right-4 items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                    <span className="text-[10px] text-teal-500 font-mono tracking-widest">
                      LIVE DATA
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2 sm:mb-4 text-teal-400">
                    <FileTextIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest font-mono">
                      SPEC SHEET v2.4
                    </span>
                  </div>

                  <h3 className="text-base sm:text-xl font-bold text-white mb-1 sm:mb-2 font-mono tracking-tight">
                    4.8<span className="text-teal-400">★</span>{' '}
                    <span className="text-slate-400 text-sm sm:text-base font-normal">
                      | 12,847 verified
                    </span>
                  </h3>

                  <p className="text-slate-300 text-xs sm:text-sm mb-2 sm:mb-4 font-mono leading-relaxed border-l-2 border-teal-800 pl-3 line-clamp-1 sm:line-clamp-none">
                    Lab-tested. BPA-free.
                    <span className="hidden sm:inline">
                      <br />
                      24hr insulation certified.
                    </span>
                  </p>

                  <div className="bg-slate-800/50 rounded p-2.5 border border-teal-900/50 mb-2 sm:mb-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between text-[10px] sm:text-xs text-teal-200/70 mb-1.5 font-mono">
                      <span>DURABILITY INDEX</span>
                      <span className="font-bold text-teal-400">98.4%</span>
                    </div>
                    <div className="h-1.5 sm:h-2 bg-slate-900 rounded-full overflow-hidden border border-teal-900">
                      <div className="h-full w-[98%] bg-teal-500 rounded-full relative">
                        <div className="absolute right-0 top-0 bottom-0 w-px bg-white/50" />
                      </div>
                    </div>
                    <div className="flex justify-between mt-1 opacity-50">
                      {[...Array(10)].map((_, i) =>
                      <div
                        key={i}
                        className="w-px h-0.5 sm:h-1 bg-teal-900" />

                      )}
                    </div>
                  </div>

                  <div className="mt-auto">
                    <Button
                      size="sm"
                      className="w-full bg-teal-600 hover:bg-teal-500 text-white border border-teal-400/30 font-mono text-[10px] sm:text-xs tracking-wider">

                      VIEW TECHNICAL REPORT
                    </Button>
                  </div>
                </div>

                {/* The Impulse Buyer Variant */}
                <div
                  className={`
                    absolute inset-0 bg-white bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-300 shadow-xl p-4 sm:p-6 transition-all duration-500 ease-out
                    ${activePersona === 1 ? 'opacity-100 scale-100 z-30 translate-x-0 persona-glow' : activePersona === 0 ? 'opacity-40 scale-90 z-10 translate-x-12 translate-y-4 blur-[1px]' : 'opacity-40 scale-90 z-10 -translate-x-12 translate-y-4 blur-[1px]'}
                  `}
                  style={
                  {
                    '--persona-glow': 'rgba(249, 115, 22, 0.3)'
                  } as React.CSSProperties
                  }>

                  <div className="flex items-center gap-2 mb-2 sm:mb-4 text-orange-600">
                    <FlameIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                      Limited Time Offer
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900 mb-1.5 sm:mb-2 leading-tight">
                    🔥 SELLING FAST — 73% Gone!
                  </h3>
                  <p className="text-slate-700 text-xs sm:text-sm mb-3 sm:mb-4 font-medium">
                    Free shipping ends tonight. Don't miss out on the viral
                    bottle everyone is talking about.
                  </p>
                  <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-red-100 text-red-700 text-[10px] sm:text-xs font-bold rounded">
                      Low Stock
                    </span>
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-orange-100 text-orange-700 text-[10px] sm:text-xs font-bold rounded">
                      Free Ship
                    </span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white border-none shadow-lg shadow-orange-500/30">

                    Buy Now - $39
                  </Button>
                </div>

                {/* The Researcher Variant */}
                <div
                  className={`
                    absolute inset-0 bg-white bg-blue-50 rounded-2xl border border-blue-300 shadow-xl p-4 sm:p-6 transition-all duration-500 ease-out
                    ${activePersona === 2 ? 'opacity-100 scale-100 z-30 translate-x-0 persona-glow' : 'opacity-40 scale-90 z-10 -translate-x-12 translate-y-4 blur-[1px]'}
                  `}
                  style={
                  {
                    '--persona-glow': 'rgba(59, 130, 246, 0.3)'
                  } as React.CSSProperties
                  }>

                  <div className="flex items-center gap-2 mb-2 sm:mb-4 text-blue-600">
                    <ScaleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
                      Feature Comparison
                    </span>
                  </div>
                  <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-1.5 sm:mb-2">
                    vs. Hydro Flask vs. Yeti — See the Data
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm mb-3 sm:mb-4">
                    Side-by-side comparison of 14 features including thermal
                    retention and weight.
                  </p>
                  <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                    <div className="flex justify-between text-[10px] sm:text-xs border-b border-blue-200 pb-1">
                      <span className="text-slate-500">Thermal Retention</span>
                      <span className="font-bold text-blue-700">
                        24h vs 12h
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] sm:text-xs border-b border-blue-200 pb-1">
                      <span className="text-slate-500">Weight (oz)</span>
                      <span className="font-bold text-blue-700">
                        10.2 vs 14.5
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">

                    Compare All Models
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Human Impact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Video Player Placeholder */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 aspect-video group">
              <div className="absolute inset-0 flex">
                {/* Split Screen Left: AI Ad */}
                <div className="w-1/2 bg-slate-800 p-4 border-r border-slate-700 flex flex-col justify-center items-center">
                  <div className="w-full aspect-[9/16] bg-slate-700 rounded-lg mb-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
                    <div className="absolute bottom-4 left-4 right-4 h-2 bg-slate-600 rounded-full animate-pulse" />
                    <div className="absolute bottom-8 left-4 w-1/2 h-2 bg-slate-600 rounded-full animate-pulse" />
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    AI GENERATING...
                  </span>
                </div>

                {/* Split Screen Right: Live Sentiment */}
                <div className="w-1/2 bg-slate-900 p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-green-400 font-mono flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      LIVE SENTIMENT
                    </span>
                    <span className="text-xs text-slate-500">t=0.4s</span>
                  </div>

                  <div className="flex-1 relative">
                    <svg className="w-full h-full overflow-visible">
                      <path
                        d="M0,100 C20,100 40,80 60,60 S100,20 140,30 S180,50 220,10"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        className="animate-draw" />

                      <area />
                    </svg>
                    <div className="absolute top-0 right-0 p-2 bg-slate-800/80 rounded backdrop-blur-sm border border-slate-700">
                      <div className="text-xl font-bold text-white">94%</div>
                      <div className="text-[10px] text-slate-400">POSITIVE</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors cursor-pointer">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                  <PlayCircleIcon className="w-8 h-8 text-white fill-white" />
                </div>
              </div>
            </div>

            {/* Right: Customer Reaction */}
            <div className="relative">
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full mb-4 border border-emerald-100">
                  <ActivityIcon className="w-3 h-3" />
                  Real Platform Result
                </div>

                <h2 className="text-3xl font-bold text-slate-900 mb-6 font-serif italic">
                  "The Skeptic-targeted variant outperformed our generic ads by
                  3x."
                </h2>

                <Card
                  variant="glass"
                  className="bg-white/60 backdrop-blur-xl border-white/50 shadow-xl p-6">

                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-lg font-bold text-slate-600">
                        JD
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-0.5 rounded-full border-2 border-white">
                        <CheckIcon className="w-3 h-3" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900">
                          James D., Marketing Lead
                        </h4>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                          Ad-gentic User
                        </span>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        The comparison chart format caught eyes we were missing
                        before. Our Skeptic segment now converts at 2x the rate
                        of our old generic creative.
                      </p>
                      <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" /> 2 mins ago
                        </span>
                        <span className="flex items-center gap-1 text-red-500">
                          <HeartIcon className="w-3 h-3 fill-current" /> 24
                          likes
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Logos Bar */}
      <section className="py-10 border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-slate-500 mb-6">
            Deploy across every major platform
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="flex items-center gap-2 cursor-default hover:scale-110 transition-transform duration-300">
              <FacebookIcon className="w-6 h-6 text-blue-600" />
              <span className="font-bold text-slate-700">Meta</span>
            </div>
            <div className="flex items-center gap-2 cursor-default hover:scale-110 transition-transform duration-300">
              <Music2Icon className="w-6 h-6 text-black" />
              <span className="font-bold text-slate-700">TikTok</span>
            </div>
            <div className="flex items-center gap-2 cursor-default hover:scale-110 transition-transform duration-300">
              <InstagramIcon className="w-6 h-6 text-pink-600" />
              <span className="font-bold text-slate-700">Instagram</span>
            </div>
            <div className="flex items-center gap-2 cursor-default hover:scale-110 transition-transform duration-300">
              <YoutubeIcon className="w-6 h-6 text-red-600" />
              <span className="font-bold text-slate-700">YouTube</span>
            </div>
            <div className="flex items-center gap-2 cursor-default hover:scale-110 transition-transform duration-300">
              <SearchIcon className="w-6 h-6 text-blue-500" />
              <span className="font-bold text-slate-700">Google Ads</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Your Ads, Their Psychology
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We don't just generate ads. We decode what makes each person tick.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card
              variant="elevated"
              padding="lg"
              className="border-l-4 border-l-blue-500">

              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
                <BrainIcon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                AI Psychological Profiling
              </h3>
              <p className="text-slate-600">
                Generate 10+ ad variants targeting distinct personality types —
                The Skeptic, The Impulse Buyer, The Researcher, and more.
              </p>
            </Card>

            <Card
              variant="elevated"
              padding="lg"
              className="border-l-4 border-l-purple-500">

              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                <Share2Icon className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Multi-Platform Deployment
              </h3>
              <p className="text-slate-600">
                Deploy to Meta, TikTok, Instagram, and YouTube from one
                dashboard. We handle the formatting automatically.
              </p>
            </Card>

            <Card
              variant="elevated"
              padding="lg"
              className="border-l-4 border-l-emerald-500">

              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                <ShieldCheckIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Human-Verified Creative
              </h3>
              <p className="text-slate-600">
                Every ad passes through human review before deployment. AI
                generates, humans validate for quality assurance.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        id="how-it-works"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">

        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }} />


        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Four Steps to Ads That Actually Connect
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Our streamlined process makes ad creation effortless.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200 rounded-full" />

            <div className="text-center relative group">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-blue-500 text-blue-500 flex items-center justify-center mx-auto mb-4 relative z-10 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <UploadIcon className="w-5 h-5" />
              </div>
              <div className="text-sm font-medium text-blue-500 mb-2">
                Step 1
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Upload Your Data
              </h3>
              <p className="text-sm text-slate-600">
                Import customer data and product information to get started.
              </p>
            </div>

            <div className="text-center relative group">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-purple-500 text-purple-500 flex items-center justify-center mx-auto mb-4 relative z-10 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <UsersIcon className="w-5 h-5" />
              </div>
              <div className="text-sm font-medium text-purple-500 mb-2">
                Step 2
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                AI Builds Personas
              </h3>
              <p className="text-sm text-slate-600">
                Our AI analyzes data to create psychological profiles of your
                audience.
              </p>
            </div>

            <div className="text-center relative group">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-pink-500 text-pink-500 flex items-center justify-center mx-auto mb-4 relative z-10 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <WandIcon className="w-5 h-5" />
              </div>
              <div className="text-sm font-medium text-pink-500 mb-2">
                Step 3
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Generate & Iterate
              </h3>
              <p className="text-sm text-slate-600">
                Chat with AI to refine your ads until they're perfect.
              </p>
            </div>

            <div className="text-center relative group">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-emerald-500 text-emerald-500 flex items-center justify-center mx-auto mb-4 relative z-10 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BarChart3Icon className="w-5 h-5" />
              </div>
              <div className="text-sm font-medium text-emerald-500 mb-2">
                Step 4
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Deploy & Measure
              </h3>
              <p className="text-sm text-slate-600">
                Launch across platforms and track performance in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Start free, upgrade when you're ready to scale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basic */}
            <Card
              variant="elevated"
              padding="lg"
              className="border-t-4 border-t-slate-200">

              <div className="text-slate-900">
                <h3 className="text-xl font-semibold mb-2">Basic</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold">Free</span>
                </div>
                <p className="text-slate-500 text-sm mb-6">
                  Perfect for trying out Ad-gentic AI
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">
                      3 version histories per chat
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">20 chats per month</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">3 ad campaigns</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">
                      10 downloads per month
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">Limited reach</span>
                  </li>
                </ul>
                <Link to="/sign-up" className="block">
                  <Button variant="secondary" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Premium - Highlighted */}
            <Card
              variant="elevated"
              padding="lg"
              className="ring-2 ring-orange-500 relative shadow-orange-100">

              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-full shadow-lg">
                Most Popular
              </div>
              <div className="text-slate-900">
                <h3 className="text-xl font-semibold mb-2">Premium</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold">$99</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <p className="text-slate-500 text-sm mb-6">
                  For growing businesses ready to scale
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">
                      Unlimited version history
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">Unlimited chats</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">Unlimited campaigns</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">Unlimited downloads</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">
                      Full reach + automated posting
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">Priority support</span>
                  </li>
                </ul>
                <Link to="/sign-up" className="block">
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-none shadow-lg shadow-orange-500/25">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Enterprise */}
            <Card
              variant="elevated"
              padding="lg"
              className="border-t-4 border-t-blue-500">

              <div className="text-slate-900">
                <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold">Custom</span>
                </div>
                <p className="text-slate-500 text-sm mb-6">
                  For large teams with specific needs
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">
                      Everything in Premium
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">
                      Dedicated account manager
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">Custom integrations</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">SLA guarantee</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm">
                    <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600">Team workspaces</span>
                  </li>
                </ul>
                <a href="#contact">
                  <Button variant="secondary" className="w-full">
                    Contact Sales
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider rounded-full mb-4 border border-green-100">
              <AwardIcon className="w-3 h-3" />
              Verified Results
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Trusted by Growing Brands
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              See how businesses are transforming their advertising with
              Ad-gentic AI.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card variant="elevated" padding="lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white">
                  <ZapIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    NovaTech Solutions
                  </p>
                  <p className="text-sm text-slate-500">SaaS Company</p>
                </div>
              </div>
              <p className="text-slate-600 mb-4 font-serif italic text-lg">
                "Ad-gentic AI helped us understand our audience segments we
                didn't even know existed. Our CTR increased by 43% in the first
                month."
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-2xl font-bold text-emerald-500">+43%</p>
                  <p className="text-xs text-slate-500">CTR Increase</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-500">2.1x</p>
                  <p className="text-xs text-slate-500">ROAS</p>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white">
                  <HeartIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    BloomFit Wellness
                  </p>
                  <p className="text-sm text-slate-500">E-commerce</p>
                </div>
              </div>
              <p className="text-slate-600 mb-4 font-serif italic text-lg">
                "The psychological profiling feature is a game-changer. We're
                now speaking directly to each customer's motivations."
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-2xl font-bold text-emerald-500">+67%</p>
                  <p className="text-xs text-slate-500">Conversion Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-500">-32%</p>
                  <p className="text-xs text-slate-500">CPA</p>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white">
                  <ShoppingCartIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">SwiftCart</p>
                  <p className="text-sm text-slate-500">Marketplace</p>
                </div>
              </div>
              <p className="text-slate-600 mb-4 font-serif italic text-lg">
                "We went from spending hours on ad creative to generating 10
                variants in minutes. The time savings alone are worth it."
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-2xl font-bold text-emerald-500">10x</p>
                  <p className="text-xs text-slate-500">Faster Creation</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-500">+28%</p>
                  <p className="text-xs text-slate-500">Engagement</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Meet the Team
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We're a team of marketers, engineers, and psychologists building
              the future of advertising.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-4">
                SJ
              </div>
              <h3 className="font-semibold text-slate-900">Sarah Johnson</h3>
              <p className="text-sm text-slate-500">CEO & Co-founder</p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-4">
                MC
              </div>
              <h3 className="font-semibold text-slate-900">Michael Chen</h3>
              <p className="text-sm text-slate-500">CTO & Co-founder</p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-4">
                EP
              </div>
              <h3 className="font-semibold text-slate-900">Emily Park</h3>
              <p className="text-sm text-slate-500">Head of AI Research</p>
            </div>

            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-4">
                DR
              </div>
              <h3 className="font-semibold text-slate-900">David Rodriguez</h3>
              <p className="text-sm text-slate-500">Head of Psychology</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Ready to Transform Your Advertising?
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Get in touch with our team to learn how Ad-gentic AI can help
                your business grow.
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <MailIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email us at</p>
                    <a
                      href="mailto:hello@adgentic.ai"
                      className="font-medium text-slate-900 hover:text-blue-600 transition-colors">

                      hello@adgentic.ai
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <PhoneIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Call us at</p>
                    <a
                      href="tel:+15550123"
                      className="font-medium text-slate-900 hover:text-blue-600 transition-colors">

                      +1 (555) 012-3456
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-semibold text-slate-900 mb-6">
                Request a Call
              </h3>
              <form className="space-y-4">
                <Input
                  label="Your Name"
                  placeholder="John Smith"
                  value={contactForm.name}
                  onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    name: e.target.value
                  })
                  } />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="john@company.com"
                  value={contactForm.email}
                  onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    email: e.target.value
                  })
                  } />

                <Textarea
                  label="Message"
                  placeholder="Tell us about your advertising goals..."
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    message: e.target.value
                  })
                  } />

                <Button className="w-full">Request a Call</Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A1628] text-white py-16 px-4 sm:px-6 lg:px-8">
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
                  <a
                    href="#features"
                    className="hover:text-white transition-colors">

                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors">

                    Pricing
                  </a>
                </li>
                <li>
                  <span className="opacity-40 cursor-default">
                    Integrations (Coming Soon)
                  </span>
                </li>
                <li>
                  <span className="opacity-40 cursor-default">
                    API (Coming Soon)
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <a
                    href="#contact"
                    className="hover:text-white transition-colors">

                    About
                  </a>
                </li>
                <li>
                  <span className="opacity-40 cursor-default">
                    Blog (Coming Soon)
                  </span>
                </li>
                <li>
                  <span className="opacity-40 cursor-default">
                    Careers (Coming Soon)
                  </span>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="hover:text-white transition-colors">

                    Contact
                  </a>
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