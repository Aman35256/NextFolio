import { useEffect, useState, useRef } from 'react';
import { Card, Button, Badge } from '../../../components';
import {
  Mic,
  MicOff,
  BookOpen,
  User,
  ShieldAlert,
  CheckCircle,
  RefreshCw,
  Send,
  Sparkles,
  Trophy,
  Video,
  VideoOff,
  Pause,
  Play,
  Square,
  Clock,
  Award,
  Heart,
  Brain,
  Zap,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Volume2,
  Plus,
  ExternalLink
} from 'lucide-react';
import { useCareerAgentStore } from '../../../store/careerAgent';
import { useResumeStore } from '../../../store';
import { API_URL } from '../../../lib/api';

// Custom SVG Line Chart for Analytics
function SVGLineChart({ data, width = 300, height = 150, color = '#4f46e5' }) {
  if (!data || data.length === 0) {
    return <div className="text-center text-xs text-slate-400 py-6">No trend data yet.</div>;
  }
  const maxVal = 100;
  const minVal = 0;
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1 || 1)) * (width - 40) + 20;
    const y = height - ((val - minVal) / (maxVal - minVal)) * (height - 40) - 20;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <line x1="20" y1="20" x2={width - 20} y2="20" stroke="#f1f5f9" strokeWidth="1" />
      <line x1="20" y1={height / 2} x2={width - 20} y2={height / 2} stroke="#f1f5f9" strokeWidth="1" />
      <line x1="20" y1={height - 20} x2={width - 20} y2={height - 20} stroke="#e2e8f0" strokeWidth="1.5" />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {data.map((val, idx) => {
        const x = (idx / (data.length - 1 || 1)) * (width - 40) + 20;
        const y = height - ((val - minVal) / (maxVal - minVal)) * (height - 40) - 20;
        return (
          <g key={idx} className="group cursor-pointer">
            <circle cx={x} cy={y} r="4" fill="#fff" stroke={color} strokeWidth="2.5" />
            <circle cx={x} cy={y} r="8" fill={color} className="opacity-0 group-hover:opacity-20 transition-opacity" />
          </g>
        );
      })}
    </svg>
  );
}

