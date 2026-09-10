import { BatteryCharging, PlugZap } from "lucide-react";

export function BrandLogo() {
  return (
    <div className="brand">
      <div className="brand-mark" aria-hidden="true">
        <BatteryCharging size={29} strokeWidth={2.2} />
        <PlugZap className="brand-plug" size={17} strokeWidth={2.2} />
      </div>
      <div className="brand-text">Smart Battery<br />Calculator</div>
    </div>
  );
}
