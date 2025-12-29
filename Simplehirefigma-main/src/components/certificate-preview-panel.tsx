import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Download, Share2, Award, CheckCircle2, ExternalLink } from "lucide-react";

interface Certificate {
  id: string;
  title: string;
  status: "completed" | "in-progress" | "locked";
  completedDate: string | null;
  verificationId: string | null;
  skills?: string[];
  details?: string[];
  score?: string;
}

interface CertificatePreviewPanelProps {
  certificate: Certificate;
}

export function CertificatePreviewPanel({ certificate }: CertificatePreviewPanelProps) {
  if (certificate.status !== "completed") {
    return (
      <div className="w-[500px] flex-shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 sticky top-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-slate-900 mb-2">Certificate not available</h3>
            <p className="text-sm text-slate-600">
              Complete the verification process to view and download your certificate
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[500px] flex-shrink-0">
      <div className="space-y-4 sticky top-8">
        {/* Preview card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
          {/* Certificate design */}
          <div className="bg-gradient-to-br from-blue-50 to-white p-8 border-b-4 border-blue-600">
            {/* Header with logo */}
            <div className="text-center mb-6">
              <div className="inline-block mb-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-blue-600 text-xl mb-1">Simplehire</h2>
              <p className="text-sm text-slate-600">Professional Verification Certificate</p>
            </div>

            {/* Certificate content */}
            <div className="text-center mb-6">
              <p className="text-sm text-slate-600 mb-2">This certifies that</p>
              <h3 className="text-slate-900 text-xl mb-4">John Doe</h3>
              
              <p className="text-sm text-slate-600 mb-2">has successfully completed</p>
              <h4 className="text-slate-900 mb-6">{certificate.title.replace(" Certificate", "")}</h4>

              {certificate.score && (
                <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm mb-4">
                  <span className="text-sm text-slate-600">Assessment Score:</span>
                  <Badge className="bg-blue-600 text-white">{certificate.score}</Badge>
                </div>
              )}
            </div>

            {/* Skills badges */}
            {certificate.skills && certificate.skills.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-slate-600 text-center mb-3">Verified Skills</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {certificate.skills.map((skill, index) => (
                    <Badge key={index} className="bg-white text-slate-700 shadow-sm">
                      <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Details */}
            {certificate.details && certificate.details.length > 0 && (
              <div className="mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  {certificate.details.map((detail, index) => (
                    <p key={index} className="text-sm text-slate-700 flex items-center gap-2 mb-2 last:mb-0">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      {detail}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Footer info */}
            <div className="border-t border-slate-200 pt-4 mt-6">
              <div className="grid grid-cols-2 gap-4 text-center text-xs">
                <div>
                  <p className="text-slate-500 mb-1">Issue Date</p>
                  <p className="text-slate-900">{certificate.completedDate}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-1">Certificate ID</p>
                  <p className="text-slate-900 font-mono">{certificate.verificationId?.split('-').pop()}</p>
                </div>
              </div>
            </div>

            {/* Verification badge */}
            <div className="text-center mt-6">
              <div className="inline-flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Verified by Simplehire AI</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="p-4 bg-slate-50 space-y-2">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" className="w-full">
              <Share2 className="w-4 h-4 mr-2" />
              Share verification link
            </Button>
          </div>
        </div>

        {/* Verification details */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h4 className="text-slate-900 text-sm mb-3">Verification Details</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Full ID:</span>
              <span className="text-slate-900 font-mono">{certificate.verificationId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Status:</span>
              <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Valid Until:</span>
              <span className="text-slate-900">Lifetime</span>
            </div>
          </div>
          <a href="#" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-3">
            Verify this certificate
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
