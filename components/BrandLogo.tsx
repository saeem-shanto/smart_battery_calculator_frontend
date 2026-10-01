import { BatteryCharging, PlugZap } from "lucide-react";

export function BrandLogo() {
  return (
    <a className="brand" href="/" aria-label="Smart Battery Calculator home">
      <div className="brand-mark" aria-hidden="true">
        <BatteryCharging size={29} strokeWidth={2.2} />
        <PlugZap className="brand-plug" size={17} strokeWidth={2.2} />
      </div>
      <div className="brand-text">Smart Battery<br />Calculator</div>
    </a>
  );
}
