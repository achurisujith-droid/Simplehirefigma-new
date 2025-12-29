import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Monitor, Camera, Mic, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface SystemCheckCardProps {
  onStartInterview: () => void;
}

export function SystemCheckCard({ onStartInterview }: SystemCheckCardProps) {
  const [checks, setChecks] = useState([
    { id: "screen", label: "Screen & browser check", icon: Monitor, status: "not-checked" as const, description: "Checking screen size and browser compatibility" },
    { id: "camera", label: "Camera check", icon: Camera, status: "not-checked" as const, description: "Preview your camera feed" },
    { id: "microphone", label: "Microphone check", icon: Mic, status: "not-checked" as const, description: "Testing audio input levels" }
  ]);

  const [allPassed, setAllPassed] = useState(false);

  useEffect(() => {
    // Simulate system checks
    const timer1 = setTimeout(() => {
      setChecks(prev => prev.map(check => 
        check.id === "screen" ? { ...check, status: "checking" as const } : check
      ));
    }, 500);

    const timer2 = setTimeout(() => {
      setChecks(prev => prev.map(check => 
        check.id === "screen" ? { ...check, status: "passed" as const } : check
      ));
    }, 1500);

    const timer3 = setTimeout(() => {
      setChecks(prev => prev.map(check => 
        check.id === "camera" ? { ...check, status: "checking" as const } : check
      ));
    }, 2000);

    const timer4 = setTimeout(() => {
      setChecks(prev => prev.map(check => 
        check.id === "camera" ? { ...check, status: "passed" as const } : check
      ));
    }, 3000);

    const timer5 = setTimeout(() => {
      setChecks(prev => prev.map(check => 
        check.id === "microphone" ? { ...check, status: "checking" as const } : check
      ));
    }, 3500);

    const timer6 = setTimeout(() => {
      setChecks(prev => prev.map(check => 
        check.id === "microphone" ? { ...check, status: "passed" as const } : check
      ));
      setAllPassed(true);
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not-checked":
        return <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">Not checked</Badge>;
      case "checking":
        return <Badge className="bg-blue-100 text-blue-700 text-xs">Checking...</Badge>;
      case "passed":
        return <Badge className="bg-green-100 text-green-700 text-xs flex items-center gap-1">
          <Check className="w-3 h-3" />
          Passed
        </Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <h2 className="text-slate-900 mb-6">System check before interview</h2>

      <div className="flex gap-8">
        {/* Left side - Checklist */}
        <div className="flex-1 space-y-6">
          {checks.map((check) => {
            const Icon = check.icon;
            return (
              <div key={check.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    check.status === "passed" ? "bg-green-100" : 
                    check.status === "checking" ? "bg-blue-100" : "bg-slate-200"
                  }`}>
                    {check.status === "checking" ? (
                      <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    ) : check.status === "passed" ? (
                      <Check className="w-6 h-6 text-green-600" />
                    ) : (
                      <Icon className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-slate-900">{check.label}</h4>
                    {getStatusBadge(check.status)}
                  </div>
                  <p className="text-sm text-slate-600">{check.description}</p>
                  
                  {/* Mic level indicator */}
                  {check.id === "microphone" && check.status === "checking" && (
                    <div className="mt-3 flex items-center gap-1">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-${Math.floor(Math.random() * 8) + 4} bg-blue-600 rounded-full animate-pulse`}
                          style={{ 
                            animationDelay: `${i * 0.1}s`,
                            height: `${Math.random() * 24 + 8}px`
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right side - Camera preview */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-slate-900 rounded-lg overflow-hidden aspect-video relative">
            {/* Simulated camera preview */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera className="w-16 h-16 text-slate-600" />
            </div>
            <div className="absolute top-3 left-3">
              <Badge className="bg-slate-800/80 text-white text-xs">Camera preview</Badge>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Make sure you're clearly visible and well-lit
          </p>
        </div>
      </div>

      {/* Bottom action area */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
        <p className="text-sm text-slate-600">
          We'll only start the interview after your screen, camera and microphone are ready.
        </p>
        <Button
          onClick={onStartInterview}
          disabled={!allPassed}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
        >
          Start interview
        </Button>
      </div>
    </div>
  );
}
