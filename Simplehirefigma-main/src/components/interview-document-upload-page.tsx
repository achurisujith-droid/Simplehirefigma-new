import { useState } from "react";
import { Upload, FileText, User, CreditCard, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { interviewService } from "../src/services/interview.service";
import { toast } from "sonner";

interface InterviewDocumentUploadPageProps {
  onComplete: () => void;
}

export function InterviewDocumentUploadPage({ onComplete }: InterviewDocumentUploadPageProps) {
  const [fullName, setFullName] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ fullName?: string; resume?: string; idCard?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setErrors({ ...errors, resume: 'Please upload a PDF or DOC file' });
        return;
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, resume: 'File size must be less than 10MB' });
        return;
      }
      setResumeFile(file);
      setErrors({ ...errors, resume: undefined });
    }
  };

  const handleIdCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (images only)
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setErrors({ ...errors, idCard: 'Please upload a JPG or PNG image' });
        return;
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ ...errors, idCard: 'File size must be less than 10MB' });
        return;
      }
      setIdCardFile(file);
      setErrors({ ...errors, idCard: undefined });
    }
  };

  const handleSubmit = async () => {
    const newErrors: { fullName?: string; resume?: string; idCard?: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!resumeFile) {
      newErrors.resume = 'Resume is required';
    }
    if (!idCardFile) {
      newErrors.idCard = 'ID card is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check if user is authenticated before making API call
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expired', {
        description: 'Please log in again to continue.',
      });
      // Note: Consider redirecting to login or triggering re-auth here
      return;
    }

    // Upload documents to backend
    setIsSubmitting(true);
    try {
      const response = await interviewService.startAssessment(resumeFile!, idCardFile);
      
      if (!response.success) {
        toast.error('Failed to upload documents', {
          description: response.error || 'Please try again',
        });
        return;
      }

      // Store the sessionId/planId for later use
      if (response.data?.sessionId) {
        localStorage.setItem('assessmentPlanId', response.data.sessionId);
      }

      toast.success('Documents uploaded successfully');
      onComplete();
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload documents', {
        description: 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isFormValid = fullName.trim() && resumeFile && idCardFile && !isSubmitting;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl text-slate-900 mb-2 sm:mb-3">Document Upload</h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto px-4">
            Before we begin your skill interview, please provide your basic information and documents. 
            Your ID card will be used for identity verification and face matching during the interview.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-4 sm:p-6 lg:p-8">
          <div className="space-y-6 sm:space-y-8">
            {/* Full Name Input */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-900 mb-3">
                <User className="w-4 h-4 text-blue-600" />
                <span>Full Name</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setErrors({ ...errors, fullName: undefined });
                }}
                placeholder="Enter your full name as it appears on your ID"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.fullName 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />
              {errors.fullName && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.fullName}</span>
                </div>
              )}
              {fullName.trim() && !errors.fullName && (
                <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Looks good!</span>
                </div>
              )}
            </div>

            {/* Resume Upload */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-900 mb-3">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Resume / CV</span>
                <span className="text-red-500">*</span>
              </label>
              
              {!resumeFile ? (
                <label className="block">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50/50 ${
                    errors.resume ? 'border-red-300 bg-red-50/30' : 'border-slate-300'
                  }`}>
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${errors.resume ? 'text-red-400' : 'text-slate-400'}`} />
                    <p className="text-sm text-slate-900 mb-1">Click to upload resume</p>
                    <p className="text-xs text-slate-500">PDF, DOC, DOCX up to 10MB</p>
                  </div>
                </label>
              ) : (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-900 font-medium">{resumeFile.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(resumeFile.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleResumeUpload}
                          className="hidden"
                        />
                        <Button variant="outline" size="sm" className="text-xs">
                          Change
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>
              )}
              {errors.resume && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.resume}</span>
                </div>
              )}
            </div>

            {/* ID Card Upload */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-900 mb-3">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Government ID Card</span>
                <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-600 mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                📸 Your ID will be used for <strong>identity verification</strong> and <strong>face matching</strong> during the interview to ensure the person taking the test is you.
              </p>
              
              {!idCardFile ? (
                <label className="block">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleIdCardUpload}
                    className="hidden"
                  />
                  <div className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50/50 ${
                    errors.idCard ? 'border-red-300 bg-red-50/30' : 'border-slate-300'
                  }`}>
                    <Upload className={`w-10 h-10 mx-auto mb-3 ${errors.idCard ? 'text-red-400' : 'text-slate-400'}`} />
                    <p className="text-sm text-slate-900 mb-1">Click to upload ID card</p>
                    <p className="text-xs text-slate-500">JPG, PNG up to 10MB</p>
                    <p className="text-xs text-slate-400 mt-1">(Passport, Driver's License, National ID)</p>
                  </div>
                </label>
              ) : (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-900 font-medium">{idCardFile.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(idCardFile.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <label>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleIdCardUpload}
                          className="hidden"
                        />
                        <Button variant="outline" size="sm" className="text-xs">
                          Change
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>
              )}
              {errors.idCard && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.idCard}</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-10 pt-6 border-t border-slate-200">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`w-full py-4 text-white transition-all ${
                isFormValid 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg' 
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Uploading documents...
                </>
              ) : isFormValid ? (
                <>
                  Continue to Interview Preparation
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Please complete all required fields
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 sm:mt-8">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm text-slate-900">Identity Verification</h4>
            </div>
            <p className="text-xs text-slate-600">
              Your ID ensures the person taking the interview is actually you
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm text-slate-900">Resume Analysis</h4>
            </div>
            <p className="text-xs text-slate-600">
              Your resume helps the AI ask relevant, personalized questions
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm text-slate-900">Secure & Private</h4>
            </div>
            <p className="text-xs text-slate-600">
              All documents are encrypted and stored securely
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}