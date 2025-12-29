import { Award, CheckCircle, Calendar, Shield, ExternalLink, Download } from "lucide-react";
import { Button } from "./ui/button";
import { CertificatePDF } from "./certificate-pdf";
import { useState } from "react";

interface PublicCertificateViewProps {
  certificateId: string;
}

export function PublicCertificateView({ certificateId }: PublicCertificateViewProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  // In a real app, this would fetch data based on certificateId
  const certificateData = {
    candidateName: "John Anderson",
    role: "React Developer",
    overallScore: 90,
    completionDate: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    certificateId: certificateId,
    verifiedDate: "December 26, 2024",
    duration: "58 minutes",
    skills: [
      { name: "React Fundamentals", score: 94 },
      { name: "React Hooks & State", score: 91 },
      { name: "Component Architecture", score: 88 },
      { name: "Performance Optimization", score: 85 },
      { name: "Problem Solving", score: 92 },
      { name: "Code Quality", score: 89 },
    ],
    verification: {
      voiceQuestions: "6 of 6",
      mcqScore: "9/10 (90%)",
      codingProblems: "2 of 2",
      aiConfidence: "96%"
    }
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    
    try {
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

      const canvas = await html2canvas(certificateElement, {
        scale: 2,
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

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [1056, 816],
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 1056, 816);
      
      pdf.save(`SimplehireAI-Certificate-${certificateData.candidateName.replace(/\s/g, '_')}-${certificateData.role.replace(/\s/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('There was an error generating the PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header with Branding */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-slate-900 text-xl">SimplehireAI</h1>
              <p className="text-xs text-slate-600">Verified Skill Certificate</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? "Generating PDF..." : "Download Certificate"}
            </Button>
            <a
              href="https://simplehire.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Get Verified
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Verification Banner */}
        <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-slate-900 mb-2">✓ Verified Certificate</h2>
              <p className="text-slate-600 mb-4">
                This certificate has been verified by SimplehireAI's blockchain-secured verification system.
                The candidate successfully completed a comprehensive skill assessment including AI-powered
                voice interview, technical multiple-choice test, and hands-on coding challenges.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-slate-700">Certificate ID: <strong>{certificateId}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span className="text-slate-700">Verified: {certificateData.verifiedDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Main Certificate Preview */}
          <div className="col-span-2">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-8">
                {/* Certificate Header */}
                <div className="text-center mb-8 pb-6 border-b border-slate-200">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Shield className="w-10 h-10 text-blue-600" />
                    <h1 className="text-blue-600 text-3xl" style={{ letterSpacing: '2px' }}>
                      SIMPLEHIRE
                    </h1>
                  </div>
                  <p className="text-slate-600 text-sm" style={{ letterSpacing: '3px' }}>
                    PROFESSIONAL SKILL CERTIFICATE
                  </p>
                </div>

                {/* Certificate Body */}
                <div className="text-center mb-8">
                  <p className="text-sm text-slate-600 mb-3">This is to certify that</p>
                  <h2 className="text-slate-900 text-4xl mb-6 pb-3 border-b-2 border-slate-200 inline-block px-12">
                    {certificateData.candidateName}
                  </h2>
                  <p className="text-slate-700 mb-2">
                    has successfully completed a comprehensive skill verification assessment for
                  </p>
                  <p className="text-blue-600 text-2xl mb-4">
                    {certificateData.role}
                  </p>
                  <p className="text-slate-600 text-sm max-w-2xl mx-auto">
                    This verification included an AI-powered voice interview, technical multiple-choice assessment,
                    and hands-on coding challenges, validating professional competency and expertise.
                  </p>
                </div>

                {/* Score Badge */}
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl">
                      <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-blue-600 text-3xl">
                            {certificateData.overallScore}%
                          </div>
                          <div className="text-slate-600 text-xs" style={{ letterSpacing: '1px' }}>
                            OVERALL
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Award className="w-12 h-12 text-amber-500" fill="#fbbf24" />
                    </div>
                  </div>
                </div>

                {/* Skills Grid */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {certificateData.skills.map((skill, index) => (
                    <div key={index} className="text-center bg-slate-50 rounded-lg p-3">
                      <div className="text-slate-700 text-sm mb-1">{skill.name}</div>
                      <div className="flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-slate-900">{skill.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="pt-6 border-t border-slate-200 text-center">
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1" style={{ letterSpacing: '1px' }}>
                        COMPLETION DATE
                      </p>
                      <p className="text-slate-900">{certificateData.completionDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1" style={{ letterSpacing: '1px' }}>
                        CERTIFICATE ID
                      </p>
                      <p className="text-slate-900 font-mono text-sm">{certificateData.certificateId}</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Verify authenticity at simplehire.ai/verify/{certificateId}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Verification Details */}
          <div className="space-y-6">
            {/* Verification Details */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Verification Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Duration</span>
                  <span className="text-slate-900">{certificateData.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Voice Questions</span>
                  <span className="text-slate-900">{certificateData.verification.voiceQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">MCQ Score</span>
                  <span className="text-slate-900">{certificateData.verification.mcqScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Coding Problems</span>
                  <span className="text-slate-900">{certificateData.verification.codingProblems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">AI Confidence</span>
                  <span className="text-slate-900">{certificateData.verification.aiConfidence}</span>
                </div>
              </div>
            </div>

            {/* Authenticity Badge */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-slate-900 mb-2">Blockchain Verified</h4>
                <p className="text-sm text-slate-600 mb-4">
                  This certificate is secured on the blockchain and cannot be forged or tampered with.
                </p>
                <div className="text-xs text-slate-500 font-mono bg-white rounded p-2 break-all">
                  {certificateId}
                </div>
              </div>
            </div>

            {/* Call to Action for Employers */}
            <div className="bg-slate-900 rounded-xl p-6 text-white">
              <h4 className="mb-2">Hiring {certificateData.candidateName}?</h4>
              <p className="text-sm text-slate-300 mb-4">
                Get your team verified on SimplehireAI to build trust with clients and stand out in the market.
              </p>
              <a
                href="https://simplehire.ai/employers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-lg text-sm hover:bg-slate-100 transition-colors"
              >
                Learn More
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Get Verified CTA */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
              <h4 className="text-slate-900 mb-2">Want to Get Verified?</h4>
              <p className="text-sm text-slate-600 mb-4">
                Stand out to employers with your own verified skill certificate.
              </p>
              <a
                href="https://simplehire.ai/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors w-full justify-center"
              >
                Get Started Free
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Certificate for PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <CertificatePDF
          candidateName={certificateData.candidateName}
          role={certificateData.role}
          overallScore={certificateData.overallScore}
          completionDate={certificateData.completionDate}
          certificateId={certificateData.certificateId}
          skills={certificateData.skills}
        />
      </div>
    </main>
  );
}