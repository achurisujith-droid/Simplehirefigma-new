import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Upload, CheckCircle, X, AlertCircle, FileText } from "lucide-react";
import { useState, useRef } from "react";

interface UploadIdStepProps {
  onContinue: () => void;
}

interface UploadedFile {
  file: File;
  preview: string;
  error?: string;
}

export function UploadIdStep({ onContinue }: UploadIdStepProps) {
  const [documentType, setDocumentType] = useState<string>("");
  const [frontFile, setFrontFile] = useState<UploadedFile | null>(null);
  const [backFile, setBackFile] = useState<UploadedFile | null>(null);
  const [errors, setErrors] = useState<{ front?: string; back?: string; type?: string }>({});
  
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'application/pdf'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return "Please upload a valid image file (JPG, PNG, HEIC, or PDF)";
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }

    return null;
  };

  const handleFileSelect = (side: 'front' | 'back', file: File) => {
    const error = validateFile(file);
    
    if (error) {
      setErrors(prev => ({ ...prev, [side]: error }));
      return;
    }

    // Create preview
    const preview = URL.createObjectURL(file);
    
    if (side === 'front') {
      // Clean up old preview
      if (frontFile?.preview) {
        URL.revokeObjectURL(frontFile.preview);
      }
      setFrontFile({ file, preview });
      setErrors(prev => ({ ...prev, front: undefined }));
    } else {
      // Clean up old preview
      if (backFile?.preview) {
        URL.revokeObjectURL(backFile.preview);
      }
      setBackFile({ file, preview });
      setErrors(prev => ({ ...prev, back: undefined }));
    }
  };

  const handleDrop = (side: 'front' | 'back', e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(side, file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (side: 'front' | 'back') => {
    if (side === 'front' && frontFile) {
      URL.revokeObjectURL(frontFile.preview);
      setFrontFile(null);
    } else if (side === 'back' && backFile) {
      URL.revokeObjectURL(backFile.preview);
      setBackFile(null);
    }
  };

  const handleContinue = () => {
    const newErrors: { front?: string; back?: string; type?: string } = {};
    
    if (!documentType) {
      newErrors.type = "Please select a document type";
    }
    if (!frontFile) {
      newErrors.front = "Front side is required";
    }
    if (!backFile && documentType !== 'passport') {
      newErrors.back = "Back side is required for this document type";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Store files in sessionStorage as base64
    if (frontFile) {
      const reader1 = new FileReader();
      
      reader1.onload = () => {
        sessionStorage.setItem('id_front', reader1.result as string);
        sessionStorage.setItem('id_type', documentType);
        
        // If we have a back file, read it too
        if (backFile) {
          const reader2 = new FileReader();
          reader2.onload = () => {
            sessionStorage.setItem('id_back', reader2.result as string);
            onContinue();
          };
          reader2.readAsDataURL(backFile.file);
        } else {
          // No back file needed (passport), continue immediately
          onContinue();
        }
      };
      
      reader1.readAsDataURL(frontFile.file);
    }
  };

  const needsBackSide = documentType && documentType !== 'passport';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <h2 className="text-slate-900 mb-2">Step 1 · Upload ID document</h2>
      <p className="text-sm text-slate-600 mb-6">
        Upload a clear photo of your government-issued ID
      </p>

      {/* Supported documents */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
        <h3 className="text-slate-900 text-sm mb-3">✓ Supported ID documents:</h3>
        <ul className="space-y-1.5 text-sm text-slate-700">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
            Passport (any country)
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
            State ID or Driver's License (any US state)
          </li>
        </ul>
      </div>

      {/* Document type selector */}
      <div className="mb-6">
        <label className="block text-sm text-slate-700 mb-2">
          Document type <span className="text-red-500">*</span>
        </label>
        <Select value={documentType} onValueChange={(value) => {
          setDocumentType(value);
          setErrors(prev => ({ ...prev, type: undefined }));
        }}>
          <SelectTrigger className={`w-full ${errors.type ? 'border-red-500' : ''}`}>
            <SelectValue placeholder="Select ID document type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="passport">Passport</SelectItem>
            <SelectItem value="state-id">State ID</SelectItem>
            <SelectItem value="drivers-license">Driver's License</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.type}
          </p>
        )}
      </div>

      {/* Upload areas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Front side */}
        <div>
          <label className="block text-sm text-slate-700 mb-2">
            Front side <span className="text-red-500">*</span>
          </label>
          
          {!frontFile ? (
            <div
              onClick={() => frontInputRef.current?.click()}
              onDrop={(e) => handleDrop('front', e)}
              onDragOver={handleDragOver}
              className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer ${
                errors.front ? 'border-red-500 bg-red-50' : 'border-slate-300'
              }`}
            >
              <Upload className={`w-6 h-6 mx-auto mb-2 ${errors.front ? 'text-red-400' : 'text-slate-400'}`} />
              <p className="text-sm text-slate-600 mb-1">Click or drag to upload</p>
              <p className="text-xs text-slate-500">JPG, PNG, PDF up to 10MB</p>
              <input
                ref={frontInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/heic,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect('front', file);
                }}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative border-2 border-green-500 rounded-lg p-3 bg-green-50">
              {frontFile.file.type === 'application/pdf' ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 truncate">{frontFile.file.name}</p>
                    <p className="text-xs text-slate-600">{(frontFile.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ) : (
                <img 
                  src={frontFile.preview} 
                  alt="Front side preview" 
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
              )}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Uploaded</span>
                </div>
                <button
                  onClick={() => removeFile('front')}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {errors.front && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.front}
            </p>
          )}
        </div>

        {/* Back side */}
        <div>
          <label className="block text-sm text-slate-700 mb-2">
            Back side {needsBackSide && <span className="text-red-500">*</span>}
            {!needsBackSide && <span className="text-slate-400 text-xs">(Not required for passport)</span>}
          </label>
          
          {!backFile ? (
            <div
              onClick={() => backInputRef.current?.click()}
              onDrop={(e) => handleDrop('back', e)}
              onDragOver={handleDragOver}
              className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer ${
                errors.back ? 'border-red-500 bg-red-50' : 'border-slate-300'
              } ${!needsBackSide ? 'opacity-50' : ''}`}
            >
              <Upload className={`w-6 h-6 mx-auto mb-2 ${errors.back ? 'text-red-400' : 'text-slate-400'}`} />
              <p className="text-sm text-slate-600 mb-1">Click or drag to upload</p>
              <p className="text-xs text-slate-500">JPG, PNG, PDF up to 10MB</p>
              <input
                ref={backInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/heic,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect('back', file);
                }}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative border-2 border-green-500 rounded-lg p-3 bg-green-50">
              {backFile.file.type === 'application/pdf' ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 truncate">{backFile.file.name}</p>
                    <p className="text-xs text-slate-600">{(backFile.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              ) : (
                <img 
                  src={backFile.preview} 
                  alt="Back side preview" 
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
              )}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Uploaded</span>
                </div>
                <button
                  onClick={() => removeFile('back')}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {errors.back && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.back}
            </p>
          )}
        </div>
      </div>

      {/* Quality guidelines */}
      <div className="bg-amber-50 rounded-lg border border-amber-200 p-4 mb-6">
        <p className="text-sm text-amber-900 mb-2"><strong>📸 Photo quality tips:</strong></p>
        <ul className="space-y-1 text-sm text-amber-900">
          <li className="flex items-start gap-2">
            <span className="text-amber-600 mt-0.5">•</span>
            <span>Ensure all text is clear and readable</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 mt-0.5">•</span>
            <span>No glare or shadows on the document</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-600 mt-0.5">•</span>
            <span>Capture the entire document within the frame</span>
          </li>
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button variant="ghost" className="text-slate-600">Save & exit</Button>
        <Button 
          onClick={handleContinue} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
        >
          Continue to work authorization
        </Button>
      </div>
    </div>
  );
}