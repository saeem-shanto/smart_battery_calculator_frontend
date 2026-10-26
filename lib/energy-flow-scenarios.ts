/**
 * Visual verification fixtures for the dashboard energy-flow illustration.
 * Each fixture is a ONE-HOUR synthetic example calculated using the supplied
 * client Version 2 dispatch equations for t >= 2, NOT a model-result API response.
 * Never describe these examples as user results or audited Octave parity.
 */
import {
  activeFlowRoutes,
  illustrativeClientV2Hour,
  type EnergyFlow,
  type EnergyRoute,
} from '../src/lib/energy-flow';

export type ScenarioKey =
  | 'solar-surplus'
  | 'solar-only'
  | 'battery-discharge'
  | 'grid-import'
  | 'grid-export';

interface EnergyFlowScenario {
  key: ScenarioKey;
  label: string;
  description: string;
  pvKwh: number;
  loadKwh: number;
  batteryCapacityKwh: number;
  startingSocFraction: number;
}

export const ENERGY_FLOW_SCENARIOS: readonly EnergyFlowScenario[] = [
  {
    key: 'solar-surplus', label: 'Solar surplus',
    description: 'Solar serves the home, charges the battery and sends the remainder to the grid.',
    pvKwh: 8, loadKwh: 2, batteryCapacityKwh: 10, startingSocFraction: 0.60,
  },
  {
    key: 'solar-only', label: 'Solar to home',
    description: 'Solar generation directly meets the household demand.',
    pvKwh: 2, loadKwh: 2, batteryCapacityKwh: 10, startingSocFraction: 0.60,
  },
  {
    key: 'battery-discharge', label: 'Battery + grid',
    description: 'Stored energy powers the home; the grid supplies any shortfall.',
    pvKwh: 0, loadKwh: 4, batteryCapacityKwh: 10, startingSocFraction: 0.50,
  },
  {
    key: 'grid-import', label: 'Grid import',
    description: 'With no solar and an empty usable battery, grid electricity flows into the home.',
    pvKwh: 0, loadKwh: 3, batteryCapacityKwh: 10, startingSocFraction: 0.10,
  },
  {
    key: 'grid-export', label: 'Grid export',
    description: 'A fully charged battery leaves excess solar to export, subject to the 5 kW cap.',
    pvKwh: 8, loadKwh: 1, batteryCapacityKwh: 10, startingSocFraction: 0.95,
  },
] as const;

/**
 * SVG paths on the EXISTING homepage illustration (viewBox 0 0 720 440).
 * Every path begins at the supplying node and ends at the receiving node.
 * Paths are separate for battery charging and discharging and for grid
 * import and export: no CSS direction flip / sign-guessing is needed.
 */
export const HERO_ROUTE_PATHS: Readonly<Record<EnergyRoute, string>> = {
  solarToHome: 'M 341 209 C 423 151 493 203 529 250',
  solarToBattery: 'M 342 233 C 370 257 375 280 402 286',
  batteryToHome: 'M 477 287 C 510 285 524 274 538 271',
  gridToHome: 'M 684 145 C 688 184 660 222 646 247',
  solarToGrid: 'M 330 190 C 425 79 606 66 679 139',
};

export function getScenario(key: ScenarioKey): { scenario: EnergyFlowScenario; flow: EnergyFlow } {
  const scenario = ENERGY_FLOW_SCENARIOS.find(item => item.key === key);
  if (!scenario) throw new Error(`Unknown illustrative energy-flow scenario: ${key}`);
  const { flow } = illustrativeClientV2Hour(scenario);
  // The visual must never activate a physically impossible path.
  activeFlowRoutes(flow);
  return { scenario, flow };
}
