import { Info } from "lucide-react";

export function InfoTip({ text, label = "More information" }: { text: string; label?: string }) {
  return (
    <span className="info-tip">
      <button className="info-tip-button" type="button" aria-label={label}>
        <Info size={14} strokeWidth={2} />
      </button>
      <span className="info-tip-content" role="tooltip">{text}</span>
    </span>
  );
}
