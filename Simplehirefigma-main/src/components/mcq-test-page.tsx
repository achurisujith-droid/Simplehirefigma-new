import { useState, useEffect } from "react";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { interviewService } from "../src/services/interview.service";
import { toast } from "sonner";

interface Question {
  id: string;
  question: string;
  options: string[];
  category: string;
  difficulty?: string;
}

interface McqTestPageProps {
  onComplete: () => void;
}

export function McqTestPage({ onComplete }: McqTestPageProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes = 1200 seconds
  const [showWarning, setShowWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch MCQ questions from backend
  useEffect(() => {
    async function loadMCQQuestions() {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('/api/interviews/mcq', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load MCQ questions');
        }

        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          setQuestions(data.data);
        } else {
          throw new Error('No questions received from server');
        }
      } catch (error) {
        console.error('Failed to load MCQ questions:', error);
        setError(error instanceof Error ? error.message : 'Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    }
    loadMCQQuestions();
  }, []);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(selectedAnswers).length;

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Call onComplete directly when time runs out
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  // Warning for unanswered questions
  useEffect(() => {
    if (currentQuestionIndex === questions.length - 1 && answeredCount < questions.length) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [currentQuestionIndex, answeredCount]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (optionIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: optionIndex,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Convert selectedAnswers to the format expected by backend
      // Backend expects: { answers: [{ questionId, selectedOptionIndex }] }
      const answersArray = Object.entries(selectedAnswers).map(([questionId, selectedOptionIndex]) => ({
        questionId,
        selectedOptionIndex,
      }));

      const response = await interviewService.submitMCQTest(answersArray);
      
      if (!response.success) {
        toast.error('Failed to submit answers', {
          description: response.error || 'Please try again',
        });
        setIsSubmitting(false);
        return;
      }

      toast.success('MCQ test completed successfully');
      onComplete();
    } catch (error) {
      console.error('Error submitting MCQ test:', error);
      toast.error('Failed to submit answers', {
        description: 'Please try again',
      });
      setIsSubmitting(false);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Show loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your personalized MCQ test...</p>
        </div>
      </main>
    );
  }

  // Show error state
  if (error || questions.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Unable to Load Questions</h2>
          <p className="text-slate-600 mb-4">{error || 'No questions available'}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-slate-900">Multiple Choice Test</span>
            </div>
            <div className="h-6 w-px bg-slate-300 hidden sm:block"></div>
            <div className="text-sm text-slate-600">
              Step 2 of 3
            </div>
          </div>
          
          <div className="flex-1 w-full sm:max-w-md sm:mx-8">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            timeLeft < 300 ? 'bg-red-500 text-white' : 'bg-slate-100'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Question Area */}
          <div className="col-span-3 space-y-6">
            {/* Question Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs uppercase tracking-wide">
                    {currentQuestion.category}
                  </span>
                  <span className="text-sm text-slate-500">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>
                <h2 className="text-2xl text-slate-900">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(index)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? "border-blue-500 bg-blue-500"
                            : "border-slate-300"
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                        <span className={`flex-1 ${
                          isSelected ? "text-slate-900" : "text-slate-700"
                        }`}>
                          {option}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Warning for unanswered */}
              {showWarning && !selectedAnswers[currentQuestion.id] && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-800">
                      You haven't answered this question yet. Make sure to answer all questions before submitting.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="px-6"
              >
                Previous
              </Button>

              <div className="text-sm text-slate-600">
                {answeredCount} of {questions.length} answered
              </div>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={answeredCount < questions.length || isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Test'
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar - Question Navigator */}
          <div className="col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sticky top-24">
              <h3 className="text-sm text-slate-900 mb-4">Question Navigator</h3>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {questions.map((q, index) => {
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  const isCurrent = index === currentQuestionIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(index)}
                      className={`aspect-square rounded-lg text-sm transition-all ${
                        isCurrent
                          ? "bg-blue-600 text-white border-2 border-blue-600"
                          : isAnswered
                          ? "bg-green-100 text-green-700 border-2 border-green-300"
                          : "bg-slate-100 text-slate-600 border-2 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span className="text-slate-600">Current</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
                  <span className="text-slate-600">Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-100 border-2 border-slate-200 rounded"></div>
                  <span className="text-slate-600">Not answered</span>
                </div>
              </div>

              {/* Progress Stats */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Answered</span>
                    <span className="text-slate-900">{answeredCount}/{questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Time Left</span>
                    <span className={timeLeft < 120 ? "text-red-600" : "text-slate-900"}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}