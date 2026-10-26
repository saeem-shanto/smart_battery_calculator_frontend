"use client";

import { memo, useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { activeFlowRoutes } from "@/src/lib/energy-flow";
import { ENERGY_FLOW_SCENARIOS, HERO_ROUTE_PATHS, getScenario, type ScenarioKey } from "@/lib/energy-flow-scenarios";



export const EnergyEcosystem = memo(function EnergyEcosystem() {
  const markerBase = useId().replace(/:/g, "");
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("solar-surplus");
  const { scenario, flow } = getScenario(scenarioKey);
  const routes = activeFlowRoutes(flow);
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
  }, []);

  function move(event: PointerEvent<HTMLDivElement>) {
    const root = rootRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      root.style.setProperty("--scene-x", `${x * 10}px`);
      root.style.setProperty("--scene-y", `${y * 7}px`);
      root.style.setProperty("--scene-ry", `${x * 3.2}deg`);
      root.style.setProperty("--scene-rx", `${-y * 2.3}deg`);
    });
  }

  function reset() {
    const root = rootRef.current;
    if (!root) return;
    root.style.setProperty("--scene-x", "0px");
    root.style.setProperty("--scene-y", "0px");
    root.style.setProperty("--scene-ry", "0deg");
    root.style.setProperty("--scene-rx", "0deg");
  }

  return (
    <div
      ref={rootRef}
      className="energy-ecosystem energy-ecosystem--verified"
      onPointerMove={move}
      onPointerLeave={reset}
      role="region"
      aria-label="Illustrative hourly solar, battery, home and grid energy-flow directions. Select a scenario to verify import and export."
    >
      <div className="energy-orb energy-orb-warm" />
      <div className="energy-orb energy-orb-cyan" />

      <div className="energy-scene-tilt">
        <svg viewBox="0 0 720 440" className="energy-scene" aria-hidden="true">
          <defs>
            <linearGradient id="terrain" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e7f9f1" />
              <stop offset="1" stopColor="#d8f0ee" />
            </linearGradient>
            <linearGradient id="terrainEdge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c7e8dc" />
              <stop offset="1" stopColor="#a9d4c6" />
            </linearGradient>
            <linearGradient id="panelFace" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#183b59" />
              <stop offset="0.55" stopColor="#0f6687" />
              <stop offset="1" stopColor="#0d344f" />
            </linearGradient>
            <linearGradient id="batteryBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#17313f" />
              <stop offset="1" stopColor="#0b1f2c" />
            </linearGradient>
            <linearGradient id="houseFace" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#dcecef" />
            </linearGradient>
            <linearGradient id="cyanGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#57e4ff" />
              <stop offset="1" stopColor="#18b7d9" />
            </linearGradient>
            <radialGradient id="sunFace">
              <stop offset="0" stopColor="#fff8bd" />
              <stop offset="0.58" stopColor="#ffd35d" />
              <stop offset="1" stopColor="#ffad2f" />
            </radialGradient>
            <filter id="softShadow" x="-30%" y="-30%" width="160%" height="170%">
              <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#17384a" floodOpacity="0.14" />
            </filter>
            <filter id="smallGlow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <ellipse cx="397" cy="349" rx="268" ry="47" fill="#0c5b4d" opacity="0.07" />

          <g className="sun-group">
            <circle cx="103" cy="78" r="52" fill="#ffc94b" opacity="0.12" className="sun-halo" />
            <circle cx="103" cy="78" r="28" fill="url(#sunFace)" />
            <g stroke="#f4b52e" strokeWidth="4" strokeLinecap="round" opacity="0.76">
              <path d="M103 31v-15" /><path d="M103 140v-15" />
              <path d="M56 78H41" /><path d="M165 78h-15" />
              <path d="M70 45l-11-11" /><path d="M147 122l-11-11" />
              <path d="M136 45l11-11" /><path d="M59 122l11-11" />
            </g>
          </g>

          <path d="M136 326 L389 256 L650 323 L397 404 Z" fill="url(#terrain)" />
          <path d="M136 326 L397 404 L397 420 L136 342 Z" fill="url(#terrainEdge)" opacity="0.68" />
          <path d="M397 404 L650 323 L650 339 L397 420 Z" fill="#b9ddd4" opacity="0.78" />

          <g className="solar-array" filter="url(#softShadow)">
            <path d="M201 214 L321 184 L362 234 L239 265 Z" fill="url(#panelFace)" stroke="#0a4967" strokeWidth="3" />
            <path d="M218 218 L322 192 M228 231 L333 205 M239 244 L344 218 M249 257 L354 231" stroke="#5bd8ec" strokeWidth="1.5" opacity="0.62" />
            <path d="M226 208 L263 256 M257 200 L294 248 M288 192 L326 240 M319 187 L356 232" stroke="#69dff0" strokeWidth="1.5" opacity="0.55" />
            <path d="M247 267v26M337 244v26" stroke="#657f86" strokeWidth="6" strokeLinecap="round" />
            <path d="M216 221 L326 194 L334 203 L223 231 Z" fill="#9cf3ff" opacity="0.10" className="panel-shimmer" />
          </g>

          <g className="battery-unit" filter="url(#softShadow)">
            <rect x="402" y="232" width="76" height="112" rx="18" fill="url(#batteryBody)" />
            <rect x="424" y="220" width="32" height="15" rx="6" fill="#294a59" />
            <rect x="417" y="249" width="46" height="66" rx="12" fill="#102937" stroke="#294b58" />
            <rect x="423" y="278" width="34" height="30" rx="8" fill="url(#cyanGlow)" opacity="0.82" className={flow.solarToBattery > 0 ? "battery-charge" : "battery-charge battery-charge--resting"} />
            <path d="M438 258h7l-5 10h7l-12 17 4-12h-7z" fill="#a5f5ff" />
            <circle cx="440" cy="327" r="4" fill="#62e9c2" />
          </g>

          <g className="eco-house" filter="url(#softShadow)">
            <path d="M514 249 L590 194 L657 235 L657 330 L514 330 Z" fill="url(#houseFace)" />
            <path d="M502 250 L588 183 L669 235" fill="none" stroke="#173c4c" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round" />
            <path d="M529 246 L588 204 L636 234" fill="none" stroke="#4f7180" strokeWidth="3" opacity="0.55" />
            <rect x="535" y="274" width="33" height="56" rx="3" fill="#244a5b" />
            <rect x="586" y="258" width="47" height="36" rx="4" fill="#9af0ff" stroke="#4ba9ba" strokeWidth="2" className="window-glow" />
            <path d="M609.5 259v34M587 276h45" stroke="#5eb8c7" strokeWidth="2" opacity="0.7" />
            <rect x="614" y="302" width="22" height="7" rx="3.5" fill="#53dcb0" opacity="0.8" />
            <path d="M552 221 L589 194 L623 214" fill="none" stroke="#55cdb3" strokeWidth="4" strokeLinecap="round" opacity="0.65" />
          </g>

          <g className="grid-tower" aria-hidden="true">
            <path d="M672 174 L687 106 L705 174 M679 141 H699 M675 158 H701 M687 106 L702 158 M705 174 L675 158 M672 174 L699 141 M696 132 L705 119" stroke="#476678" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M674 124 H704 M668 142 H711" stroke="#7895a1" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="686" cy="107" r="4" fill="#73b1c1" />
          </g>

          <defs>
            {routes.map(route => (
              <marker key={route.key} id={`${markerBase}-hero-arrow-${route.key}`} markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse" viewBox="0 0 9 8">
                <path d="M0 0 L9 4 L0 8 Z" fill={route.color}/>
              </marker>
            ))}
          </defs>
          <g className="energy-lines" role="presentation">
            {routes.map(route => (
              <g key={route.key}>
                <path d={HERO_ROUTE_PATHS[route.key]} fill="none" stroke={route.color} strokeWidth="4.5"
                  strokeLinecap="round" opacity="0.95" markerEnd={`url(#${markerBase}-hero-arrow-${route.key})`} />
                <circle r="5" fill={route.color} className="energy-particle">
                  <animateMotion dur="2.6s" repeatCount="indefinite" path={HERO_ROUTE_PATHS[route.key]}/>
                </circle>
              </g>
            ))}
          </g>
        </svg>

        <div className="energy-label energy-label-solar"><span />Solar PV</div>
        <div className="energy-label energy-label-battery"><span />Battery</div>
        <div className="energy-label energy-label-home"><span />Home</div>
        <div className="energy-label energy-label-grid"><span />Grid</div>
      </div>

      <div className="energy-flow-controls" role="group" aria-label="Choose an illustrative energy-flow scenario">
        {ENERGY_FLOW_SCENARIOS.map(item => (
          <button key={item.key} type="button" aria-pressed={scenarioKey === item.key}
            className={`energy-flow-scenario${scenarioKey === item.key ? " is-active" : ""}`}
            onClick={() => setScenarioKey(item.key)}>{item.label}</button>
        ))}
      </div>
      <div className="energy-flow-legend" role="status" aria-live="polite">
        <strong>{scenario.label}:</strong>
        <span>{routes.map(route => `${route.from} → ${route.to}`).join(" · ") || "No active flow"}</span>
      </div>
      <span className="energy-flow-provenance" title={scenario.description}>Static direction example only — not a live calculation or MATLAB simulation</span>
    </div>
  );
});
