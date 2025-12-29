import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Upload, CheckCircle, X } from "lucide-react";
import { useState, useRef } from "react";

interface DocumentUploadRowProps {
  label: string;
  optional?: boolean;
  documentId?: string;
}

export function DocumentUploadRow({ label, optional, documentId }: DocumentUploadRowProps) {
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setUploadedFile(base64);
      setFileName(file.name);
      
      // Store in sessionStorage with unique key
      if (documentId) {
        sessionStorage.setItem(`visa_doc_${documentId}`, base64);
        sessionStorage.setItem(`visa_doc_${documentId}_name`, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setUploadedFile(null);
    setFileName("");
    if (documentId) {
      sessionStorage.removeItem(`visa_doc_${documentId}`);
      sessionStorage.removeItem(`visa_doc_${documentId}_name`);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Document label */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm text-slate-900">{label}</p>
          {optional && (
            <Badge variant="secondary" className="text-xs">
              Optional
            </Badge>
          )}
        </div>
        {uploadedFile ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-700">{fileName}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-500">PNG, JPG, PDF up to 10MB</p>
        )}
      </div>

      {/* Upload/Remove button */}
      <div className="flex-shrink-0">
        {uploadedFile ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Remove
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="hover:bg-blue-50 hover:border-blue-300"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        )}
      </div>
    </div>
  );
}