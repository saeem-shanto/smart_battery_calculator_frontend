import type { CsvSummary } from "@/lib/types";

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { current += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { values.push(current.trim()); current = ""; }
    else current += char;
  }
  values.push(current.trim());
  return values;
}

function numberValue(value: string) {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!/^[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function analyzeCsvText(fileName: string, text: string): { summary: CsvSummary; meta: { source: string; energyColumn: string; assumption: string } } {
  if (!fileName || typeof text !== "string") throw new Error("fileName and CSV text are required.");
  if (!fileName.toLowerCase().endsWith(".csv")) throw new Error("Only .csv files are accepted.");
  if (!text.trim()) throw new Error("The CSV is empty.");
  if (text.length > 5_000_000) throw new Error("For this prototype, upload a CSV smaller than 5 MB.");

  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new Error("The CSV must include a header and at least one data row.");

  const headers = splitCsvLine(lines[0]);
  if (headers.length < 1 || headers.every((header) => !header.trim())) throw new Error("The CSV header row is empty.");
  if (new Set(headers.map((header) => header.trim().toLowerCase())).size !== headers.length) throw new Error("The CSV contains duplicate column names. Rename duplicate headers and try again.");

  const rows = lines.slice(1).map(splitCsvLine);
  const badlyShaped = rows.filter((row) => row.length !== headers.length).length;
  if (badlyShaped > Math.max(2, Math.floor(rows.length * 0.1))) throw new Error("Too many CSV rows have a different number of columns than the header.");

  const candidates = headers.map((header, index) => ({
    index,
    score: /(^|\b)(kwh|energy|usage|consumption|import)(\b|$)/i.test(header) ? 2 : /value/i.test(header) ? 1 : 0,
  })).sort((a, b) => b.score - a.score);

  let energyIndex = candidates[0]?.score ? candidates[0].index : -1;
  if (energyIndex < 0) {
    for (let column = 0; column < headers.length; column += 1) {
      const sample = rows.slice(0, 100);
      const numericCount = sample.filter((row) => row[column] !== undefined && numberValue(row[column]) !== null).length;
      if (numericCount >= Math.max(1, Math.floor(sample.length * 0.8))) { energyIndex = column; break; }
    }
  }
  if (energyIndex < 0) throw new Error("No numeric electricity-usage column could be detected. Include a column such as kWh, Usage, Energy or Consumption.");

  const parsed = rows.map((row) => numberValue(row[energyIndex] ?? ""));
  const numericValues = parsed.filter((value): value is number => value !== null);
  if (!numericValues.length) throw new Error("The detected electricity-usage column does not contain numeric values.");

  const invalidCount = parsed.length - numericValues.length;
  if (invalidCount > Math.max(3, Math.floor(rows.length * 0.2))) throw new Error("More than 20% of values in the detected electricity-usage column are missing or non-numeric.");
  if (numericValues.some((value) => value < 0)) throw new Error("Negative electricity usage values were detected. This demo expects non-negative consumption data.");

  const values = numericValues.filter((value) => value >= 0);
  const totalKWh = values.reduce((sum, value) => sum + value, 0);
  if (totalKWh <= 0) throw new Error("The electricity-usage column totals 0 kWh. Check that you uploaded the correct data and units.");

  const intervalCount = values.length;
  const estimatedDays = intervalCount >= 48 ? Math.max(1, intervalCount / 48) : intervalCount;
  const averageDailyKWh = totalKWh / estimatedDays;
  if (!Number.isFinite(averageDailyKWh) || averageDailyKWh <= 0) throw new Error("Could not derive a valid daily electricity usage estimate from this CSV.");

  return {
    summary: {
      fileName,
      rowCount: rows.length,
      intervalCount,
      totalKWh: Number(totalKWh.toFixed(2)),
      averageDailyKWh: Number(averageDailyKWh.toFixed(2)),
      detectedColumns: headers,
    },
    meta: {
      source: "dummy-csv-analyzer-v4",
      energyColumn: headers[energyIndex],
      assumption: intervalCount >= 48 ? "30-minute intervals" : "daily values",
    },
  };
}
