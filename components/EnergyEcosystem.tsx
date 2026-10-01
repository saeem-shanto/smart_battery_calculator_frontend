"use client";

import { memo, useEffect, useRef, type PointerEvent } from "react";

const warmPath = "M118 98 C170 120 190 165 226 206";
const chargePath = "M314 286 C348 306 380 307 416 286";
const homePath = "M474 286 C512 278 542 258 575 238";

export const EnergyEcosystem = memo(function EnergyEcosystem() {
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
      className="energy-ecosystem"
      onPointerMove={move}
      onPointerLeave={reset}
      role="img"
      aria-label="Animated energy flow from sunlight to solar panels, battery storage and a modern home"
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
            <rect x="423" y="278" width="34" height="30" rx="8" fill="url(#cyanGlow)" opacity="0.82" className="battery-charge" />
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

          <g className="energy-lines">
            <path d={warmPath} fill="none" stroke="#ffbd45" strokeWidth="3" strokeLinecap="round" opacity="0.30" />
            <path d={warmPath} fill="none" stroke="#ffd978" strokeWidth="2" strokeLinecap="round" strokeDasharray="5 11" className="energy-dash warm-dash" />

            <path d={chargePath} fill="none" stroke="#39d8ef" strokeWidth="9" strokeLinecap="round" opacity="0.10" />
            <path d={chargePath} fill="none" stroke="url(#cyanGlow)" strokeWidth="3" strokeLinecap="round" />

            <path d={homePath} fill="none" stroke="#39d8ef" strokeWidth="9" strokeLinecap="round" opacity="0.10" />
            <path d={homePath} fill="none" stroke="url(#cyanGlow)" strokeWidth="3" strokeLinecap="round" />
          </g>

          <g className="energy-particles" filter="url(#smallGlow)">
            <circle r="4.6" fill="#ffd56c" className="energy-particle">
              <animateMotion dur="3.8s" repeatCount="indefinite" path={warmPath} />
            </circle>
            <circle r="3.8" fill="#fff0a5" className="energy-particle">
              <animateMotion dur="3.8s" begin="-1.9s" repeatCount="indefinite" path={warmPath} />
            </circle>
            <circle r="4.5" fill="#79ecff" className="energy-particle">
              <animateMotion dur="2.1s" repeatCount="indefinite" path={chargePath} />
            </circle>
            <circle r="3.5" fill="#c6f8ff" className="energy-particle">
              <animateMotion dur="2.1s" begin="-1.05s" repeatCount="indefinite" path={chargePath} />
            </circle>
            <circle r="4.4" fill="#79ecff" className="energy-particle">
              <animateMotion dur="2.4s" repeatCount="indefinite" path={homePath} />
            </circle>
            <circle r="3.4" fill="#c6f8ff" className="energy-particle">
              <animateMotion dur="2.4s" begin="-1.2s" repeatCount="indefinite" path={homePath} />
            </circle>
          </g>
        </svg>

        <div className="energy-label energy-label-solar"><span />Solar capture</div>
        <div className="energy-label energy-label-battery"><span />Storage</div>
        <div className="energy-label energy-label-home"><span />Home demand</div>
      </div>

      <div className="energy-flow-legend" aria-hidden="true">
        <span><i className="legend-dot warm" />Sunlight</span>
        <span><i className="legend-dot cyan" />Electricity</span>
      </div>
    </div>
  );
});
