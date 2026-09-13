import { X, FileText, Download, CheckCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useUIStore, useResumeStore } from '../store';
import Button from './Button';
import { API_URL } from '../lib/api';

export default function ATSModal() {
  const { showATSModal, setShowATSModal, setActiveTab } = useUIStore();
  const { 
    token, 
    user, 
    resumeData,
    atsScore,
    atsAnalysis,
    isLoadingATS,
    fetchATSScore,
    reanalyzeATS
  } = useResumeStore();
  
  const isAuthenticated = Boolean(token && user);
  const [isGenerating, setIsGenerating] = useState(false);

  const hasResumeData = Boolean(
    resumeData?.personal?.fullName
    || resumeData?.skills?.length
    || resumeData?.experience?.length
    || resumeData?.projects?.length
  );

  useEffect(() => {
    if (showATSModal && isAuthenticated && hasResumeData) {
      fetchATSScore();
    }
  }, [showATSModal, isAuthenticated, hasResumeData, fetchATSScore]);

  if (!showATSModal) return null;

  const handleDownload = async () => {
    if (!isAuthenticated) return alert("Log in or sign up before generating an ATS resume.");
    if (!hasResumeData) return alert("Please upload or build a resume first.");
    setIsGenerating(true);
    try {
      const res = await fetch(`${API_URL}/generate/ats-resume`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ resumeData })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ATS_Resume.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        let message = 'Failed to generate PDF. Make sure you have uploaded a resume first.';
        try {
          const result = await res.json();
          message = result.error || result.message || message;
        } catch {
          // Keep default
        }
        alert(message);
      }
    } catch (e) { console.error(e); }
    setIsGenerating(false);
  };

  const handleGoToBuilder = () => {
    setShowATSModal(false);
    if (window.location.pathname !== '/') {
      window.location.href = '/#personal';
    } else {
      setActiveTab('personal');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm select-none">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-brand p-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" />
            <h2 className="text-xl font-bold">ATS Resume Generator</h2>
          </div>
          <button onClick={() => setShowATSModal(false)} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 flex flex-col">
          {!hasResumeData ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center py-8 space-y-4">
              <FileText className="w-16 h-16 text-slate-350" />
              <h3 className="text-lg font-bold text-slate-800">No Resume Uploaded</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Please upload or build your resume in the resume editor before generating an ATS score or suggestions.
              </p>
              <div className="pt-2">
                <Button variant="primary" onClick={handleGoToBuilder}>
                  Go to Resume Builder
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Score Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-dark">Resume Analysis</h3>
                  <p className="text-sm text-gray-500">Analysis for {resumeData.personal?.fullName || 'User'}</p>
                </div>
                <div className="text-center flex flex-col items-center">
                  <div className="text-3xl font-extrabold text-indigo-600 flex justify-center items-center h-9 gap-1.5">
                    {isLoadingATS ? (
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    ) : (
                      <>
                        {atsScore || 0}
                        <span className="text-lg text-gray-450">/100</span>
                        {isAuthenticated && (
                          <button
                            onClick={reanalyzeATS}
                            title="Re-analyze resume"
                            className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Estimated ATS Score</p>
                </div>
              </div>

              {/* Suggestions List */}
              <div className="space-y-4">
                {isLoadingATS ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-dark" /></div>
                ) : atsAnalysis ? (
                  <>
                    <p className="text-sm text-gray-700 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                      {atsAnalysis.message}
                    </p>

                    <h4 className="font-semibold text-brand-dark flex items-center gap-2 mt-4">
                      <AlertTriangle className="w-5 h-5 text-amber-500" /> How to Improve the ATS Score:
                    </h4>
                    
                    <ul className="space-y-3">
                      {(atsAnalysis.improvements || []).map((improvement, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-gray-800">{improvement.title}:</span>
                            <p className="text-sm text-gray-600 mt-1">{improvement.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-55 p-4 border-t border-gray-100 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowATSModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={handleDownload} 
            disabled={isGenerating || !hasResumeData} 
            className="flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
            {isGenerating ? 'Generating...' : 'Download ATS PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
}
