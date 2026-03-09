import useAppStore from "../useAppStore";
import { useState } from "react";
import GridChartR3, { SCENARIO_COLORS } from "./GridChartR3";
import VehicleChartR1R2, { TRACT_COLORS } from "./VehicleChartR1R2";

const FUEL_TYPES = ["CNG", "Diesel", "Electricity", "Ethanol", "Gasoline"];

import GA_R1 from "../assets/r1r2data/GA_R1.json";
import GA_R2 from "../assets/r1r2data/GA_R2.json";
import CA_R1 from "../assets/r1r2data/CA_R1.json";
import CA_R2 from "../assets/r1r2data/CA_R2.json";
import NY_R1 from "../assets/r1r2data/NY_R1.json";
import NY_R2 from "../assets/r1r2data/NY_R2.json";
import WA_R1 from "../assets/r1r2data/WA_R1.json";
import WA_R2 from "../assets/r1r2data/WA_R2.json";
import GA_CO2 from "../assets/r3data/GA_CO2.json";

const DATA_MAP = { GA_R1, GA_R2, CA_R1, CA_R2, NY_R1, NY_R2, WA_R1, WA_R2 };
const CITY_TO_STATE = {
  Atlanta: "GA", "Los Angeles": "CA", LosAngeles: "CA", NewYork: "NY", Seattle: "WA",
};

const EMISSION_TYPES = [
  { label: "CO₂", value: "CO2" },
  { label: "NOₓ", value: "NOx" },
  { label: "PM2.5B", value: "PM2.5B" },
  { label: "PM2.5T", value: "PM2.5T" },
];

// Scenario names from R3 data (same for all states/gases)
const SCENARIO_NAMES = Object.keys(GA_CO2.scenarios || {});

