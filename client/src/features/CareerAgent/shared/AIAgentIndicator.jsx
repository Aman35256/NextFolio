import { Zap, Loader } from 'lucide-react';

export default function AIAgentIndicator({ 
  isActive = false,
  status = 'idle', // 'idle', 'searching', 'applying', 'analyzing'
  message = '',
  className = '',
}) {
  const statusMessages = {
    idle: '🤖 Agent ready',
    searching: '🔍 Searching jobs...',
    applying: '📝 Submitting applications...',
    analyzing: '📊 Analyzing opportunities...',
  };

  const isLoading = status !== 'idle';

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg 
      ${isActive ? 'bg-gradient-subtle border border-indigo-200' : 'bg-slate-100'}
      ${className}`}>
      
      <div className="relative w-6 h-6">
        {isLoading ? (
          <Loader size={20} className="text-indigo-600 animate-spin" />
        ) : (
          <Zap size={20} className="text-indigo-600" />
        )}
        {isActive && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </div>

      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-900">
          {message || statusMessages[status]}
        </p>
      </div>

      {isLoading && (
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" />
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      )}
    </div>
  );
}
