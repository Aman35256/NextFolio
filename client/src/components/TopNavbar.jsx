import { useUIStore, useResumeStore } from '../store';
import Button from './Button';
import { Download, LogOut, Globe, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/NextFolioLogo.png';

export default function TopNavbar() {
  const { setShowATSModal, setShowPublishModal } = useUIStore();
  const { user, token, logout } = useResumeStore();
  const navigate = useNavigate();
  const isAuthenticated = Boolean(token && user);

  return (
    <div className="h-16 bg-gradient-brand flex items-center justify-between px-6 shadow-md z-50">
      {/* Left: Logo */}
      <div 
        className="group relative flex items-center cursor-pointer" 
        onClick={() => navigate('/')}
        tabIndex={0} 
        aria-label="NextFolio logo"
      >
        <img
          src={logo}
          alt="Nextfolio"
          className="h-12 w-44 rounded-xl bg-white object-cover p-1 shadow-sm"
        />
        <span className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white opacity-0 shadow-xl shadow-indigo-500/30 ring-1 ring-white/40 transition-opacity duration-200 group-hover:opacity-100 group-focus:opacity-100">
          BUILD TODAY. IMPRESS TOMORROW.
        </span>
      </div>

      {/* Center: Buttons */}
      <div className="hidden md:flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-white/80 hover:text-white font-medium px-4 py-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
        >
          <Home className="w-4 h-4" /> Home
        </button>
        {isAuthenticated && (
          <>
            <button
              type="button"
              onClick={() => navigate('/career-agent')}
              className="text-white/80 hover:text-white font-medium px-4 py-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
            >
              🤖 AI Career Agent
            </button>
            <button
              type="button"
              onClick={() => navigate('/knowledge-map')}
              className="text-white/80 hover:text-white font-medium px-4 py-2 rounded-full hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
            >
              🗺️ Knowledge Map
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => navigate('/about')}
          className="text-white/80 hover:text-white font-medium px-4 py-2 rounded-full hover:bg-white/10 transition-colors text-sm"
        >
          About
        </button>
        <button
          type="button"
          onClick={() => navigate('/contact')}
          className="text-white/80 hover:text-white font-medium px-4 py-2 rounded-full hover:bg-white/10 transition-colors text-sm"
        >
          Contact
        </button>
        {!isAuthenticated && (
          <button 
            onClick={() => navigate('/login')}
            className="bg-white/10 text-white font-medium px-6 py-2 rounded-full hover:bg-white/20 transition-colors border border-white/20 text-sm"
          >
            Log In / Sign Up
          </button>
        )}
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3">
        <Button 
          variant="secondary" 
          size="sm" 
          className="bg-white/10 text-white hover:bg-white/20 border border-white/20 shadow-sm flex items-center gap-2 backdrop-blur-sm"
          onClick={() => setShowATSModal(true)}
        >
          <Download className="w-4 h-4" /> ATS Resume
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          className="bg-white text-indigo-600 hover:bg-indigo-50 border-none shadow-lg shadow-indigo-500/30 flex items-center gap-2 font-bold px-5"
          onClick={() => setShowPublishModal(true)}
        >
          <Globe className="w-4 h-4" /> Publish
        </Button>
        
        {isAuthenticated ? (
          <div className="flex items-center gap-2 ml-2">
            <div className="w-10 h-10 rounded-full bg-indigo-200 border-2 border-white overflow-hidden flex items-center justify-center shadow-sm cursor-pointer" title={user?.name || 'Account'}>
              <img 
                src={user?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'Nextfolio'}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <button onClick={logout} className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors" title="Log Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="md:hidden">
            <button 
              onClick={() => navigate('/login')}
              className="bg-white/10 text-white font-medium px-4 py-2 rounded-full hover:bg-white/20 transition-colors border border-white/20 text-sm"
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
