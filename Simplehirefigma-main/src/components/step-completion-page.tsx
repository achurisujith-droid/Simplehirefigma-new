import { useState } from "react";
import { CheckCircle, Clock, Code } from "lucide-react";
import { Button } from "./ui/button";

interface StepCompletionPageProps {
  stepNumber: number;
  stepName: string;
  onContinue: () => void;
  onTakeBreak: () => void;
}

export function StepCompletionPage({ stepNumber, stepName, onContinue, onTakeBreak }: StepCompletionPageProps) {
  // Map of what to show NEXT based on completed step
  const nextStepMap: Record<number, any> = {
    1: {
      name: "Voice Interview",
      description: "5 questions with AI interviewer",
      duration: "5-8 minutes",
      icon: CheckCircle,
    },
    2: {
      name: "MCQ Test",
      description: "Answer 10 multiple-choice questions",
      duration: "15 minutes",
      icon: CheckCircle,
    },
    3: {
      name: "Coding Challenge",
      description: "Solve 2 coding problems",
      duration: "30 minutes",
      icon: Code,
    },
  };

  const nextStep = nextStepMap[stepNumber];
  const totalSteps = 4; // Docs + Voice + MCQ + Coding

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-12">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-slate-900 mb-2">
              {stepName} Complete! 🎉
            </h1>
            <p className="text-slate-600">
              Great job! You've completed step {stepNumber} of 4
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Overall Progress</span>
              <span className="text-sm text-slate-900">{Math.round((stepNumber / 4) * 100)}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500 rounded-full"
                style={{ width: `${(stepNumber / 4) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>Voice Interview</span>
              <span>MCQ Test</span>
              <span>Coding Challenge</span>
            </div>
          </div>

          {stepNumber < 4 && nextStep && (
            <>
              {/* Next Step Preview */}
              <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <nextStep.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-slate-900 mb-1">Next: {nextStep.name}</h3>
                    <p className="text-slate-600 text-sm mb-2">{nextStep.description}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span>Estimated time: {nextStep.duration}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={onContinue}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base"
                >
                  Continue to {nextStep.name}
                </Button>
                <Button
                  onClick={onTakeBreak}
                  variant="outline"
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 py-6 text-base"
                >
                  Take a Break - I'll Come Back Later
                </Button>
              </div>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800 text-center">
                  💡 Your progress is saved. You can continue anytime from your dashboard.
                </p>
              </div>
            </>
          )}

          {stepNumber === 4 && (
            <div className="text-center">
              <div className="bg-green-50 rounded-xl border border-green-200 p-6 mb-6">
                <h3 className="text-slate-900 mb-2">All Steps Complete!</h3>
                <p className="text-slate-600 text-sm">
                  Your responses are being evaluated to generate your certificate.
                </p>
              </div>
              <Button
                onClick={onContinue}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base"
              >
                View Evaluation Results
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}