import { useEffect, useState } from 'react';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Send,
  Volume2,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Brain,
  Heart,
  Zap,
  Award,
} from 'lucide-react';
import { Card, Button, Badge } from '../../../components';
import { useCareerAgentStore } from '../../../store/careerAgent';
import { useResumeStore } from '../../../store';
import VirtualInterviewer from './VirtualInterviewer';
import InterviewControls from './InterviewControls';
import LiveFeedbackPanel from './LiveFeedbackPanel';
import InterviewHistory from './InterviewHistory';

export default function AIInterviewStudio() {
  const token = useResumeStore((state) => state.token);
  const { upcomingInterviews, fetchInterviews } = useCareerAgentStore();

  // Session management
  const [selectedPrep, setSelectedPrep] = useState(null);
  const [session, setSession] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('not_started'); // 'not_started', 'in_progress', 'paused', 'completed'
  
  // Interview state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Analysis state
  const [liveAnalysis, setLiveAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionAnalytics, setSessionAnalytics] = useState(null);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [interviewerPersona, setInterviewerPersona] = useState('Senior Engineer');
  const [difficulty, setDifficulty] = useState('medium');
  const [interviewType, setInterviewType] = useState('mixed');
  const [transcriptVisible, setTranscriptVisible] = useState(true);

  // Fetch interviews on mount
  useEffect(() => {
    if (token) {
      fetchInterviews(token);
    }
  }, [token]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (sessionStatus === 'in_progress') {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStatus]);

  // Recording timer effect
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSelectPrep = (prep) => {
    setSelectedPrep(prep);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setElapsedTime(0);
    setSessionStatus('not_started');
  };

  const handleCreateSession = async () => {
    if (!selectedPrep || !token) return;

    try {
      const response = await fetch('/api/career-agents/interviews/studio/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          prepId: selectedPrep.id,
          interviewerPersona,
          difficulty,
          interviewType,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSession(data.session);
        setCurrentQuestion(data.session.questions?.[0]);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const handleStartInterview = async () => {
    if (!session || !token) return;

    try {
      const response = await fetch('/api/career-agents/interviews/studio/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: session.id }),
      });

      const data = await response.json();
      if (data.success) {
        setSession(data.session);
        setSessionStatus('in_progress');
      }
    } catch (error) {
      console.error('Error starting interview:', error);
    }
  };

  const handlePauseResume = async () => {
    if (!session || !token) return;

    try {
      const response = await fetch('/api/career-agents/interviews/studio/session/pause', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: session.id }),
      });

      const data = await response.json();
      if (data.success) {
        setSession(data.session);
        setSessionStatus(data.session.status);
      }
    } catch (error) {
      console.error('Error pausing interview:', error);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || !session || !token) return;

    setIsAnalyzing(true);

    try {
      // Add transcript
      await fetch('/api/career-agents/interviews/studio/transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: session.id,
          questionIndex: currentQuestionIndex,
          question: currentQuestion?.question,
          answer: userAnswer,
        }),
      });

      // Analyze response
      const analysisResponse = await fetch('/api/career-agents/interviews/studio/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          answer: userAnswer,
          audioMetadata: { duration: recordingTime / 10 },
        }),
      });

      const analysisData = await analysisResponse.json();
      if (analysisData.success) {
        setLiveAnalysis(analysisData.analysis);
      }

      // Get next question
      const nextResponse = await fetch('/api/career-agents/interviews/studio/next-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: session.id }),
      });

      const nextData = await nextResponse.json();
      if (nextData.success) {
        if (nextData.completed) {
          setSessionStatus('completed');
          await handleEndInterview();
        } else {
          setCurrentQuestion(nextData.question);
          setCurrentQuestionIndex(nextData.questionIndex);
          setUserAnswer('');
          setRecordingTime(0);
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEndInterview = async () => {
    if (!session || !token) return;

    try {
      const response = await fetch('/api/career-agents/interviews/studio/session/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: session.id }),
      });

      const data = await response.json();
      if (data.success) {
        setSession(data.session);
        setSessionStatus('completed');

        // Generate feedback
        await handleGenerateFeedback(session.id);
      }
    } catch (error) {
      console.error('Error ending interview:', error);
    }
  };

  const handleGenerateFeedback = async (sessionId) => {
    if (!token) return;

    try {
      const response = await fetch('/api/career-agents/interviews/studio/generate-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();
      if (data.success) {
        setSessionAnalytics(data);
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
    }
  };

  if (!token) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600">Please log in to access AI Interview Studio</p>
      </Card>
    );
  }

  if (!selectedPrep) {
    return <InterviewHistory interviews={upcomingInterviews} onSelect={handleSelectPrep} />;
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">AI Interview Studio</h2>
          <p className="text-slate-600">
            Prepare for {selectedPrep.role} at {selectedPrep.company} with real-time AI coaching
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Interview Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Interviewer Persona</label>
                <select
                  value={interviewerPersona}
                  onChange={(e) => setInterviewerPersona(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600"
                >
                  <option>HR Recruiter</option>
                  <option>Software Engineer</option>
                  <option selected>Senior Engineer</option>
                  <option>Engineering Manager</option>
                  <option>CTO</option>
                  <option>Product Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600"
                >
                  <option>Easy</option>
                  <option selected>Medium</option>
                  <option>Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Interview Type</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600"
                >
                  <option>Technical</option>
                  <option>Behavioral</option>
                  <option selected>Mixed</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCreateSession}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                <Play size={18} />
                Start Interview
              </Button>
              <Button
                onClick={() => setSelectedPrep(null)}
                variant="outline"
                className="flex-1"
              >
                Back to Interviews
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (sessionStatus === 'completed' && sessionAnalytics) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">Interview Complete!</h2>
          <p className="text-slate-600">Here's your detailed feedback and analysis</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Overall', value: sessionAnalytics.sessionScores?.overall, icon: Award, color: 'indigo' },
            { label: 'Communication', value: sessionAnalytics.sessionScores?.communication, icon: Heart, color: 'red' },
            { label: 'Technical', value: sessionAnalytics.sessionScores?.technical, icon: Brain, color: 'purple' },
            { label: 'Behavior', value: sessionAnalytics.sessionScores?.behavior, icon: Zap, color: 'yellow' },
            { label: 'Confidence', value: sessionAnalytics.sessionScores?.confidence, icon: TrendingUp, color: 'green' },
          ].map((score) => {
            const Icon = score.icon;
            return (
              <Card key={score.label} className="p-4 text-center space-y-2">
                <Icon size={24} className={`text-${score.color}-600 mx-auto`} />
                <p className="text-sm text-slate-600 font-semibold">{score.label}</p>
                <p className="text-3xl font-bold text-slate-900">{score.value}</p>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-${score.color}-600`}
                    style={{ width: `${(score.value / 100) * 100}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>

        {sessionAnalytics.feedback && (
          <Card className="p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Detailed Feedback</h3>

            {sessionAnalytics.feedback.strengths && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-600" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {sessionAnalytics.feedback.strengths.map((item, idx) => (
                    <li key={idx} className="text-slate-700 text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {sessionAnalytics.feedback.improvements && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <AlertCircle size={18} className="text-amber-600" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-1">
                  {sessionAnalytics.feedback.improvements.map((item, idx) => (
                    <li key={idx} className="text-slate-700 text-sm">• {item}</li>
                  ))}
                </ul>
              </div>
            )}

            {sessionAnalytics.feedback.suggestions && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Zap size={18} className="text-indigo-600" />
                  Improvement Suggestions
                </h4>
                <ol className="space-y-1">
                  {sessionAnalytics.feedback.suggestions.map((item, idx) => (
                    <li key={idx} className="text-slate-700 text-sm">{idx + 1}. {item}</li>
                  ))}
                </ol>
              </div>
            )}
          </Card>
        )}

        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
            Start Another Interview
          </Button>
          <Button onClick={() => setSelectedPrep(null)} variant="outline" className="flex-1">
            Back to Interviews
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">
            {selectedPrep.role} Interview • {selectedPrep.company}
          </h2>
          <p className="text-slate-600 mt-1">
            Question {currentQuestionIndex + 1} of {session.questions?.length || 0}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={sessionStatus === 'in_progress' ? 'success' : 'default'}>
            {sessionStatus === 'in_progress' ? 'Recording' : sessionStatus}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={18} />
          </Button>
        </div>
      </div>

      {/* Main Interview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Question & History */}
        <div className="space-y-4">
          <VirtualInterviewer
            question={currentQuestion}
            questionIndex={currentQuestionIndex}
            totalQuestions={session.questions?.length}
            interviewerPersona={interviewerPersona}
          />
        </div>

        {/* Center Panel - Interview Controls */}
        <div className="space-y-4">
          <InterviewControls
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            recordingTime={recordingTime}
            elapsedTime={elapsedTime}
            sessionStatus={sessionStatus}
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            transcriptVisible={transcriptVisible}
            setTranscriptVisible={setTranscriptVisible}
            onPauseResume={handlePauseResume}
            onSubmitAnswer={handleSubmitAnswer}
            onEndInterview={handleEndInterview}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Right Panel - Live Feedback */}
        <div>
          <LiveFeedbackPanel
            analysis={liveAnalysis}
            isAnalyzing={isAnalyzing}
          />
        </div>
      </div>

      {/* Full Width Transcript */}
      {transcriptVisible && userAnswer && (
        <Card className="p-4 space-y-2">
          <h4 className="font-semibold text-slate-900">Your Answer</h4>
          <p className="text-slate-700 leading-relaxed">{userAnswer}</p>
        </Card>
      )}
    </div>
  );
}
