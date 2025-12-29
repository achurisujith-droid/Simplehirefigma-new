import { useState, useEffect } from "react";
import { Code, Clock, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

interface CodingQuestion {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium";
  description: string;
  examples: { input: string; output: string }[];
}

interface CodingChallengePageProps {
  onComplete: () => void;
}

export function CodingChallengePage({ onComplete }: CodingChallengePageProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [solutions, setSolutions] = useState<Record<number, string>>({
    1: "",
    2: "",
  });
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes total

  const questions: CodingQuestion[] = [
    {
      id: 1,
      title: "Check if a String is a Palindrome",
      difficulty: "Easy",
      description: "Write a function that checks if a given string is a palindrome. A palindrome is a word, phrase, or sequence that reads the same backward as forward (ignoring spaces, punctuation, and capitalization).",
      examples: [
        { input: "\"racecar\"", output: "true" },
        { input: "\"hello\"", output: "false" },
        { input: "\"A man a plan a canal Panama\"", output: "true" }
      ]
    },
    {
      id: 2,
      title: "Find the Largest Number in an Array",
      difficulty: "Easy",
      description: "Write a function that takes an array of numbers and returns the largest number in the array. Handle edge cases like empty arrays.",
      examples: [
        { input: "[3, 7, 2, 9, 1]", output: "9" },
        { input: "[-5, -2, -10, -1]", output: "-1" },
        { input: "[42]", output: "42" }
      ]
    }
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const completedCount = Object.values(solutions).filter(s => s.trim().length > 0).length;

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (value: string) => {
    setSolutions({
      ...solutions,
      [currentQuestion.id]: value,
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
    onComplete();
  };

  const getDifficultyColor = (difficulty: string) => {
    return difficulty === "Easy" 
      ? "bg-green-100 text-green-700 border-green-300"
      : "bg-amber-100 text-amber-700 border-amber-300";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Top Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left: Title & Step */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Code className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Step 3 of 3</p>
                  <p className="text-sm text-slate-900">Coding Challenge</p>
                </div>
              </div>
            </div>

            {/* Center: Progress */}
            <div className="flex-1 w-full sm:max-w-md sm:mx-8">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</span>
                <span className="text-xs text-slate-500">{completedCount} attempted</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Right: Timer */}
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              timeLeft < 300 
                ? 'bg-red-500 text-white shadow-lg' 
                : timeLeft < 600
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-700'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Side - Problem Description */}
          <div className="space-y-6">
            {/* Problem Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider border ${getDifficultyColor(currentQuestion.difficulty)}`}>
                    {currentQuestion.difficulty}
                  </span>
                  <span className="text-sm text-slate-500">
                    Problem {currentQuestionIndex + 1}
                  </span>
                </div>
                {solutions[currentQuestion.id]?.trim().length > 0 && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Attempted</span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl text-slate-900 mb-4">
                {currentQuestion.title}
              </h1>

              {/* Description */}
              <div className="mb-6">
                <p className="text-slate-700 leading-relaxed">
                  {currentQuestion.description}
                </p>
              </div>

              {/* Examples */}
              <div>
                <h3 className="text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <span>📝</span>
                  <span>Examples:</span>
                </h3>
                <div className="space-y-3">
                  {currentQuestion.examples.map((example, index) => (
                    <div key={index} className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-4 border border-slate-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-slate-500 uppercase tracking-wide">Input</span>
                          <code className="block text-sm text-slate-900 mt-2 font-mono bg-white px-3 py-2 rounded-lg border border-slate-200">
                            {example.input}
                          </code>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500 uppercase tracking-wide">Output</span>
                          <code className="block text-sm text-blue-600 mt-2 font-mono bg-white px-3 py-2 rounded-lg border border-blue-200">
                            {example.output}
                          </code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
              <h4 className="text-sm text-blue-900 mb-4 flex items-center gap-2 font-medium">
                <span>💡</span>
                <span>Coding Tips</span>
              </h4>
              <ul className="space-y-2.5 text-xs text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>Write your solution in any programming language</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>Add comments to explain your logic</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>Consider edge cases (empty inputs, special characters)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>Focus on correctness first, optimization second</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Side - Code Editor */}
          <div className="space-y-6">
            {/* Code Editor Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              {/* Editor Header - Mac Style */}
              <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-sm text-slate-300 font-mono">solution.js</span>
                </div>
                <div className="flex items-center gap-2">
                  {solutions[currentQuestion.id]?.trim().length > 0 ? (
                    <div className="flex items-center gap-2 text-green-400 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Auto-saved</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-400 text-xs">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Empty</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Text Area - Code Editor */}
              <div className="bg-slate-900 p-6">
                <textarea
                  value={solutions[currentQuestion.id] || ""}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder={`// Write your solution here...
// You can use any programming language

function isPalindrome(str) {
  // Your code here
  
}

// Example usage:
// isPalindrome("racecar") → true`}
                  className="w-full h-[520px] bg-slate-900 text-slate-100 font-mono text-sm leading-relaxed resize-none focus:outline-none placeholder-slate-600"
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                />
              </div>

              {/* Editor Footer */}
              <div className="bg-slate-800 px-6 py-3 flex items-center justify-between text-xs border-t border-slate-700">
                <span className="text-slate-400 font-mono">
                  {solutions[currentQuestion.id]?.split('\n').length || 1} lines
                </span>
                <span className="text-slate-400 font-mono">
                  {solutions[currentQuestion.id]?.length || 0} characters
                </span>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>Note:</strong> Your code is automatically saved as you type. 
                We evaluate your logic, approach, and problem-solving skills - not just syntax.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-8 flex items-center justify-between bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="px-6 disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="text-center">
            <p className="text-sm text-slate-900 mb-1">
              Progress: {completedCount} of {questions.length} attempted
            </p>
            <p className="text-xs text-slate-500">
              You can move between problems freely
            </p>
          </div>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 shadow-lg"
            >
              Submit All Solutions
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}