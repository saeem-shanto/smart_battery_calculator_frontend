import { AlertCircle, TriangleAlert } from "lucide-react";
import type { ValidationIssue } from "@/lib/validation";

export function ValidationSummary({ issues, showWarnings = true }: { issues: ValidationIssue[]; showWarnings?: boolean }) {
  const errors = issues.filter((issue) => issue.level === "error");
  const warnings = showWarnings ? issues.filter((issue) => issue.level === "warning") : [];
  if (!errors.length && !warnings.length) return null;

  return (
    <div className="validation-stack" aria-live="polite">
      {errors.length > 0 && (
        <div className="validation-summary error" role="alert">
          <AlertCircle size={19} />
          <div><strong>Please fix {errors.length === 1 ? "this error" : `these ${errors.length} errors`}:</strong><ul>{errors.map((issue, index) => <li key={`${issue.field}-${index}`}>{issue.message}</li>)}</ul></div>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="validation-summary warning">
          <TriangleAlert size={19} />
          <div><strong>Please check {warnings.length === 1 ? "this warning" : `these ${warnings.length} warnings`}:</strong><ul>{warnings.map((issue, index) => <li key={`${issue.field}-${index}`}>{issue.message}</li>)}</ul></div>
        </div>
      )}
    </div>
  );
}

export function InlineIssue({ issues, field }: { issues: ValidationIssue[]; field: string }) {
  const error = issues.find((issue) => issue.field === field && issue.level === "error");
  const warning = issues.find((issue) => issue.field === field && issue.level === "warning");
  if (!error && !warning) return null;
  const issue = error ?? warning!;
  return <div className={`field-message ${issue.level}`} role={issue.level === "error" ? "alert" : undefined}>{issue.message}</div>;
}
