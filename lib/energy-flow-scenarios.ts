/**
 * STATIC, hand-authored arrow-direction demonstration cases.
 *
 * These unitless route-activation fixtures never execute, approximate, or
 * reproduce the client MATLAB battery simulation. They are NOT user results.
 * Actual dispatch and financial results must be provided by Django/Octave.
 */
import { activeFlowRoutes, type EnergyFlow, type EnergyRoute } from '../src/lib/energy-flow';

export type ScenarioKey = 'solar-surplus' | 'solar-only' | 'battery-discharge' | 'grid-import' | 'grid-export';

interface EnergyFlowScenario {
  key: ScenarioKey;
  label: string;
  description: string;
  readonly flow: EnergyFlow;
}

// Values are 0/1 flags for which arrows should animate; not simulated energy.
export const ENERGY_FLOW_SCENARIOS: readonly EnergyFlowScenario[] = [
  { key: 'solar-surplus', label: 'Solar surplus', description: 'Illustrates solar supplying the home, battery and grid.',
    flow: { solarToHome: 1, solarToBattery: 1, batteryToHome: 0, gridToHome: 0, solarToGrid: 1 } },
  { key: 'solar-only', label: 'Solar to home', description: 'Illustrates solar supplying the home.',
    flow: { solarToHome: 1, solarToBattery: 0, batteryToHome: 0, gridToHome: 0, solarToGrid: 0 } },
  { key: 'battery-discharge', label: 'Battery + grid', description: 'Illustrates the home being supplied by the battery and grid.',
    flow: { solarToHome: 0, solarToBattery: 0, batteryToHome: 1, gridToHome: 1, solarToGrid: 0 } },
  { key: 'grid-import', label: 'Grid import', description: 'Illustrates electricity flowing from the grid to the home.',
    flow: { solarToHome: 0, solarToBattery: 0, batteryToHome: 0, gridToHome: 1, solarToGrid: 0 } },
  { key: 'grid-export', label: 'Grid export', description: 'Illustrates solar energy flowing toward the grid.',
    flow: { solarToHome: 1, solarToBattery: 0, batteryToHome: 0, gridToHome: 0, solarToGrid: 1 } },
] as const;

/** SVG routes for the homepage diagram; all oriented source → destination. */
export const HERO_ROUTE_PATHS: Readonly<Record<EnergyRoute, string>> = {
  solarToHome: 'M 341 209 C 423 151 493 203 529 250',
  solarToBattery: 'M 342 233 C 370 257 375 280 402 286',
  batteryToHome: 'M 477 287 C 510 285 524 274 538 271',
  gridToHome: 'M 684 145 C 688 184 660 222 646 247',
  solarToGrid: 'M 330 190 C 425 79 606 66 679 139',
};

export function getScenario(key: ScenarioKey): { scenario: EnergyFlowScenario; flow: EnergyFlow } {
  const scenario = ENERGY_FLOW_SCENARIOS.find(item => item.key === key);
  if (!scenario) throw new Error(`Unknown static energy-flow scenario: ${key}`);
  activeFlowRoutes(scenario.flow); // validate display fixture, never run battery model
  return { scenario, flow: scenario.flow };
}
