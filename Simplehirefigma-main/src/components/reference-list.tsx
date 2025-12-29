import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Trash2, Mail, Building, User } from "lucide-react";
import { ReferenceItem } from "./reference-status-card";

interface ReferenceListProps {
  references: ReferenceItem[];
  onRemove: (id: number) => void;
  onAddMore: () => void;
  onSubmit: () => void;
  canAddMore: boolean;
}

export function ReferenceList({ references, onRemove, onAddMore, onSubmit, canAddMore }: ReferenceListProps) {
  const formatRelation = (relation: string) => {
    return relation.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 mb-1">Your references</h2>
          <p className="text-sm text-slate-600">
            {references.length} reference{references.length !== 1 ? 's' : ''} added
          </p>
        </div>
        {canAddMore && (
          <Button onClick={onAddMore} variant="outline" size="sm">
            + Add another
          </Button>
        )}
      </div>

      {/* Reference cards */}
      <div className="space-y-4 mb-6">
        {references.map((reference) => (
          <div key={reference.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <p className="text-sm text-slate-900">{reference.name}</p>
                  <Badge variant="secondary" className="text-xs">
                    {formatRelation(reference.relation)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <p className="text-sm text-slate-600">{reference.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-500" />
                  <p className="text-sm text-slate-600">{reference.company}</p>
                </div>
              </div>
              <Button
                onClick={() => onRemove(reference.id)}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Info message */}
      {references.length >= 5 && (
        <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-200">
          <p className="text-sm text-green-900">
            ✓ You've added the maximum of 5 references. Ready to submit?
          </p>
        </div>
      )}

      {references.length >= 1 && references.length < 5 && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
          <p className="text-sm text-blue-900">
            💡 You can add up to {5 - references.length} more reference{5 - references.length !== 1 ? 's' : ''}. More references strengthen your profile!
          </p>
        </div>
      )}

      {/* Submit button */}
      <div className="flex justify-end pt-4 border-t border-slate-200">
        <Button
          onClick={onSubmit}
          disabled={references.length === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8"
        >
          Submit references for verification
        </Button>
      </div>
    </div>
  );
}