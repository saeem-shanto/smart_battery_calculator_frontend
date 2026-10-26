"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENERGY_ROUTES = exports.FLOW_TOLERANCE_KWH = void 0;
exports.flowFromHourlyDispatch = flowFromHourlyDispatch;
exports.activeFlowRoutes = activeFlowRoutes;
exports.FLOW_TOLERANCE_KWH = 1e-6;
/** Arrows run source -> destination, never target -> source. */
exports.ENERGY_ROUTES = [
    { key: 'solarToHome', from: 'Solar', to: 'Home', path: 'M 220 136 L 382 205', label: 'Solar to home', color: '#c78110' },
    { key: 'solarToBattery', from: 'Solar', to: 'Battery', path: 'M 140 154 L 140 302', label: 'Solar charging battery', color: '#008f71' },
    { key: 'batteryToHome', from: 'Battery', to: 'Home', path: 'M 216 328 L 385 260', label: 'Battery to home', color: '#008f71' },
    { key: 'gridToHome', from: 'Grid', to: 'Home', path: 'M 682 232 L 521 232', label: 'Grid import to home', color: '#315bd0' },
    { key: 'solarToGrid', from: 'Solar', to: 'Grid', path: 'M 220 95 C 426 4 652 15 730 167', label: 'Solar export to grid', color: '#bf5215' },
];
function finiteNonnegative(value, name) {
    if (!Number.isFinite(value) || value < -exports.FLOW_TOLERANCE_KWH) {
        throw new RangeError(`${name} must be a finite non-negative hourly kWh value`);
    }
    return Math.max(0, value);
}
function closeEnough(left, right) {
    return Math.abs(left - right) <= exports.FLOW_TOLERANCE_KWH;
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
function flowFromHourlyDispatch(input) {
    const pvKwh = finiteNonnegative(input.pvKwh, 'pvKwh');
    const loadKwh = finiteNonnegative(input.loadKwh, 'loadKwh');
    const batteryChargeKwh = finiteNonnegative(input.batteryChargeKwh, 'batteryChargeKwh');
    const batteryDischargeKwh = finiteNonnegative(input.batteryDischargeKwh, 'batteryDischargeKwh');
    const gridImportKwh = finiteNonnegative(input.gridImportKwh, 'gridImportKwh');
    const gridExportKwh = finiteNonnegative(input.gridExportKwh, 'gridExportKwh');
    if (batteryChargeKwh > exports.FLOW_TOLERANCE_KWH && batteryDischargeKwh > exports.FLOW_TOLERANCE_KWH) {
        throw new Error('Impossible dispatch: battery charges and discharges in the same interval');
    }
    if (gridImportKwh > exports.FLOW_TOLERANCE_KWH && gridExportKwh > exports.FLOW_TOLERANCE_KWH) {
        throw new Error('Impossible dispatch: grid import and export simultaneously');
    }
    const solarToHome = Math.min(pvKwh, loadKwh);
    const curtailedSolar = pvKwh - solarToHome - batteryChargeKwh - gridExportKwh;
    const homeResidual = loadKwh - solarToHome - batteryDischargeKwh - gridImportKwh;
    if (curtailedSolar < -exports.FLOW_TOLERANCE_KWH) {
        throw new Error('Invalid dispatch: PV allocation exceeds generated energy');
    }
    if (!closeEnough(homeResidual, 0)) {
        throw new Error(`Invalid dispatch: household energy balance off by ${homeResidual.toFixed(6)} kWh`);
    }
    if (pvKwh > loadKwh + exports.FLOW_TOLERANCE_KWH && (batteryDischargeKwh > exports.FLOW_TOLERANCE_KWH || gridImportKwh > exports.FLOW_TOLERANCE_KWH)) {
        throw new Error('Invalid dispatch: surplus solar cannot require battery discharge/grid import');
    }
    if (loadKwh > pvKwh + exports.FLOW_TOLERANCE_KWH && (batteryChargeKwh > exports.FLOW_TOLERANCE_KWH || gridExportKwh > exports.FLOW_TOLERANCE_KWH)) {
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
/** Useful for showing only active arrows; zero-valued flows never animate. */
function activeFlowRoutes(flow) {
    return exports.ENERGY_ROUTES.filter((route) => flow[route.key] > exports.FLOW_TOLERANCE_KWH);
}
