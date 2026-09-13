import { create } from 'zustand';
import { API_URL } from '../lib/api';

export const useKnowledgeMapStore = create((set, get) => ({
  skills: [],
  roadmap: null,
  dailyPlan: null,
  loading: false,
  error: null,
  mentorMessages: [],
  tutorTyping: false,
  tutorMode: 'tutor',
  tutorLevel: 'intermediate',
  proactiveSuggestion: null,

  fetchSkills: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/knowledge-map/skills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch skills');
      const data = await response.json();
      set({ skills: data.skills || [], loading: false });
      return data.skills || [];
    } catch (err) {
      console.error('fetchSkills error:', err);
      set({ error: err.message, loading: false });
      return [];
    }
  },

  extractSkills: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/knowledge-map/skills/extract`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to extract skills');
      const data = await response.json();
      set({ skills: data.skills || [], loading: false });
      return data.skills || [];
    } catch (err) {
      console.error('extractSkills error:', err);
      set({ error: err.message, loading: false });
      return [];
    }
  },

  updateMastery: async (id, mastery, token) => {
    try {
      const response = await fetch(`${API_URL}/knowledge-map/skills/${id}/mastery`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mastery }),
      });
      if (!response.ok) throw new Error('Failed to update mastery');
      const data = await response.json();
      
      // Update local skills list
      const updatedSkills = get().skills.map((s) => (s.id === id ? data.skill : s));
      set({ skills: updatedSkills });
      
      // Refresh roadmap
      await get().fetchRoadmap(token);
      return true;
    } catch (err) {
      console.error('updateMastery error:', err);
      return false;
    }
  },

  fetchRoadmap: async (token) => {
    try {
      const response = await fetch(`${API_URL}/knowledge-map/roadmap`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch roadmap');
      const data = await response.json();
      set({ roadmap: data.roadmap || null });
      return data.roadmap;
    } catch (err) {
      console.error('fetchRoadmap error:', err);
      return null;
    }
  },

  generateRoadmap: async (targetRole, token) => {
    set({ loading: true });
    try {
      const response = await fetch(`${API_URL}/knowledge-map/roadmap/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetRole }),
      });
      if (!response.ok) throw new Error('Failed to generate roadmap');
      const data = await response.json();
      set({ roadmap: data.roadmap || null, loading: false });
      
      // Refresh skills list
      await get().fetchSkills(token);
      return data.roadmap;
    } catch (err) {
      console.error('generateRoadmap error:', err);
      set({ loading: false });
      return null;
    }
  },

  fetchDailyPlan: async (token) => {
    try {
      const response = await fetch(`${API_URL}/knowledge-map/daily`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch daily plan');
      const data = await response.json();
      set({ dailyPlan: data.plan || null });
      return data.plan;
    } catch (err) {
      console.error('fetchDailyPlan error:', err);
      return null;
    }
  },

  completeTask: async (taskId, token) => {
    try {
      const response = await fetch(`${API_URL}/knowledge-map/daily/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to complete task');
      const data = await response.json();
      set({ dailyPlan: data.plan });
      
      if (data.roadmap) {
        set({ roadmap: data.roadmap });
      }
      return true;
    } catch (err) {
      console.error('completeTask error:', err);
      return false;
    }
  },

  sendMentorMessage: async (message, token) => {
    const userMessage = { id: Date.now(), role: 'user', content: message };
    const currentMessages = get().mentorMessages;
    
    set({ 
      mentorMessages: [...currentMessages, userMessage],
      tutorTyping: true 
    });

    try {
      const response = await fetch(`${API_URL}/knowledge-map/mentor/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          chatHistory: currentMessages,
        }),
      });
      if (!response.ok) throw new Error('Tutor communication failed');
      const data = await response.json();

      const mentorReply = { id: Date.now() + 1, role: 'mentor', content: data.reply };
      set({ 
        mentorMessages: [...get().mentorMessages, mentorReply],
        tutorTyping: false,
        tutorMode: data.detectedMode || 'tutor',
        tutorLevel: data.detectedLevel || 'intermediate',
        proactiveSuggestion: data.proactiveSuggestion || null
      });
    } catch (err) {
      console.error('sendMentorMessage error:', err);
      const errorReply = { 
        id: Date.now() + 1, 
        role: 'mentor', 
        content: 'Sorry, I am having trouble connecting right now. Can we try again?' 
      };
      set({ 
        mentorMessages: [...get().mentorMessages, errorReply],
        tutorTyping: false 
      });
    }
  },
}));
