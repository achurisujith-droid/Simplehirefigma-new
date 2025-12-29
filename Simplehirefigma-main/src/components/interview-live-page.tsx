import { useState, useEffect, useRef } from "react";
import { Camera, Mic, Volume2, Eye, CheckCircle2, AlertTriangle, Play, Pause, Clock } from "lucide-react";
import { Button } from "./ui/button";

interface InterviewLivePageProps {
  onComplete: () => void;
  sessionId?: string;
}

interface Question {
  id: string;
  text: string;
  topic: string;
}

interface ProctoringAlert {
  id: number;
  type: 'warning' | 'info';
  message: string;
  time: string;
}

export function InterviewLivePage({ onComplete, sessionId }: InterviewLivePageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentIndexRef = useRef<number>(0); // Track current index to avoid closure issues
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [proctoringAlerts, setProctoringAlerts] = useState<ProctoringAlert[]>([]);
  const [audioWaveform, setAudioWaveform] = useState<number[]>(Array(20).fill(30));

  // Fetch voice questions from backend
  useEffect(() => {
    async function loadVoiceQuestions() {
      try {
        setIsLoading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No authentication token found, using fallback questions');
          setDefaultQuestions();
          return;
        }

        // Try to fetch from assessment plan if sessionId is provided
        const endpoint = sessionId 
          ? `/api/interviews/assessment-plan/${sessionId}`
          : '/api/interviews/assessment-plan/latest';

        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load voice questions');
        }

        const data = await response.json();
        if (data.success && data.data.voiceQuestions && data.data.voiceQuestions.length > 0) {
          setQuestions(data.data.voiceQuestions);
        } else {
          console.warn('No voice questions found, using fallback');
          setDefaultQuestions();
        }
      } catch (error) {
        console.error('Failed to load voice questions:', error);
        setDefaultQuestions();
      } finally {
        setIsLoading(false);
      }
    }
    loadVoiceQuestions();
  }, [sessionId]);

  // Set default fallback questions
  const setDefaultQuestions = () => {
    setQuestions([
      {
        id: '1',
        text: "Tell me about your professional background and experience.",
        topic: "Background & Experience"
      },
      {
        id: '2',
        text: "Describe a complex problem you solved recently. What was your approach?",
        topic: "Problem Solving"
      },
      {
        id: '3',
        text: "What are your main technical skills and how have you applied them?",
        topic: "Technical Skills"
      }
    ]);
  };

  // Setup camera and MediaRecorder
  useEffect(() => {
    // Don't setup media until questions are loaded
    if (isLoading || questions.length === 0) {
      return;
    }

    async function setupMedia() {
      try {
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
        setHasPermission(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        try {
          const recorder = new MediaRecorder(mediaStream, {
            mimeType: 'video/webm;codecs=vp8,opus'
          });
          
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              console.log("Recording chunk:", event.data.size);
            }
          };
          
          setMediaRecorder(recorder);
          recorder.start(1000); // Continuous recording
        } catch (recorderErr) {
          console.log("MediaRecorder setup failed");
        }
      } catch (err: any) {
        setHasPermission(false);
      }
    }

    setupMedia();
    
    // Start interview after 2 seconds
    setTimeout(() => {
      startInterview();
    }, 2000);

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      // Stop any ongoing speech
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isLoading, questions.length]);

  // Animated waveform effect when AI speaks
  useEffect(() => {
    if (isAISpeaking) {
      const interval = setInterval(() => {
        setAudioWaveform(prev => prev.map(() => Math.random() * 100));
      }, 80);
      return () => clearInterval(interval);
    } else {
      setAudioWaveform(new Array(50).fill(0));
    }
  }, [isAISpeaking]);

  // Text-to-speech function
  const speakQuestion = (questionText: string) => {
    if (!window.speechSynthesis) {
      console.log("Speech synthesis not supported");
      // Fallback: just show visual indication for 5 seconds
      setTimeout(() => {
        setIsAISpeaking(false);
        startUserAnswer();
      }, 5000);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(questionText);
    
    // Configure voice settings
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = isMuted ? 0 : 1.0; // Respect mute setting
    
    // Try to use a good quality voice
    const voices = window.speechSynthesis.getVoices();
    // Prefer female voices for professional feel
    const preferredVoice = voices.find(voice => 
      (voice.name.includes('Google') || voice.name.includes('Microsoft')) && 
      (voice.name.includes('Female') || voice.name.includes('Samantha') || voice.name.includes('Karen'))
    ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Event handlers
    utterance.onstart = () => {
      setIsAISpeaking(true);
      console.log("AI started speaking");
    };

    utterance.onend = () => {
      setIsAISpeaking(false);
      console.log("AI finished speaking");
      // Start recording user's answer
      setTimeout(() => {
        startUserAnswer();
      }, 500);
    };

    utterance.onerror = (event) => {
      console.log("Speech error:", event);
      setIsAISpeaking(false);
      // Still proceed to user answer even if speech fails
      setTimeout(() => {
        startUserAnswer();
      }, 500);
    };

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Start interview flow
  const startInterview = () => {
    askQuestion(0);
  };

  // Ask a specific question
  const askQuestion = (index: number) => {
    if (index >= questions.length) {
      // Interview complete
      setTimeout(() => {
        onComplete();
      }, 2000);
      return;
    }

    const question = questions[index];
    currentIndexRef.current = index; // Update ref
    setCurrentQuestion(question);
    setCurrentQuestionIndex(index);
    setIsUserSpeaking(false);
    
    // Speak the question
    setTimeout(() => {
      speakQuestion(question.text);
    }, 1000);
  };

  // Start user answer phase
  const startUserAnswer = () => {
    setIsUserSpeaking(true);
    
    // Listen for 5 seconds, then move to next question
    setTimeout(() => {
      setIsUserSpeaking(false);
      
      // Brief pause of 2 seconds, then next question
      setTimeout(() => {
        const nextIndex = currentIndexRef.current + 1; // Use ref instead of state
        console.log(`Moving from question ${currentIndexRef.current} to ${nextIndex}`);
        askQuestion(nextIndex);
      }, 2000);
    }, 5000); // 5 seconds listening time
  };

  // Simulate proctoring alerts
  useEffect(() => {
    const addAlert = (type: 'warning' | 'info', message: string) => {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      setProctoringAlerts(prev => [...prev, {
        id: Date.now(),
        type,
        message,
        time
      }]);
    };

    // Demo alerts
    setTimeout(() => addAlert('info', 'Interview started - All systems normal'), 3000);
    setTimeout(() => addAlert('warning', 'Multiple faces detected briefly'), 25000);
    setTimeout(() => addAlert('info', 'Audio levels good'), 45000);

    return () => {};
  }, []);

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      // Pausing
      if (window.speechSynthesis && isAISpeaking) {
        window.speechSynthesis.pause();
      }
    } else {
      // Resuming
      if (window.speechSynthesis && isAISpeaking) {
        window.speechSynthesis.resume();
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted && window.speechSynthesis && isAISpeaking) {
      // Muting - lower volume
      window.speechSynthesis.cancel();
    }
  };

  // Load voices when they become available
  useEffect(() => {
    if (window.speechSynthesis) {
      // Chrome loads voices asynchronously
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      
      loadVoices();
      
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Show loading state while questions are being fetched
  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Preparing your personalized interview...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      {/* Top Header - Minimal */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <div>
                  <p className="text-xs text-slate-500">Live Interview</p>
                  <p className="text-sm text-slate-900">SimplehireAI - React Developer</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="text-right mr-2 hidden sm:block">
                <p className="text-xs text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</p>
                <p className="text-sm text-slate-900">{currentQuestion ? currentQuestion.topic : 'N/A'}</p>
              </div>
              <Button
                onClick={handlePauseResume}
                variant="outline"
                size="sm"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Pause</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Better Layout */}
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Left Column - AI Interviewer (Main Focus) */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Interviewer Card - Main */}
            <div className="bg-white rounded-3xl border border-slate-200/50 shadow-xl overflow-hidden">
              <div className="p-8 sm:p-10">
                {/* AI Avatar with Animation */}
                <div className="relative mb-8">
                  <div className={`w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center relative overflow-hidden transition-all duration-500 ${
                    isAISpeaking ? 'scale-105' : 'scale-100'
                  }`}>
                    {/* Animated rings when AI speaks */}
                    {isAISpeaking && (
                      <>
                        <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-30"></div>
                        <div className="absolute inset-[-20px] rounded-full border-4 border-blue-300 animate-ping opacity-20" style={{ animationDelay: '0.3s' }}></div>
                        <div className="absolute inset-[-40px] rounded-full border-4 border-blue-200 animate-ping opacity-10" style={{ animationDelay: '0.6s' }}></div>
                      </>
                    )}
                    <Volume2 className="w-24 h-24 text-white relative z-10" />
                  </div>
                  
                  {/* Dynamic Status Badge */}
                  <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-sm flex items-center gap-2 shadow-lg transition-all duration-300 ${
                    isAISpeaking 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white scale-105' 
                      : isUserSpeaking 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700'
                  }`}>
                    {isAISpeaking ? (
                      <>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="font-medium">AI Speaking...</span>
                      </>
                    ) : isUserSpeaking ? (
                      <>
                        <Mic className="w-4 h-4" />
                        <span className="font-medium">Listening to You</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                        <span>Thinking...</span>
                      </>
                    )}
                  </div>
                </div>

                {/* AI Interviewer Info */}
                <div className="text-center mb-8 mt-12">
                  <h3 className="text-xl text-slate-900 mb-2">Sarah Chen</h3>
                  <p className="text-slate-600">Senior Technical Interviewer</p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <p className="text-sm text-slate-500">SimplehireAI</p>
                  </div>
                </div>

                {/* Audio Waveform Visualization */}
                {isAISpeaking && (
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 rounded-2xl p-6 mb-6">
                    <div className="flex items-end justify-center gap-1 h-24">
                      {audioWaveform.map((height, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-gradient-to-t from-blue-500 via-blue-600 to-indigo-500 rounded-full transition-all duration-75"
                          style={{ height: `${Math.max(10, height)}%` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Current Question Display */}
                <div className={`rounded-2xl p-6 transition-all duration-300 ${
                  isAISpeaking 
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200' 
                    : isUserSpeaking 
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200'
                      : 'bg-slate-50 border-2 border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600">{currentQuestion?.category}</span>
                  </div>
                  <p className={`text-base leading-relaxed ${
                    isAISpeaking ? 'text-green-900' : isUserSpeaking ? 'text-blue-900' : 'text-slate-700'
                  }`}>
                    {currentQuestion?.text || 'Preparing next question...'}
                  </p>
                </div>

                {/* Status Message */}
                <div className="mt-6 text-center">
                  <p className={`text-sm font-medium ${
                    isAISpeaking ? 'text-green-700' : isUserSpeaking ? 'text-blue-700' : 'text-slate-500'
                  }`}>
                    {isAISpeaking 
                      ? '🎯 Listen carefully to the question...' 
                      : isUserSpeaking 
                        ? '🎤 Take your time and share your thoughts clearly'
                        : '⏸️ Agent is processing your response...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Interview Tips */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 rounded-2xl border border-blue-200/50 p-6 shadow-lg">
              <h4 className="text-sm text-blue-900 mb-4 flex items-center gap-2 font-medium">
                <span>💡</span>
                <span>Interview Tips</span>
              </h4>
              <ul className="space-y-3 text-xs text-blue-800">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>Speak naturally - the AI will wait for you to finish</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>Use specific examples from your experience</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>Structure answers: Problem → Solution → Result</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>Take pauses to think - quality over speed</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Sidebar - Video + Proctoring */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Video Feed - Compact */}
            <div className="bg-white rounded-2xl border border-slate-200/50 shadow-xl overflow-hidden sticky top-24">
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm text-slate-900">Your Video</h3>
                  </div>
                  {isUserSpeaking && (
                    <div className="flex items-center gap-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                      Recording
                    </div>
                  )}
                </div>
              </div>
              
              {/* Compact Video */}
              <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                {hasPermission ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Simple overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                      <div className="flex items-center justify-between text-white text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span>Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mic className="w-3 h-3" />
                          <Camera className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera className="w-12 h-12 mx-auto mb-2 text-white/60" />
                      <p className="text-xs text-white/90">Demo Mode</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Proctoring Alerts - Compact */}
            <div className="bg-white rounded-2xl border border-slate-200/50 shadow-xl overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm text-slate-900">Proctoring</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Active
                  </div>
                </div>
              </div>
              <div className="p-4 max-h-80 overflow-y-auto">
                {proctoringAlerts.length === 0 ? (
                  <div className="text-center py-6">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-600">All systems normal</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {proctoringAlerts.map(alert => (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-2 p-3 rounded-lg border ${
                          alert.type === 'warning' 
                            ? 'bg-amber-50 border-amber-200' 
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        {alert.type === 'warning' ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs ${
                            alert.type === 'warning' ? 'text-amber-900' : 'text-blue-900'
                          }`}>
                            {alert.message}
                          </p>
                          <p className={`text-xs mt-0.5 ${
                            alert.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                          }`}>
                            {alert.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-indigo-900 font-medium">Interview Progress</span>
                <span className="text-xs text-indigo-600">{currentQuestionIndex + 1}/{questions.length}</span>
              </div>
              <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
              <div className="mt-3 space-y-1">
                {questions.map((q, idx) => (
                  <div key={q.id} className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      idx < currentQuestionIndex ? 'bg-green-500' :
                      idx === currentQuestionIndex ? 'bg-blue-500 animate-pulse' :
                      'bg-slate-300'
                    }`}></div>
                    <span className={`${
                      idx === currentQuestionIndex ? 'text-blue-900 font-medium' : 'text-slate-600'
                    }`}>{q.category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}