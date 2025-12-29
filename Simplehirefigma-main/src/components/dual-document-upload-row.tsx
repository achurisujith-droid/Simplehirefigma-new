import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Upload, CheckCircle, X } from "lucide-react";
import { useState, useRef } from "react";

interface DualDocumentUploadRowProps {
  label: string;
  optional?: boolean;
  documentId?: string;
}

export function DualDocumentUploadRow({ label, optional, documentId }: DualDocumentUploadRowProps) {
  const [frontFile, setFrontFile] = useState<string | null>(null);
  const [backFile, setBackFile] = useState<string | null>(null);
  const [frontFileName, setFrontFileName] = useState<string>("");
  const [backFileName, setBackFileName] = useState<string>("");
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (side: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload PNG, JPG, or PDF files only');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Convert to base64 and store
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      
      if (side === 'front') {
        setFrontFile(base64);
        setFrontFileName(file.name);
        if (documentId) {
          sessionStorage.setItem(`visa_doc_${documentId}_front`, base64);
        }
      } else {
        setBackFile(base64);
        setBackFileName(file.name);
        if (documentId) {
          sessionStorage.setItem(`visa_doc_${documentId}_back`, base64);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = (side: 'front' | 'back') => () => {
    if (side === 'front') {
      setFrontFile(null);
      setFrontFileName("");
      if (documentId) {
        sessionStorage.removeItem(`visa_doc_${documentId}_front`);
      }
      if (frontInputRef.current) {
        frontInputRef.current.value = '';
      }
    } else {
      setBackFile(null);
      setBackFileName("");
      if (documentId) {
        sessionStorage.removeItem(`visa_doc_${documentId}_back`);
      }
      if (backInputRef.current) {
        backInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
      {/* Hidden file inputs */}
      <input
        ref={frontInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf"
        onChange={handleFileSelect('front')}
        className="hidden"
      />
      <input
        ref={backInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf"
        onChange={handleFileSelect('back')}
        className="hidden"
      />

      {/* Document label */}
      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm text-slate-900">{label}</p>
        {optional && (
          <Badge variant="secondary" className="text-xs">
            Optional
          </Badge>
        )}
      </div>

      {/* Front and Back upload sections */}
      <div className="grid grid-cols-2 gap-3">
        {/* Front side */}
        <div>
          <label className="block text-xs text-slate-600 mb-2">Front side</label>
          {frontFile ? (
            <div className="border-2 border-green-200 bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-xs text-green-700 truncate">{frontFileName}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove('front')}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          ) : (
            <div 
              onClick={() => frontInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors cursor-pointer"
            >
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-600 mb-0.5">Upload</p>
              <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
            </div>
          )}
        </div>

        {/* Back side */}
        <div>
          <label className="block text-xs text-slate-600 mb-2">Back side</label>
          {backFile ? (
            <div className="border-2 border-green-200 bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-xs text-green-700 truncate">{backFileName}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove('back')}
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          ) : (
            <div 
              onClick={() => backInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center hover:border-blue-400 transition-colors cursor-pointer"
            >
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <p className="text-xs text-slate-600 mb-0.5">Upload</p>
              <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}