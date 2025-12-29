import { useState } from "react";
import { Upload, FileText, User, Briefcase, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { UnifiedAssessmentAPI } from "../lib/api/unifiedAssessmentClient";
import { useAssessmentSession } from "../state/assessmentSession";
import { toast } from "sonner@2.0.3";

interface InterviewDocumentUploadPageProps {
  onComplete: () => void;
}

export function InterviewDocumentUploadPageUnified({ onComplete }: InterviewDocumentUploadPageProps) {
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file');
  const [errors, setErrors] = useState<{ fullName?: string; jobTitle?: string; resume?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { setSessionId } = useAssessmentSession();

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

  const handleSubmit = async () => {
    const newErrors: { fullName?: string; jobTitle?: string; resume?: string } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }
    if (uploadMode === 'file' && !resumeFile) {
      newErrors.resume = 'Resume is required';
    }
    if (uploadMode === 'text' && !resumeText.trim()) {
      newErrors.resume = 'Resume text is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Call unified assessment API
      const response = await UnifiedAssessmentAPI.start({
        name: fullName,
        jobTitle: jobTitle,
        resumeFile: uploadMode === 'file' ? resumeFile! : undefined,
        resumeText: uploadMode === 'text' ? resumeText : undefined,
      });

      // Store session ID
      setSessionId(response.sessionId);
      
      toast.success('Assessment started successfully!');
      onComplete();
    } catch (error) {
      console.error('Failed to start assessment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isFormValid = 
    fullName.trim() && 
    jobTitle.trim() && 
    (uploadMode === 'file' ? resumeFile !== null : resumeText.trim() !== '');

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl text-slate-900 mb-2 sm:mb-3">Start Your Assessment</h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto px-4">
            Provide your information and resume to begin your personalized skill assessment. 
            The AI will analyze your background and create customized interview questions.
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
                placeholder="Enter your full name"
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

            {/* Job Title Input */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-900 mb-3">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Job Title / Role</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => {
                  setJobTitle(e.target.value);
                  setErrors({ ...errors, jobTitle: undefined });
                }}
                placeholder="e.g. Senior React Developer"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.jobTitle 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
              />
              {errors.jobTitle && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.jobTitle}</span>
                </div>
              )}
            </div>

            {/* Resume Upload Mode Toggle */}
            <div>
              <label className="flex items-center gap-2 text-sm text-slate-900 mb-3">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Resume / CV</span>
                <span className="text-red-500">*</span>
              </label>

              {/* Mode Selector */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm transition-all ${
                    uploadMode === 'file'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('text')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm transition-all ${
                    uploadMode === 'text'
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Paste Text
                </button>
              </div>

              {/* File Upload Mode */}
              {uploadMode === 'file' && (
                <>
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
                </>
              )}

              {/* Text Mode */}
              {uploadMode === 'text' && (
                <div>
                  <textarea
                    value={resumeText}
                    onChange={(e) => {
                      setResumeText(e.target.value);
                      setErrors({ ...errors, resume: undefined });
                    }}
                    placeholder="Paste your resume text here...&#10;&#10;Example:&#10;John Doe&#10;Senior React Developer&#10;&#10;Experience:&#10;- 5 years of React development&#10;- Built 20+ production apps..."
                    className={`w-full h-64 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all resize-none ${
                      errors.resume 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-slate-300 focus:ring-blue-500'
                    }`}
                  />
                  {resumeText.trim() && !errors.resume && (
                    <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{resumeText.length} characters</span>
                    </div>
                  )}
                </div>
              )}

              {errors.resume && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.resume}</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-10 pt-6 border-t border-slate-200">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className={`w-full py-4 text-white transition-all ${
                isFormValid && !isSubmitting
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg' 
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Starting Assessment...
                </>
              ) : isFormValid ? (
                <>
                  Start Assessment
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
              <h4 className="text-sm text-slate-900">Personalized</h4>
            </div>
            <p className="text-xs text-slate-600">
              AI analyzes your resume to create relevant questions
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm text-slate-900">Comprehensive</h4>
            </div>
            <p className="text-xs text-slate-600">
              Voice, MCQ, and coding challenges in one assessment
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm text-slate-900">Secure & Private</h4>
            </div>
            <p className="text-xs text-slate-600">
              All data is encrypted and stored securely
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
