import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  Gauge,
  LockKeyhole,
  Menu,
  Mic,
  Search,
  Settings,
  Send,
  X,
  Mail,
} from 'lucide-react';
import { useResumeStore } from '../store';
import TopNavbar from '../components/TopNavbar';
import Button from '../components/Button';
import { APP_VERSION } from '../lib/buildInfo';

const CAREER_AGENT_LINKS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'resume', label: 'Resume Intelligence', icon: FileText },
  { id: 'discovery', label: 'Job Discovery', icon: Search },
  { id: 'matches', label: 'Job Matches', icon: Gauge },
  { id: 'emailsync', label: 'Email Monitoring', icon: Mail },
  { id: 'applications', label: 'Applications', icon: ClipboardList },
  { id: 'interviews', label: 'Interview Prep', icon: Mic },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'offers', label: 'Offer Analysis', icon: BriefcaseBusiness },
  { id: 'settings', label: 'Agent Settings', icon: Settings },
];

export default function CareerAgentLayout({ children }) {
  const navigate = useNavigate();
  const token = useResumeStore((state) => state.token);
  const user = useResumeStore((state) => state.user);
  const isAuthenticated = Boolean(token && user);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-brand-bg flex flex-col overflow-hidden">
        <TopNavbar />
        <div className="flex-1 overflow-hidden bg-slate-50 px-6 py-8">
          <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white text-indigo-600 shadow-soft-md">
              <LockKeyhole className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-950">
              Log in to access AI Career Agent
            </h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-slate-600">
              Upload your resume and let NextFolio help find, evaluate, and track the best job opportunities for you.
            </p>
            <Button type="button" onClick={() => navigate('/login')} className="mt-6 px-8">
              Log In / Sign Up
            </Button>
            <p className="mt-5 text-xs font-medium text-slate-400">
              NextFolio {APP_VERSION}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-brand-bg flex flex-col overflow-hidden">
      <TopNavbar />

      <div className="flex-1 flex overflow-hidden relative">
        <div
          className={`fixed md:relative z-40 h-full bg-white border-r border-indigo-100 shadow-soft-sm transition-all duration-300 ease-in-out flex flex-col ${
            sidebarOpen ? 'w-64' : 'w-0 md:w-20'
          }`}
        >
          <div className="p-4 border-b border-indigo-50 flex items-center justify-between">
            <span
              className={`font-bold text-brand-dark transition-opacity duration-300 ${
                sidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'
              }`}
            >
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

          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {CAREER_AGENT_LINKS.map((link) => {
              const Icon = link.icon;

              return (
                <a
                  key={link.id}
                  href={`/career-agent#${link.id}`}
                  onClick={() => setSidebarOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-gray-600 hover:bg-slate-50 hover:text-indigo-600 hover:shadow-sm"
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span
                    className={`font-medium transition-all duration-300 ${
                      sidebarOpen
                        ? 'opacity-100 w-auto'
                        : 'opacity-0 md:hidden w-0 overflow-hidden'
                    }`}
                  >
                    {link.label}
                  </span>
                </a>
              );
            })}
          </nav>

          <div className="p-4 border-t border-indigo-50">
            <a
              href="/"
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all text-sm font-medium"
            >
              <span>&larr;</span>
              <span className={`transition-all duration-300 ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 md:hidden w-0'}`}>
                Back
              </span>
            </a>
          </div>
        </div>

        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 overflow-auto bg-slate-50 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
