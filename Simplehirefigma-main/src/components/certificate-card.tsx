import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { CheckCircle2, Clock, Lock, Download, Share2 } from "lucide-react";

interface CertificateCardProps {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in-progress" | "locked";
  completedDate: string | null;
  verificationId: string | null;
  isSelected: boolean;
  onSelect: () => void;
  skills?: string[];
  details?: string[];
  progress?: string;
  requirement?: string;
  score?: string;
}

export function CertificateCard({
  title,
  description,
  status,
  completedDate,
  verificationId,
  isSelected,
  onSelect,
  skills,
  details,
  progress,
  requirement,
  score
}: CertificateCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-blue-100 text-blue-700 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            In Progress
          </Badge>
        );
      case "locked":
        return (
          <Badge className="bg-slate-100 text-slate-600 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Locked
          </Badge>
        );
    }
  };

  return (
    <div
      onClick={status === "completed" ? onSelect : undefined}
      className={`bg-white rounded-xl border shadow-sm p-6 transition-all ${
        status === "completed" ? "cursor-pointer hover:shadow-md" : "opacity-60"
      } ${
        isSelected && status === "completed"
          ? "border-blue-300 ring-2 ring-blue-100"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-slate-900">{title}</h3>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>

      {/* Completed certificate details */}
      {status === "completed" && (
        <div className="space-y-3 mb-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-1">Completed on</p>
                <p className="text-slate-900">{completedDate}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-1">Verification ID</p>
                <p className="text-slate-900 font-mono text-xs">{verificationId}</p>
              </div>
            </div>
          </div>

          {score && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Score:</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {score}
              </Badge>
            </div>
          )}

          {skills && skills.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Verified skills:</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {details && details.length > 0 && (
            <div className="space-y-1">
              {details.map((detail, index) => (
                <p key={index} className="text-sm text-slate-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  {detail}
                </p>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      )}

      {/* In progress */}
      {status === "in-progress" && progress && (
        <div className="bg-blue-50 rounded-lg p-3 mt-4">
          <p className="text-sm text-blue-900">{progress}</p>
        </div>
      )}

      {/* Locked */}
      {status === "locked" && requirement && (
        <div className="bg-slate-50 rounded-lg p-3 mt-4 flex items-start gap-2">
          <Lock className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-600">{requirement}</p>
        </div>
      )}
    </div>
  );
}
