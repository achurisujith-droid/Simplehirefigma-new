import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Clock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { UnifiedAssessmentAPI } from "../lib/api/unifiedAssessmentClient";
import { useAssessmentSession } from "../state/assessmentSession";
import type { AssessmentStatus, ComponentStatus } from "../types/assessment";
import { toast } from "sonner@2.0.3";

interface AssessmentStatusPageProps {
  onNavigate: (component: 'voice' | 'mcq' | 'code' | 'results') => void;
}

export function AssessmentStatusPage({ onNavigate }: AssessmentStatusPageProps) {
  const { sessionId } = useAssessmentSession();
  const [status, setStatus] = useState<AssessmentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('No active session found');
      setIsLoading(false);
      return;
    }

    fetchStatus();
  }, [sessionId]);

  const fetchStatus = async () => {
    if (!sessionId) return;

    try {
      setIsLoading(true);
      const data = await UnifiedAssessmentAPI.getStatus(sessionId);
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assessment status');
      toast.error('Failed to load assessment status');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (componentStatus: ComponentStatus) => {
    switch (componentStatus) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'pending':
        return <Circle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusLabel = (componentStatus: ComponentStatus) => {
    switch (componentStatus) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Not Started';
    }
  };

  const getStatusColor = (componentStatus: ComponentStatus) => {
    switch (componentStatus) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      case 'pending':
        return 'text-slate-400';
    }
  };

  const handleContinue = () => {
    if (!status) return;

    // Navigate based on resume component or first pending
    if (status.resumeComponent) {
      onNavigate(status.resumeComponent);
    } else {
      // Find first non-completed component
      if (status.components.voice !== 'completed') {
        onNavigate('voice');
      } else if (status.components.mcq !== 'completed') {
        onNavigate('mcq');
      } else if (status.components.code !== 'completed') {
        onNavigate('code');
      } else {
        onNavigate('results');
      }
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading assessment status...</p>
        </div>
      </main>
    );
  }

  if (error || !status) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl text-slate-900 mb-2">Unable to Load Assessment</h2>
          <p className="text-slate-600 mb-6">{error || 'An error occurred'}</p>
          <Button onClick={fetchStatus}>Try Again</Button>
        </div>
      </main>
    );
  }

  const isComplete = status.status === 'completed';

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl text-slate-900 mb-2">Assessment Progress</h1>
          <p className="text-sm sm:text-base text-slate-600">
            {isComplete 
              ? 'Your assessment is complete! View your results below.'
              : 'Continue where you left off or start the next component.'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-600">Overall Progress</span>
            <span className="text-sm text-slate-900">{Math.round(status.progressPercentage)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${status.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Component Status Cards */}
        <div className="space-y-4 mb-8">
          {/* Voice Interview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(status.components.voice)}
                <div>
                  <h3 className="text-slate-900">Voice Interview</h3>
                  <p className="text-sm text-slate-600">AI-powered conversation assessment</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${getStatusColor(status.components.voice)}`}>
                  {getStatusLabel(status.components.voice)}
                </span>
                {status.components.voice !== 'completed' && (
                  <Button
                    size="sm"
                    onClick={() => onNavigate('voice')}
                    variant={status.components.voice === 'in_progress' ? 'default' : 'outline'}
                  >
                    {status.components.voice === 'in_progress' ? 'Continue' : 'Start'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* MCQ Test */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(status.components.mcq)}
                <div>
                  <h3 className="text-slate-900">Multiple Choice Test</h3>
                  <p className="text-sm text-slate-600">Technical knowledge assessment</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${getStatusColor(status.components.mcq)}`}>
                  {getStatusLabel(status.components.mcq)}
                </span>
                {status.components.mcq !== 'completed' && (
                  <Button
                    size="sm"
                    onClick={() => onNavigate('mcq')}
                    variant={status.components.mcq === 'in_progress' ? 'default' : 'outline'}
                    disabled={status.components.mcq === 'pending'}
                  >
                    {status.components.mcq === 'in_progress' ? 'Continue' : 'Start'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Coding Challenge */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getStatusIcon(status.components.code)}
                <div>
                  <h3 className="text-slate-900">Coding Challenge</h3>
                  <p className="text-sm text-slate-600">Hands-on programming test</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${getStatusColor(status.components.code)}`}>
                  {getStatusLabel(status.components.code)}
                </span>
                {status.components.code !== 'completed' && (
                  <Button
                    size="sm"
                    onClick={() => onNavigate('code')}
                    variant={status.components.code === 'in_progress' ? 'default' : 'outline'}
                    disabled={status.components.code === 'pending'}
                  >
                    {status.components.code === 'in_progress' ? 'Continue' : 'Start'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6">
          {isComplete ? (
            <Button
              onClick={() => onNavigate('results')}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              View Results
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleContinue}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              Continue Assessment
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>

        {/* Session Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Session ID: {sessionId?.slice(0, 8)}...
          </p>
        </div>
      </div>
    </main>
  );
}
