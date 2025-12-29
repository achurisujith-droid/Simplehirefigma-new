import { useState, useEffect } from "react";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";

interface Question {
  id: number;
  text: string;
  options: string[];
  category: string;
}

interface McqTestPageProps {
  onComplete: () => void;
}

export function McqTestPage({ onComplete }: McqTestPageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes = 900 seconds
  const [showWarning, setShowWarning] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      text: "What is the primary purpose of React's Virtual DOM?",
      options: [
        "To store application state",
        "To optimize rendering performance by minimizing direct DOM manipulation",
        "To handle routing in React applications",
        "To manage component lifecycle"
      ],
      category: "Core Concepts",
    },
    {
      id: 2,
      text: "Which hook would you use to perform side effects in a functional component?",
      options: ["useState", "useEffect", "useContext", "useReducer"],
      category: "React Hooks",
    },
    {
      id: 3,
      text: "What does the dependency array in useEffect control?",
      options: [
        "Which props the component receives",
        "When the effect should re-run",
        "The order of hook execution",
        "Component rendering order"
      ],
      category: "React Hooks",
    },
    {
      id: 4,
      text: "In React, what is the correct way to update state that depends on the previous state?",
      options: [
        "setState(prevState + 1)",
        "setState((prevState) => prevState + 1)",
        "setState = prevState + 1",
        "updateState(prevState + 1)"
      ],
      category: "State Management",
    },
    {
      id: 5,
      text: "What is the purpose of React.memo()?",
      options: [
        "To memoize component props",
        "To prevent unnecessary re-renders of functional components",
        "To cache API responses",
        "To manage component state"
      ],
      category: "Performance",
    },
    {
      id: 6,
      text: "Which of the following is true about React keys?",
      options: [
        "Keys should be unique among siblings to help React identify which items have changed",
        "Keys are optional for list items",
        "Index should always be used as keys",
        "Keys are used for styling components"
      ],
      category: "Lists & Keys",
    },
    {
      id: 7,
      text: "What is the difference between controlled and uncontrolled components?",
      options: [
        "Controlled components have no state",
        "Controlled components' form data is handled by React state, uncontrolled use DOM refs",
        "Uncontrolled components are class-based",
        "There is no difference"
      ],
      category: "Forms",
    },
    {
      id: 8,
      text: "When should you use useCallback hook?",
      options: [
        "To fetch data from APIs",
        "To memoize callback functions and prevent unnecessary re-creations",
        "To manage global state",
        "To handle form submissions"
      ],
      category: "Performance",
    },
    {
      id: 9,
      text: "What is the purpose of the Context API in React?",
      options: [
        "To style components",
        "To share state across the component tree without prop drilling",
        "To handle routing",
        "To optimize performance"
      ],
      category: "Context API",
    },
    {
      id: 10,
      text: "In React, what does lifting state up mean?",
      options: [
        "Moving state to a parent component to share it among children",
        "Storing state in localStorage",
        "Using global variables",
        "Creating a new state object"
      ],
      category: "State Management",
    },
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
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

  const handleSubmit = () => {
    // Save answers before completion (optional - for future analytics)
    console.log("MCQ Test completed. Answers:", selectedAnswers);
    onComplete();
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

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
                  {currentQuestion.text}
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
                  disabled={answeredCount < questions.length}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 disabled:opacity-50"
                >
                  Submit Test
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