import { create } from 'zustand';
import { API_URL } from '../lib/api';

export { useCareerAgentStore } from './careerAgent';

export const authFetch = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (response.status === 401) {
    useResumeStore.getState().logout();
    throw new Error('Your session has expired. Please log in again.');
  }
  return response;
};

const readStoredJson = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const writeStoredJson = (key, value) => {
  if (value) {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    localStorage.removeItem(key);
  }
};

const storedToken = localStorage.getItem('nextfolio_token');
const storedUser = readStoredJson('nextfolio_user');
const hasStoredAuth = Boolean(storedToken && storedUser);

if (!hasStoredAuth) {
  localStorage.removeItem('nextfolio_token');
  localStorage.removeItem('nextfolio_user');
}

const emptyResumeData = {
  personal: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    summary: '',
    profileImage: '',
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  achievements: [],
  certifications: [],
};

/**
 * Normalize a single project into the standard schema.
 * Handles legacy formats (plain string descriptions, flat link fields) and
 * auto-converts long paragraph descriptions into bullet points.
 */
const normalizeProject = (proj) => {
  if (!proj || typeof proj !== 'object') return null;

  const title = (proj.title || proj.name || '').trim();
  const date = (proj.date || proj.timeline || '').trim();
  const type = (proj.type || '').trim();
  const demoLink = (proj.demoLink || proj.demo || proj.link || '').trim();
  const githubLink = (proj.githubLink || proj.github || '').trim();

  // Technologies: accept array or comma-separated string
  let technologies = [];
  if (Array.isArray(proj.technologies)) {
    technologies = proj.technologies.map((t) => (typeof t === 'string' ? t.trim() : '')).filter(Boolean);
  } else if (typeof proj.technologies === 'string' && proj.technologies.trim()) {
    technologies = proj.technologies.split(',').map((t) => t.trim()).filter(Boolean);
  }

  // Bullet points: accept array or auto-split from description
  let bulletPoints = [];
  if (Array.isArray(proj.bulletPoints)) {
    bulletPoints = proj.bulletPoints.map((b) => (typeof b === 'string' ? b.trim() : '')).filter(Boolean);
  }

  let description = (proj.description || proj.summary || '').trim();

  // Auto-convert long descriptions into bullet points if none exist
  if (bulletPoints.length === 0 && description) {
    // Check if description contains bullet-like markers
    const bulletRegex = /(?:^|\n)\s*[-*•]\s*/;
    if (bulletRegex.test(description)) {
      const parts = description.split(/\n\s*[-*•]\s*/).map((s) => s.trim()).filter(Boolean);
      // First part before any bullet may be the actual description
      if (parts.length > 1) {
        const firstPart = parts[0];
        // If first part looks like a sentence (short, no verb-start), keep as description
        if (firstPart.length < 120 && !firstPart.startsWith('-')) {
          description = firstPart;
          bulletPoints = parts.slice(1);
        } else {
          description = '';
          bulletPoints = parts;
        }
      }
    } else if (description.length > 150) {
      // Split long paragraph into sentences as bullet points
      const sentences = description.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 10);
      if (sentences.length > 1) {
        description = '';
        bulletPoints = sentences.map((s) => s.replace(/^\s*[-*•]\s*/, '').trim());
      }
    }
  }

  return { title, date, type, technologies, description, bulletPoints, demoLink, githubLink };
};

const normalizeParsedResume = (parsed = {}, current = emptyResumeData) => {
  const personal = parsed.personal || parsed.personalInfo || {};

  const rawProjects = Array.isArray(parsed.projects) ? parsed.projects : [];
  const normalizedProjects = rawProjects.map(normalizeProject).filter(Boolean);

  return {
    ...current,
    personal: {
      ...current.personal,
      ...personal,
      fullName: personal.fullName || personal.name || current.personal.fullName || '',
    },
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    education: Array.isArray(parsed.education) ? parsed.education : [],
    skills: Array.isArray(parsed.skills)
      ? parsed.skills.map((skill) => (typeof skill === 'string' ? skill : skill.name)).filter(Boolean)
      : [],
    projects: normalizedProjects,
    achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
  };
};

