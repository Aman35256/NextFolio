import { useEffect, useState } from 'react';
import {
  Award,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  ClipboardList,
  FileSearch,
  FileText,
  Gauge,
  Mic,
  Search,
  Settings,
  Send,
  TrendingUp,
  Users,
  Zap,
  Clock,
  Cpu,
  Mail,
} from 'lucide-react';
import { Card } from '../components';
import { useCareerAgentStore } from '../store/careerAgent';
import { useResumeStore } from '../store';
import {
  AIAgentIndicator,
  MetricsCard,
  ProfileCard,
} from '../features/CareerAgent/shared';

import ResumeIntelligenceDashboard from '../features/CareerAgent/ResumeIntelligence/Dashboard';
import JobDiscoveryDashboard from '../features/CareerAgent/JobDiscovery/Dashboard';
import JobMatchesDashboard from '../features/CareerAgent/JobMatches/Dashboard';
import ApplicationsDashboard from '../features/CareerAgent/Applications/Dashboard';
import InterviewPrepDashboard from '../features/CareerAgent/InterviewPrep/Dashboard';
import NotificationsDashboard from '../features/CareerAgent/Notifications/Dashboard';
import OfferAnalysisDashboard from '../features/CareerAgent/OfferAnalysis/Dashboard';
import AgentSettingsDashboard from '../features/CareerAgent/AgentSettings/Dashboard';
import EmailSyncDashboard from '../features/CareerAgent/EmailSync/Dashboard';


const TABS = [
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

const getHashTab = () => {
  if (typeof window === 'undefined') return 'dashboard';
  const hash = window.location.hash.replace('#', '');
  return TABS.some((tab) => tab.id === hash) ? hash : 'dashboard';
};

export default function CareerAgentPage() {
  const [activeTab, setActiveTab] = useState(getHashTab);
  const token = useResumeStore((state) => state.token);
  const {
    agentStatus,
    agentMessage,
    fetchSettings,
    fetchApplications,
    fetchJobs,
    fetchOffers,
    fetchInterviews,
    fetchCandidateProfile,
  } = useCareerAgentStore();

  useEffect(() => {
    const handleHashChange = () => setActiveTab(getHashTab());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (token) {
      fetchCandidateProfile(token);
      fetchSettings(token);
      fetchApplications(token);
      fetchJobs(token);
      fetchOffers(token);
      fetchInterviews(token);
    }
  }, [token]);

  const setTab = (tabId) => {
    setActiveTab(tabId);
    window.history.replaceState(null, '', `/career-agent#${tabId}`);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'resume':
        return <ResumeIntelligenceDashboard />;
      case 'discovery':
        return <JobDiscoveryDashboard />;
      case 'matches':
        return <JobMatchesDashboard />;
      case 'applications':
        return <ApplicationsDashboard />;
      case 'emailsync':
        return <EmailSyncDashboard />;
      case 'interviews':
        return <InterviewPrepDashboard />;
      case 'notifications':
        return <NotificationsDashboard />;
      case 'offers':
        return <OfferAnalysisDashboard />;
      case 'settings':
        return <AgentSettingsDashboard />;
      case 'dashboard':
      default:
        return <MainDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-brand bg-clip-text text-transparent">
            AI Career Agent
          </h1>
          <p className="text-slate-600 mt-2">
            Your autonomous job hunting assistant inside NextFolio.
          </p>
        </div>

        <AIAgentIndicator
          isActive={agentStatus !== 'idle'}
          status={agentStatus}
          message={agentMessage}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap rounded-lg transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="animate-fade-in">
        {renderTabContent()}
      </div>
    </div>
  );
}

function MainDashboard() {
  const {
    candidateProfile,
    analytics,
    jobs,
    jobMatches,
    applications,
    receivedOffers,
  } = useCareerAgentStore();
  const atsScore = useResumeStore((state) => state.atsScore);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricsCard
            label="Applications"
            value={applications.length}
            icon={BarChart3}
            change={analytics.applicationsSubmitted}
            changeType="positive"
            description="Total applications submitted"
          />
          <MetricsCard
            label="Interviews"
            value={analytics.interviewsReceived}
            icon={Users}
            change={analytics.interviewsReceived}
            changeType="positive"
            description="Interview invitations received"
          />
          <MetricsCard
            label="Offers"
            value={receivedOffers.length}
            icon={Award}
            change={receivedOffers.length}
            changeType="positive"
            description="Offers received"
          />
          <MetricsCard
            label="Success Rate"
            value={`${Math.round(analytics.applicationSuccessRate)}%`}
            icon={TrendingUp}
            description="Application success rate"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ProfileCard profile={candidateProfile || {}} atsScore={atsScore} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileSearch size={20} className="text-indigo-600" />
                Active Jobs Found
              </h3>
              <span className="text-2xl font-bold text-indigo-600">{jobs.length}</span>
            </div>
            <p className="text-sm text-slate-600">
              {jobs.length > 0
                ? `${jobs.length} job opportunities discovered in your field`
                : 'Start by analyzing your resume to find matching opportunities'}
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Top Matches</h3>
            {jobMatches.length > 0 ? (
              <div className="space-y-3">
                {jobMatches.slice(0, 3).map((match) => (
                  <div
                    key={`${match.company}-${match.title}`}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{match.title}</p>
                      <p className="text-sm text-slate-600">{match.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-indigo-600">
                        {Math.round(match.matchScore)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                No job matches yet. Analyze your resume to get started.
              </p>
            )}
          </Card>

          <Card className="p-6 space-y-4 border-l-4 border-l-orange-500">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-orange-500" />
              Pending Actions
            </h3>
            <div className="space-y-2 text-sm text-slate-600">
              {jobs.length > 0 && <p>{jobs.length} new job opportunities to review</p>}
              {applications.length > 0 && <p>{applications.length} applications in progress</p>}
              {receivedOffers.length > 0 && <p>{receivedOffers.length} offers to evaluate</p>}
              {!jobs.length && !applications.length && !receivedOffers.length && (
                <p>No pending actions yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