// Circular Score Indicator
function ScoreGauge({ score, label, icon: Icon, colorClass = 'indigo' }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ((score || 0) / 100) * circumference;
  
  const textColors = {
    indigo: 'text-indigo-600',
    green: 'text-emerald-600',
    amber: 'text-amber-500',
    red: 'text-rose-500',
    blue: 'text-sky-500',
    purple: 'text-purple-600'
  };

  const strokeColors = {
    indigo: 'stroke-indigo-600',
    green: 'stroke-emerald-600',
    amber: 'stroke-amber-500',
    red: 'stroke-rose-500',
    blue: 'stroke-sky-500',
    purple: 'stroke-purple-600'
  };

  const bgColors = {
    indigo: 'bg-indigo-50',
    green: 'bg-emerald-50',
    amber: 'bg-amber-50',
    red: 'bg-rose-50',
    blue: 'bg-sky-50',
    purple: 'bg-purple-50'
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-soft-sm">
      <div className="relative flex items-center justify-center w-14 h-14">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="28" cy="28" r={radius} stroke="#f1f5f9" strokeWidth="4.5" fill="transparent" />
          <circle
            cx="28"
            cy="28"
            r={radius}
            strokeWidth="4.5"
            fill="transparent"
            className={`transition-all duration-500 ${strokeColors[colorClass] || strokeColors.indigo}`}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-xs font-extrabold text-slate-800">{Math.round(score || 0)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1">
          {Icon && <Icon size={12} className={textColors[colorClass]} />}
          {label}
        </p>
        <p className="text-xs font-bold text-slate-700 mt-0.5">
          {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work'}
        </p>
      </div>
    </div>
  );
}

export default function InterviewPrepDashboard() {
  const token = useResumeStore((state) => state.token);
  const {
    upcomingInterviews,
    fetchInterviews,
  } = useCareerAgentStore();

  const [createKitOpen, setCreateKitOpen] = useState(false);
  const [customCompany, setCustomCompany] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [customTopics, setCustomTopics] = useState('');
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);

  const handleCreateCustomKit = async (e) => {
    e.preventDefault();
    if (!customCompany || !customRole) return;
    
    setIsGeneratingKit(true);
    try {
      const response = await fetch(`${API_URL}/career-agents/interviews/prep/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          company: customCompany,
          role: customRole,
          topics: customTopics
        })
      });
      const data = await response.json();
      if (data.success) {
        setCustomCompany('');
        setCustomRole('');
        setCustomTopics('');
        setCreateKitOpen(false);
        alert('Custom interview prep kit generated successfully!');
        
        // Refresh prep list
        await fetchInterviews(token);
        // Automatically select the new prep kit
        handleSelectPrep(data.prep);
      } else {
        alert(data.error || 'Failed to generate practice kit.');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating practice kit.');
    } finally {
      setIsGeneratingKit(false);
    }
  };

  // Selected Prep Detail
  const [selectedPrep, setSelectedPrep] = useState(null); // { prep, job, profile, history, skills }
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Interface settings
  const [interviewerPersona, setInterviewerPersona] = useState('Senior Engineer');
  const [difficulty, setDifficulty] = useState('medium');
  const [interviewType, setInterviewType] = useState('mixed');

  // Accordions left panel
  const [openAccordion, setOpenAccordion] = useState('job'); // 'job', 'resume', 'skills'

  // Session state
  const [session, setSession] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('not_started'); // 'not_started', 'in_progress', 'paused', 'completed'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]); // Array of { role: 'interviewer' | 'candidate', content }

  // Microphone recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [micStream, setMicStream] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Camera preview
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const videoRef = useRef(null);

  // Analysis / Feedback state
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const [currentAudioAnalysis, setCurrentAudioAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionAnalytics, setSessionAnalytics] = useState(null);

  // Global historical analytics
  const [globalAnalytics, setGlobalAnalytics] = useState(null);

  // Fetch interviews & global analytics on mount
  useEffect(() => {
    if (token) {
      fetchInterviews(token);
      fetchGlobalAnalytics();
    }
  }, [token]);

  // Timers
  useEffect(() => {
    let interval;
    if (sessionStatus === 'in_progress') {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStatus]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [videoStream]);

  // API Call: Fetch Global Interview Analytics
  const fetchGlobalAnalytics = async () => {
    try {
      const response = await fetch(`${API_URL}/career-agents/interviews/studio/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setGlobalAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Fetch global analytics error:', err);
    }
  };

  // API Call: Fetch Prep details for Left Panel
  const handleSelectPrep = async (prep) => {
    setSelectedPrep(null);
    setSession(null);
    setSessionStatus('not_started');
    setLiveAnalysis(null);
    setSessionAnalytics(null);
    setConversationHistory([]);
    setCurrentQuestionIndex(0);
    setCurrentQuestion(null);
    setUserAnswer('');
    setIsLoadingDetails(true);

    try {
      const response = await fetch(`${API_URL}/career-agents/interviews/prep/${prep.id}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedPrep(data);
        
        // Find if user has a session in progress to restore
        const active = data.history.find(s => s.status === 'in_progress' || s.status === 'paused');
        if (active) {
          setSession(active);
          setSessionStatus(active.status);
          setInterviewerPersona(active.interviewerPersona);
          setDifficulty(active.difficulty);
          setInterviewType(active.interviewType);
          
          // Fetch transcripts
          const detailsResponse = await fetch(`${API_URL}/career-agents/interviews/studio/session/${active.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const detailsData = await detailsResponse.json();
          if (detailsData.success && detailsData.session) {
            const list = detailsData.session.InterviewTranscripts || [];
            const chatTurns = [];
            list.forEach((t) => {
              chatTurns.push({ role: 'interviewer', content: t.question });
              chatTurns.push({ role: 'candidate', content: t.answer });
            });
            setConversationHistory(chatTurns);
            setCurrentQuestionIndex(active.currentQuestionIndex);
            setCurrentQuestion(active.questions?.[active.currentQuestionIndex]);
            if (list.length > 0) {
              setLiveAnalysis(list[list.length - 1]);
            }
          }
        }
      }
    } catch (err) {
      console.error('Fetch prep details error:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // API Call: Create and Start Session
  const handleStartSession = async () => {
    if (!selectedPrep || !token) return;
    try {
      const createResponse = await fetch(`${API_URL}/career-agents/interviews/studio/session/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          prepId: selectedPrep.prep.id,
          interviewerPersona,
          difficulty,
          interviewType
        })
      });
      const createData = await createResponse.json();
      if (createData.success) {
        const createdSession = createData.session;
        
        const startResponse = await fetch(`${API_URL}/career-agents/interviews/studio/session/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId: createdSession.id })
        });
        const startData = await startResponse.json();
        if (startData.success) {
          setSession(startData.session);
          setSessionStatus('in_progress');
          setCurrentQuestionIndex(0);
          const firstQ = startData.session.questions?.[0];
          setCurrentQuestion(firstQ);
          setConversationHistory([
            { role: 'interviewer', content: firstQ?.question || 'Welcome! Let us start the interview.' }
          ]);
          setElapsedTime(0);
          setRecordingTime(0);
          setLiveAnalysis(null);
          setSessionAnalytics(null);
        }
      }
    } catch (err) {
      console.error('Start session error:', err);
    }
  };

  // API Call: Submit Answer & get next question
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || !session || !token) return;
    setIsAnalyzing(true);
    const textToSubmit = userAnswer;
    setUserAnswer('');

    if (isRecording) {
      stopAudioRecording();
    }

    try {
      setConversationHistory(prev => [...prev, { role: 'candidate', content: textToSubmit }]);

      // 1. Submit text transcript record
      const transcriptRes = await fetch(`${API_URL}/career-agents/interviews/studio/transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: session.id,
          questionIndex: currentQuestionIndex,
          question: currentQuestion?.question,
          answer: textToSubmit
        })
      });
      const transcriptData = await transcriptRes.json();
      const transcriptId = transcriptData.transcript?.id;

      // 2. Perform audio analysis
      const analysisRes = await fetch(`${API_URL}/career-agents/interviews/studio/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          transcriptId,
          sessionId: session.id,
          answer: textToSubmit,
          audioMetadata: { duration: recordingTime > 0 ? recordingTime : 30 },
          audioAnalysis: currentAudioAnalysis
        })
      });
      const analysisData = await analysisRes.json();
      if (analysisData.success) {
        setLiveAnalysis(analysisData.analysis);
      }
      setCurrentAudioAnalysis(null);

      // 3. Move to next question
      const nextRes = await fetch(`${API_URL}/career-agents/interviews/studio/next-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId: session.id })
      });
      const nextData = await nextRes.json();
      if (nextRes.ok && nextData.success) {
        if (nextData.completed) {
          setSessionStatus('completed');
          await handleEndInterview();
        } else {
          setCurrentQuestion(nextData.question);
          setCurrentQuestionIndex(nextData.questionIndex);
          setConversationHistory(prev => [...prev, { role: 'interviewer', content: nextData.question.question }]);
          setRecordingTime(0);
        }
      }
    } catch (err) {
      console.error('Submit answer error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // API Call: Pause / Resume Session
  const handlePauseResume = async () => {
    if (!session || !token) return;
    try {
      const response = await fetch(`${API_URL}/career-agents/interviews/studio/session/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId: session.id })
      });
      const data = await response.json();
      if (data.success) {
        setSession(data.session);
        setSessionStatus(data.session.status);
      }
    } catch (err) {
      console.error('Pause/resume error:', err);
    }
  };

  // API Call: End Interview Session
  const handleEndInterview = async () => {
    if (!session || !token) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_URL}/career-agents/interviews/studio/session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId: session.id })
      });
      const data = await response.json();
      if (data.success) {
        setSession(data.session);
        setSessionStatus('completed');
        
        // Generate feedback report
        const reportRes = await fetch(`${API_URL}/career-agents/interviews/studio/generate-feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ sessionId: session.id })
        });
        const reportData = await reportRes.json();
        if (reportData.success) {
          setSessionAnalytics(reportData);
          fetchInterviews(token);
          fetchGlobalAnalytics();
        }
      }
    } catch (err) {
      console.error('End session error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Local Microphone Recording logic
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await handleTranscribeAudio(audioBlob);
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      if (micStream) {
        micStream.getTracks().forEach((track) => track.stop());
      }
      setIsRecording(false);
    }
  };

  const handleTranscribeAudio = async (audioBlob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      
      const response = await fetch(`${API_URL}/career-agents/interviews/studio/transcribe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        if (data.text) {
          setUserAnswer(data.text);
        }
        if (data.audioAnalysis) {
          setCurrentAudioAnalysis(data.audioAnalysis);
        }
      }
    } catch (err) {
      console.error('Transcription API error:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  // Local Camera streaming logic
  const toggleCamera = async () => {
    if (isCameraOn) {
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
      setVideoStream(null);
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setVideoStream(stream);
        setIsCameraOn(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      } catch (err) {
        console.error('Webcam streaming error:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">AI Interview Coach Studio</h2>
        <p className="text-slate-600 mt-1">
          Prepare with real-time adaptive questioning, speech transcribing, camera feed setups, and multi-dimensional analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* ================================== LEFT PANEL ================================== */}
        <div className="lg:col-span-3 space-y-4">
          {/* Scheduled Interviews Card */}
          <Card className="p-4 shadow-soft-sm">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <Mic className="text-indigo-600" size={16} />
              Scheduled Interviews
            </h3>
            
            <div className="space-y-2 mt-3 max-h-[200px] overflow-y-auto pr-1">
              {upcomingInterviews.length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-xs">
                  No scheduled interviews. Schedule one in the Applications tab to generate practice kits.
                </p>
              ) : (
                upcomingInterviews.map((prep) => (
                  <div
                    key={prep.id}
                    onClick={() => handleSelectPrep(prep)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
                      selectedPrep?.prep?.id === prep.id
                        ? 'border-indigo-600 bg-indigo-50/20 shadow-soft-sm font-semibold'
                        : 'border-slate-100 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{prep.role}</span>
                      {prep.mockScore && (
                        <Badge variant="success" size="xs">
                          {Math.round(prep.mockScore)}/100
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5">
                      <span>{prep.company}</span>
                      <span>{prep.status === 'completed' ? 'Completed' : 'Practice Ready'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-slate-100">
              <Button
                onClick={() => setCreateKitOpen(true)}
                variant="outline"
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold border-indigo-100 hover:bg-indigo-50/50 hover:text-indigo-700"
              >
                <Plus size={14} /> Practice Custom Role
              </Button>
            </div>
          </Card>

          {/* Active Prep Kit Details Panel */}
          {selectedPrep && (
            <Card className="p-4 shadow-soft-sm space-y-4">
              {/* Difficulty & Type Configuration (Enabled only if not started) */}
              {sessionStatus === 'not_started' && (
                <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800">Session Customization</h4>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Difficulty</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-semibold mb-1">Interview Type</label>
                      <select
                        value={interviewType}
                        onChange={(e) => setInterviewType(e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="technical">Technical Focus</option>
                        <option value="behavioral">Behavioral Focus</option>
                        <option value="mixed">Mixed Assessment</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Accordions for JD, Resume, and Knowledge Map */}
              <div className="space-y-2">
                {/* Accordion: Job Info */}
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenAccordion(openAccordion === 'job' ? null : 'job')}
                    className="w-full px-3 py-2.5 bg-slate-50 flex items-center justify-between font-bold text-xs text-slate-800"
                  >
                    <span className="flex items-center gap-1.5"><BookOpen size={14} className="text-indigo-600" /> Company & Role</span>
                    {openAccordion === 'job' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {openAccordion === 'job' && (
                    <div className="p-3 bg-white text-xs text-slate-600 space-y-2 max-h-[200px] overflow-y-auto">
                      <p><strong>Company:</strong> {selectedPrep.job?.company || selectedPrep.prep?.company}</p>
                      <p><strong>Role:</strong> {selectedPrep.job?.role || selectedPrep.prep?.role}</p>
                      <p className="border-t border-slate-100 pt-2 font-semibold">Job Description:</p>
                      <p className="leading-relaxed whitespace-pre-wrap">{selectedPrep.job?.jobDescription || 'No description provided.'}</p>
                    </div>
                  )}
                </div>

                {/* Accordion: Resume Profile */}
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenAccordion(openAccordion === 'resume' ? null : 'resume')}
                    className="w-full px-3 py-2.5 bg-slate-50 flex items-center justify-between font-bold text-xs text-slate-800"
                  >
                    <span className="flex items-center gap-1.5"><FileText size={14} className="text-indigo-600" /> Resume Profile</span>
                    {openAccordion === 'resume' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {openAccordion === 'resume' && (
                    <div className="p-3 bg-white text-xs text-slate-600 space-y-1.5 max-h-[150px] overflow-y-auto">
                      <p><strong>Headline:</strong> {selectedPrep.profile?.headline || 'Not available'}</p>
                      <p><strong>Skills Matched:</strong> {selectedPrep.profile?.allSkills?.join(', ') || 'None'}</p>
                    </div>
                  )}
                </div>

                {/* Accordion: Knowledge Map */}
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpenAccordion(openAccordion === 'skills' ? null : 'skills')}
                    className="w-full px-3 py-2.5 bg-slate-50 flex items-center justify-between font-bold text-xs text-slate-800"
                  >
                    <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-indigo-600" /> Skill Node Map</span>
                    {openAccordion === 'skills' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {openAccordion === 'skills' && (
                    <div className="p-3 bg-white text-xs text-slate-600 max-h-[200px] overflow-y-auto space-y-2">
                      <p className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider">Candidate Strong Concepts</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedPrep.skills?.filter(s => s.mastery >= 70).slice(0, 5).map(s => (
                          <Badge key={s.name} variant="success" size="xs">{s.name}</Badge>
                        )) || <span className="text-slate-400">None detected</span>}
                      </div>

                      <p className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider pt-1">Identified Weak Areas</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedPrep.skills?.filter(s => s.mastery < 50).slice(0, 5).map(s => (
                          <Badge key={s.name} variant="danger" size="xs">{s.name}</Badge>
                        )) || <span className="text-slate-400">None detected</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* History for Selected Interview */}
              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold text-slate-800 mb-2">Practice History</h4>
                {selectedPrep.history?.length === 0 ? (
                  <p className="text-[10px] text-slate-400">No mock runs recorded for this position yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedPrep.history.map((h, i) => (
                      <div key={h.id} className="flex justify-between text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-700">Attempt #{selectedPrep.history.length - i}</span>
                        <span className="font-bold text-indigo-600">{Math.round(h.overallScore || 0)}/100</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* ================================== CENTER PANEL ================================== */}
        <div className="lg:col-span-6 space-y-4 flex flex-col h-full">
          {/* Main Interview Studio Board */}
          {selectedPrep ? (
            <Card className="p-6 shadow-soft-md flex-1 flex flex-col justify-between border-slate-200">
              
              {/* Studio Setup / Persona Selection state */}
              {sessionStatus === 'not_started' && (
                <div className="flex-1 flex flex-col justify-center items-center py-10 space-y-6 text-center">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-extrabold text-4xl shadow-lg animate-pulse">
                      {interviewerPersona.charAt(0)}
                    </div>
                    {isCameraOn && (
                      <div className="absolute -bottom-2 -right-2 w-16 h-12 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shadow-md">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 max-w-sm">
                    <h3 className="text-lg font-bold text-slate-800">Prepare for Your Simulation</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Select your preferred interviewer archetype to begin practicing with follow-ups, and adaptive questions.
                    </p>
                  </div>

                  {/* AI Extracted Interview Details Card */}
                  {(selectedPrep.prep.interviewDate || selectedPrep.prep.meetingLink) && (
                    <Card className="w-full max-w-md p-4 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-100 rounded-2xl text-left space-y-4 shadow-soft-sm">
                      <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2">
                        <h4 className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock size={14} className="text-indigo-600" />
                          AI-Extracted Interview Schedule
                        </h4>
                        <Badge variant="primary" size="xs">
                          {selectedPrep.prep.interviewType || 'Technical'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Date & Time</p>
                          <p className="font-semibold text-slate-800">
                            {selectedPrep.prep.interviewDate || 'TBD'} at {selectedPrep.prep.interviewTime || 'TBD'} ({selectedPrep.prep.timezone || 'Local'})
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Interviewer(s)</p>
                          <p className="font-semibold text-slate-800">
                            {selectedPrep.prep.interviewerNames && selectedPrep.prep.interviewerNames.length > 0
                              ? (Array.isArray(selectedPrep.prep.interviewerNames) ? selectedPrep.prep.interviewerNames.join(', ') : selectedPrep.prep.interviewerNames)
                              : 'Recruiting Team'}
                          </p>
                        </div>
                      </div>

                      {selectedPrep.prep.meetingLink && (
                        <div className="space-y-1 text-xs pt-1 border-t border-indigo-100/30">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Meeting Link</p>
                          <a
                            href={selectedPrep.prep.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline truncate"
                          >
                            <ExternalLink size={12} />
                            {selectedPrep.prep.meetingLink}
                          </a>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-100/30">
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            const dateStr = selectedPrep.prep.interviewDate || '2026-07-15';
                            const cleanDate = dateStr.replace(/[^0-9]/g, '');
                            const icsContent = 
                              `BEGIN:VCALENDAR\n` +
                              `VERSION:2.0\n` +
                              `PRODID:-//NextFolio//NONSGML AI Email Monitor//EN\n` +
                              `BEGIN:VEVENT\n` +
                              `SUMMARY:Interview with ${selectedPrep.prep.company} for ${selectedPrep.prep.role}\n` +
                              `DESCRIPTION:Interview scheduled automatically by NextFolio AI Email Monitoring Agent.\\nLink: ${selectedPrep.prep.meetingLink || 'None'}\\nInterviewer(s): ${selectedPrep.prep.interviewerNames || 'Recruiter'}\n` +
                              `DTSTART:20260715T170000Z\n` +
                              `DTEND:20260715T180000Z\n` +
                              `LOCATION:${selectedPrep.prep.meetingLink || 'Remote'}\n` +
                              `END:VEVENT\n` +
                              `END:VCALENDAR`;
                            
                            const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `${selectedPrep.prep.company.replace(/\s+/g, '_')}_interview.ics`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="text-[9px] py-1.5 border border-indigo-100 text-indigo-700 hover:bg-indigo-50 font-bold"
                        >
                          Add to Calendar
                        </Button>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => {
                            // Automatically start mock interview with this role
                            setInterviewerPersona('Senior Engineer');
                            setDifficulty('medium');
                            setInterviewType(selectedPrep.prep.interviewType || 'technical');
                            handleStartSession();
                          }}
                          className="text-[9px] py-1.5 bg-indigo-650 text-white hover:bg-indigo-700 font-bold"
                        >
                          Start Practice Mock
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            alert(`Showing AI Insights for ${selectedPrep.prep.company}: Top tech firm. Expect a focus on performance optimization, scaling web platforms, system designs, and team collaboration.`);
                          }}
                          className="text-[9px] py-1.5 border border-indigo-100 text-indigo-700 hover:bg-indigo-50 font-bold"
                        >
                          View Company Insights
                        </Button>
                      </div>
                    </Card>
                  )}

                  <div className="w-full max-w-xs space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 text-left mb-1.5">
                        Interviewer Persona
                      </label>
                      <select
                        value={interviewerPersona}
                        onChange={(e) => setInterviewerPersona(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option>HR Recruiter</option>
                        <option>Software Engineer</option>
                        <option>Senior Engineer</option>
                        <option>Engineering Manager</option>
                        <option>CTO</option>
                        <option>Product Manager</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={toggleCamera}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs py-2 border-slate-200"
                      >
                        {isCameraOn ? <VideoOff size={14} /> : <Video size={14} />}
                        {isCameraOn ? 'Turn Off Video' : 'Setup Camera'}
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleStartSession}
                    className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-3 rounded-xl shadow-soft-sm flex items-center justify-center gap-1.5"
                  >
                    <Play size={14} />
                    Start Mock Interview
                  </Button>
                </div>
              )}

              {/* Active Interview in Progress / Paused State */}
              {(sessionStatus === 'in_progress' || sessionStatus === 'paused') && (
                <div className="flex-1 flex flex-col justify-between h-full space-y-4">
                  {/* Avatar & Webcam Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm ${
                          sessionStatus === 'in_progress' && !isRecording ? 'animate-pulse' : ''
                        }`}>
                          {interviewerPersona.charAt(0)}
                        </div>
                        {isRecording && (
                          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800">{interviewerPersona}</h4>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock size={12} /> Question {currentQuestionIndex + 1} of {session.questions?.length || 5}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="success" size="xs">
                        {sessionStatus === 'in_progress' ? 'Listening' : 'Paused'}
                      </Badge>
                      
                      {/* Webcam feed PIP */}
                      {isCameraOn && (
                        <div className="w-20 h-14 rounded-lg bg-slate-900 border border-slate-200 overflow-hidden shadow-sm">
                          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conversation History timeline */}
                  <div className="flex-1 min-h-[180px] max-h-[280px] overflow-y-auto pr-1 space-y-3.5 scrollbar-thin">
                    {conversationHistory.map((turn, idx) => (
                      <div
                        key={idx}
                        className={`flex ${turn.role === 'candidate' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-soft-sm ${
                            turn.role === 'candidate'
                              ? 'bg-indigo-600 text-white font-medium rounded-tr-none'
                              : 'bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-tl-none'
                          }`}
                        >
                          <p className="text-[9px] font-extrabold tracking-wider uppercase opacity-65 mb-1">
                            {turn.role === 'candidate' ? 'You' : interviewerPersona}
                          </p>
                          <p>{turn.content}</p>
                        </div>
                      </div>
                    ))}
                    
                    {isAnalyzing && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs rounded-tl-none flex items-center gap-2">
                          <span className="animate-spin text-lg">◌</span>
                          <span>AI Coach is compiling live evaluation and feedback...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Real-time Transcription or text input box */}
                  <div className="space-y-3 border-t border-slate-100 pt-3">
                    
                    {/* Transcript visible area */}
                    {userAnswer && (
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-700 leading-relaxed max-h-[80px] overflow-y-auto">
                        <span className="font-extrabold text-[9px] uppercase tracking-wider text-indigo-600 block mb-1">Recorded Speech Transcript</span>
                        {userAnswer}
                      </div>
                    )}

                    {isTranscribing && (
                      <div className="text-[10px] text-indigo-600 flex items-center gap-1.5 animate-pulse italic">
                        <Volume2 size={12} /> Whisper transcribing speech to text...
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type response or use the microphone to start speaking..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
                        className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                        disabled={sessionStatus !== 'in_progress'}
                      />
                      
                      {/* Recording mic button */}
                      <Button
                        onClick={isRecording ? stopAudioRecording : startAudioRecording}
                        className={`${
                          isRecording ? 'bg-rose-600 hover:bg-rose-700 animate-pulse' : 'bg-slate-800 hover:bg-slate-900'
                        } text-white px-3`}
                        disabled={sessionStatus !== 'in_progress'}
                      >
                        {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                      </Button>
                      
                      <Button
                        onClick={handleSubmitAnswer}
                        disabled={!userAnswer.trim() || isAnalyzing || sessionStatus !== 'in_progress'}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3"
                      >
                        <Send size={16} />
                      </Button>
                    </div>

                    {/* Operational controls */}
                    <div className="flex items-center justify-between text-xs pt-1.5">
                      <div className="flex items-center gap-3 text-slate-500">
                        <span className="flex items-center gap-1"><Clock size={12} /> {Math.floor(elapsedTime / 60)}m {elapsedTime % 60}s</span>
                        {isRecording && <span className="flex items-center gap-1 text-rose-500 font-bold"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" /> {recordingTime}s</span>}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={handlePauseResume}
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 h-8 text-[11px]"
                        >
                          {sessionStatus === 'in_progress' ? <Pause size={12} /> : <Play size={12} />}
                          {sessionStatus === 'in_progress' ? 'Pause' : 'Resume'}
                        </Button>
                        <Button
                          onClick={handleEndInterview}
                          variant="outline"
                          size="sm"
                          className="border-rose-100 text-rose-600 hover:bg-rose-50 h-8 text-[11px]"
                        >
                          <Square size={12} />
                          End Session
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Feedback Banner */}
              {sessionStatus === 'completed' && (
                <div className="flex-1 flex flex-col justify-center items-center py-10 space-y-4 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
                    <Trophy size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Interview Completed!</h3>
                    <p className="text-xs text-slate-500 max-w-sm mt-1.5">
                      Awesome effort. We evaluated your communication style, STAR alignment, and technical correctness.
                    </p>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl w-full max-w-sm text-center">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">Overall Interview Readiness</p>
                    <p className="text-4xl font-black text-indigo-700 mt-1">{Math.round(session.interviewReadiness || 0)}%</p>
                  </div>

                  <div className="flex gap-2 w-full max-w-xs pt-2">
                    <Button onClick={() => window.location.reload()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
                      Restart Mock
                    </Button>
                    <Button onClick={() => setSelectedPrep(null)} variant="outline" className="flex-1 text-xs">
                      Back Home
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            /* Onboarding Coach Studio */
            <Card className="p-8 text-center flex-1 flex flex-col justify-center items-center py-20 border-dashed border-2 border-slate-200">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4 shadow-soft-sm">
                <Mic size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">AI Interview Studio Coach</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
                Select an upcoming interview from the left panel to trigger preparation materials, config personas, and initialize the studio session.
              </p>
              
              {/* History / Logs list */}
              {globalAnalytics?.totalInterviews > 0 && (
                <div className="w-full max-w-sm border-t border-slate-100 pt-6 mt-6 text-left">
                  <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1">
                    <Award size={14} className="text-indigo-600" /> Past Session Logs
                  </h4>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {upcomingInterviews.filter(p => p.status === 'completed').map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{p.role}</p>
                          <p className="text-[10px] text-slate-500">{p.company}</p>
                        </div>
                        <span className="font-black text-indigo-600">{Math.round(p.mockScore || 0)}/100</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ================================== RIGHT PANEL ================================== */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Active Live AI Feedback Metrics */}
          {selectedPrep && (sessionStatus === 'in_progress' || sessionStatus === 'paused') && (
            <Card className="p-4 shadow-soft-sm space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto">
              <h3 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Sparkles className="text-indigo-600" size={16} />
                Live AI Coach Feedback
              </h3>

              {liveAnalysis ? (
                <div className="space-y-4">
                  {/* Score circle widgets */}
                  <div className="grid grid-cols-1 gap-2.5">
                    <ScoreGauge score={liveAnalysis.communicationScore} label="Communication" icon={Heart} colorClass="indigo" />
                    <ScoreGauge score={liveAnalysis.technicalScore} label="Technical Evaluation" icon={Brain} colorClass="purple" />
                    <ScoreGauge score={liveAnalysis.confidenceScore} label="Confidence Score" icon={Zap} colorClass="amber" />
                    <ScoreGauge score={liveAnalysis.starFrameworkScore} label="STAR Framework Score" icon={Award} colorClass="green" />
                  </div>

                  {/* Audio specifics */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3 text-xs text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">Speaking Pace:</span>
                      <span className={`font-black ${
                        liveAnalysis.speakingPace?.pace === 'natural' ? 'text-emerald-600' : 'text-amber-500'
                      }`}>
                        {liveAnalysis.speakingPace?.wpm || 130} WPM ({liveAnalysis.speakingPace?.pace || 'natural'})
                      </span>
                    </div>

                    <div className="h-px bg-slate-200" />

                    <div>
                      <span className="font-bold block mb-1.5">Filler Words:</span>
                      {liveAnalysis.fillers?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {liveAnalysis.fillers.map((f, i) => (
                            <Badge key={i} variant="danger" size="xs">
                              {f.word}: {f.count}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-600 font-semibold">Perfect flow! No fillers detected.</span>
                      )}
                    </div>

                    <div className="h-px bg-slate-200" />

                    <div>
                      <span className="font-bold block mb-1.5">Grammar Highlights:</span>
                      {liveAnalysis.grammarIssues?.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-600">
                          {liveAnalysis.grammarIssues.slice(0, 3).map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-emerald-600 font-semibold">Excellent grammar and structure.</span>
                      )}
                    </div>
                  </div>

                  {/* Suggestions list */}
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl space-y-2 text-xs">
                    <strong className="text-indigo-800 block">Coaching Suggestions</strong>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px]">
                      {liveAnalysis.suggestions?.slice(0, 3).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-400 space-y-2">
                  <AlertCircle className="mx-auto" size={24} />
                  <p className="text-xs">Waiting for your first response...</p>
                  <p className="text-[10px] text-slate-400">Speak or type your answer and hit submit to analyze.</p>
                </div>
              )}
            </Card>
          )}

          {/* Final Feedback Report */}
          {sessionStatus === 'completed' && (
            <Card className="p-4 shadow-soft-sm space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto">
              <h3 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Award className="text-indigo-600" size={16} />
                Detailed Report
              </h3>

              {sessionAnalytics?.feedback ? (
                <div className="space-y-4 text-xs">
                  {/* Strengths */}
                  <div>
                    <h4 className="font-bold text-emerald-600 mb-1.5 flex items-center gap-1">✓ Key Strengths</h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px]">
                      {sessionAnalytics.feedback.strengths?.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div>
                    <h4 className="font-bold text-rose-600 mb-1.5 flex items-center gap-1">✗ Areas for Improvement</h4>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px]">
                      {sessionAnalytics.feedback.improvements?.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
                    <h4 className="font-bold text-indigo-800 mb-1.5">Actionable Coaching Recommendations</h4>
                    <ul className="list-disc pl-4 space-y-1 text-indigo-950 text-[11px]">
                      {sessionAnalytics.feedback.suggestions?.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Practice Areas */}
                  <div className="border-t border-slate-100 pt-3">
                    <h4 className="font-bold text-slate-700 mb-1.5">Knowledge Map Updates</h4>
                    <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                      The AI Coach adjusted your skill nodes based on weak and strong concepts discovered during mock evaluation.
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {sessionAnalytics.feedback.weakConcepts?.map((c) => (
                        <Badge key={c} variant="danger" size="xs">Needs Work: {c}</Badge>
                      ))}
                      {sessionAnalytics.feedback.strongConcepts?.map((c) => (
                        <Badge key={c} variant="success" size="xs">Mastered: {c}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-indigo-600 font-bold animate-pulse">
                  Evaluating session transcripts...
                </div>
              )}
            </Card>
          )}

          {/* Historical Trends/Analytics Panel (Fallback context) */}
          {(!selectedPrep || sessionStatus === 'not_started') && (
            <Card className="p-4 shadow-soft-sm space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <TrendingUp className="text-indigo-600" size={16} />
                Coach Progress Analytics
              </h3>

              {globalAnalytics && globalAnalytics.totalInterviews > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-extrabold">TOTAL RUNS</p>
                      <p className="text-lg font-black text-slate-800 mt-1">{globalAnalytics.totalInterviews}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-extrabold">COMPLETED</p>
                      <p className="text-lg font-black text-slate-800 mt-1">{globalAnalytics.completedInterviews}</p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100" />

                  {/* Sparklines */}
                  <div className="space-y-3.5">
                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Communication Trend</p>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <SVGLineChart data={globalAnalytics.communicationTrend || [70, 72, 75, 78, 80]} color="#4f46e5" />
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Technical Correctness</p>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <SVGLineChart data={globalAnalytics.technicalTrend || [65, 70, 72, 70, 75]} color="#9333ea" />
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Confidence Energy</p>
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <SVGLineChart data={globalAnalytics.confidenceTrend || [60, 65, 70, 75, 78]} color="#f59e0b" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400 text-xs leading-relaxed space-y-2">
                  <AlertCircle className="mx-auto" size={20} />
                  <p>No historical analytics found.</p>
                  <p className="text-[10px] text-slate-400">Complete mock runs to track your vocabulary, STAR framework, and communication progress.</p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Custom Prep Kit Generation Modal */}
      {createKitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 p-6 space-y-4 shadow-soft-xl animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <Sparkles className="text-indigo-600 h-5 w-5 animate-pulse" />
                Practice Custom Role
              </h3>
              <button onClick={() => setCreateKitOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            
            <p className="text-xs text-slate-500">
              Create a custom mock interview preparation kit immediately. The AI coach will tailor behavioral and technical questions based on your profile and target company.
            </p>
            
            <form onSubmit={handleCreateCustomKit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apple, Stripe, local startup"
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 bg-slate-50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Job Title / Role</label>
                <input
                  type="text"
                  placeholder="e.g. Senior iOS Engineer, Product Manager"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 bg-slate-50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Focus Topics (Optional)</label>
                <textarea
                  placeholder="e.g. Focus on SwiftUI, CoreData, and Apple design guidelines"
                  value={customTopics}
                  onChange={(e) => setCustomTopics(e.target.value)}
                  rows="2.5"
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 bg-slate-50"
                />
              </div>

              <div className="flex gap-2.5 justify-end pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCreateKitOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={isGeneratingKit}>
                  {isGeneratingKit ? 'Tailoring Guide...' : 'Generate Practice Kit'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
