import {
  ArrowLeft,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Cpu,
  FileText,
  Globe2,
  Network,
  Palette,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/NextFolioLogo.png';

export default function AboutPage() {
  const navigate = useNavigate();

  const PILLARS = [
    {
      title: 'Resume & Portfolio Builder',
      badge: 'Creation',
      description: 'Turn your experience into polished, professional assets. Choose from modern web themes or a unique CLI-style terminal view, all with real-time side-by-side editing.',
      icon: Palette,
      features: ['Live Markdown & PDF Preview', 'Modern & CLI Portfolio Themes', 'One-Click Portfolio Publishing'],
      color: 'from-blue-600 to-cyan-500',
      shadow: 'shadow-blue-500/10',
      actionText: 'Build Resume',
      actionPath: '/',
    },
    {
      title: 'AI Career Agent',
      badge: 'Automation',
      description: 'Your 24/7 agent that automates the job search. From scanning and matching jobs based on your skills to preparing you for interviews and auto-applying to roles.',
      icon: Bot,
      features: ['Automated Job Match Scoring', 'Interactive AI Mock Interviews', 'Automated Application Submission'],
      color: 'from-indigo-600 to-purple-500',
      shadow: 'shadow-indigo-500/10',
      actionText: 'Launch Agent',
      actionPath: '/career-agent',
    },
    {
      title: 'Knowledge Map & Roadmaps',
      badge: 'Growth',
      description: 'Bridge the gap between where you are and where you want to be. Analyze your skill set against target roles and follow AI-generated learning pathways.',
      icon: Network,
      features: ['Visual Skill Graph Extraction', 'Target Role Gap Analysis', 'Daily Study & Progress Tracker'],
      color: 'from-purple-600 to-pink-500',
      shadow: 'shadow-purple-500/10',
      actionText: 'Explore Map',
      actionPath: '/knowledge-map',
    },
  ];

  const STATS = [
    { label: 'Core Pillars', value: '3' },
    { label: 'AI Subagents', value: '8+' },
    { label: 'Target Roles', value: '10+' },
    { label: 'ATS Optimized', value: '100%' },
  ];

  return (
    <main className="min-h-screen bg-slate-50/50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Background patterns */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-indigo-200/20 to-purple-200/0 blur-3xl" />
        <div className="absolute -right-1/4 -bottom-1/4 h-[800px] w-[800px] rounded-full bg-gradient-to-tr from-blue-200/20 to-pink-200/0 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Builder
          </button>
          
          <div className="group relative cursor-pointer" onClick={() => navigate('/')} tabIndex={0} aria-label="NextFolio logo">
            <img
              src={logo}
              alt="Nextfolio"
              className="h-10 w-36 rounded-xl bg-white object-cover p-1 shadow-sm transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white opacity-0 shadow-xl transition-opacity duration-200 group-hover:opacity-100">
              BUILD TODAY. IMPRESS TOMORROW.
            </span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
            The Career Development Platform
          </span>
          
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Your AI-Powered <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Career Command Center</span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            NextFolio is a unified workspace designed to help you build stunning portfolios, analyze skill gaps, and deploy intelligent AI agents to automate your job search.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-soft-sm">
              <span className="block text-3xl font-extrabold text-indigo-600">{stat.value}</span>
              <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Pillars Showcase */}
        <div className="mt-20 space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Core Capabilities</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500">Three integrated modules engineered to support your professional growth journey.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {PILLARS.map((pillar) => {
              const IconComponent = pillar.icon;
              return (
                <div 
                  key={pillar.title} 
                  className={`group relative flex flex-col rounded-3xl border border-slate-100 bg-white p-8 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-200/80 hover:shadow-xl ${pillar.shadow}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${pillar.color} text-white shadow-lg shadow-indigo-500/10`}>
                      <IconComponent className="h-6 w-6" />
                    </span>
                    <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {pillar.title}
                  </h3>
                  
                  <p className="mt-3 text-sm leading-6 text-slate-600 flex-grow">
                    {pillar.description}
                  </p>

                  <ul className="mt-6 space-y-2.5 border-t border-slate-50 pt-5">
                    {pillar.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2.5 text-xs text-slate-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => navigate(pillar.actionPath)}
                    className="mt-8 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-600 hover:shadow-md active:scale-[0.98]"
                  >
                    {pillar.actionText}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow / How it works */}
        <div className="mt-28 rounded-3xl border border-indigo-100/60 bg-gradient-to-b from-white to-slate-50/40 p-8 md:p-12 shadow-soft-lg">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">How NextFolio Works</h2>
            <p className="mt-3 text-slate-500">A seamless loop of creation, learning, and automated job matching.</p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3 relative">
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600 ring-4 ring-white">1</span>
              <h4 className="mt-4 text-base font-bold text-slate-900">Input & Parse</h4>
              <p className="mt-2 text-xs leading-5 text-slate-500 max-w-[240px]">
                Create your resume or upload an existing one. NextFolio parses the content and generates your live portfolio website.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600 ring-4 ring-white">2</span>
              <h4 className="mt-4 text-base font-bold text-slate-900">Map Skill Gaps</h4>
              <p className="mt-2 text-xs leading-5 text-slate-500 max-w-[240px]">
                Define your target career paths. The Knowledge Map identifies skills you need, creates a custom roadmap, and tracks your daily progress.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-sm font-bold text-purple-600 ring-4 ring-white">3</span>
              <h4 className="mt-4 text-base font-bold text-slate-900">Automate Search</h4>
              <p className="mt-2 text-xs leading-5 text-slate-500 max-w-[240px]">
                Deploy the Career Agent to monitor matching jobs, prepare for interviews with AI mock sessions, and auto-apply.
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-24 text-center">
          <h3 className="text-2xl font-bold text-slate-900">Ready to take the next step?</h3>
          <p className="mt-2 text-slate-500">Go ahead and start crafting your profile or let the career agent work for you.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg active:scale-95"
            >
              Start Building
            </button>
            <button
              type="button"
              onClick={() => navigate('/career-agent')}
              className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-95"
            >
              Configure AI Agent
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
