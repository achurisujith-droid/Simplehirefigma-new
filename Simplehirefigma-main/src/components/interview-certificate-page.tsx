import { useState } from "react";
import { Award, Download, Share2, CheckCircle, Calendar, TrendingUp, Linkedin, Mail, Link as LinkIcon, ArrowRight, Star, Shield, Users, FileCheck } from "lucide-react";
import { Button } from "./ui/button";
import { CertificatePDF } from "./certificate-pdf";

interface InterviewCertificatePageProps {
  onBackToProducts: () => void;
  purchasedProducts?: string[];
  skillVerified?: boolean;
  idVerified?: boolean;
  referenceVerified?: boolean;
}

export function InterviewCertificatePage({ onBackToProducts, purchasedProducts = [], skillVerified = true, idVerified = false, referenceVerified = false }: InterviewCertificatePageProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const candidateName = "John Anderson";
  const role = "React Developer";
  const overallScore = 90;
  const completionDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const certificateId = `SH-${Date.now().toString(36).toUpperCase()}-RD`;
  const publicUrl = `https://simplehire.ai/verify/${certificateId}`;

  // Check if user has combo plan (all three verifications)
  const hasCombo = purchasedProducts.includes('skill') && purchasedProducts.includes('id-visa') && purchasedProducts.includes('reference');
  const hasMultipleVerifications = [skillVerified, idVerified, referenceVerified].filter(Boolean).length > 1;

  const skills = [
    { name: "React Fundamentals", score: 94 },
    { name: "React Hooks & State", score: 91 },
    { name: "Component Architecture", score: 88 },
    { name: "Performance Optimization", score: 85 },
    { name: "Problem Solving", score: 92 },
    { name: "Code Quality", score: 89 },
  ];

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    
    try {
      // Import html2canvas and jsPDF dynamically
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const certificateElement = document.getElementById('certificate-content');
      if (!certificateElement) return;

      // Create a temporary style element to override oklch colors with standard colors
      const styleOverride = document.createElement('style');
      styleOverride.id = 'pdf-color-override';
      styleOverride.textContent = `
        #certificate-content, #certificate-content * {
          color: inherit !important;
        }
      `;
      document.head.appendChild(styleOverride);

      // Capture the certificate as canvas
      const canvas = await html2canvas(certificateElement, {
        scale: 2, // Higher quality
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Remove the style override
      const overrideEl = document.getElementById('pdf-color-override');
      if (overrideEl) {
        overrideEl.remove();
      }

      // Create PDF in landscape mode
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1056, 816], // Match certificate dimensions
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 1056, 816);
      
      // Download the PDF
      pdf.save(`SimplehireAI-Certificate-${candidateName.replace(/\s/g, '_')}-${role.replace(/\s/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyPublicLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const shareText = `I just earned a verified ${role} certificate from SimplehireAI with a ${overallScore}% score! 🎉`;
    
    switch (platform) {
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}&title=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=My SimplehireAI Skill Certificate&body=${encodeURIComponent(shareText + '\n\nView my verified certificate: ' + publicUrl)}`;
        break;
      case 'copy':
        handleCopyPublicLink();
        break;
    }
    setShowShareMenu(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Celebration Confetti Effect (CSS only) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="confetti"></div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-bounce">
            <Award className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-slate-900 mb-2">Congratulations! 🎉</h1>
          <p className="text-xl text-slate-600">
            You've successfully completed the React Developer skill verification
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Certificate */}
          <div className="col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-blue-600" id="certificate-content">
              {/* Certificate Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -ml-20 -mt-20"></div>
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mb-20"></div>
                </div>
                <div className="relative">
                  <Award className="w-16 h-16 mx-auto mb-4" />
                  <h2 className="text-white mb-2">
                    {hasMultipleVerifications ? "Complete Verification Certificate" : "Skill Verification Certificate"}
                  </h2>
                  <p className="text-blue-100">Issued by Simplehire.ai</p>
                </div>
              </div>

              {/* Certificate Body */}
              <div className="p-12">
                <div className="text-center mb-8">
                  <p className="text-sm text-slate-600 mb-4">This is to certify that</p>
                  <h3 className="text-slate-900 mb-4">{candidateName}</h3>
                  <p className="text-slate-600 mb-2">
                    has successfully completed a comprehensive React Developer skill verification
                  </p>
                  <p className="text-slate-600">
                    including voice interview, technical MCQ assessment, and coding challenges
                  </p>
                </div>

                {/* Overall Score */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 text-center border border-blue-200">
                  <div className="text-sm text-slate-600 mb-2">Overall Performance Score</div>
                  <div className="text-6xl text-blue-600 mb-2">{overallScore}</div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(overallScore / 20)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-slate-700">Exceptional Performance</div>
                </div>

                {/* Verified Credentials Section */}
                {hasMultipleVerifications && (
                  <div className="mb-8">
                    <h4 className="text-sm text-slate-600 mb-4 text-center">Verified Credentials</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {skillVerified && (
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 text-center">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Award className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-sm text-slate-900 mb-1">Skill Verification</div>
                          <div className="text-xs text-slate-600">Technical Assessment</div>
                          <div className="mt-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          </div>
                        </div>
                      )}
                      {idVerified && (
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 text-center">
                          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Shield className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-sm text-slate-900 mb-1">ID Verification</div>
                          <div className="text-xs text-slate-600">Identity + Work Auth</div>
                          <div className="mt-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          </div>
                        </div>
                      )}
                      {referenceVerified && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 text-center">
                          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-sm text-slate-900 mb-1">Reference Check</div>
                          <div className="text-xs text-slate-600">Professional References</div>
                          <div className="mt-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Skill Breakdown - Only show if skill verified */}
                {skillVerified && (
                  <div className="mb-8">
                    <h4 className="text-sm text-slate-600 mb-4 text-center">Skill Assessment Breakdown</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {skills.map((skill) => (
                        <div key={skill.name} className="bg-slate-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-700">{skill.name}</span>
                            <span className="text-sm text-slate-900">{skill.score}%</span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${skill.score}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ID Verification Details - Only show if ID verified */}
                {idVerified && (
                  <div className="mb-8">
                    <h4 className="text-sm text-slate-600 mb-4 text-center">Identity Verification</h4>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileCheck className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm text-slate-900 mb-1">Government ID</div>
                            <div className="text-xs text-slate-600">Verified & Authenticated</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm text-slate-900 mb-1">Work Authorization</div>
                            <div className="text-xs text-slate-600">Valid Documentation</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm text-slate-900 mb-1">Face Match</div>
                            <div className="text-xs text-slate-600">Biometric Verification</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm text-slate-900 mb-1">Document Validity</div>
                            <div className="text-xs text-slate-600">Not Expired</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reference Check Details - Only show if reference verified */}
                {referenceVerified && (
                  <div className="mb-8">
                    <h4 className="text-sm text-slate-600 mb-4 text-center">Professional References</h4>
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">References Collected</span>
                          <span className="text-sm text-slate-900">5 of 5</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">Response Rate</span>
                          <span className="text-sm text-slate-900">100%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">Average Rating</span>
                          <span className="text-sm text-slate-900">4.8/5.0</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-700">Recommendation</span>
                          <span className="text-sm text-green-600">Highly Recommended</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Certificate Footer */}
                <div className="border-t border-slate-200 pt-6 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Certificate ID</div>
                    <div className="text-sm text-slate-900 font-mono">{certificateId}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Issue Date</div>
                    <div className="text-sm text-slate-900">{completionDate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Verified By</div>
                    <div className="text-sm text-slate-900">Simplehire AI</div>
                  </div>
                </div>

                {/* Digital signature placeholder */}
                <div className="mt-6 flex justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-2" style={{ fontFamily: 'cursive' }}>Simplehire.ai</div>
                    <div className="h-px w-32 bg-slate-300 mb-1"></div>
                    <div className="text-xs text-slate-500">Digital Signature</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-slate-900 mb-4">Next Steps</h3>
              <div className="space-y-3">
                <button
                  onClick={handleDownloadPDF}
                  className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-900">Download Certificate</div>
                    <div className="text-xs text-slate-600">Save as PDF</div>
                  </div>
                </button>

                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-900">Share on LinkedIn</div>
                    <div className="text-xs text-slate-600">Boost your profile</div>
                  </div>
                </button>

                <button
                  onClick={onBackToProducts}
                  className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors"
                >
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-slate-900">View All Products</div>
                    <div className="text-xs text-slate-600">Continue verification</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Verification Details */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-slate-900 mb-4">Verification Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Duration</span>
                  <span className="text-slate-900">58 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Voice Questions</span>
                  <span className="text-slate-900">6 of 6</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">MCQ Score</span>
                  <span className="text-slate-900">9/10 (90%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Coding Problems</span>
                  <span className="text-slate-900">2 of 2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">AI Confidence</span>
                  <span className="text-slate-900">96%</span>
                </div>
              </div>
            </div>

            {/* Trust Badge */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-sm text-slate-900 mb-2">Verified by Simplehire</h4>
              <p className="text-xs text-slate-600">
                This certificate is blockchain-verified and can be shared with employers worldwide
              </p>
            </div>

            {/* Public Link Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <LinkIcon className="w-5 h-5 text-green-600" />
                <h4 className="text-sm text-slate-900">Public Verification Link</h4>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                Share this link with employers to showcase your verified skills
              </p>
              
              {/* Link Display */}
              <div className="bg-white rounded-lg border border-green-200 p-3 mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={publicUrl}
                    readOnly
                    className="flex-1 text-xs text-slate-600 bg-transparent border-none outline-none font-mono"
                  />
                </div>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopyPublicLink}
                className={`w-full py-2.5 px-4 rounded-lg text-sm transition-all ${
                  linkCopied
                    ? "bg-green-600 text-white"
                    : "bg-white text-green-700 hover:bg-green-100 border border-green-300"
                }`}
              >
                {linkCopied ? (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Link Copied!
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Copy Public Link
                  </span>
                )}
              </button>

              <p className="text-xs text-slate-500 mt-3 text-center">
                Add this to your resume, LinkedIn, or portfolio
              </p>
            </div>
          </div>
        </div>

        {/* Share Menu */}
        {showShareMenu && (
          <div className="absolute right-10 top-10 bg-white rounded-lg shadow-lg p-4 z-50 border border-slate-200">
            <h4 className="text-sm text-slate-900 mb-2">Share Your Certificate</h4>
            <div className="space-y-2">
              <button
                onClick={() => handleShare('linkedin')}
                className="w-full flex items-center gap-3 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
              >
                <Linkedin className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <div className="text-sm text-slate-900">LinkedIn</div>
                  <div className="text-xs text-slate-600">Share on LinkedIn</div>
                </div>
              </button>

              <button
                onClick={() => handleShare('email')}
                className="w-full flex items-center gap-3 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors"
              >
                <Mail className="w-5 h-5 text-slate-600" />
                <div className="flex-1">
                  <div className="text-sm text-slate-900">Email</div>
                  <div className="text-xs text-slate-600">Send via Email</div>
                </div>
              </button>

              <button
                onClick={() => handleShare('copy')}
                className="w-full flex items-center gap-3 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors"
              >
                <LinkIcon className="w-5 h-5 text-slate-600" />
                <div className="flex-1">
                  <div className="text-sm text-slate-900">Copy Link</div>
                  <div className="text-xs text-slate-600">Copy Verification Link</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden Certificate for PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <CertificatePDF
          candidateName={candidateName}
          role={role}
          overallScore={overallScore}
          completionDate={completionDate}
          certificateId={certificateId}
          skills={skills}
        />
      </div>
    </main>
  );
}