import { Check } from "lucide-react";
const labels = ["Data & Location", "Algorithm", "Battery Cost", "Results"];
export function StepIndicator({ current }: { current: 1 | 2 | 3 | 4 }) {
  return <div className="stepper" aria-label={`Step ${current} of 4`}>{labels.map((label,index)=>{const step=index+1;const complete=step<current;const active=step===current;return <div className="stepper-fragment" key={label}><div className={`step ${complete?"complete":""} ${active?"active":""}`}><div className="step-circle">{complete?<Check size={18} strokeWidth={2.5}/>:step}</div><span>{label}</span></div>{step<4&&<div className={`step-line ${step<current?"done":""}`}/>}</div>;})}</div>;
}
