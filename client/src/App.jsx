import { useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import CareerAgentLayout from './layouts/CareerAgentLayout';
import KnowledgeMapLayout from './layouts/KnowledgeMapLayout';
import LoginPage from './pages/LoginPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PublishedPortfolioPage from './pages/PublishedPortfolioPage';
import CareerAgentPage from './pages/CareerAgentPage';
import KnowledgeMapPage from './pages/KnowledgeMapPage';
import { GOOGLE_CLIENT_ID } from './lib/googleAuth';
import { useResumeStore } from './store';
import ATSModal from './components/ATSModal';
import AuthModal from './components/AuthModal';
import PublishModal from './components/PublishModal';

const googleClientId = GOOGLE_CLIENT_ID || 'GOOGLE_OAUTH_CLIENT_ID_NOT_CONFIGURED';

export default function App() {
  const token = useResumeStore((state) => state.token);
  const fetchResume = useResumeStore((state) => state.fetchResume);

  useEffect(() => {
    if (token) {
      fetchResume(token);
    }
  }, [token, fetchResume]);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Routes>
        <Route path="/" element={<MainLayout />} />
        <Route path="/career-agent" element={<CareerAgentLayout><CareerAgentPage /></CareerAgentLayout>} />
        <Route path="/knowledge-map" element={<KnowledgeMapLayout><KnowledgeMapPage /></KnowledgeMapLayout>} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/portfolio/:slug" element={<PublishedPortfolioPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
      <ATSModal />
      <AuthModal />
      <PublishModal />
    </GoogleOAuthProvider>
  );
}