export const useResumeStore = create((set, get) => ({
  token: hasStoredAuth ? storedToken : null,
  user: hasStoredAuth ? storedUser : null,
  isSaving: false,
  parseResumeError: '',
  targetJobDescription: '',
  missingKeywords: [],
  setTargetJobDescription: (desc) => set({ targetJobDescription: desc }),
  setToken: (token) => {
    if (token) localStorage.setItem('nextfolio_token', token);
    else localStorage.removeItem('nextfolio_token');
    set({ token });
  },
  setUser: (user) => {
    writeStoredJson('nextfolio_user', user);
    set({ user });
  },
  setAuth: ({ token, user }) => {
    if (token) localStorage.setItem('nextfolio_token', token);
    else localStorage.removeItem('nextfolio_token');
    writeStoredJson('nextfolio_user', user);
    set({ token: token || null, user: user || null });
    if (token && user) {
      get().fetchResume(token);
    }
  },
  logout: () => {
    localStorage.removeItem('nextfolio_token');
    localStorage.removeItem('nextfolio_user');
    set({ token: null, user: null, atsAnalysis: null, atsScore: null });
  },
  
  resumeData: readStoredJson('nextfolio_resume_data') || emptyResumeData,

  setResumeDataState: (updater) => {
    const current = get().resumeData;
    const next = typeof updater === 'function' ? updater(current) : updater;
    writeStoredJson('nextfolio_resume_data', next);
    set({ resumeData: next });
  },

  setResumeData: (data) => get().setResumeDataState(data),
  
  updatePersonal: (personal) => get().setResumeDataState((prev) => ({ ...prev, personal })),
  addExperience: (experience) => get().setResumeDataState((prev) => ({ ...prev, experience: [...prev.experience, experience] })),
  updateExperience: (index, experience) => get().setResumeDataState((prev) => {
    const newExperience = [...prev.experience];
    newExperience[index] = experience;
    return { ...prev, experience: newExperience };
  }),
  removeExperience: (index) => get().setResumeDataState((prev) => ({ ...prev, experience: prev.experience.filter((_, i) => i !== index) })),
  addEducation: (education) => get().setResumeDataState((prev) => ({ ...prev, education: [...prev.education, education] })),
  updateEducation: (index, education) => get().setResumeDataState((prev) => {
    const newEducation = [...prev.education];
    newEducation[index] = education;
    return { ...prev, education: newEducation };
  }),
  removeEducation: (index) => get().setResumeDataState((prev) => ({ ...prev, education: prev.education.filter((_, i) => i !== index) })),
  addSkill: (skill) => get().setResumeDataState((prev) => ({ ...prev, skills: [...prev.skills, skill] })),
  removeSkill: (index) => get().setResumeDataState((prev) => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) })),
  addProject: (project) => get().setResumeDataState((prev) => ({ ...prev, projects: [...prev.projects, project] })),
  updateProject: (index, project) => get().setResumeDataState((prev) => {
    const newProjects = [...prev.projects];
    newProjects[index] = project;
    return { ...prev, projects: newProjects };
  }),
  removeProject: (index) => get().setResumeDataState((prev) => ({ ...prev, projects: prev.projects.filter((_, i) => i !== index) })),
  addAchievement: (achievement) => get().setResumeDataState((prev) => ({ ...prev, achievements: [...prev.achievements, achievement] })),
  updateAchievement: (index, achievement) => get().setResumeDataState((prev) => {
    const newAchievements = [...prev.achievements];
    newAchievements[index] = achievement;
    return { ...prev, achievements: newAchievements };
  }),
  removeAchievement: (index) => get().setResumeDataState((prev) => ({ ...prev, achievements: prev.achievements.filter((_, i) => i !== index) })),
  addCertification: (certification) => get().setResumeDataState((prev) => ({ ...prev, certifications: [...prev.certifications, certification] })),
  updateCertification: (index, certification) => get().setResumeDataState((prev) => {
    const newCertifications = [...prev.certifications];
    newCertifications[index] = certification;
    return { ...prev, certifications: newCertifications };
  }),
  removeCertification: (index) => get().setResumeDataState((prev) => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== index) })),

  // API Integration: Parse Resume
  parseResume: async (file) => {
    const { token, user, targetJobDescription } = get();
    set({ parseResumeError: '' });

    if (!token || !user) {
      set({ parseResumeError: 'Log in or sign up before uploading a resume.' });
      return false;
    }
    
    const formData = new FormData();
    formData.append('resume', file);
    
    try {
      const res = await authFetch(`${API_URL}/ai/parse`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const result = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        const message = result.error || result.message || `Parse API error: ${res.status} ${res.statusText}`;
        console.error(message);
        set({ parseResumeError: message });
        return false;
      }

      console.log('Parse result:', result);
      
      if (result.error) {
        console.error('Parse error from server:', result.error);
        set({ parseResumeError: result.error });
        return false;
      }
      
      if (result.data) {
        // Hydrate state
        const parsed = result.data;
        const newResumeData = normalizeParsedResume(parsed, get().resumeData);
        console.log('Updated resume data:', newResumeData);
        get().setResumeDataState(newResumeData);
        set({ atsAnalysis: null, atsScore: null });
        
        // ML Keyword Optimization
        if (targetJobDescription) {
          try {
            const optRes = await authFetch(`${API_URL}/ai/optimize`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ skills: newResumeData.skills, targetJobDescription })
            });
            if (optRes.ok) {
              const optData = await optRes.json();
              set({ missingKeywords: optData.data || [] });
            }
          } catch (e) {
            console.error('Failed to optimize keywords', e);
            set({ missingKeywords: [] });
          }
        } else {
          set({ missingKeywords: [] });
        }
        
        return true;
      } else {
        console.error('No data in parse result:', result);
        set({ parseResumeError: result.message || 'No resume data was returned by the parser.' });
        return false;
      }
    } catch (error) {
      console.error("Parse error", error);
      set({ parseResumeError: error.message || 'Failed to parse resume.' });
      return false;
    }
  },

  optimizeBio: async () => {
    let { token, user, resumeData, updatePersonal } = get();
    if (!token || !user) return false;
    
    try {
      const res = await authFetch(`${API_URL}/ai/optimize-bio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ resumeData })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          updatePersonal({ ...resumeData.personal, summary: result.data });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Optimize bio error", error);
      return false;
    }
  },

  fetchResume: async (token) => {
    try {
      const response = await authFetch(`${API_URL}/resume`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const dbUser = await response.json();
        const personal = dbUser.PersonalInfo || {};
        
        const experience = (dbUser.Experiences || []).map(exp => ({
          jobTitle: exp.jobTitle || '',
          company: exp.company || '',
          startDate: exp.startDate || '',
          endDate: exp.endDate || '',
          description: exp.description || '',
        }));
        
        const education = (dbUser.Educations || []).map(edu => ({
          degree: edu.degree || '',
          school: edu.school || '',
          graduationDate: edu.graduationDate || '',
          result: edu.result || '',
        }));
        
        const skills = (dbUser.Skills || []).map(s => s.name || '');
        
        const projects = (dbUser.Projects || []).map(proj => ({
          title: proj.title || '',
          date: proj.date || '',
          type: '',
          technologies: [],
          description: proj.description || '',
          bulletPoints: [],
          demoLink: proj.link || '',
          githubLink: '',
        }));

        let certifications = [];
        let achievements = [];
        try {
          const profileRes = await authFetch(`${API_URL}/career-agents/resume/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.profile) {
              certifications = profileData.profile.certifications || [];
              achievements = profileData.profile.achievements || [];
            }
          }
        } catch (err) {
          console.error('Failed to fetch candidate profile during resume sync', err);
        }

        const syncedResumeData = {
          personal: {
            fullName: personal.fullName || dbUser.name || '',
            email: personal.email || dbUser.email || '',
            phone: personal.phone || '',
            location: personal.location || '',
            linkedin: personal.linkedin || '',
            github: personal.github || '',
            summary: personal.summary || '',
            profileImage: dbUser.profileImage || '',
          },
          experience,
          education,
          skills,
          projects,
          achievements,
          certifications,
        };

        const hasDbData = Boolean(
          personal.fullName ||
          personal.summary ||
          experience.length ||
          education.length ||
          skills.length ||
          projects.length
        );

        if (hasDbData) {
          writeStoredJson('nextfolio_resume_data', syncedResumeData);
          set({ resumeData: syncedResumeData });
        }
      }
    } catch (err) {
      console.error('Failed to fetch resume from database', err);
    }
  },

  // API Integration: Save to DB
  saveToDatabase: async () => {
    let { token, user, resumeData } = get();
    if (!token || !user) return;
    
    set({ isSaving: true });
    try {
      const skillsObjects = resumeData.skills.map(skillName => ({
        name: skillName,
        category: 'General'
      }));

      const projectsPayload = resumeData.projects.map(proj => ({
        title: proj.title || '',
        description: proj.description || '',
        link: proj.demoLink || proj.githubLink || '',
        date: proj.date || '',
      }));

      const response = await authFetch(`${API_URL}/upload/save-resume-data`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          personalInfo: resumeData.personal,
          experience: resumeData.experience,
          education: resumeData.education,
          skills: skillsObjects,
          projects: projectsPayload
        })
      });

      if (response.ok) {
        set({ atsAnalysis: null, atsScore: null });
        try {
          await authFetch(`${API_URL}/career-agents/resume/analyze`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json', 
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
              resumeData: resumeData
            })
          });
        } catch (profileErr) {
          console.error("Failed to auto-update candidate profile on save", profileErr);
        }
      }

      set({ isSaving: false });
    } catch (e) {
      set({ isSaving: false });
      console.error("Save error", e);
    }
  },

  atsScore: null,
  atsAnalysis: null,
  isLoadingATS: false,
  fetchATSScore: async () => {
    const { token, atsAnalysis, resumeData } = get();
    if (!token) return;

    if (atsAnalysis !== null && atsAnalysis !== undefined) {
      return;
    }

    set({ isLoadingATS: true });
    try {
      const res = await fetch(`${API_URL}/ai/ats-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resumeData })
      });
      if (res.ok) {
        const result = await res.json();
        set({
          atsAnalysis: result.data,
          atsScore: result.data.score
        });
      }
    } catch (e) {
      console.error('Failed to fetch ATS score', e);
    } finally {
      set({ isLoadingATS: false });
    }
  },

  reanalyzeATS: async () => {
    set({ atsAnalysis: null, atsScore: null });
    await get().fetchATSScore();
  }
}));

export const useUIStore = create((set) => ({
  activeTab: 'personal',
  sidebarOpen: true,
  theme: 'default',
  colorPalette: 'blue',
  layoutStyle: 'default',
  showATSModal: false,
  showAuthModal: false,
  showPublishModal: false,
  previewMode: 'resume',
  setActiveTab: (activeTab) => set({ activeTab }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setTheme: (theme) => set({ theme }),
  setColorPalette: (colorPalette) => set({ colorPalette }),
  setLayoutStyle: (layoutStyle) => set({ layoutStyle }),
  setShowATSModal: (showATSModal) => set({ showATSModal }),
  setShowAuthModal: (showAuthModal) => set({ showAuthModal }),
  setShowPublishModal: (showPublishModal) => set({ showPublishModal }),
  setPreviewMode: (previewMode) => set({ previewMode }),
}));
