import { CertificateCard } from "./certificate-card";
import { CertificatePreviewPanel } from "./certificate-preview-panel";
import { Badge } from "./ui/badge";
import { Award, Download, Share2, ExternalLink } from "lucide-react";
import { useState } from "react";

export function CertificatesPage() {
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>("skill");

  const certificates = [
    {
      id: "skill",
      title: "Skill Verification Certificate",
      description: "AI-verified professional skills assessment",
      status: "completed" as const,
      completedDate: "May 20, 2024",
      verificationId: "SH-SKILL-2024-8492",
      skills: ["React", "TypeScript", "System Design"],
      score: "92/100"
    },
    {
      id: "id-visa",
      title: "ID + Visa Verification Certificate",
      description: "Government ID and work authorization verified",
      status: "completed" as const,
      completedDate: "May 22, 2024",
      verificationId: "SH-IDVISA-2024-8493",
      details: ["Identity verified", "H1B work authorization confirmed"]
    },
    {
      id: "reference",
      title: "Reference Check Certificate",
      description: "Professional references verified",
      status: "in-progress" as const,
      completedDate: null,
      verificationId: null,
      progress: "2 of 3 responses received"
    },
    {
      id: "complete",
      title: "Complete Verification Certificate",
      description: "All-in-one comprehensive verification",
      status: "locked" as const,
      completedDate: null,
      verificationId: null,
      requirement: "Complete all three verifications to unlock"
    }
  ];

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-12">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-slate-900 mb-2">Certificates</h1>
            <p className="text-slate-600">
              View, download, and share your verified credentials with employers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <Award className="w-3 h-3 mr-1" />
              2 Certificates earned
            </Badge>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-8">
        {/* Left column - Certificate list */}
        <div className="flex-1 space-y-4">
          {certificates.map((cert) => (
            <CertificateCard
              key={cert.id}
              {...cert}
              isSelected={selectedCertificate === cert.id}
              onSelect={() => setSelectedCertificate(cert.id)}
            />
          ))}

          {/* Help section */}
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mt-8">
            <h3 className="text-slate-900 mb-2">How to use your certificates</h3>
            <ul className="space-y-2 text-sm text-slate-700 mb-4">
              <li className="flex items-start gap-2">
                <Download className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Download as PDF to attach to job applications</span>
              </li>
              <li className="flex items-start gap-2">
                <Share2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Share verification link with recruiters and hiring managers</span>
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Add to your LinkedIn profile and resume</span>
              </li>
            </ul>
            <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
              Learn more about certificates →
            </a>
          </div>
        </div>

        {/* Right column - Certificate preview */}
        <CertificatePreviewPanel
          certificate={certificates.find(c => c.id === selectedCertificate) || certificates[0]}
        />
      </div>
    </main>
  );
}
