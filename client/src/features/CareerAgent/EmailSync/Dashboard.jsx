import { useEffect, useState } from 'react';
import { Card, Button, Badge } from '../../../components';
import { Mail, RefreshCw, Trash2, Pause, Play, AlertCircle, CheckCircle2, Sparkles, Plus, ShieldCheck, ExternalLink, Calendar, DollarSign, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { useCareerAgentStore } from '../../../store/careerAgent';
import { useResumeStore } from '../../../store';

const SCENARIOS = [
  {
    title: 'Google - Technical Interview Invitation',
    sender: 'google-recruiter@google.com',
    subject: 'Next steps: Interview invitation for Software Engineer role at Google',
    body: 'Hi there, we reviewed your profile and would love to move you forward to a technical interview for the Software Engineer position. Please click this Google Meet link: https://meet.google.com/abc-xyz to select your time slot on July 15, 2026 at 10:00 AM PST.'
  },
  {
    title: 'Amazon - Application Rejection Update',
    sender: 'noreply@amazon.jobs',
    subject: 'Update on your Software Engineer application with Amazon',
    body: 'Thank you for taking the time to apply and speak with us about the Software Engineer role. Unfortunately, after careful consideration, we have decided not to move forward with your candidacy at this time. We will keep your resume on file for future opportunities.'
  },
  {
    title: 'Meta - Employment Job Offer Letter',
    sender: 'meta-offers@meta.com',
    subject: 'Official Offer of Employment: Frontend Engineer at Meta',
    body: 'We are thrilled to offer you the position of Frontend Engineer at Meta! The base salary is $155,000 per year, starting on September 1, 2026. Please sign and return the documents by July 25, 2026.'
  },
  {
    title: 'Microsoft - Online Coding Assessment',
    sender: 'recruit@microsoft.com',
    subject: 'Action Required: Online Coding Assessment for Microsoft',
    body: 'Hi Candidate, thank you for applying to Microsoft. As the next step, please complete this online coding assessment via Hackerrank: https://hackerrank.com/test/msft-coding. You have 7 days to complete it.'
  }
];

export default function EmailSyncDashboard() {
  const token = useResumeStore((state) => state.token);
  const {
    emailAccounts,
    emailLogs,
    emailSyncing,
    fetchEmailAccounts,
    connectEmailAccount,
    disconnectEmailAccount,
    toggleEmailSync,
    fetchEmailLogs,
    simulateIncomingEmail,
    applications,
    fetchApplications,
    resolveEmailMatch,
  } = useCareerAgentStore();

  const [newEmail, setNewEmail] = useState('');
  const [provider, setProvider] = useState('gmail');
  
  // Custom simulator state
  const [simSender, setSimSender] = useState('');
  const [simSubject, setSimSubject] = useState('');
  const [simBody, setSimBody] = useState('');
  const [customSimulatorOpen, setCustomSimulatorOpen] = useState(false);

  // New state variables for IMAP, OAuth, and matching
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [imapPassword, setImapPassword] = useState('');
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState({});

  useEffect(() => {
    if (token) {
      fetchEmailAccounts(token);
      fetchEmailLogs(token);
      fetchApplications(token);
    }
  }, [token]);

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!newEmail) return;

    if (provider === 'imap') {
      if (!imapHost || !imapPort || !imapPassword) {
        alert('Please fill out all IMAP configuration details.');
        return;
      }
      const success = await connectEmailAccount(provider, newEmail, {
        imapHost,
        imapPort: parseInt(imapPort, 10),
        password: imapPassword
      }, token);
      if (success) {
        setNewEmail('');
        setImapHost('');
        setImapPort('993');
        setImapPassword('');
        alert('IMAP inbox connected and credentials encrypted securely!');
      } else {
        alert('Failed to connect email address.');
      }
    } else {
      setShowOAuthModal(true);
    }
  };

  const handleOAuthConfirm = async () => {
    setShowOAuthModal(false);
    const success = await connectEmailAccount(provider, newEmail, {}, token);
    if (success) {
      setNewEmail('');
      alert(`Successfully authorized and linked your ${provider.replace('_', ' ').toUpperCase()} account!`);
    } else {
      alert('Failed to connect email address.');
    }
  };

  const handleResolveMatch = async (logId) => {
    const jobId = selectedJobIds[logId];
    if (!jobId) {
      alert('Please select an active application to match.');
      return;
    }
    const success = await resolveEmailMatch(logId, jobId, token);
    if (success) {
      alert('Email matched and application stage updated successfully!');
      const updated = { ...selectedJobIds };
      delete updated[logId];
      setSelectedJobIds(updated);
    } else {
      alert('Failed to match email to application.');
    }
  };

  const handleSimulateScenario = async (scenario) => {
    const success = await simulateIncomingEmail({
      sender: scenario.sender,
      subject: scenario.subject,
      body: scenario.body
    }, token);
    if (success) {
      alert(`Simulation completed: status updated!`);
    } else {
      alert('Simulation completed. Verify if a matching job exists in your discovery/applications.');
    }
  };

  const handleCustomSimulate = async (e) => {
    e.preventDefault();
    if (!simSender || !simSubject || !simBody) return;
    const success = await simulateIncomingEmail({
      sender: simSender,
      subject: simSubject,
      body: simBody
    }, token);
    if (success) {
      setSimSender('');
      setSimSubject('');
      setSimBody('');
      setCustomSimulatorOpen(false);
      alert(`Custom simulation completed! Check status updates.`);
    }
  };

  const getBadgeVariant = (classification) => {
    switch (classification) {
      case 'Interview Invitation':
        return 'primary';
      case 'Offer Letter':
        return 'success';
      case 'Online Assessment':
        return 'warning';
      case 'Rejection':
        return 'danger';
      case 'Application Received':
        return 'glass';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">AI Email Monitoring</h2>
          <p className="text-slate-600 mt-1">
            Securely link your inbox to track application updates, interview loops, and job offers automatically.
          </p>
        </div>
        <Button
          onClick={() => { fetchEmailAccounts(token); fetchEmailLogs(token); fetchApplications(token); }}
          className="flex items-center gap-2 bg-gradient-brand text-white shadow-soft-sm font-semibold"
          disabled={emailSyncing}
        >
          <RefreshCw className={`h-4 w-4 ${emailSyncing ? 'animate-spin' : ''}`} />
          Refresh Inbox Sync
        </Button>
      </div>

      {/* Low-Confidence Unmatched Emails Warning Panel */}
      {emailLogs.filter(log => log.status === 'pending_user_confirmation').length > 0 && (
        <Card className="p-5 border-l-4 border-l-amber-500 bg-amber-50/50 shadow-soft-sm space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 h-6 w-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Unmatched Job Search Emails</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                The AI Email Monitor detected recruitment messages but could not match them to your applications with high confidence. Please link them manually.
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            {emailLogs.filter(log => log.status === 'pending_user_confirmation').map((log) => (
              <div key={log.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-3.5 bg-white border border-slate-100 rounded-xl gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-805">{log.sender}</span>
                    <Badge variant={getBadgeVariant(log.classification)} size="xs">
                      {log.classification}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{log.subject}</p>
                  <p className="text-[10px] text-slate-400 italic">"{log.summary}"</p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <select
                    value={selectedJobIds[log.id] || ''}
                    onChange={(e) => setSelectedJobIds({ ...selectedJobIds, [log.id]: e.target.value })}
                    className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 cursor-pointer flex-1 md:flex-none max-w-xs text-slate-700 font-semibold"
                  >
                    <option value="">-- Select Job Application --</option>
                    {applications.map((app) => (
                      <option key={app.id} value={app.Job.id}>
                        {app.Job.company} - {app.Job.role}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => handleResolveMatch(log.id)}
                    className="text-xs py-1.5 font-bold"
                  >
                    Confirm Link
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Email Accounts Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 space-y-6 shadow-soft-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="text-indigo-600 h-5 w-5" />
              Email Integrations
            </h3>

            {/* Connect Form */}
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. candidate@gmail.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Provider</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50/50 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="gmail">Gmail (OAuth)</option>
                  <option value="outlook">Outlook / Hotmail</option>
                  <option value="microsoft_365">Microsoft 365</option>
                  <option value="yahoo">Yahoo Mail</option>
                  <option value="imap">Generic IMAP</option>
                </select>
              </div>

              {provider === 'imap' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">IMAP Host</label>
                    <input
                      type="text"
                      placeholder="e.g. imap.mail.yahoo.com"
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">IMAP Port</label>
                    <input
                      type="number"
                      placeholder="e.g. 993"
                      value={imapPort}
                      onChange={(e) => setImapPort(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password / App Password</label>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={imapPassword}
                      onChange={(e) => setImapPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
                      required
                    />
                  </div>
                </>
              )}

              <Button type="submit" variant="primary" className="w-full flex items-center justify-center gap-1.5 py-2 font-semibold">
                <Plus size={16} /> Link Inbox
              </Button>
            </form>

            {/* List of Connected Accounts */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Connections</h4>
              
              {emailAccounts.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No email accounts connected yet.</p>
              ) : (
                <div className="space-y-2">
                  {emailAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                          {account.emailAddress}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Provider: <span className="capitalize">{account.provider.replace('_', ' ')}</span> • Sync status: {account.status}
                        </p>
                      </div>
                      
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleEmailSync(account.id, token)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
                          title={account.status === 'connected' ? 'Pause Sync' : 'Resume Sync'}
                        >
                          {account.status === 'connected' ? <Pause size={14} /> : <Play size={14} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => disconnectEmailAccount(account.id, token)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                          title="Disconnect account"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sync Simulator Widget & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Simulator Panel */}
          <Card className="p-6 space-y-4 shadow-soft-sm bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-100/50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="text-purple-600 h-5 w-5 animate-pulse" />
                AI Email Sync Simulator Tool
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                onClick={() => setCustomSimulatorOpen(!customSimulatorOpen)}
              >
                {customSimulatorOpen ? 'View Preset Scenarios' : 'Write Custom Email'}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Simulate incoming emails to verify status updates, AI letter classifications, and notifications in real time. (Make sure matching job applications exist).
            </p>

            {customSimulatorOpen ? (
              <form onSubmit={handleCustomSimulate} className="space-y-3 pt-2 bg-white p-4 rounded-xl border border-slate-100 shadow-soft-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Sender</label>
                    <input
                      type="text"
                      placeholder="e.g. HR@meta.com"
                      value={simSender}
                      onChange={(e) => setSimSender(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Subject</label>
                    <input
                      type="text"
                      placeholder="e.g. Job Offer"
                      value={simSubject}
                      onChange={(e) => setSimSubject(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-400">Email Body</label>
                  <textarea
                    placeholder="Type the recruitment email details..."
                    value={simBody}
                    onChange={(e) => setSimBody(e.target.value)}
                    rows="3"
                    className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setCustomSimulatorOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" size="sm" disabled={emailSyncing}>
                    {emailSyncing ? 'Processing...' : 'Run AI Analysis'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {SCENARIOS.map((scenario, index) => (
                  <button
                    key={index}
                    onClick={() => handleSimulateScenario(scenario)}
                    disabled={emailSyncing}
                    className="p-3 text-left bg-white border border-slate-100 hover:border-indigo-400 hover:shadow-soft-sm rounded-xl transition duration-300 group space-y-1"
                  >
                    <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition flex items-center justify-between">
                      {scenario.title}
                      <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 text-indigo-500 transition-opacity" />
                    </p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">Subject: {scenario.subject}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Sync History Log Table */}
          <Card className="p-6 space-y-4 shadow-soft-sm">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Mail className="text-indigo-600 h-5 w-5" />
              Recruitment Inbox Sync Logs
            </h3>

            {emailLogs.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No synchronized messages found.</p>
                <p className="text-slate-400 text-xs mt-1">Connect an account and run simulator scenarios above to populate sync logs.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-2.5">Sender & Subject</th>
                      <th className="py-2.5">Matched Application</th>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">AI Summary</th>
                      <th className="py-2.5">Action Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                        <td className="py-3 pr-2">
                          <p className="font-bold text-slate-800">{log.sender}</p>
                          <p className="text-slate-500 line-clamp-1 font-medium">{log.subject}</p>
                        </td>
                        <td className="py-3 pr-2">
                          {log.matchedJob ? (
                            <div>
                              <p className="font-semibold text-indigo-700">{log.matchedJob.company}</p>
                              <p className="text-[10px] text-slate-400">{log.matchedJob.role}</p>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 bg-slate-100 rounded-full">No match found</span>
                          )}
                        </td>
                        <td className="py-3 pr-2">
                          <Badge variant={getBadgeVariant(log.classification)} size="sm">
                            {log.classification}
                          </Badge>
                        </td>
                        <td className="py-3 pr-2 max-w-xs">
                          <p className="text-slate-600 leading-relaxed font-medium line-clamp-2">{log.summary}</p>
                        </td>
                        <td className="py-3 font-semibold text-slate-500">
                          {log.actionRequired ? (
                            <span className="text-indigo-600 block text-[10px] bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1 leading-snug">
                              ⚠️ {log.actionRequired}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Simulated OAuth Consent Modal */}
      {showOAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <Card className="max-w-md w-full p-6 shadow-2xl bg-white border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <span className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <ShieldCheck size={24} />
              </span>
              <div>
                <h3 className="text-lg font-bold text-slate-900">OAuth Consent Authorization</h3>
                <p className="text-xs text-slate-500">Secure connection requested via {provider.toUpperCase()}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-650">
              <p><strong>NextFolio Career Agent</strong> would like permission to access your mailbox <strong>{newEmail}</strong>:</p>
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs font-semibold text-slate-600 border border-slate-100">
                <p className="flex items-start gap-2">
                  <span className="text-green-500">✓</span> View and parse recruitment/job status update emails.
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-500">✓</span> Extract interview invitations and cost compensation structures.
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-green-500">✓</span> Safely process, categorize, and archive recruiter messages in your application logs.
                </p>
              </div>
              <p className="text-xs text-slate-400 italic">
                OAuth integrations strictly extract data matching applied companies or ATS domains (e.g. Greenhouse, Lever). Your other emails remain completely private and are never processed.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setShowOAuthModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" className="bg-indigo-600 text-white font-semibold" onClick={handleOAuthConfirm}>
                Grant Access & Connect
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
