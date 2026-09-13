import { authFetch, useResumeStore } from './index';
import { create } from 'zustand';
import { API_URL } from '../lib/api';

/**
 * CareerAgent Store
 * Manages all state related to the AI Career Agent module
 */
export const useCareerAgentStore = create((set, get) => ({
  // Resume Intelligence State
  candidateProfile: null,
  atsScore: null,
  missingSkills: [],
  skillsGraph: null,
  resumeSummary: null,
  skillRecommendations: [],
  profileStrength: 0,

  // Job Discovery State
  jobs: [],
  jobFilters: {
    locations: [],
    salary: { min: 0, max: 500000 },
    remote: null,
    jobType: [],
    experience: 'any',
    industries: [],
  },
  jobsLoading: false,
  jobsError: null,

  // Job Matches State
  jobMatches: [],
  matchesLoading: false,
  matchesError: null,
  selectedMatch: null,

  // Applications State
  applications: [],
  applicationStatuses: {}, // { jobId: { status, timestamp, notes } }
  applicationsLoading: false,
  applicationsError: null,

  // Auto Apply Settings
  autoApplyRules: {
    enabled: false,
    matchScoreThreshold: 75,
    salaryMin: 0,
    salaryMax: 500000,
    remoteOnly: false,
    requiresApproval: false,
    allowedCountries: [],
    blockedCompanies: [],
  },

  // Email Monitoring State
  emailAccounts: [],
  emailLogs: [],
  emailSyncing: false,

  // Notifications
  notifications: [],
  notificationPreferences: {
    inApp: true,
    email: true,
    push: false,
  },

  // Interview Prep
  upcomingInterviews: [],
  interviewQuestions: {},
  mockInterviewScore: null,

  // Offers
  receivedOffers: [],
  selectedOffer: null,

  // Agent Activity
  agentStatus: 'idle', // 'idle', 'searching', 'applying', 'analyzing'
  agentMessage: '',
  lastAgentActivity: null,

  // Multi-Agent Orchestration State
  orchestrationHistory: [],
  activeOrchestration: null,
  orchestrationLoading: false,

  // Analytics
  analytics: {
    applicationsSubmitted: 0,
    interviewsReceived: 0,
    offersReceived: 0,
    acceptanceRate: 0,
    applicationSuccessRate: 0,
    topMatchingSkills: [],
    mostActiveRegions: [],
  },

  // ===== Resume Intelligence Actions =====
  setCandidateProfile: (profile) => set({ candidateProfile: profile }),
  setAtsScore: (score) => set({ atsScore: score }),
  setMissingSkills: (skills) => set({ missingSkills: skills }),
  setSkillsGraph: (graph) => set({ skillsGraph: graph }),
  setResumeSummary: (summary) => set({ resumeSummary: summary }),
  setSkillRecommendations: (recommendations) => set({ skillRecommendations: recommendations }),
  setProfileStrength: (strength) => set({ profileStrength: strength }),

  // Alias methods for easier use in components
  updateCandidateProfile: (profile) => set({ candidateProfile: profile }),
  updateATSScore: (score) => set({ atsScore: score }),
  updateMissingSkills: (skills) => set({ missingSkills: skills }),

  // ===== Job Discovery Actions =====
  setJobs: (jobs) => set({ jobs }),
  addJobs: (newJobs) => set((state) => ({
    jobs: [...state.jobs, ...newJobs],
  })),
  setJobFilters: (filters) => set((state) => ({
    jobFilters: { ...state.jobFilters, ...filters },
  })),
  setJobsLoading: (loading) => set({ jobsLoading: loading }),
  setJobsError: (error) => set({ jobsError: error }),

  // ===== Job Matches Actions =====
  setJobMatches: (matches) => set({ jobMatches: matches }),
  addJobMatches: (newMatches) => set((state) => ({
    jobMatches: [...state.jobMatches, ...newMatches],
  })),
  setSelectedMatch: (match) => set({ selectedMatch: match }),
  setMatchesLoading: (loading) => set({ matchesLoading: loading }),
  setMatchesError: (error) => set({ matchesError: error }),

  // ===== Application Actions =====
  setApplications: (applications) => set({ applications }),
  addApplication: (application) => set((state) => ({
    applications: [...state.applications, application],
  })),
  updateApplicationStatus: (jobId, status, notes = '') => set((state) => ({
    applicationStatuses: {
      ...state.applicationStatuses,
      [jobId]: {
        status,
        timestamp: new Date().toISOString(),
        notes,
      },
    },
  })),
  setApplicationsLoading: (loading) => set({ applicationsLoading: loading }),
  setApplicationsError: (error) => set({ applicationsError: error }),

  // ===== Auto Apply Settings Actions =====
  setAutoApplyRules: (rules) => set((state) => ({
    autoApplyRules: { ...state.autoApplyRules, ...rules },
  })),
  toggleAutoApply: () => set((state) => ({
    autoApplyRules: { ...state.autoApplyRules, enabled: !state.autoApplyRules.enabled },
  })),

  // ===== Notification Actions =====
  addNotification: (notification) => set((state) => ({
    notifications: [
      { id: Date.now(), ...notification },
      ...state.notifications,
    ],
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id),
  })),
  clearNotifications: () => set({ notifications: [] }),
  setNotificationPreferences: (prefs) => set((state) => ({
    notificationPreferences: { ...state.notificationPreferences, ...prefs },
  })),

  // ===== Interview Prep Actions =====
  setUpcomingInterviews: (interviews) => set({ upcomingInterviews: interviews }),
  addInterview: (interview) => set((state) => ({
    upcomingInterviews: [...state.upcomingInterviews, interview],
  })),
  setInterviewQuestions: (jobId, questions) => set((state) => ({
    interviewQuestions: {
      ...state.interviewQuestions,
      [jobId]: questions,
    },
  })),
  setMockInterviewScore: (score) => set({ mockInterviewScore: score }),

  // ===== Offer Actions =====
  setReceivedOffers: (offers) => set({ receivedOffers: offers }),
  addOffer: (offer) => set((state) => ({
    receivedOffers: [...state.receivedOffers, offer],
  })),
  setSelectedOffer: (offer) => set({ selectedOffer: offer }),

  // ===== Agent Status Actions =====
  setAgentStatus: (status, message = '') => set({
    agentStatus: status,
    agentMessage: message,
    lastAgentActivity: new Date().toISOString(),
  }),

  // ===== Analytics Actions =====
  setAnalytics: (analytics) => set((state) => ({
    analytics: { ...state.analytics, ...analytics },
  })),
  updateAnalytics: (key, value) => set((state) => ({
    analytics: { ...state.analytics, [key]: value },
  })),

  // ===== Bulk Actions =====
  resetCareerAgent: () => set({
    candidateProfile: null,
    atsScore: null,
    missingSkills: [],
    skillsGraph: null,
    jobs: [],
    jobMatches: [],
    applications: [],
    notifications: [],
    upcomingInterviews: [],
    receivedOffers: [],
    agentStatus: 'idle',
    agentMessage: '',
  }),

  // ===== API Integration =====
  analyzeResume: async (resumeData, token) => {
    set({ agentStatus: 'analyzing', agentMessage: 'Analyzing your resume...' });
    try {
      const response = await authFetch(`${API_URL}/career-agents/resume/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeData }),
      });

      if (!response.ok) throw new Error('Failed to analyze resume');

      const data = await response.json();
      set({
        candidateProfile: data.profile,
        atsScore: data.atsScore,
        missingSkills: data.missingSkills,
        skillsGraph: data.skillsGraph,
        resumeSummary: data.resumeSummary,
        skillRecommendations: data.skillRecommendations,
        profileStrength: data.profileStrength,
        agentStatus: 'idle',
        agentMessage: '',
      });

      const atsImprovements = (data.missingSkills || []).map(skillObj => ({
        title: (skillObj.priority || 'High').charAt(0).toUpperCase() + (skillObj.priority || 'High').slice(1) + ' Priority',
        desc: `Integrate "${skillObj.skill || skillObj}" into your experience points to match recruiters' expectations.`
      }));
      if (atsImprovements.length === 0) {
        atsImprovements.push({
          title: 'Low Priority',
          desc: 'Quantify your achievements in bullet points with metric improvements.'
        });
      }
      useResumeStore.setState({
        atsScore: data.atsScore,
        atsAnalysis: {
          score: data.atsScore,
          message: 'Analysis calculated from your presently stored resume profile.',
          improvements: atsImprovements
        }
      });

      return true;
    } catch (error) {
      console.error('Resume analysis error:', error);
      set({
        agentStatus: 'idle',
        agentMessage: error.message,
      });
      return false;
    }
  },

  discoverJobs: async (filters, token) => {
    set({
      jobsLoading: true,
      agentStatus: 'searching',
      agentMessage: 'Discovering job opportunities...',
    });
    try {
      const response = await authFetch(`${API_URL}/career-agents/jobs/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) throw new Error('Failed to discover jobs');

      // Wait a moment for background crawler simulation to write jobs, then fetch them
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await get().fetchJobs(token);

      set({
        agentStatus: 'idle',
        agentMessage: '',
      });

      return true;
    } catch (error) {
      console.error('Job discovery error:', error);
      set({
        jobsLoading: false,
        jobsError: error.message,
        agentStatus: 'idle',
      });
      return false;
    }
  },

  fetchJobs: async (token) => {
    set({ jobsLoading: true });
    try {
      const response = await authFetch(`${API_URL}/career-agents/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      set({ jobs: data.jobs || [], jobsLoading: false });
      return data.jobs || [];
    } catch (error) {
      console.error('Fetch jobs error:', error);
      set({ jobsLoading: false, jobsError: error.message });
      return [];
    }
  },

  formatJob: async (jobId, token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/jobs/${jobId}/format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to format job');
      const data = await response.json();
      
      // Update local jobs list
      const updatedJobs = get().jobs.map((job) => 
        job.id === jobId ? { ...job, formattedData: data.formattedData } : job
      );
      set({ jobs: updatedJobs });
      
      return data.formattedData;
    } catch (error) {
      console.error('Format job error:', error);
      return null;
    }
  },

  matchJobs: async (token) => {
    set({
      matchesLoading: true,
      agentStatus: 'analyzing',
      agentMessage: 'Finding perfect matches...',
    });
    try {
      const response = await authFetch(`${API_URL}/career-agents/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to match jobs');

      const data = await response.json();
      set({
        jobMatches: data.matches,
        matchesLoading: false,
        agentStatus: 'idle',
        agentMessage: '',
      });

      return true;
    } catch (error) {
      console.error('Job matching error:', error);
      set({
        matchesLoading: false,
        matchesError: error.message,
        agentStatus: 'idle',
      });
      return false;
    }
  },


  fetchSettings: async (token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      set({ autoApplyRules: data.settings });
      return data.settings;
    } catch (error) {
      console.error('Fetch settings error:', error);
      return null;
    }
  },

  updateSettings: async (settings, token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      const data = await response.json();
      set({ autoApplyRules: data.settings });
      return true;
    } catch (error) {
      console.error('Update settings error:', error);
      return false;
    }
  },

  fetchApplications: async (token) => {
    set({ applicationsLoading: true });
    try {
      const response = await authFetch(`${API_URL}/career-agents/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      
      // Compute analytics from apps
      const apps = data.applications || [];
      const interviewsCount = apps.filter(a => ['interview_scheduled', 'interview_completed'].includes(a.status)).length;
      const offersCount = apps.filter(a => a.status === 'offer_received').length;
      const successRate = apps.length > 0 ? ((offersCount + interviewsCount) / apps.length) * 100 : 0;

      set({
        applications: apps,
        applicationsLoading: false,
        analytics: {
          ...get().analytics,
          applicationsSubmitted: apps.length,
          interviewsReceived: interviewsCount,
          offersReceived: offersCount,
          applicationSuccessRate: successRate,
        }
      });
      return apps;
    } catch (error) {
      console.error('Fetch applications error:', error);
      set({ applicationsLoading: false, applicationsError: error.message });
      return [];
    }
  },

  updateApplicationStatusOnServer: async (appId, status, token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/applications/${appId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update application status');
      
      // Refresh list
      await get().fetchApplications(token);
      return true;
    } catch (error) {
      console.error('Update application status error:', error);
      return false;
    }
  },

  fetchNotifications: async (token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      set({ notifications: data.notifications || [] });
      return data.notifications;
    } catch (error) {
      console.error('Fetch notifications error:', error);
      return [];
    }
  },

  markNotificationRead: async (notificationId, token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to mark read');
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
      }));
      return true;
    } catch (error) {
      console.error('Mark read error:', error);
      return false;
    }
  },

  clearNotificationsOnServer: async (token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/notifications`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to clear notifications');
      set({ notifications: [] });
      return true;
    } catch (error) {
      console.error('Clear notifications error:', error);
      return false;
    }
  },

  fetchInterviews: async (token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/interviews/prep`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch interviews');
      const data = await response.json();
      set({ upcomingInterviews: data.preps || [] });
      return data.preps;
    } catch (error) {
      console.error('Fetch interviews error:', error);
      return [];
    }
  },

  submitMockAnswer: async (prepId, message, token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/interviews/mock/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prepId, message }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      const data = await response.json();
      
      // Update local state
      set((state) => ({
        upcomingInterviews: state.upcomingInterviews.map((prep) =>
          prep.id === prepId
            ? { ...prep, mockChatHistory: data.chatHistory, status: 'started' }
            : prep
        ),
      }));

      return data;
    } catch (error) {
      console.error('Submit answer error:', error);
      return null;
    }
  },

  gradeMockInterview: async (prepId, token) => {
    set({ agentStatus: 'analyzing', agentMessage: 'Grading mock interview response...' });
    try {
      const response = await authFetch(`${API_URL}/career-agents/interviews/mock/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prepId }),
      });
      if (!response.ok) throw new Error('Failed to grade mock interview');
      const data = await response.json();

      set((state) => ({
        upcomingInterviews: state.upcomingInterviews.map((prep) =>
          prep.id === prepId ? data.prep : prep
        ),
        mockInterviewScore: data.prep.mockScore,
        agentStatus: 'idle',
        agentMessage: '',
      }));

      return data.prep;
    } catch (error) {
      console.error('Grade mock error:', error);
      set({ agentStatus: 'idle', agentMessage: '' });
      return null;
    }
  },

  fetchOffers: async (token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/offers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch offers');
      const data = await response.json();
      set({ receivedOffers: data.offers || [] });
      return data.offers;
    } catch (error) {
      console.error('Fetch offers error:', error);
      return [];
    }
  },

  submitOffer: async (offerData, token) => {
    set({ agentStatus: 'analyzing', agentMessage: 'Evaluating salary and benefits offer...' });
    try {
      const response = await authFetch(`${API_URL}/career-agents/offers/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(offerData),
      });
      if (!response.ok) throw new Error('Failed to analyze offer');
      const data = await response.json();

      set((state) => ({
        receivedOffers: [data.offer, ...state.receivedOffers],
        agentStatus: 'idle',
        agentMessage: '',
      }));

      return true;
    } catch (error) {
      console.error('Submit offer error:', error);
      set({ agentStatus: 'idle', agentMessage: '' });
      return false;
    }
  },

  updateOfferStatusOnServer: async (offerId, status, token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/offers/${offerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update offer status');
      const data = await response.json();
      
      set((state) => ({
        receivedOffers: state.receivedOffers.map((o) =>
          o.id === offerId ? data.offer : o
        ),
      }));
      return true;
    } catch (error) {
      console.error('Update offer status error:', error);
      return false;
    }
  },

  // ===== Multi-Agent Orchestration Actions =====
  triggerOrchestration: async (query, resumeData, jobDescription, token) => {
    set({ orchestrationLoading: true, agentStatus: 'analyzing', agentMessage: 'Orchestrating agents...' });
    try {
      const response = await authFetch(`${API_URL}/career-agents/orchestrator/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query, resumeData, jobDescription }),
      });
      if (!response.ok) throw new Error('Orchestration run failed');
      const data = await response.json();
      
      const orchestrationId = data.orchestrationId;

      set({
        activeOrchestration: {
          orchestrationId,
          reasoning: 'Planning execution pipeline...',
          pipeline: [],
          result: {}
        }
      });

      // Clear any existing polling interval if there was one
      if (window.orchestrationPollInterval) {
        clearInterval(window.orchestrationPollInterval);
      }

      // Start the polling interval
      window.orchestrationPollInterval = setInterval(async () => {
        try {
          const logs = await get().fetchOrchestrationStatus(orchestrationId, token);
          
          // Check if Master AI Orchestrator has completed or failed
          const orchestratorStep = logs.find(log => log.agentName === 'Master AI Orchestrator');
          const isFinished = orchestratorStep && (orchestratorStep.status === 'completed' || orchestratorStep.status === 'failed');

          // Process the result context based on inputs/outputs
          const contextResult = logs.reduce((acc, log) => {
            if (log.output) {
              try {
                acc[log.agentName] = typeof log.output === 'string' ? JSON.parse(log.output) : log.output;
              } catch (e) {
                acc[log.agentName] = log.output;
              }
            }
            return acc;
          }, {});

          // Find the planning/reasoning statement
          const reasoning = orchestratorStep?.reasoning || 'Running multi-agent pipeline...';

          set({
            activeOrchestration: {
              orchestrationId,
              reasoning,
              pipeline: logs.map(log => {
                let parsedOutput = null;
                if (log.output) {
                  try {
                    parsedOutput = typeof log.output === 'string' ? JSON.parse(log.output) : log.output;
                  } catch (e) {
                    parsedOutput = log.output;
                  }
                }
                return {
                  agentName: log.agentName,
                  status: log.status,
                  progress: log.progress,
                  reasoning: log.reasoning,
                  planning: log.planning,
                  validation: log.validation,
                  confidence: log.confidence,
                  executionTime: log.executionTime,
                  output: parsedOutput
                };
              }).filter(l => l.agentName !== 'Master AI Orchestrator'), // Don't show Master Orchestrator in step cards
              result: contextResult
            }
          });

          if (isFinished) {
            clearInterval(window.orchestrationPollInterval);
            window.orchestrationPollInterval = null;
            
            set({
              orchestrationLoading: false,
              agentStatus: 'idle',
              agentMessage: ''
            });

            // Update candidate profile details in the store
            const parsedProfile = contextResult.ResumeParsingAgent;
            if (parsedProfile) {
              const atsScore = contextResult.ATSAnalysisAgent?.atsScore || null;
              const profileStrength = contextResult.ProfileCompletionAgent?.completenessScore || null;

              // Construct missing skills from KeywordOptimizationAgent or ProfileCompletionAgent
              const missingSkills = (contextResult.KeywordOptimizationAgent?.missingKeywords || []).map(skill => ({
                skill,
                category: 'General',
                priority: 'high'
              }));

              // Construct skill recommendations from KeywordOptimizationAgent gaps
              const skillRecommendations = (contextResult.KeywordOptimizationAgent?.skillGaps || []).map(skill => ({
                skill,
                reason: 'Recommended to fill identified skill gaps.',
                priority: 'high'
              }));

              // Construct resume summary from ATSAnalysisAgent and ResumeImprovementAgent suggestions
              const atsEvaluation = contextResult.ATSAnalysisAgent?.evaluation || {};
              const strengths = [
                atsEvaluation.formatting || 'Single-column layout is clean and ATS-compliant.',
                atsEvaluation.length || 'Resume length matches professional expectations.',
              ].filter(Boolean);

              const improvements = [
                atsEvaluation.keywords || 'Integrate more targeted keywords from candidate profile.',
                atsEvaluation.actionVerbs || 'Use stronger action verbs to quantify accomplishments.',
                ...(contextResult.ResumeImprovementAgent?.suggestions || [])
              ].filter(Boolean);

              const resumeSummary = {
                strengths,
                improvements,
                overallRating: atsScore >= 80 ? 'Excellent' : (atsScore >= 60 ? 'Good' : 'Needs Improvement')
              };

              // Flatten candidate profile details
              const profileData = {
                fullName: parsedProfile.fullName || parsedProfile.personal?.fullName || 'Profile',
                email: parsedProfile.email || parsedProfile.personal?.email || '',
                phone: parsedProfile.phone || parsedProfile.personal?.phone || '',
                location: parsedProfile.location || parsedProfile.personal?.location || '',
                headline: parsedProfile.headline || (parsedProfile.skills?.length > 0 ? `${parsedProfile.skills[0]} Professional` : 'Job Seeker'),
                summary: parsedProfile.summary || parsedProfile.personal?.summary || '',
                yearsOfExperience: parsedProfile.yearsOfExperience || 0,
                skills: parsedProfile.skills || [],
                projects: parsedProfile.projects || [],
                experience: parsedProfile.experience || [],
                education: parsedProfile.education || [],
                certifications: parsedProfile.certifications || [],
              };

              set({
                candidateProfile: {
                  ...profileData,
                  missingSkills,
                  topSkills: profileData.skills?.slice(0, 8) || [],
                },
                atsScore,
                profileStrength,
                missingSkills,
                resumeSummary,
                skillRecommendations,
              });
            }

            // Reload history list
            get().fetchOrchestrationHistory(token);
          }
        } catch (pollError) {
          console.error('Error polling orchestration status:', pollError);
        }
      }, 1500);

      return data;
    } catch (error) {
      console.error('Trigger orchestration error:', error);
      set({ orchestrationLoading: false, agentStatus: 'idle', agentMessage: error.message });
      return null;
    }
  },

  fetchOrchestrationStatus: async (orchestrationId, token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/orchestrator/status/${orchestrationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch status');
      const data = await response.json();
      return data.logs;
    } catch (error) {
      console.error('Fetch orchestration status error:', error);
      return [];
    }
  },

  fetchOrchestrationHistory: async (token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/orchestrator/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      set({ orchestrationHistory: data.history || [] });
      return data.history;
    } catch (error) {
      console.error('Fetch orchestration history error:', error);
      return [];
    }
  },

  fetchCandidateProfile: async (token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/resume/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          const profile = data.profile;
          
          // Re-construct matching lists from database values
          const missingSkills = Array.isArray(profile.missingSkills) ? profile.missingSkills : [];
          const skillRecommendations = missingSkills.slice(0, 3).map(skillObj => ({
            skill: skillObj.skill || skillObj,
            reason: 'Recommended to cover identified tech stack gaps.',
            priority: skillObj.priority || 'high'
          }));

          const strengths = [
            'Formatting layout is clean and ATS-compliant.',
            'Resume length matches professional expectations.',
          ];

          const improvements = [
            'Integrate more targeted keywords from candidate profile.',
            'Use stronger action verbs to quantify accomplishments.',
          ];

          const resumeSummary = {
            strengths,
            improvements,
            overallRating: profile.atsScore >= 80 ? 'Excellent' : (profile.atsScore >= 60 ? 'Good' : 'Needs Improvement')
          };

          set({
            candidateProfile: profile,
            atsScore: profile.atsScore || null,
            profileStrength: profile.profileStrength || null,
            missingSkills,
            resumeSummary,
            skillRecommendations,
          });

          const atsImprovements = missingSkills.map(skillObj => ({
            title: (skillObj.priority || 'High').charAt(0).toUpperCase() + (skillObj.priority || 'High').slice(1) + ' Priority',
            desc: `Integrate "${skillObj.skill || skillObj}" into your experience points to match recruiters' expectations.`
          }));
          if (atsImprovements.length === 0) {
            atsImprovements.push({
              title: 'Low Priority',
              desc: 'Quantify your achievements in bullet points with metric improvements.'
            });
          }
          useResumeStore.setState({
            atsScore: profile.atsScore || null,
            atsAnalysis: {
              score: profile.atsScore || 0,
              message: 'Analysis calculated from your presently stored resume profile.',
              improvements: atsImprovements
            }
          });

          return profile;
        }
      }
      return null;
    } catch (error) {
      console.error('Fetch candidate profile error:', error);
      return null;
    }
  },

  fetchEmailAccounts: async (token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/email-sync`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch connections');
      const data = await response.json();
      set({ emailAccounts: data.connections || [] });
      return data.connections;
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  connectEmailAccount: async (provider, emailAddress, extraData = {}, token) => {
    set({ emailSyncing: true });
    try {
      const response = await authFetch(`${API_URL}/career-agents/email-sync/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ provider, emailAddress, ...extraData }),
      });
      if (!response.ok) throw new Error('Failed to connect email');
      const data = await response.json();
      set((state) => ({
        emailAccounts: [data.connection, ...state.emailAccounts],
        emailSyncing: false,
      }));
      return true;
    } catch (err) {
      console.error(err);
      set({ emailSyncing: false });
      return false;
    }
  },

  disconnectEmailAccount: async (id, token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/email-sync/disconnect/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to disconnect');
      set((state) => ({
        emailAccounts: state.emailAccounts.filter(acc => acc.id !== id),
      }));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  toggleEmailSync: async (id, token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/email-sync/toggle/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to toggle status');
      const data = await response.json();
      set((state) => ({
        emailAccounts: state.emailAccounts.map(acc => acc.id === id ? data.account : acc),
      }));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },

  fetchEmailLogs: async (token) => {
    try {
      const response = await authFetch(`${API_URL}/career-agents/email-sync/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      set({ emailLogs: data.logs || [] });
      return data.logs;
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  simulateIncomingEmail: async (emailData, token) => {
    set({ emailSyncing: true });
    try {
      const response = await authFetch(`${API_URL}/career-agents/email-sync/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(emailData),
      });
      if (!response.ok) throw new Error('Failed to simulate email');
      
      // Re-fetch connections and logs to refresh UI
      await get().fetchEmailAccounts(token);
      await get().fetchEmailLogs(token);
      
      set({ emailSyncing: false });
      return true;
    } catch (err) {
      console.error(err);
      set({ emailSyncing: false });
      return false;
    }
  },

  resolveEmailMatch: async (logId, jobId, token) => {
    set({ emailSyncing: true });
    try {
      const response = await authFetch(`${API_URL}/career-agents/email-sync/resolve/${logId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId }),
      });
      if (!response.ok) throw new Error('Failed to resolve email match');
      
      // Re-fetch logs, accounts and applications to refresh UI
      await get().fetchEmailAccounts(token);
      await get().fetchEmailLogs(token);
      await get().fetchApplications(token);
      
      set({ emailSyncing: false });
      return true;
    } catch (err) {
      console.error(err);
      set({ emailSyncing: false });
      return false;
    }
  },
}));
