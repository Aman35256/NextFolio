import { CheckCircle2, Circle } from 'lucide-react';

export default function TimelineStatus({ statuses = [], currentStatus = null }) {
  const statusSteps = [
    { id: 'applied', label: 'Applied', icon: '📮' },
    { id: 'viewed', label: 'Viewed', icon: '👁️' },
    { id: 'under_review', label: 'Under Review', icon: '📋' },
    { id: 'assessment', label: 'Assessment', icon: '✏️' },
    { id: 'interview_scheduled', label: 'Interview', icon: '🎤' },
    { id: 'interview_completed', label: 'Completed', icon: '✅' },
    { id: 'offer', label: 'Offer', icon: '🎉' },
  ];

  const filteredSteps = statusSteps.filter(step =>
    statuses.some(s => s.id === step.id || s.status === step.id)
  );

  const currentIndex = filteredSteps.findIndex(
    step => step.id === currentStatus?.id || step.id === currentStatus
  );

  return (
    <div className="space-y-4">
      {filteredSteps.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const status = statuses.find(s => s.id === step.id || s.status === step.id);

        return (
          <div key={step.id} className="flex gap-4">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                  ${isCompleted || isCurrent
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                  }
                  transition-all duration-300
                `}
              >
                {step.icon}
              </div>
              {idx < filteredSteps.length - 1 && (
                <div
                  className={`w-1 h-12 my-1 ${
                    isCompleted ? 'bg-indigo-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 py-2">
              <p className={`font-semibold ${
                isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-600'
              }`}>
                {step.label}
              </p>
              {status?.timestamp && (
                <p className="text-xs text-slate-500">
                  {new Date(status.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
              {status?.notes && (
                <p className="text-sm text-slate-600 mt-1">{status.notes}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
