import { Card, Button, Badge } from '../../../components';
import { Mic, MicOff, Pause, Play, Send, Square, Eye, EyeOff, Clock } from 'lucide-react';

export default function InterviewControls({
  isRecording,
  setIsRecording,
  recordingTime,
  elapsedTime,
  sessionStatus,
  userAnswer,
  setUserAnswer,
  transcriptVisible,
  setTranscriptVisible,
  onPauseResume,
  onSubmitAnswer,
  onEndInterview,
  isAnalyzing,
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Timer and Recording Status */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-xs text-slate-600 font-semibold mb-1">Elapsed Time</p>
            <p className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-1">
              <Clock size={18} />
              {formatTime(elapsedTime)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-600 font-semibold mb-1">Recording Time</p>
            <p className={`text-2xl font-bold flex items-center justify-center gap-1 ${
              isRecording ? 'text-red-600' : 'text-slate-900'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-slate-400'}`} />
              {formatTime(recordingTime)}
            </p>
          </div>
        </div>
      </Card>

      {/* Recording Controls */}
      <Card className="p-4 space-y-3">
        <h4 className="font-semibold text-slate-900 text-sm">Recording Controls</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => setIsRecording(!isRecording)}
            disabled={sessionStatus !== 'in_progress'}
            className={`${
              isRecording
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white font-semibold`}
          >
            {isRecording ? (
              <>
                <MicOff size={16} />
                Stop Recording
              </>
            ) : (
              <>
                <Mic size={16} />
                Start Recording
              </>
            )}
          </Button>

          <Button
            onClick={onPauseResume}
            disabled={sessionStatus === 'not_started' || sessionStatus === 'completed'}
            variant="outline"
            className="font-semibold"
          >
            {sessionStatus === 'in_progress' ? (
              <>
                <Pause size={16} />
                Pause
              </>
            ) : (
              <>
                <Play size={16} />
                Resume
              </>
            )}
          </Button>
        </div>

        <Button
          onClick={() => setTranscriptVisible(!transcriptVisible)}
          variant="outline"
          className="w-full font-semibold text-sm"
        >
          {transcriptVisible ? (
            <>
              <EyeOff size={16} />
              Hide Transcript
            </>
          ) : (
            <>
              <Eye size={16} />
              Show Transcript
            </>
          )}
        </Button>
      </Card>

      {/* Answer Input */}
      <Card className="p-4 space-y-3">
        <h4 className="font-semibold text-slate-900 text-sm">Your Answer</h4>
        
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Type or paste your answer here... or use the microphone to record your response."
          disabled={sessionStatus !== 'in_progress'}
          className="w-full h-24 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-400 text-sm resize-none"
        />

        <div className="flex gap-2">
          <Button
            onClick={onSubmitAnswer}
            disabled={!userAnswer.trim() || isAnalyzing || sessionStatus !== 'in_progress'}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            {isAnalyzing ? (
              <>
                <span className="animate-spin inline-block mr-2">◌</span>
                Analyzing...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit Answer
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Session Controls */}
      <Card className="p-4 space-y-3">
        <h4 className="font-semibold text-slate-900 text-sm">Interview Controls</h4>
        
        <div className="space-y-2">
          <Button
            onClick={onEndInterview}
            disabled={sessionStatus === 'completed'}
            variant="outline"
            className="w-full font-semibold border-red-200 text-red-600 hover:bg-red-50"
          >
            <Square size={16} />
            End Interview
          </Button>
          
          <p className="text-xs text-slate-500 text-center">
            You can end the interview at any time. Your progress will be saved.
          </p>
        </div>
      </Card>

      {/* Status Badge */}
      <div className="text-center">
        <Badge variant={sessionStatus === 'in_progress' ? 'success' : 'default'}>
          Status: {sessionStatus}
        </Badge>
      </div>
    </div>
  );
}
