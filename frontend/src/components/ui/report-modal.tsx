import { useState } from "react";
import { ChevronDown, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "./modal";
import { Button } from "./button";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { Alert, AlertDescription } from "./alert";
import type { MetadataReportEntityType, CreateMetadataReportRequest } from "@/types";

const controlClass = cn(
  "w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground",
  "placeholder:text-faint outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
);

export interface ReportModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when report is submitted */
  onSubmit: (report: CreateMetadataReportRequest) => Promise<void>;
  /** Entity type being reported */
  entityType: MetadataReportEntityType;
  /** Entity ID */
  entityId: string;
  /** Entity name for display */
  entityName: string;
  /** Available fields to report */
  fields: Array<{
    name: string;
    label: string;
    currentValue: string;
  }>;
}

export function ReportModal({
  isOpen,
  onClose,
  onSubmit,
  entityType,
  entityId,
  entityName,
  fields,
}: ReportModalProps) {
  const [selectedField, setSelectedField] = useState<string>("");
  const [suggestedValue, setSuggestedValue] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFieldData = fields.find((f) => f.name === selectedField);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedField || !suggestedValue.trim()) {
      setError("Select a field and provide a suggested value.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        entity_type: entityType,
        entity_id: entityId,
        field_name: selectedField,
        current_value: selectedFieldData?.currentValue ?? "",
        suggested_value: suggestedValue.trim(),
        description: description.trim() || undefined,
      });

      setSelectedField("");
      setSuggestedValue("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedField("");
    setSuggestedValue("");
    setDescription("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Report incorrect data"
      description={`Report an issue with "${entityName}"`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="field">Which field is incorrect?</Label>
          <div className="relative">
            <select
              id="field"
              value={selectedField}
              onChange={(e) => {
                setSelectedField(e.target.value);
                setSuggestedValue("");
              }}
              className={cn(controlClass, "h-9 appearance-none pr-9")}
              required
            >
              <option value="">Select a field</option>
              {fields.map((field) => (
                <option key={field.name} value={field.name}>
                  {field.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          </div>
        </div>

        {selectedFieldData && (
          <div className="space-y-1.5">
            <Label>Current value</Label>
            <div className="rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
              {selectedFieldData.currentValue || <em className="text-faint">Empty</em>}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="suggestedValue">Correct value</Label>
          <input
            id="suggestedValue"
            type="text"
            value={suggestedValue}
            onChange={(e) => setSuggestedValue(e.target.value)}
            placeholder="Enter the correct value"
            className={cn(controlClass, "h-9")}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">
            Additional details <span className="text-faint">(optional)</span>
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain why this is incorrect or provide sources"
            rows={3}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!selectedField || !suggestedValue.trim()}
          >
            Submit report
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Button to trigger the report modal.
 */
export interface ReportButtonProps {
  onClick: () => void;
  className?: string;
}

export function ReportButton({ onClick, className }: ReportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-muted-foreground",
        "transition-colors hover:bg-destructive/10 hover:text-destructive",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        className
      )}
    >
      <Flag className="size-4" />
      Report incorrect data
    </button>
  );
}

export default ReportModal;
