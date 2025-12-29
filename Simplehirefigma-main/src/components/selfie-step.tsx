import { Button } from "./ui/button";
import { Camera, Check, AlertCircle, CheckCircle, Video, VideoOff } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface SelfieStepProps {
  onBack: () => void;
  onContinue: () => void;
}

export function SelfieStep({ onBack, onContinue }: SelfieStepProps) {
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [skipCamera, setSkipCamera] = useState(false); // NEW: Allow skipping camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setCameraError("");
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.");
        return;
      }

      // Request camera permission
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setStream(mediaStream);
      setCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Ensure video plays
        videoRef.current.play().catch(err => {
          console.error("Video play error:", err);
        });
      }
    } catch (error: any) {
      console.error("Camera access error:", error);
      
      // Provide more specific error messages based on error type
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraError("Camera access was denied. Please allow camera permissions in your browser settings and try again.");
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setCameraError("No camera found. Please connect a camera and try again.");
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setCameraError("Camera is already in use by another application. Please close other apps using the camera and try again.");
      } else if (error.name === 'OverconstrainedError') {
        setCameraError("Camera doesn't meet the requirements. Trying with default settings...");
        // Try again with less strict constraints
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          setStream(fallbackStream);
          setCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            videoRef.current.play().catch(err => console.error("Video play error:", err));
          }
          setCameraError("");
        } catch (fallbackError) {
          setCameraError("Unable to access camera with any settings. Please check your camera and permissions.");
        }
      } else if (error.name === 'SecurityError') {
        setCameraError("Camera access blocked due to security settings. Please ensure you're using HTTPS or localhost.");
      } else {
        setCameraError(`Unable to access camera: ${error.message || 'Unknown error'}. Please check your browser permissions and try again.`);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw the current video frame to canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        
        // Store in sessionStorage
        sessionStorage.setItem('selfie_image', imageData);
        
        // Stop camera after capture
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    sessionStorage.removeItem('selfie_image');
    startCamera();
  };

  const handleContinue = () => {
    console.log("=== handleContinue CALLED ===");
    console.log("capturedImage:", capturedImage);
    console.log("skipCamera:", skipCamera);
    
    if (!capturedImage && !skipCamera) {
      console.log("ERROR: No selfie captured and camera not skipped");
      setCameraError("Please capture a selfie before continuing");
      return;
    }
    
    // Debug log
    console.log("Selfie validation passed, calling onContinue()...");
    console.log("Captured image exists:", !!capturedImage);
    console.log("SessionStorage selfie:", !!sessionStorage.getItem('selfie_image'));
    
    try {
      onContinue();
      console.log("onContinue() executed successfully");
    } catch (error) {
      console.error("Error in onContinue():", error);
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <div className="mb-6">
        <h2 className="text-slate-900 mb-1">Step 3 · Selfie verification</h2>
        <p className="text-sm text-slate-600">
          Take a selfie to verify your identity matches your ID document
        </p>
      </div>

      {/* Camera preview / Captured image */}
      <div className="mb-6">
        <label className="block text-sm text-slate-700 mb-2">Your selfie</label>
        <div className="bg-slate-900 rounded-lg aspect-[4/3] max-w-md mx-auto relative overflow-hidden">
          {!cameraActive && !capturedImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <Camera className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-400 mb-4">Camera preview will appear here</p>
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <Button 
                  onClick={startCamera}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Enable camera
                </Button>
                <Button 
                  onClick={() => {
                    setSkipCamera(true);
                    sessionStorage.setItem('selfie_image', 'skipped');
                    setCapturedImage('skipped');
                  }}
                  variant="outline"
                  className="bg-white/10 text-slate-300 hover:bg-white/20 border-slate-600"
                >
                  Skip for now
                </Button>
              </div>
            </div>
          )}
          
          {cameraActive && !capturedImage && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Face outline guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-64 border-4 border-white/40 rounded-full"></div>
              </div>
            </>
          )}
          
          {capturedImage && capturedImage !== 'skipped' && (
            <div className="relative w-full h-full">
              <img 
                src={capturedImage} 
                alt="Captured selfie" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm">
                <CheckCircle className="w-4 h-4" />
                Captured
              </div>
            </div>
          )}
          
          {capturedImage === 'skipped' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
              <p className="text-slate-300 text-lg mb-2">Selfie verification skipped</p>
              <p className="text-slate-400 text-sm">You can continue to review</p>
            </div>
          )}
          
          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {cameraError && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 mb-2">{cameraError}</p>
              <Button 
                onClick={() => {
                  setSkipCamera(true);
                  setCameraError("");
                  sessionStorage.setItem('selfie_image', 'skipped');
                  setCapturedImage('skipped');
                }}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Skip selfie verification
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Camera controls */}
      {cameraActive && !capturedImage && (
        <div className="text-center mb-6">
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={capturePhoto}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture selfie
            </Button>
            <Button 
              onClick={stopCamera}
              variant="outline"
            >
              <VideoOff className="w-4 h-4 mr-2" />
              Stop camera
            </Button>
          </div>
        </div>
      )}

      {/* Retake button */}
      {capturedImage && capturedImage !== 'skipped' && (
        <div className="text-center mb-6">
          <Button 
            onClick={retakePhoto}
            variant="outline"
            className="px-6"
          >
            <Camera className="w-4 h-4 mr-2" />
            Retake selfie
          </Button>
        </div>
      )}

      {/* Guidelines */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
        <p className="text-sm text-blue-900 mb-3"><strong>📸 Guidelines for best results:</strong></p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-start gap-2 text-sm text-blue-900">
            <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>Face clearly visible and centered</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-blue-900">
            <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>Good lighting from the front</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-blue-900">
            <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>No masks, sunglasses, or hats</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-blue-900">
            <Check className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>Neutral expression, eyes open</span>
          </div>
        </div>
      </div>

      {/* Why we need this */}
      <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 mb-6">
        <p className="text-sm text-amber-900">
          <strong>Why do we need this?</strong> We compare your selfie with your ID photo to verify your identity. This helps prevent fraud and protects your account.
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBack();
          }} 
          variant="ghost"
        >
          Back
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-slate-600">Save & exit</Button>
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("=== CONTINUE BUTTON CLICKED ===");
              console.log("Captured image:", !!capturedImage);
              console.log("Skip camera:", skipCamera);
              console.log("Button disabled:", (!capturedImage && !skipCamera));
              
              if (!capturedImage && !skipCamera) {
                console.log("ERROR: Button should be disabled but was clicked");
                setCameraError("Please capture a selfie before continuing");
                return;
              }
              
              console.log("Calling handleContinue...");
              handleContinue();
            }}
            disabled={!capturedImage && !skipCamera}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to review
          </Button>
        </div>
      </div>
    </div>
  );
}