import { Card, Badge } from '../../../components';
import { MessageCircle, Lightbulb } from 'lucide-react';

export default function VirtualInterviewer({
  question,
  questionIndex,
  totalQuestions,
  interviewerPersona,
}) {
  return (
    <Card className="p-6 space-y-6 h-full">
      {/* Virtual Avatar */}
      <div className="flex flex-col items-center space-y-4">
        <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-5xl shadow-lg">
          {interviewerPersona?.charAt(0).toUpperCase()}
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-900">{interviewerPersona}</h3>
          <p className="text-sm text-slate-500 mt-1">AI Interview Coach</p>
        </div>
      </div>

      {/* Interview Status */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-700">Progress</span>
          <span className="text-sm font-bold text-indigo-600">
            {questionIndex + 1} / {totalQuestions}
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="h-2 bg-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${((questionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Question */}
      {question ? (
        <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex items-start gap-2">
            <MessageCircle size={20} className="text-indigo-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-600 mb-1">Current Question</p>
              <p className="text-slate-900 leading-relaxed">{question.question}</p>
            </div>
          </div>

          {question.type && (
            <div className="flex gap-2 pt-2">
              <Badge variant="outline" size="sm">
                {question.type === 'system_design' ? 'System Design' : question.type}
              </Badge>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 p-4 rounded-lg text-center text-slate-500 h-32 flex items-center justify-center">
          Waiting for next question...
        </div>
      )}

      {/* Tips for Current Question */}
      <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs font-semibold text-blue-700 flex items-center gap-1">
          <Lightbulb size={14} />
          Interview Tip
        </p>
        <p className="text-xs text-blue-600 leading-relaxed">
          {question?.type === 'behavioral'
            ? 'Use the STAR method: Situation, Task, Action, Result. Be specific with examples.'
            : question?.type === 'technical'
            ? 'Think out loud and explain your approach. Don\'t rush - clarity is important.'
            : question?.type === 'system_design'
            ? 'Start with requirements, discuss trade-offs, and focus on scalability.'
            : 'Take your time and provide clear, structured answers with examples.'}
        </p>
      </div>

      {/* Interviewer Status */}
      <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-200">
        <p>Ready to listen to your response</p>
        <p>Speak clearly and naturally</p>
      </div>
    </Card>
  );
}
