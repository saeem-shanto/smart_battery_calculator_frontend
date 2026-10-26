/**
 * N01 Smart Battery Calculator — hourly energy-flow presentation model.
 *
 * All flow quantities are NON-NEGATIVE kWh within the same ONE-HOUR interval.
 * Positive gridImport means Grid -> Home; positive gridExport means Solar -> Grid.
 *
 * Do not feed annual import/export totals to this module. To faithfully portray
 * a real run, obtain the corresponding hourly dispatch from the backend/client
 * model and call flowFromHourlyDispatch.
 */

export const FLOW_TOLERANCE_KWH = 1e-6;

export interface HourlyDispatch {
  pvKwh: number;
  loadKwh: number;
  batteryChargeKwh: number;      // Pbin(t) in client V2
  batteryDischargeKwh: number;   // Pbout(t) in client V2
  gridImportKwh: number;         // imp(t) in client V2
  gridExportKwh: number;         // exp(t) in client V2
}

export interface EnergyFlow {
  solarToHome: number;
  solarToBattery: number;
  batteryToHome: number;
  gridToHome: number;
  solarToGrid: number;
  curtailedSolar: number;
  pvKwh: number;
  loadKwh: number;
}

export type EnergyRoute = 'solarToHome' | 'solarToBattery' | 'batteryToHome' | 'gridToHome' | 'solarToGrid';

export interface FlowRouteSpec {
  readonly key: EnergyRoute;
  readonly from: 'Solar' | 'Battery' | 'Grid';
  readonly to: 'Home' | 'Battery' | 'Grid';
  readonly path: string; // Start coordinates are the SOURCE, end coordinates the DESTINATION.
  readonly label: string;
  readonly color: string;
}

/** Arrows run source -> destination, never target -> source. */
export const ENERGY_ROUTES: readonly FlowRouteSpec[] = [
  { key: 'solarToHome', from: 'Solar', to: 'Home', path: 'M 220 136 L 382 205', label: 'Solar to home', color: '#c78110' },
  { key: 'solarToBattery', from: 'Solar', to: 'Battery', path: 'M 140 154 L 140 302', label: 'Solar charging battery', color: '#008f71' },
  { key: 'batteryToHome', from: 'Battery', to: 'Home', path: 'M 216 328 L 385 260', label: 'Battery to home', color: '#008f71' },
  { key: 'gridToHome', from: 'Grid', to: 'Home', path: 'M 682 232 L 521 232', label: 'Grid import to home', color: '#315bd0' },
  { key: 'solarToGrid', from: 'Solar', to: 'Grid', path: 'M 220 95 C 426 4 652 15 730 167', label: 'Solar export to grid', color: '#bf5215' },
] as const;

function finiteNonnegative(value: number, name: string): number {
  if (!Number.isFinite(value) || value < -FLOW_TOLERANCE_KWH) {
    throw new RangeError(`${name} must be a finite non-negative hourly kWh value`);
  }
  return Math.max(0, value);
}

function closeEnough(left: number, right: number): boolean {
  return Math.abs(left - right) <= FLOW_TOLERANCE_KWH;
}

/**
 * Converts client/authoritative hourly dispatch into animation branches.
 * Validates conservation of energy and prevents physically impossible arrows.
 * Mirrors the client Version 2 supply priority: PV -> home first; PV surplus
 * then charges battery/exports; deficit then uses battery/grid.
 *
 * The original V2 script initialises the FIRST hour differently; avoid using
 * its initial-hour imp(1) when PV > load (it can become negative). Do not
 * silently treat first-hour script values as physically valid imports.
 */
export function flowFromHourlyDispatch(input: HourlyDispatch): EnergyFlow {
  const pvKwh = finiteNonnegative(input.pvKwh, 'pvKwh');
  const loadKwh = finiteNonnegative(input.loadKwh, 'loadKwh');
  const batteryChargeKwh = finiteNonnegative(input.batteryChargeKwh, 'batteryChargeKwh');
  const batteryDischargeKwh = finiteNonnegative(input.batteryDischargeKwh, 'batteryDischargeKwh');
  const gridImportKwh = finiteNonnegative(input.gridImportKwh, 'gridImportKwh');
  const gridExportKwh = finiteNonnegative(input.gridExportKwh, 'gridExportKwh');

  if (batteryChargeKwh > FLOW_TOLERANCE_KWH && batteryDischargeKwh > FLOW_TOLERANCE_KWH) {
    throw new Error('Impossible dispatch: battery charges and discharges in the same interval');
  }
  if (gridImportKwh > FLOW_TOLERANCE_KWH && gridExportKwh > FLOW_TOLERANCE_KWH) {
    throw new Error('Impossible dispatch: grid import and export simultaneously');
  }

  const solarToHome = Math.min(pvKwh, loadKwh);
  const curtailedSolar = pvKwh - solarToHome - batteryChargeKwh - gridExportKwh;
  const homeResidual = loadKwh - solarToHome - batteryDischargeKwh - gridImportKwh;

  if (curtailedSolar < -FLOW_TOLERANCE_KWH) {
    throw new Error('Invalid dispatch: PV allocation exceeds generated energy');
  }
  if (!closeEnough(homeResidual, 0)) {
    throw new Error(`Invalid dispatch: household energy balance off by ${homeResidual.toFixed(6)} kWh`);
  }
  if (pvKwh > loadKwh + FLOW_TOLERANCE_KWH && (batteryDischargeKwh > FLOW_TOLERANCE_KWH || gridImportKwh > FLOW_TOLERANCE_KWH)) {
    throw new Error('Invalid dispatch: surplus solar cannot require battery discharge/grid import');
  }
  if (loadKwh > pvKwh + FLOW_TOLERANCE_KWH && (batteryChargeKwh > FLOW_TOLERANCE_KWH || gridExportKwh > FLOW_TOLERANCE_KWH)) {
    throw new Error('Invalid dispatch: solar deficit cannot charge battery/export to grid in client V2');
  }

  return {
    solarToHome,
    solarToBattery: batteryChargeKwh,
    batteryToHome: batteryDischargeKwh,
    gridToHome: gridImportKwh,
    solarToGrid: gridExportKwh,
    curtailedSolar: Math.max(0, curtailedSolar),
    pvKwh,
    loadKwh,
  };
}

