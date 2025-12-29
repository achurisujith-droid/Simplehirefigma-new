import { useState, useEffect, useRef } from "react";
import { Camera, Mic, CheckCircle2, AlertCircle, ArrowRight, Clock, Volume2, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface InterviewPreparationPageProps {
  onStartInterview: () => void;
  onBack: () => void;
}

export function InterviewPreparationPage({ onStartInterview, onBack }: InterviewPreparationPageProps) {
  const [cameraGranted, setCameraGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [micError, setMicError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      setCameraError("Camera requires HTTPS. Please access this site via https://");
      setMicError("Microphone requires HTTPS.");
      setIsLoading(false);
      return;
    }

    // Small delay to ensure component is mounted
    setTimeout(() => {
      setupMediaDevices();
    }, 500);

    return () => {
      cleanup();
    };
  }, []);

  const setupMediaDevices = async () => {
    setIsLoading(true);
    setCameraError("");
    setMicError("");
    
    try {
      // First, check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices not supported");
      }

      // Check existing permissions first
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          
          console.log('Camera permission:', cameraPermission.state);
          console.log('Microphone permission:', micPermission.state);
          
          if (cameraPermission.state === 'denied' || micPermission.state === 'denied') {
            setIsLoading(false);
            setCameraError("Camera/Microphone permissions were previously blocked. Please click the camera icon in your browser's address bar and allow access, then click 'Retry Setup'.");
            setMicError("Previously blocked. Please allow permissions in browser settings.");
            return;
          }
        } catch (permErr) {
          // Permissions API might not support camera/microphone query
          console.log("Permission query not supported:", permErr);
        }
      }

      // Request both camera and microphone
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setStream(mediaStream);
      
      // Setup video
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Check for video track
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack && videoTrack.enabled) {
        setCameraGranted(true);
      }

      // Check for audio track and setup audio level monitoring
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack && audioTrack.enabled) {
        setMicGranted(true);
        setupAudioAnalyzer(mediaStream);
      }

      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      console.log("Media device error:", err.name, err.message);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("❌ Permission denied. Click the 🎥 camera icon in your address bar (top-left), select 'Allow', then click 'Retry Setup' below.");
        setMicError("Permission denied. Please allow microphone access.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("No camera found. Please connect a camera to continue.");
        setMicError("No microphone found. Please connect a microphone.");
      } else if (err.name === 'NotReadableError') {
        setCameraError("Camera is being used by another application (Zoom, Teams, etc.). Please close other apps and click 'Retry Setup'.");
        setMicError("Microphone is being used by another application.");
      } else if (err.message === "MediaDevices not supported") {
        setCameraError("Your browser doesn't support camera access. Please use Chrome, Firefox, or Edge.");
        setMicError("Browser not supported.");
      } else {
        setCameraError(`Unable to access camera. Error: ${err.name}. Please check browser settings and click 'Retry Setup'.`);
        setMicError("Unable to access microphone.");
      }
    }
  };

  const setupAudioAnalyzer = (mediaStream: MediaStream) => {
    try {
      // Create audio context and analyzer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyzer = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(mediaStream);
      
      analyzer.fftSize = 256;
      microphone.connect(analyzer);
      
      audioContextRef.current = audioContext;
      analyzerRef.current = analyzer;
      
      // Start monitoring audio levels
      monitorAudioLevel();
      setIsTestingMic(true);
    } catch (err) {
      console.log("Audio analyzer setup failed:", err);
    }
  };

  const monitorAudioLevel = () => {
    if (!analyzerRef.current) return;

    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    
    const checkLevel = () => {
      if (!analyzerRef.current) return;
      
      analyzerRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume level
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedLevel = Math.min(100, (average / 128) * 100);
      
      setMicLevel(normalizedLevel);
      
      animationFrameRef.current = requestAnimationFrame(checkLevel);
    };
    
    checkLevel();
  };

  const cleanup = () => {
    // Stop all tracks
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    // Stop audio monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const retrySetup = () => {
    cleanup();
    setupMediaDevices();
  };

  const canProceed = cameraGranted && micGranted && !isLoading;

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="text-slate-600 hover:text-slate-900 mb-4 inline-flex items-center gap-2"
          >
            ← Back to My Products
          </button>
          <h1 className="text-slate-900 mb-2">Camera & Microphone Setup</h1>
          <p className="text-slate-600">
            Let's test your camera and microphone to ensure the best interview experience.
          </p>
        </div>

        {/* Demo Mode Notice */}
        {!canProceed && !isLoading && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-blue-900 text-sm mb-1">Demo Mode Available</h3>
                <p className="text-xs text-blue-800 mb-2">
                  Camera/microphone permissions aren't available (this may be due to browser restrictions or environment limitations). 
                  You can continue in demo mode to preview the interview experience.
                </p>
                <Button
                  onClick={onStartInterview}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                >
                  Continue in Demo Mode →
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Video Preview - Larger */}
          <div className="col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="aspect-video bg-slate-900 relative">
                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-50 animate-spin" />
                      <p className="text-sm">Requesting camera & microphone access...</p>
                      <p className="text-xs text-slate-400 mt-2">Please click "Allow" in your browser</p>
                    </div>
                  </div>
                ) : cameraError ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white px-8">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
                      <p className="text-sm mb-4">{cameraError}</p>
                      <Button
                        onClick={retrySetup}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {cameraGranted && (
                      <div className="absolute top-4 right-4 bg-green-500 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-xs text-white">Camera Active</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Microphone Level Indicator */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mic className={`w-5 h-5 ${micGranted ? 'text-green-600' : 'text-slate-400'}`} />
                  <h3 className="text-slate-900">Microphone Test</h3>
                </div>
                {micGranted && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </span>
                )}
              </div>

              {micError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{micError}</p>
                </div>
              ) : micGranted ? (
                <>
                  <p className="text-sm text-slate-600 mb-4">
                    Speak normally to test your microphone. The bar should move when you talk.
                  </p>
                  
                  {/* Audio Level Visualizer */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden relative">
                        <div 
                          className={`h-full transition-all duration-100 rounded-full ${
                            micLevel > 60 ? 'bg-green-500' : 
                            micLevel > 30 ? 'bg-blue-500' : 
                            'bg-slate-300'
                          }`}
                          style={{ width: `${micLevel}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-slate-600">
                            {micLevel > 5 ? '🎤 Speaking...' : '🔇 Speak to test'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">
                        {Math.round(micLevel)}%
                      </span>
                    </div>
                    
                    {micLevel > 5 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs text-green-700 flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3" />
                          Great! Your microphone is working perfectly.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">Waiting for microphone access...</p>
                </div>
              )}
            </div>
          </div>

          {/* Instructions & Checklist */}
          <div className="space-y-6">
            {/* System Check */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-slate-900 mb-4">System Check</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {cameraGranted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : isLoading ? (
                    <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">Camera</p>
                    <p className="text-xs text-slate-500">
                      {cameraGranted ? 'Working perfectly' : isLoading ? 'Checking...' : 'Not accessible'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {micGranted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : isLoading ? (
                    <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">Microphone</p>
                    <p className="text-xs text-slate-500">
                      {micGranted ? (micLevel > 5 ? 'Receiving audio' : 'Speak to test') : isLoading ? 'Checking...' : 'Not accessible'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">Internet</p>
                    <p className="text-xs text-slate-500">Connected</p>
                  </div>
                </div>
              </div>

              {!canProceed && !isLoading && (
                <>
                  <Button
                    onClick={retrySetup}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry Setup
                  </Button>
                  
                  {/* Troubleshooting Help */}
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="text-xs text-amber-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      How to Allow Camera/Mic in Chrome:
                    </h4>
                    <ol className="text-xs text-amber-800 space-y-1 list-decimal list-inside">
                      <li>Click the <strong>🎥 camera icon</strong> in the address bar (top-left)</li>
                      <li>Select <strong>"Allow"</strong> for camera and microphone</li>
                      <li>Click <strong>"Retry Setup"</strong> button above</li>
                    </ol>
                    <p className="text-xs text-amber-700 mt-2">
                      If you don't see the icon, go to: <strong>Chrome Settings → Privacy → Site Settings → Camera/Microphone</strong>
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Interview Details */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-slate-900 mb-4">What to Expect</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm text-slate-900 mb-1">Voice Interview</h4>
                    <p className="text-xs text-slate-600">
                      6 questions, 90 seconds each (~12 min)
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm text-slate-900 mb-1">MCQ Test</h4>
                    <p className="text-xs text-slate-600">
                      10 questions (~15 min)
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm text-slate-900 mb-1">Coding Challenge</h4>
                    <p className="text-xs text-slate-600">
                      2 problems (~30 min)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h4 className="text-blue-900 text-sm mb-3">💡 Tips for Success</h4>
              <ul className="space-y-2 text-xs text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Find a quiet, well-lit space</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Look directly at the camera</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Speak clearly at normal volume</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Your progress is auto-saved!</span>
                </li>
              </ul>
            </div>

            {/* Start Button */}
            <Button
              onClick={onStartInterview}
              disabled={!canProceed}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : canProceed ? (
                <>
                  Start Interview
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Allow camera & microphone to continue
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}