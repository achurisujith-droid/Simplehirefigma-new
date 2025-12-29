import { useState, useEffect } from "react";
import { Loader2, Sparkles, BarChart3, TrendingUp, Award } from "lucide-react";

interface InterviewEvaluationPageProps {
  onComplete: () => void;
}

export function InterviewEvaluationPage({ onComplete }: InterviewEvaluationPageProps) {
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);

  const stages = [
    { label: "Analyzing responses", icon: BarChart3 },
    { label: "Evaluating communication", icon: TrendingUp },
    { label: "Assessing technical skills", icon: Sparkles },
    { label: "Generating certificate", icon: Award },
  ];

  useEffect(() => {
    // Simulate evaluation progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 1000);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    // Update stage based on progress
    if (progress < 25) setCurrentStage(0);
    else if (progress < 50) setCurrentStage(1);
    else if (progress < 75) setCurrentStage(2);
    else setCurrentStage(3);
  }, [progress]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-slate-900 mb-2">Evaluating Your Interview</h1>
            <p className="text-slate-600">
              Our AI is analyzing your responses and generating your skill certificate
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Overall Progress</span>
              <span className="text-sm text-slate-900">{progress}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Stages */}
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = index === currentStage;
              const isComplete = index < currentStage;

              return (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isActive
                      ? "bg-blue-50 border-2 border-blue-200"
                      : isComplete
                      ? "bg-green-50 border-2 border-green-200"
                      : "bg-slate-50 border-2 border-slate-100"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : isComplete
                        ? "bg-green-600 text-white"
                        : "bg-slate-300 text-slate-600"
                    }`}
                  >
                    {isComplete ? (
                      <span className="text-xl">✓</span>
                    ) : (
                      <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm ${
                      isActive || isComplete ? 'text-slate-900' : 'text-slate-500'
                    }`}>
                      {stage.label}
                    </div>
                  </div>
                  {isActive && (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Fun facts while waiting */}
          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <p className="text-sm text-slate-700 text-center">
              <span className="text-blue-600">💡 Did you know?</span> Your interview responses are analyzed using advanced AI to provide accurate skill assessment and industry-standard evaluation.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