/**
 * An illustrative one-hour dispatch, transcribed from the CONTROL/FLOW
 * equations of the supplied client Algorithm Version 2 (for t >= 2), NOT an
 * independent optimisation and NOT a replacement for Octave model outputs.
 *
 * This is useful for deterministic visual regression fixtures. For genuine
 * results, use the backend's hourly Pbin/Pbout/imp/exp quantities instead.
 */
export function illustrativeClientV2Hour(input: {
  pvKwh: number;
  loadKwh: number;
  batteryCapacityKwh: number;
  startingSocFraction: number;
}): { dispatch: HourlyDispatch; endingSocFraction: number; flow: EnergyFlow } {
  const pvKwh = finiteNonnegative(input.pvKwh, 'pvKwh');
  const loadKwh = finiteNonnegative(input.loadKwh, 'loadKwh');
  const capacity = input.batteryCapacityKwh;
  const soc = input.startingSocFraction;
  if (!Number.isFinite(capacity) || capacity <= 0) {
    throw new RangeError('batteryCapacityKwh must be positive');
  }
  if (!Number.isFinite(soc) || soc < 0.1 - FLOW_TOLERANCE_KWH || soc > 0.95 + FLOW_TOLERANCE_KWH) {
    throw new RangeError('startingSocFraction must lie within the client V2 10%–95% bounds');
  }
  // Exact client V2 values; do not treat as universal battery specifications.
  const SOC_MIN = 0.10;
  const SOC_MAX = 0.95;
  const CHARGE_EFF = 0.96;
  const DISCHARGE_EFF = 0.96;
  const BATTERY_EFF = 0.95;
  const POWER_RATIO = 0.37;
  const EXPORT_LIMIT_KWH_IN_1_HOUR = 5;
  const inverterLimit = POWER_RATIO * capacity;
  const surplus = pvKwh - loadKwh;
  let charge = 0;
  let discharge = 0;
  let imported = 0;
  let exported = 0;
  let newSoc = soc;

  if (surplus >= 0) {
    const permittedCharge = Math.max(0, (SOC_MAX - soc) * capacity / CHARGE_EFF);
    charge = Math.min(inverterLimit, surplus, permittedCharge);
    newSoc = soc + charge * CHARGE_EFF / capacity;
    exported = Math.min(EXPORT_LIMIT_KWH_IN_1_HOUR, Math.max(0, surplus - charge));
  } else {
    const shortfall = -surplus;
    const permittedDischarge = Math.max(0, (soc - SOC_MIN) * capacity * DISCHARGE_EFF * BATTERY_EFF);
    discharge = Math.min(inverterLimit, shortfall, permittedDischarge);
    newSoc = soc - discharge / (capacity * DISCHARGE_EFF * BATTERY_EFF);
    imported = shortfall - discharge;
  }
  // Floating-point noise near the SoC bounds is okay; gross violations are not.
  if (newSoc < SOC_MIN - FLOW_TOLERANCE_KWH || newSoc > SOC_MAX + FLOW_TOLERANCE_KWH) {
    throw new Error('Computed SoC violates the client-model bounds');
  }
  const dispatch = {
    pvKwh, loadKwh,
    batteryChargeKwh: charge,
    batteryDischargeKwh: discharge,
    gridImportKwh: imported,
    gridExportKwh: exported,
  };
  return { dispatch, endingSocFraction: newSoc, flow: flowFromHourlyDispatch(dispatch) };
}

/** Useful for showing only active arrows; zero-valued flows never animate. */
export function activeFlowRoutes(flow: EnergyFlow): FlowRouteSpec[] {
  return ENERGY_ROUTES.filter((route) => flow[route.key] > FLOW_TOLERANCE_KWH);
}
