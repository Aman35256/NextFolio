import { useEffect, useState } from 'react';
import { Card, Button, Badge } from '../../../components';
import { ClipboardList, Building2, MapPin, DollarSign, Calendar, Eye, Send, Users, ChevronRight, Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import { useCareerAgentStore } from '../../../store/careerAgent';
import { useResumeStore } from '../../../store';
import TimelineStatus from '../shared/TimelineStatus';

const TIMELINE_STEPS = [
  { id: 'applied', label: 'Applied', status: 'applied' },
  { id: 'viewed', label: 'Viewed', status: 'viewed' },
  { id: 'under_review', label: 'Under Review', status: 'under_review' },
  { id: 'assessment', label: 'Assessment', status: 'assessment' },
  { id: 'interview_scheduled', label: 'Interview Scheduled', status: 'interview_scheduled' },
  { id: 'interview_completed', label: 'Interview Completed', status: 'interview_completed' },
  { id: 'offer', label: 'Offer Received', status: 'offer_received' }
];

export default function ApplicationsDashboard() {
  const token = useResumeStore((state) => state.token);
  const {
    applications,
    applicationsLoading,
    fetchApplications,
    updateApplicationStatusOnServer,
  } = useCareerAgentStore();

  const [selectedApp, setSelectedApp] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [outreachType, setOutreachType] = useState('recruiter');
  const [outreachData, setOutreachData] = useState(null);
  const [outreachLoading, setOutreachLoading] = useState(false);

  useEffect(() => {
    if (token) {
      fetchApplications(token);
    }
  }, [token]);

  const handleStatusChange = async (appId, newStatus) => {
    const success = await updateApplicationStatusOnServer(appId, newStatus, token);
    if (success) {
      if (selectedApp?.id === appId) {
        setSelectedApp({ ...selectedApp, status: newStatus });
      }
    }
  };

  const handleGenerateOutreach = async (appId, type) => {
    setOutreachLoading(true);
    setOutreachType(type);
    setOutreachData(null);
    try {
      const response = await fetch(`/api/career-agents/applications/${appId}/outreach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type }),
      });
      if (!response.ok) throw new Error('Outreach generation failed');
      const data = await response.json();
      setOutreachData(data.outreach);
    } catch (err) {
      console.error(err);
      alert('Failed to generate outreach letter.');
    } finally {
      setOutreachLoading(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'interviews') return ['interview_scheduled', 'interview_completed'].includes(app.status);
    if (activeFilter === 'offers') return app.status === 'offer_received';
    return app.status === activeFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'offer_received':
        return <Badge variant="success">Offer Received</Badge>;
      case 'interview_scheduled':
        return <Badge variant="primary">Interview Scheduled</Badge>;
      case 'interview_completed':
        return <Badge variant="primary">Interview Completed</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'applied':
        return <Badge variant="glass">Applied</Badge>;
      case 'manual_completion_required':
        return <Badge variant="warning">Manual Action Required</Badge>;
      default:
        return <Badge variant="warning">{status.replace('_', ' ')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Application Tracking</h2>
          <p className="text-slate-600 mt-1">
            Monitor your active pipeline stages and networking correspondence.
          </p>
        </div>
        <Button
          onClick={() => fetchApplications(token)}
          disabled={applicationsLoading}
          className="flex items-center gap-2 bg-gradient-brand text-white shadow-soft-sm font-semibold"
        >
          <RefreshCw className={`h-4 w-4 ${applicationsLoading ? 'animate-spin' : ''}`} />
          {applicationsLoading ? 'Refreshing...' : 'Refresh Status'}
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        {['all', 'applied', 'under_review', 'interviews', 'offers', 'rejected'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 border-b-2 font-semibold text-sm whitespace-nowrap transition-all ${
              activeFilter === filter
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applications List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredApps.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <ClipboardList className="h-12 w-12 text-indigo-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">No Applications Found</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                No active applications in this category. Apply for jobs to populate your track record.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredApps.map((app) => (
                <Card
                  key={app.id}
                  onClick={() => { setSelectedApp(app); setOutreachData(null); }}
                  className={`p-4 flex items-center justify-between gap-4 cursor-pointer hover:shadow-soft-md transition-all border ${
                    selectedApp?.id === app.id ? 'border-indigo-600 bg-indigo-50/20' : 'border-slate-100 bg-white hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-base">{app.role}</h4>
                      {getStatusBadge(app.status)}
                      {app.autoApplied && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                          ⚡ Auto-applied
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-600 flex items-center gap-1">
                      <Building2 size={14} className="text-slate-400" />
                      {app.company}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                      <Calendar size={13} className="text-slate-400" />
                      Submitted: {new Date(app.submissionTimestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-slate-400" />
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Selected Application Tracking Detail */}
        <div className="lg:col-span-1">
          {selectedApp ? (
            <Card className="p-6 sticky top-6 space-y-6 shadow-soft-lg border border-slate-100">
              <div className="space-y-2 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-extrabold text-slate-900">{selectedApp.role}</h3>
                <p className="text-slate-600 font-bold">{selectedApp.company}</p>
                <div className="pt-1">{getStatusBadge(selectedApp.status)}</div>
              </div>



              {selectedApp.status === 'manual_completion_required' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                  <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-600" /> Action Required
                  </h5>
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    We couldn't complete this application automatically because the website requires manual interaction.
                  </p>
                  {selectedApp.notes && (
                    <p className="text-[11px] text-amber-605 italic leading-relaxed">
                      Reason: {selectedApp.notes}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-1.5"
                      onClick={() => window.open(selectedApp.applyUrl || '#', '_blank')}
                    >
                      Continue Externally
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-amber-300 text-amber-850 font-semibold text-xs py-1.5"
                      onClick={() => window.open(selectedApp.applyUrl || '#', '_blank')}
                    >
                      Open Manually
                    </Button>
                  </div>
                </div>
              )}

              {/* Lifecycle status modification controls */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Update Stage</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleStatusChange(selectedApp.id, 'under_review')}>
                    Under Review
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleStatusChange(selectedApp.id, 'interview_scheduled')}>
                    Interview
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleStatusChange(selectedApp.id, 'offer_received')}>
                    Offer
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleStatusChange(selectedApp.id, 'rejected')}>
                    Rejected
                  </Button>
                </div>
              </div>

              {/* Visual Timeline */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Application Timeline</h4>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <TimelineStatus
                    statuses={TIMELINE_STEPS}
                    currentStatus={selectedApp.status === 'offer_received' ? 'offer' : selectedApp.status === 'interview_scheduled' || selectedApp.status === 'interview_completed' ? 'interview_scheduled' : selectedApp.status}
                  />
                </div>
              </div>

              {/* Networking Agent outreach box */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Users size={16} className="text-indigo-600" />
                  Networking Cold Outreach
                </h4>
                <div className="grid grid-cols-3 gap-1.5">
                  <Button variant="secondary" size="xs" className="text-[10px] py-1" onClick={() => handleGenerateOutreach(selectedApp.id, 'recruiter')}>
                    Recruiter
                  </Button>
                  <Button variant="secondary" size="xs" className="text-[10px] py-1" onClick={() => handleGenerateOutreach(selectedApp.id, 'manager')}>
                    Manager
                  </Button>
                  <Button variant="secondary" size="xs" className="text-[10px] py-1" onClick={() => handleGenerateOutreach(selectedApp.id, 'alumni')}>
                    Alumni
                  </Button>
                </div>

                {outreachLoading && (
                  <p className="text-xs text-slate-500 animate-pulse">Generating Outreach message...</p>
                )}

                {outreachData && (
                  <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] leading-relaxed relative border border-slate-800 group">
                    <div className="flex justify-between items-center text-slate-400 border-b border-slate-800 pb-1.5 mb-2 font-sans font-semibold">
                      <span>{outreachData.outreachType?.toUpperCase()} outreach</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(outreachData.message);
                          alert('Copied to clipboard!');
                        }}
                        className="hover:text-white flex items-center gap-1"
                      >
                        <Copy size={13} />
                        Copy
                      </button>
                    </div>
                    {outreachData.subject && (
                      <p className="text-indigo-300 font-semibold mb-2">Subject: {outreachData.subject}</p>
                    )}
                    <p className="whitespace-pre-wrap">{outreachData.message}</p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center border-dashed py-16">
              <ClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                Select an application from the pipeline to monitor details, update stages, and compose cold networking messages.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
