import { Check } from "lucide-react";

const labels = ["Data & Location", "Algorithm", "Battery Cost", "Results"] as const;

export function StepIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <nav className="stepper" aria-label={`Calculation progress, step ${current} of 4`}>
      {labels.map((label, index) => {
        const step = index + 1;
        const complete = step < current;
        const active = step === current;
        return (
          <div className="stepper-fragment" key={label}>
            <div
              className={`step ${complete ? "complete" : ""} ${active ? "active" : ""}`}
              aria-current={active ? "step" : undefined}
              aria-label={`Step ${step} of 4: ${label}${complete ? ", completed" : active ? ", current" : ""}`}
            >
              <div className="step-circle" aria-hidden="true">
                {complete ? <Check size={18} strokeWidth={2.5} /> : step}
              </div>
              <span>{label}</span>
            </div>
            {step < 4 && <div className={`step-line ${step < current ? "done" : ""}`} aria-hidden="true" />}
          </div>
        );
      })}
    </nav>
  );
}
