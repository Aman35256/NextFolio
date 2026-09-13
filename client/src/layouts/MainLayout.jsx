import { useEffect, useState } from 'react';
import { Menu, X, User, AlignLeft, GraduationCap, Briefcase, FolderDot, Code, Trophy, BadgeCheck, Maximize2, LockKeyhole } from 'lucide-react';
import { useResumeStore, useUIStore } from '../store';
import ResumeBuilder from '../features/ResumeBuilder';
import PortfolioPreview from '../features/PortfolioPreview';
import ResumePreview from '../features/ResumePreview';
import TerminalPreview from '../features/TerminalPreview';
import PortfolioThemeModern from '../features/themes/PortfolioThemeModern';
import DesignPanel from '../features/DesignPanel';
import TopNavbar from '../components/TopNavbar';
import Button from '../components/Button';
import { APP_VERSION } from '../lib/buildInfo';

const SIDEBAR_LINKS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'bio', label: 'Bio', icon: AlignLeft },
  { id: 'skills', label: 'Skills', icon: Code },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'projects', label: 'Projects', icon: FolderDot },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'certifications', label: 'Certifications', icon: BadgeCheck },
];

const PORTFOLIO_THEMES = {
  default: PortfolioPreview,
  modern: PortfolioThemeModern,
  classic: TerminalPreview,
};

export default function MainLayout() {
  const { activeTab, setActiveTab, sidebarOpen, setSidebarOpen, previewMode, setPreviewMode, theme, setShowAuthModal } = useUIStore();
  const token = useResumeStore((state) => state.token);
  const user = useResumeStore((state) => state.user);
  const isAuthenticated = Boolean(token && user);
  const ActivePortfolioTheme = PORTFOLIO_THEMES[theme] || PortfolioPreview;
  const [portfolioFullscreen, setPortfolioFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setPortfolioFullscreen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen bg-brand-bg flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <TopNavbar />

      {!isAuthenticated ? (
        <div className="flex-1 overflow-hidden bg-slate-50 px-6 py-8">
          <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white text-indigo-600 shadow-soft-md">
              <LockKeyhole className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-950">Log in to build your resume</h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-slate-600">
              Resume uploads, form editing, ATS generation, design tools, and publishing are available after you log in or create an account.
            </p>
            <Button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="mt-6 px-8"
            >
              Log In / Sign Up
            </Button>
            <p className="mt-5 text-xs font-medium text-slate-400">
              Build {APP_VERSION}
            </p>
          </div>
        </div>
      ) : (
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar */}
        <div
          className={`
            fixed md:relative z-40 h-full bg-white border-r border-indigo-100 shadow-soft-sm
            transition-all duration-300 ease-in-out flex flex-col
            ${sidebarOpen ? 'w-64' : 'w-0 md:w-20'}
          `}
        >
          {/* Hamburger Toggle */}
          <div className="p-4 border-b border-indigo-50 flex items-center justify-between">
            <span className={`font-bold text-brand-dark transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
              Menu
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {SIDEBAR_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200 group
                    ${isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                      : 'text-gray-600 hover:bg-slate-50 hover:text-indigo-600'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-500'}`} />
                  <span className={`font-medium transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 md:hidden w-0 overflow-hidden'}`}>
                    {link.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 3-Column Workspace */}
        <div className="flex-1 flex overflow-hidden bg-slate-50">
          
          {/* Left Column: Data Entry */}
          <div className="w-full md:w-1/3 max-w-md bg-white border-r border-indigo-100 p-6 flex flex-col h-full overflow-hidden shadow-soft-sm z-10">
            <ResumeBuilder />
          </div>

          {/* Center Column: Real-time Preview */}
          <div className="hidden lg:flex flex-1 flex-col h-full overflow-hidden p-6 bg-slate-50">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="text-xl font-bold text-slate-800">Live Preview</h2>
              <div className="flex bg-slate-200 p-1 rounded-lg">
                <button
                  onClick={() => {
                    setPortfolioFullscreen(false);
                    setPreviewMode('resume');
                  }}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                    previewMode === 'resume'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  ATS Resume
                </button>
                <button
                  onClick={() => setPreviewMode('portfolio')}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                    previewMode === 'portfolio'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Web Portfolio
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft-md h-full w-full overflow-hidden flex flex-col border border-indigo-50">
              <div className="bg-slate-100 p-3 flex items-center gap-2 border-b border-gray-200">
                <div className="flex gap-1.5 ml-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="bg-white flex-1 mx-4 rounded-md text-center text-xs text-gray-500 py-1 shadow-sm font-medium">
                  {previewMode === 'resume' ? 'resume.pdf (preview)' : 'portfolio.nextfolio.app'}
                </div>
                {previewMode === 'portfolio' && (
                  <button
                    type="button"
                    onClick={() => setPortfolioFullscreen(true)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-indigo-600 transition-colors"
                    aria-label="Open portfolio fullscreen"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto">
                {previewMode === 'resume' && <ResumePreview />}
                {previewMode === 'portfolio' && <ActivePortfolioTheme />}
              </div>
            </div>
          </div>

          {/* Right Column: Customization Engine */}
          <div className="hidden xl:flex w-80 bg-white border-l border-indigo-100 shadow-soft-sm flex-col h-full z-10">
            <DesignPanel />
          </div>
        </div>
      </div>
      )}

      {/* Modals */}
      {portfolioFullscreen && (
        <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col">
          <div className="h-12 bg-slate-900 border-b border-white/10 flex items-center gap-3 px-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="flex-1 text-center text-xs font-medium text-slate-300">
              portfolio.nextfolio.app
            </div>
            <button
              type="button"
              onClick={() => setPortfolioFullscreen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Close fullscreen portfolio"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            <ActivePortfolioTheme />
          </div>
        </div>
      )}
    </div>
  );
}
