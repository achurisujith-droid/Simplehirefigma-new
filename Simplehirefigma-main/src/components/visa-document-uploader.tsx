import { DocumentUploadRow } from "./document-upload-row";
import { DualDocumentUploadRow } from "./dual-document-upload-row";
import { Input } from "./ui/input";

interface VisaDocumentUploaderProps {
  status: string;
}

export function VisaDocumentUploader({ status }: VisaDocumentUploaderProps) {
  const getDocumentsForStatus = () => {
    switch (status) {
      case "us-citizen":
        return {
          required: [
            { id: "passport", label: "US Passport – info page" },
            { id: "birth-cert", label: "US Birth certificate (or State ID / Driver's License)", optional: true }
          ]
        };
      
      case "green-card":
        return {
          required: [
            { id: "green-card", label: "Green card", dual: true }
          ]
        };
      
      case "h1b":
        return {
          required: [
            { id: "i797", label: "I-797 H-1B approval notice (latest)" },
            { id: "i94", label: "I-94 record" },
            { id: "paystub", label: "Recent paystub (last 30–60 days)" },
            { id: "employer-letter", label: "Client / employer letter or offer letter", optional: true }
          ]
        };
      
      case "h4":
        return {
          required: [
            { id: "h4-approval", label: "H-4 approval (I-797) or H-4 visa stamp page" },
            { id: "i94", label: "I-94 record" },
            { id: "spouse-i797", label: "Primary H-1B's I-797 (spouse)" }
          ]
        };
      
      case "h4-ead":
        return {
          required: [
            { id: "h4-ead-card", label: "H-4 EAD card", dual: true },
            { id: "h4-approval", label: "H-4 approval (I-797)" },
            { id: "i94", label: "I-94 record" }
          ]
        };
      
      case "f1-student":
        return {
          required: [
            { id: "i20", label: "Latest I-20 (all pages)" },
            { id: "f1-visa", label: "F-1 visa stamp page" },
            { id: "i94", label: "I-94 record" }
          ]
        };
      
      case "f1-cpt":
        return {
          required: [
            { id: "i20-cpt", label: "I-20 with CPT authorization" },
            { id: "i94", label: "I-94 record" },
            { id: "cpt-letter", label: "CPT offer letter / training agreement", optional: true }
          ]
        };
      
      case "f1-opt":
        return {
          required: [
            { id: "opt-ead", label: "OPT EAD card", dual: true },
            { id: "i20-opt", label: "Latest I-20 with OPT endorsement" },
            { id: "i94", label: "I-94 record" }
          ]
        };
      
      case "f1-stem-opt":
        return {
          required: [
            { id: "stem-ead", label: "STEM OPT EAD card", dual: true },
            { id: "stem-i20", label: "STEM OPT I-20" },
            { id: "i94", label: "I-94 record" }
          ],
          fields: [
            { id: "everify", label: "Employer E-Verify number", type: "text" }
          ]
        };
      
      case "l1":
        return {
          required: [
            { id: "l1-approval", label: "L-1 I-797 approval or L-1 visa stamp page" },
            { id: "i94", label: "I-94 record" },
            { id: "employer-letter", label: "Employer letter confirming assignment", optional: true }
          ]
        };
      
      case "l2":
        return {
          required: [
            { id: "l2-approval", label: "L-2 approval (I-797) or L-2 visa stamp page" },
            { id: "i94", label: "I-94 record" },
            { id: "principal-i797", label: "Primary L-1's I-797 (principal)" }
          ]
        };
      
      case "l2-ead":
        return {
          required: [
            { id: "l2-ead-card", label: "L-2 EAD card", dual: true },
            { id: "l2-approval", label: "L-2 approval / visa stamp" },
            { id: "i94", label: "I-94 record" },
            { id: "principal-i797", label: "Primary L-1's I-797", optional: true }
          ]
        };
      
      case "other":
        return {
          required: [
            { id: "work-auth", label: "Current work authorization document (approval notice / EAD)" },
            { id: "i94", label: "I-94 record" },
            { id: "visa-stamp", label: "Visa stamp page (if applicable)", optional: true }
          ]
        };
      
      default:
        return { required: [] };
    }
  };

  const documents = getDocumentsForStatus();

  return (
    <div className="mb-6">
      <h3 className="text-slate-900 mb-4">Required documents for this status</h3>
      
      <div className="space-y-4">
        {documents.required?.map((doc) => (
          doc.dual ? (
            <DualDocumentUploadRow
              key={doc.id}
              label={doc.label}
              optional={doc.optional}
              documentId={doc.id}
            />
          ) : (
            <DocumentUploadRow
              key={doc.id}
              label={doc.label}
              optional={doc.optional}
              documentId={doc.id}
            />
          )
        ))}
        
        {documents.fields?.map((field) => (
          <div key={field.id}>
            <label className="block text-sm text-slate-700 mb-2">
              {field.label} *
            </label>
            <Input
              type={field.type}
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}