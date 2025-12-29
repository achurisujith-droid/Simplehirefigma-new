import { Badge } from "./ui/badge";
import { AddReferenceForm } from "./add-reference-form";
import { ReferenceList } from "./reference-list";
import { ReferenceGuidancePanel } from "./reference-guidance-panel";
import { useState, useEffect } from "react";
import { ReferenceItem } from "./reference-status-card";

interface ReferenceCheckPageProps {
  onSubmitReferences: (references: ReferenceItem[]) => void;
  existingReferences?: ReferenceItem[];
}

export function ReferenceCheckPage({ onSubmitReferences, existingReferences }: ReferenceCheckPageProps) {
  const [references, setReferences] = useState<ReferenceItem[]>(existingReferences || []);
  const [showForm, setShowForm] = useState(existingReferences ? existingReferences.length === 0 : true);

  // Auto-save references to localStorage whenever they change (for draft state)
  useEffect(() => {
    if (references.length > 0) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Save draft references (not yet submitted)
          userData.draftReferences = references;
          localStorage.setItem('currentUser', JSON.stringify(userData));
        } catch (error) {
          console.error('Error saving draft references:', error);
        }
      }
    }
  }, [references]);

  const handleAddReference = (reference: Omit<ReferenceItem, 'id' | 'status'>) => {
    const newReference: ReferenceItem = {
      ...reference,
      id: Date.now(),
      status: "pending"
    };
    setReferences([...references, newReference]);
    setShowForm(false);
  };

  const handleRemoveReference = (id: number) => {
    setReferences(references.filter(ref => ref.id !== id));
  };

  const handleSubmit = () => {
    onSubmitReferences(references);
  };

  return (
    <main className="max-w-[1440px] mx-auto px-8 py-12">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-slate-900 mb-2">Reference check</h1>
            <p className="text-slate-600">
              Add professional references who can verify your work experience and skills
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            {references.length} of 5 added
          </Badge>
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-8">
        {/* Left column - Form and list */}
        <div className="flex-1 space-y-6">
          {showForm && (
            <AddReferenceForm 
              onAdd={handleAddReference}
              onCancel={() => setShowForm(false)}
              canAdd={references.length < 5}
            />
          )}

          {references.length > 0 && (
            <ReferenceList 
              references={references}
              onRemove={handleRemoveReference}
              onAddMore={() => setShowForm(true)}
              onSubmit={handleSubmit}
              canAddMore={references.length < 5}
            />
          )}
        </div>

        {/* Right column - Guidance */}
        <ReferenceGuidancePanel />
      </div>
    </main>
  );
}