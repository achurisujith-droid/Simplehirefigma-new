import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useState } from "react";

interface AddReferenceFormProps {
  onAdd: (reference: { name: string; email: string; company: string; relation: string }) => void;
  onCancel: () => void;
  canAdd: boolean;
}

export function AddReferenceForm({ onAdd, onCancel, canAdd }: AddReferenceFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    relation: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.company && formData.relation) {
      onAdd(formData);
      setFormData({ name: "", email: "", company: "", relation: "" });
    }
  };

  const isFormValid = formData.name && formData.email && formData.company && formData.relation;

  if (!canAdd) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
      <div className="mb-6">
        <h2 className="text-slate-900 mb-1">Add a reference</h2>
        <p className="text-sm text-slate-600">
          Provide details of someone who can verify your work experience
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm text-slate-700 mb-2">Full name *</label>
          <Input
            type="text"
            placeholder="e.g., John Smith"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-slate-700 mb-2">Email address *</label>
          <Input
            type="email"
            placeholder="john.smith@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm text-slate-700 mb-2">Company name *</label>
          <Input
            type="text"
            placeholder="e.g., Tech Corp Inc."
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            required
          />
        </div>

        {/* Relation */}
        <div>
          <label className="block text-sm text-slate-700 mb-2">Relation with you *</label>
          <Select value={formData.relation} onValueChange={(value) => setFormData({ ...formData, relation: value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="senior-manager">Senior Manager</SelectItem>
              <SelectItem value="colleague">Colleague</SelectItem>
              <SelectItem value="team-lead">Team Lead</SelectItem>
              <SelectItem value="supervisor">Supervisor</SelectItem>
              <SelectItem value="director">Director</SelectItem>
              <SelectItem value="hr">HR Representative</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Helper text */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-blue-900">
            We'll send an automated email to this reference asking them to verify your employment and skills.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={!isFormValid} className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
            Add reference
          </Button>
          <Button type="button" onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
