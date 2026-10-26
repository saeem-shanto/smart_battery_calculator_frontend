import { InfoTip } from "./InfoTip";

function niceCeiling(value: number, minimum: number) {
  const safe = Math.max(value, minimum);
  const magnitude = Math.pow(10, Math.floor(Math.log10(safe)));
  return Math.ceil(safe / magnitude * 2) / 2 * magnitude;
}

export function BillComparisonChart({ withoutBattery = 2400, withBattery = 1350, showInfo = false }: { withoutBattery?: number; withBattery?: number; showInfo?: boolean }) {
  const max = niceCeiling(Math.max(withoutBattery, withBattery) * 1.15, 1000);
  const chartHeight = 220;
  const h1 = Math.max(2, (withoutBattery / max) * chartHeight);
  const h2 = Math.max(2, (withBattery / max) * chartHeight);
  const ticks = [max, max * 2 / 3, max / 3, 0];
  return (
    <div className="chart-card">
      <div className="chart-title-row"><h3>Electricity Bill Comparison</h3>{showInfo && <InfoTip text="Compares annual baseline cost without a battery against the modelled annual cost for the selected battery size. The comparison includes annual financing costs when supplied by the backend." label="About Electricity Bill Comparison" />}</div>
      <div className="bar-chart">
        <div className="y-axis-label">Annual Bill ($)</div>
        <div className="bars-area">
          {ticks.map((tick, index) => <div className="grid-line dynamic-grid" key={tick} style={{ top: `${index * 33.333}%` }}><span>${Math.round(tick).toLocaleString()}</span></div>)}
          <div className="bar-wrapper bar-left"><strong>${withoutBattery.toLocaleString()}</strong><div className="bar gray" style={{ height: `${h1}px` }} /><span>Without Battery</span></div>
          <div className="bar-wrapper bar-right"><strong>${withBattery.toLocaleString()}</strong><div className="bar green" style={{ height: `${h2}px` }} /><span>With Battery</span></div>
        </div>
      </div>
    </div>
  );
}

export function SavingsLineChart({ points }: { points: { size: number; savings: number }[] }) {
  const safePoints = points.length ? points : [{ size: 0, savings: 0 }];
  const width = 430;
  const height = 250;
  const padding = { left: 55, right: 18, top: 18, bottom: 40 };
  const maxX = niceCeiling(Math.max(...safePoints.map((p) => p.size)), 25);
  const maxY = niceCeiling(Math.max(...safePoints.map((p) => p.savings)) * 1.15, 1000);
  const x = (v: number) => padding.left + (v / maxX) * (width - padding.left - padding.right);
  const y = (v: number) => height - padding.bottom - (v / maxY) * (height - padding.top - padding.bottom);
  const path = safePoints.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.size)},${y(p.savings)}`).join(" ");
  const highlighted = safePoints.reduce((best, point) => Math.abs(point.size - 10) < Math.abs(best.size - 10) ? point : best, safePoints[0]);
  const yTicks = [0, maxY / 3, maxY * 2 / 3, maxY];
  const xTicks = safePoints.map((p) => p.size);

  return (
    <div className="chart-card">
      <h3>Battery Size vs Annual Savings</h3>
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Battery size versus annual savings line chart">
        {yTicks.map((tick) => <g key={tick}><line x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} stroke="#e7edf3" /><text x="3" y={y(tick) + 4} fontSize="11" fill="#52647d">${Math.round(tick).toLocaleString()}</text></g>)}
        {xTicks.map((tick) => <g key={tick}><line x1={x(tick)} x2={x(tick)} y1={padding.top} y2={height - padding.bottom} stroke="#f0f3f6" /><text x={x(tick)} y={height - 14} textAnchor="middle" fontSize="12" fill="#52647d">{tick}</text></g>)}
        <path d={path} fill="none" stroke="#0b9e45" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {safePoints.map((p) => <circle key={`${p.size}-${p.savings}`} cx={x(p.size)} cy={y(p.savings)} r="6" fill="#0b9e45" />)}
        <g transform={`translate(${Math.min(width - 95, Math.max(5, x(highlighted.size) - 38))} ${Math.max(2, y(highlighted.savings) - 46)})`}>
          <rect width="76" height="31" rx="7" fill="#0b9e45" /><text x="38" y="21" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">${highlighted.savings.toLocaleString()}</text><path d="M33 31l5 7 5-7" fill="#0b9e45" />
        </g>
      </svg>
      <div className="x-axis-title">Battery Size (kWh)</div>
    </div>
  );
}
