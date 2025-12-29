import { Award, Calendar, CheckCircle, Shield } from "lucide-react";

interface CertificatePDFProps {
  candidateName: string;
  role: string;
  overallScore: number;
  completionDate: string;
  certificateId: string;
  skills: { name: string; score: number }[];
}

export function CertificatePDF({ 
  candidateName, 
  role, 
  overallScore, 
  completionDate, 
  certificateId,
  skills 
}: CertificatePDFProps) {
  return (
    <div id="certificate-content" className="bg-white" style={{ width: '1056px', height: '816px' }}>
      {/* A4 Landscape dimensions in pixels at 96 DPI: 11" x 8.5" = 1056 x 816 */}
      
      {/* Decorative border */}
      <div className="relative w-full h-full p-12 border-8 border-blue-600">
        {/* Inner decorative border */}
        <div className="w-full h-full border-2 border-blue-200 relative p-12">
          
          {/* Corner decorations */}
          <div className="absolute top-0 left-0 w-16 h-16">
            <div className="absolute top-0 left-0 w-12 h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
            <div className="absolute top-0 left-0 w-1 h-12 bg-gradient-to-b from-blue-600 to-blue-400"></div>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16">
            <div className="absolute top-0 right-0 w-12 h-1 bg-gradient-to-l from-blue-600 to-blue-400"></div>
            <div className="absolute top-0 right-0 w-1 h-12 bg-gradient-to-b from-blue-600 to-blue-400"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-16 h-16">
            <div className="absolute bottom-0 left-0 w-12 h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
            <div className="absolute bottom-0 left-0 w-1 h-12 bg-gradient-to-t from-blue-600 to-blue-400"></div>
          </div>
          <div className="absolute bottom-0 right-0 w-16 h-16">
            <div className="absolute bottom-0 right-0 w-12 h-1 bg-gradient-to-l from-blue-600 to-blue-400"></div>
            <div className="absolute bottom-0 right-0 w-1 h-12 bg-gradient-to-t from-blue-600 to-blue-400"></div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-12 h-12 text-blue-600" />
              <h1 className="text-blue-600" style={{ fontSize: '36px', fontWeight: '700', letterSpacing: '2px' }}>
                SIMPLEHIRE
              </h1>
            </div>
            <div className="h-1 w-48 bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto mb-2"></div>
            <p className="text-slate-600" style={{ fontSize: '14px', letterSpacing: '3px' }}>
              PROFESSIONAL SKILL CERTIFICATE
            </p>
          </div>

          {/* Main content */}
          <div className="text-center mb-8">
            <p className="text-slate-600 mb-3" style={{ fontSize: '14px' }}>
              This is to certify that
            </p>
            <h2 className="text-slate-900 mb-6" style={{ fontSize: '42px', fontWeight: '600', borderBottom: '2px solid #e2e8f0', display: 'inline-block', paddingBottom: '8px', paddingLeft: '40px', paddingRight: '40px' }}>
              {candidateName}
            </h2>
            <p className="text-slate-700 mb-2" style={{ fontSize: '16px', lineHeight: '1.8' }}>
              has successfully completed a comprehensive skill verification assessment for
            </p>
            <p className="text-blue-600 mb-6" style={{ fontSize: '24px', fontWeight: '600' }}>
              {role}
            </p>
            <p className="text-slate-600 mb-4" style={{ fontSize: '14px', lineHeight: '1.8', maxWidth: '700px', margin: '0 auto' }}>
              This verification included an AI-powered voice interview, technical multiple-choice assessment,
              and hands-on coding challenges, validating professional competency and expertise.
            </p>
          </div>

          {/* Score badge */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-xl">
                <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-blue-600" style={{ fontSize: '32px', fontWeight: '700' }}>
                      {overallScore}%
                    </div>
                    <div className="text-slate-600" style={{ fontSize: '10px', letterSpacing: '1px' }}>
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

          {/* Skills grid */}
          <div className="grid grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
            {skills.map((skill, index) => (
              <div key={index} className="text-center">
                <div className="text-slate-700" style={{ fontSize: '11px', marginBottom: '4px' }}>
                  {skill.name}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="text-slate-900" style={{ fontSize: '14px', fontWeight: '600' }}>
                    {skill.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-slate-600" />
                <p className="text-slate-500" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                  COMPLETION DATE
                </p>
              </div>
              <p className="text-slate-900" style={{ fontSize: '13px', fontWeight: '500' }}>
                {completionDate}
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-500 mb-2" style={{ fontSize: '10px', letterSpacing: '1px' }}>
                CERTIFICATE ID
              </p>
              <p className="text-slate-900 font-mono" style={{ fontSize: '11px' }}>
                {certificateId}
              </p>
            </div>
            <div className="text-center">
              <div className="mb-2">
                <div className="h-8 border-b-2 border-slate-900 inline-block" style={{ width: '120px' }}></div>
              </div>
              <p className="text-slate-900" style={{ fontSize: '12px', fontWeight: '500' }}>
                Sarah Mitchell
              </p>
              <p className="text-slate-500" style={{ fontSize: '10px' }}>
                Chief Verification Officer
              </p>
            </div>
          </div>

          {/* Verification URL */}
          <div className="text-center mt-6">
            <p className="text-slate-400" style={{ fontSize: '9px', letterSpacing: '1px' }}>
              Verify authenticity at simplehire.ai/verify/{certificateId}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
