import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { FileText, CreditCard, Camera, CheckCircle, AlertCircle, Edit2 } from "lucide-react";
import { useState, useEffect } from "react";

interface ReviewSubmitStepProps {
  onBack: () => void;
  onSubmit: () => void;
}

export function ReviewSubmitStep({ onBack, onSubmit }: ReviewSubmitStepProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState({
    idType: "",
    idFront: "",
    idBack: "",
    visaStatus: "",
    selfie: ""
  });

  useEffect(() => {
    // Load documents from sessionStorage
    const idType = sessionStorage.getItem('id_type') || "";
    const idFront = sessionStorage.getItem('id_front') || "";
    const idBack = sessionStorage.getItem('id_back') || "";
    const visaStatus = sessionStorage.getItem('visa_status') || "";
    const selfie = sessionStorage.getItem('selfie_image') || "";

    setDocuments({ idType, idFront, idBack, visaStatus, selfie });
  }, []);

  const handleSubmit = () => {
    if (!confirmed) {
      setError("Please confirm that all documents are accurate");
      return;
    }

    if (!documents.idFront || !documents.visaStatus || !documents.selfie) {
      setError("Some documents are missing. Please go back and complete all steps.");
      return;
    }

    setError("");
    onSubmit();
  };

  const getIdTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'passport': 'Passport',
      'state-id': 'State ID',
      'drivers-license': "Driver's License"
    };
    return labels[type] || type;
  };

  const getVisaStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'us-citizen': 'US Citizen',
      'green-card': 'Green Card (LPR)',
      'h1b': 'H-1B',
      'h4': 'H-4',
      'h4-ead': 'H-4 EAD',
      'f1-student': 'F-1 Student',
      'f1-cpt': 'F-1 CPT',
      'f1-opt': 'F-1 OPT',
      'f1-stem-opt': 'F-1 STEM OPT',
      'l1': 'L-1',
      'l2': 'L-2',
      'l2-ead': 'L-2 EAD',
      'other': 'Other'
    };
    return labels[status] || status;
  };

  const allDocumentsPresent = documents.idFront && documents.visaStatus && documents.selfie;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <div className="mb-6">
        <h2 className="text-slate-900 mb-1">Step 4 · Review & submit</h2>
        <p className="text-sm text-slate-600">
          Review your uploaded documents before submitting for verification
        </p>
      </div>

      {/* Status alert */}
      {allDocumentsPresent ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-green-900">
              <strong>All documents uploaded!</strong> Your submission is ready for verification.
            </p>
            <p className="text-xs text-green-800 mt-1">
              Typical verification time: 24-48 hours
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-900">
            Some documents are missing. Please complete all previous steps before submitting.
          </p>
        </div>
      )}

      {/* Document summary */}
      <div className="space-y-3 mb-6">
        {/* ID Document */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
          <div className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900">ID document</p>
              <p className="text-xs text-slate-600">
                {documents.idType ? getIdTypeLabel(documents.idType) : 'Not uploaded'}
              </p>
            </div>
            {documents.idFront ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Uploaded
              </Badge>
            ) : (
              <Badge variant="outline" className="text-slate-500 text-xs">
                Pending
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
          
          {/* Preview thumbnails */}
          {documents.idFront && (
            <div className="px-4 pb-4 flex gap-2">
              <div className="flex-1">
                <p className="text-xs text-slate-600 mb-1">Front side</p>
                <div className="aspect-[3/2] bg-slate-200 rounded overflow-hidden">
                  <img 
                    src={documents.idFront} 
                    alt="ID front" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {documents.idBack && (
                <div className="flex-1">
                  <p className="text-xs text-slate-600 mb-1">Back side</p>
                  <div className="aspect-[3/2] bg-slate-200 rounded overflow-hidden">
                    <img 
                      src={documents.idBack} 
                      alt="ID back" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Work Authorization */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-900">Work authorization</p>
            <p className="text-xs text-slate-600">
              {documents.visaStatus ? getVisaStatusLabel(documents.visaStatus) : 'Not selected'}
            </p>
          </div>
          {documents.visaStatus ? (
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
              <CheckCircle className="w-3 h-3 mr-1" />
              Uploaded
            </Badge>
          ) : (
            <Badge variant="outline" className="text-slate-500 text-xs">
              Pending
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit2 className="w-3 h-3" />
          </Button>
        </div>

        {/* Selfie */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
          <div className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
              {documents.selfie ? (
                <img 
                  src={documents.selfie} 
                  alt="Selfie preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-6 h-6 text-green-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900">Selfie verification</p>
              <p className="text-xs text-slate-600">
                {documents.selfie ? 'Identity verification photo' : 'Not captured'}
              </p>
            </div>
            {documents.selfie ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" />
                Captured
              </Badge>
            ) : (
              <Badge variant="outline" className="text-slate-500 text-xs">
                Pending
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
          
          {/* Selfie preview */}
          {documents.selfie && (
            <div className="px-4 pb-4">
              <div className="aspect-[4/3] bg-slate-200 rounded overflow-hidden max-w-xs">
                <img 
                  src={documents.selfie} 
                  alt="Selfie" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation checkbox */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
        <div className="flex items-start gap-3">
          <Checkbox 
            id="confirm" 
            className="mt-1" 
            checked={confirmed}
            onCheckedChange={(checked) => {
              setConfirmed(checked as boolean);
              if (checked) setError("");
            }}
          />
          <label htmlFor="confirm" className="text-sm text-blue-900 cursor-pointer leading-relaxed">
            <strong>Declaration:</strong> I confirm that these documents belong to me and are accurate. I understand that submitting false information may result in account suspension and legal consequences.
          </label>
        </div>
      </div>

      {/* Processing timeline */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-slate-900 mb-3"><strong>What happens next?</strong></p>
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-slate-700">
            <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs">1</div>
            <p>Your documents are submitted for verification</p>
          </div>
          <div className="flex items-start gap-2 text-sm text-slate-700">
            <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs">2</div>
            <p>Our team reviews your documents (24-48 hours)</p>
          </div>
          <div className="flex items-start gap-2 text-sm text-slate-700">
            <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs">3</div>
            <p>You'll receive an email with the verification results</p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button onClick={onBack} variant="ghost">
          Edit documents
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!confirmed || !allDocumentsPresent}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit for verification
        </Button>
      </div>
    </div>
  );
}