function downloadCsv(cityName, chartMode) {
  const state = CITY_TO_STATE[cityName] || CITY_TO_STATE[cityName?.replace(/\s/g, "")] || null;
  if (!state) return;
  const fileData = DATA_MAP[`${state}_${chartMode}`];
  if (!fileData) return;
  const metrics  = Object.keys(fileData);
  const tractIds = Object.keys(fileData[metrics[0]]?.tracts || {});
  const labels   = fileData[metrics[0]]?.labels || [];
  const header   = ["Label", ...metrics.flatMap(m => tractIds.map(t => `${m}_${t}`))];
  const rows     = labels.map((lbl, i) => [
    lbl, ...metrics.flatMap(m => tractIds.map(t => fileData[m]?.tracts?.[t]?.[i] ?? "")),
  ]);
  const csv  = [header, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `${cityName}_${chartMode}_emissions.csv`; a.click();
  URL.revokeObjectURL(url);
}

const FinalResultsPage = ({ resultsSelection, setResultsSelection }) => {
  const [dailyAnnualSelection, setDailyAnnualSelection] = useState("DAILY");

  const ConsumptionAndEmissionState = useAppStore((s) => s.ConsumptionAndEmission);
  const setConsumptionAndEmission = useAppStore((s) => s.setConsumptionAndEmission);
  const classificationState = useAppStore((s) => s.classificationState);

  const cityName     = classificationState.city || classificationState.cityInput;
  const fuelType     = ConsumptionAndEmissionState.FuelType || "";
  const emissionType = ConsumptionAndEmissionState.EmissionType || "";
  const chartMode    = dailyAnnualSelection === "DAILY" ? "R1" : "R2";
  const showVehicle  = resultsSelection === "VEHICLE";
  const showGrid     = resultsSelection === "GRID";

  // Tract IDs for vehicle legend
  const state    = CITY_TO_STATE[cityName] || CITY_TO_STATE[cityName?.replace(/\s/g, "")] || null;
  const fileData = state ? DATA_MAP[`${state}_${chartMode}`] : null;
  const firstMetric = fileData ? Object.keys(fileData)[0] : null;
  const tractIds = firstMetric ? Object.keys(fileData[firstMetric]?.tracts || {}) : [];

  return (
    <div className="flex flex-col gap-3 w-full h-full">

      {/* ── COMPACT CONTROL ROW ─────────────────────────────────────── */}
      <div className="flex flex-row items-end gap-3 flex-wrap">

        <div className="flex flex-col gap-[2px]">
          <label className="text-xs font-medium text-gray-600">Vehicle / Grid</label>
          <select
            value={resultsSelection}
            onChange={(e) => setResultsSelection(e.target.value)}
            className="border rounded px-2 py-1 w-40 text-sm"
          >
            <option value="">Select Vehicle/Grid</option>
            <option value="VEHICLE">Vehicle</option>
            <option value="GRID">Grid</option>
          </select>
        </div>

        {showVehicle && (
          <div className="flex flex-col gap-[2px]">
            <label className="text-xs font-medium text-gray-600">Daily / Annual</label>
            <select
              value={dailyAnnualSelection}
              onChange={(e) => setDailyAnnualSelection(e.target.value)}
              className="border rounded px-2 py-1 w-36 text-sm"
            >
              <option value="DAILY">Daily</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </div>
        )}

        {showVehicle && (
          <div className="flex flex-col gap-[2px]">
            <label className="text-xs font-medium text-gray-600">Fuel Type</label>
            <select
              value={fuelType}
              onChange={(e) => setConsumptionAndEmission({ FuelType: e.target.value })}
              className="border rounded px-2 py-1 w-36 text-sm"
            >
              <option value="">Select Fuel Type</option>
              {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        )}

        {showVehicle && (
          <div className="flex flex-col gap-[2px]">
            <label className="text-xs font-medium text-gray-600">Emission Type</label>
            <select
              value={emissionType}
              onChange={(e) => setConsumptionAndEmission({ EmissionType: e.target.value })}
              className="border rounded px-2 py-1 w-36 text-sm"
            >
              <option value="">Select Emission Type</option>
              {EMISSION_TYPES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
        )}

        {cityName && showVehicle && (
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={() => downloadCsv(cityName, chartMode)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-1.5 text-sm font-semibold transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              DOWNLOAD
            </button>
          </div>
        )}

        {showGrid && cityName && (
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={() => downloadCsv(cityName, chartMode)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-1.5 text-sm font-semibold transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              DOWNLOAD
            </button>
          </div>
        )}
      </div>

      {/* ── CHARTS + LEGEND ─────────────────────────────────────────── */}
      <div className="flex flex-row gap-4 flex-1 min-h-0">

        {/* Charts — left, takes remaining width */}
        <div className="flex-1 min-w-0 max-w-3xl flex flex-col gap-3 overflow-auto">

          {showVehicle && (
            <>
              {fuelType && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500">{fuelType} Consumption</span>
                  <div className="w-full border border-gray-200 rounded-lg bg-white shadow-sm p-1" style={{ height: 220 }}>
                    <VehicleChartR1R2 metric={fuelType} cityName={cityName} mode={chartMode} />
                  </div>
                </div>
              )}
              {emissionType && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500">
                    {EMISSION_TYPES.find(e => e.value === emissionType)?.label || emissionType} Emission
                  </span>
                  <div className="w-full border border-gray-200 rounded-lg bg-white shadow-sm p-1" style={{ height: 220 }}>
                    <VehicleChartR1R2 metric={emissionType} cityName={cityName} mode={chartMode} />
                  </div>
                </div>
              )}
              {!fuelType && !emissionType && (
                <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                  Fuel Type and Emission Type were selected in the Analysis step.
                </div>
              )}
            </>
          )}

          {showGrid && (
            <div className="flex flex-col gap-3">
              {["CO2", "CH4", "N2O"].map((e, i) => (
                <div key={e} className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-500">{["CO₂", "CH₄", "N₂O"][i]}</span>
                  <div className="p-1 rounded-lg bg-white border border-gray-200">
                    <GridChartR3 emissionType={e} cityName={cityName} showLegend={false} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!resultsSelection && (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Select Vehicle or Grid above to view results.
            </div>
          )}
        </div>

        {/* ── RIGHT LEGEND PANEL ──────────────────────────────────────── */}

        {/* Vehicle legend: census tracts */}
        {showVehicle && tractIds.length > 0 && (
          <div className="flex-shrink-0 w-52 border border-gray-200 rounded-lg bg-white p-3 overflow-y-auto self-start">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Census Tracts</div>
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
              <svg width="28" height="10" style={{ flexShrink: 0 }}>
                <line x1="0" y1="5" x2="28" y2="5" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span className="text-[10px] font-semibold text-gray-800">City Average</span>
            </div>
            {tractIds.map((id, idx) => (
              <div key={id} className="flex items-center gap-2 py-0.5">
                <svg width="28" height="10" style={{ flexShrink: 0 }}>
                  <line x1="0" y1="5" x2="28" y2="5" stroke={TRACT_COLORS[idx % TRACT_COLORS.length]} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="text-[10px] text-gray-600 truncate">Tract {id}</span>
              </div>
            ))}
          </div>
        )}

        {/* Grid legend: scenarios — shared across all 3 charts */}
        {showGrid && SCENARIO_NAMES.length > 0 && (
          <div className="flex-shrink-0 w-56 border border-gray-200 rounded-lg bg-white p-3 self-start">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Scenarios</div>
            {SCENARIO_NAMES.map((name, idx) => (
              <div key={name} className="flex items-center gap-2 py-1">
                <svg width="28" height="10" style={{ flexShrink: 0 }}>
                  <line x1="0" y1="5" x2="28" y2="5" stroke={SCENARIO_COLORS[idx % SCENARIO_COLORS.length]} strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="text-[10px] text-gray-700 leading-tight">{name}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default FinalResultsPage;
