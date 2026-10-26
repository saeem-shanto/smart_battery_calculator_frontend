'use client';

import { useId } from 'react';
import { activeFlowRoutes, type EnergyFlow } from '../lib/energy-flow';
import './energy-flow-animation.css';

type Props = {
  /** An AUTHORITATIVE hourly flow produced by flowFromHourlyDispatch. */
  flow: EnergyFlow | null;
  hourLabel?: string;
  /** e.g. "Modelled hourly dispatch" or "Illustrative scenario" */
  provenanceLabel?: string;
  className?: string;
};

const number = (n: number) => n.toLocaleString('en-AU', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

/**
 * The path d values are source -> destination. Arrowheads and moving dots
 * always move in that direction, including Grid -> Home on import.
 */
export function EnergyFlowAnimation({
  flow,
  hourLabel = 'One-hour interval',
  provenanceLabel = 'Hourly client-model dispatch',
  className = '',
}: Props) {
  const markerBase = useId().replace(/:/g, '');
  const active = flow ? activeFlowRoutes(flow) : [];

  return (
    <section className={`n01-energy-flow ${className}`.trim()} aria-label="Energy flow animation">
      <header className="n01-energy-flow__header">
        <div>
          <h3>Household energy flow</h3>
          <p>{hourLabel} · {provenanceLabel}</p>
        </div>
      </header>
      {!flow ? (
        <p className="n01-energy-flow__notice" role="status">
          Hourly energy-dispatch values are not available. The animation is disabled to avoid showing misleading import/export directions.
        </p>
      ) : (
        <>
          <svg viewBox="0 0 900 430" className="n01-energy-flow__svg" role="img" aria-label={
            active.length === 0
              ? 'No active energy transfer during this hour'
              : active.map((route) => `${route.label}: ${number(flow[route.key])} kWh`).join('. ')
          }>
            <defs>
              {active.map((route) => (
                <marker
                  key={`${route.key}-marker`}
                  id={`${markerBase}-${route.key}`}
                  markerWidth="10" markerHeight="10" refX="8" refY="4"
                  orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 10 8">
                  <path d="M 0 0 L 10 4 L 0 8 Z" fill={route.color} />
                </marker>
              ))}
            </defs>
            {active.map((route) => (
              <g key={route.key}>
                <path
                  d={route.path}
                  fill="none"
                  stroke={route.color}
                  strokeWidth="5"
                  strokeLinecap="round"
                  markerEnd={`url(#${markerBase}-${route.key})`}
                  className="n01-energy-flow__active-path"
                  aria-hidden="true"
                />
                <circle r="6" fill={route.color} className="n01-energy-flow__moving-dot" aria-hidden="true">
                  <animateMotion dur="2.2s" repeatCount="indefinite" path={route.path} />
                </circle>
              </g>
            ))}
            <g className="n01-energy-flow__node">
              <rect x="52" y="53" width="176" height="98" rx="17" />
              <text x="140" y="94" textAnchor="middle" className="n01-energy-flow__node-name">☀ Solar PV</text>
              <text x="140" y="122" textAnchor="middle">{number(flow.pvKwh)} kWh</text>
            </g>
            <g className="n01-energy-flow__node">
              <rect x="378" y="185" width="150" height="95" rx="17" />
              <text x="453" y="223" textAnchor="middle" className="n01-energy-flow__node-name">⌂ Home</text>
              <text x="453" y="253" textAnchor="middle">{number(flow.loadKwh)} kWh</text>
            </g>
            <g className="n01-energy-flow__node">
              <rect x="52" y="302" width="176" height="100" rx="17" />
              <text x="140" y="342" textAnchor="middle" className="n01-energy-flow__node-name">▣ Battery</text>
              <text x="140" y="372" textAnchor="middle">
                {flow.solarToBattery > 0 ? `Charging ${number(flow.solarToBattery)}` : flow.batteryToHome > 0 ? `Discharging ${number(flow.batteryToHome)}` : 'Idle'}
              </text>
            </g>
            <g className="n01-energy-flow__node">
              <rect x="684" y="179" width="172" height="100" rx="17" />
              <text x="770" y="219" textAnchor="middle" className="n01-energy-flow__node-name">⚡ Grid</text>
              <text x="770" y="249" textAnchor="middle">
                {flow.gridToHome > 0 ? `Import ${number(flow.gridToHome)}` : flow.solarToGrid > 0 ? `Export ${number(flow.solarToGrid)}` : 'Idle'}
              </text>
            </g>
          </svg>
          <ul className="n01-energy-flow__legend" aria-label="Hourly energy transfers">
            {active.length ? active.map((route) => (
              <li key={route.key}>
                <span className="n01-energy-flow__swatch" style={{ backgroundColor: route.color }} aria-hidden="true" />
                <span>{route.from} → {route.to}</span>
                <strong>{number(flow[route.key])} kWh</strong>
              </li>
            )) : <li>No active energy transfers.</li>}
            {flow.curtailedSolar > 1e-6 && (
              <li><span>Unexported / curtailed solar</span><strong>{number(flow.curtailedSolar)} kWh</strong></li>
            )}
          </ul>
        </>
      )}
    </section>
  );
}

export default EnergyFlowAnimation;
