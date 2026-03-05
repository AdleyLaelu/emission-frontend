import useAppStore from "../useAppStore";
import { useState, useCallback } from "react";
import GridChartR3 from "./GridChartR3";
import VehicleChartR1R2 from "./VehicleChartR1R2";
import CityTractMap from "./CityTractMap";

import GA_R1 from "../assets/r1r2data/GA_R1.json";
import GA_R2 from "../assets/r1r2data/GA_R2.json";
import CA_R1 from "../assets/r1r2data/CA_R1.json";
import CA_R2 from "../assets/r1r2data/CA_R2.json";
import NY_R1 from "../assets/r1r2data/NY_R1.json";
import NY_R2 from "../assets/r1r2data/NY_R2.json";
import WA_R1 from "../assets/r1r2data/WA_R1.json";
import WA_R2 from "../assets/r1r2data/WA_R2.json";

const DATA_MAP = { GA_R1, GA_R2, CA_R1, CA_R2, NY_R1, NY_R2, WA_R1, WA_R2 };
const CITY_TO_STATE = {
  Atlanta: "GA", "Los Angeles": "CA", LosAngeles: "CA", NewYork: "NY", Seattle: "WA",
};

const FUEL_TYPES = ["CNG", "Diesel", "Electricity", "Ethanol", "Gasoline"];
const EMISSION_TYPES = [
  { label: "CO₂", value: "CO2" },
  { label: "NOₓ", value: "NOx" },
  { label: "PM2.5B", value: "PM2.5B" },
  { label: "PM2.5T", value: "PM2.5T" },
];

const Dropdown = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-[2px]">
    <label className="text-xs font-medium text-gray-600">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded px-2 py-1 w-full text-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

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
  const [selectedTractId, setSelectedTractId] = useState(null);
  const [hoveredTractId,  setHoveredTractId]  = useState(null);

  const ConsumptionAndEmissionState    = useAppStore((s) => s.ConsumptionAndEmission);
  const setConsumptionAndEmissionState = useAppStore((s) => s.setConsumptionAndEmission);
  const classificationState = useAppStore((s) => s.classificationState);

  const cityName     = classificationState.city || classificationState.cityInput;
  const fuelType     = ConsumptionAndEmissionState.FuelType || "";
  const emissionType = ConsumptionAndEmissionState.EmissionType || "";
  const chartMode    = dailyAnnualSelection === "DAILY" ? "R1" : "R2";
  const showVehicle  = resultsSelection === "VEHICLE";

  const handleTractSelect = useCallback((id) => setSelectedTractId(id), []);
  const handleTractHover  = useCallback((id) => setHoveredTractId(id),  []);

  return (
    /*
     * 3-column layout
     *   LEFT   flex-[3]  — charts
     *   MIDDLE flex-[2]  — city name + map (fills height)
     *   RIGHT  flex-[1]  — Vehicle/Grid, Daily/Annual, Download
     */
    <div className="flex flex-row gap-4 w-full h-full">

      {/* ── LEFT: Charts ────────────────────────────────────────────── */}
      <div className="flex-[3] min-w-0 min-h-0 flex flex-col gap-3">

        {showVehicle && (
          <>
            <div className="flex-1 min-h-0 flex flex-col gap-1">
              <Dropdown
                label="Fuel Type"
                value={fuelType}
                onChange={(v) => setConsumptionAndEmissionState({ FuelType: v })}
                options={[{ value: "", label: "Select Fuel Type" }, ...FUEL_TYPES.map(f => ({ value: f, label: f }))]}
              />
              {fuelType && (
                <div className="flex-1 min-h-0 w-full border border-gray-200 rounded-lg bg-white shadow-sm p-1">
                  <VehicleChartR1R2
                    metric={fuelType} cityName={cityName} mode={chartMode}
                    selectedTractId={selectedTractId} hoveredTractId={hoveredTractId}
                    onTractSelect={handleTractSelect}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-1">
              <Dropdown
                label="Emission Type"
                value={emissionType}
                onChange={(v) => setConsumptionAndEmissionState({ EmissionType: v })}
                options={[{ value: "", label: "Select Emission Type" }, ...EMISSION_TYPES.map(e => ({ value: e.value, label: e.label }))]}
              />
              {emissionType && (
                <div className="flex-1 min-h-0 w-full border border-gray-200 rounded-lg bg-white shadow-sm p-1">
                  <VehicleChartR1R2
                    metric={emissionType} cityName={cityName} mode={chartMode}
                    selectedTractId={selectedTractId} hoveredTractId={hoveredTractId}
                    onTractSelect={handleTractSelect}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {resultsSelection === "GRID" && (
          <div className="flex flex-col gap-3 h-full overflow-auto">
            {["CO2", "CH4", "N2O"].map((e, i) => (
              <div key={e} className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-1">
                  {["CO₂", "CH₄", "N₂O"][i]}
                </div>
                <GridChartR3 emissionType={e} cityName={cityName} />
              </div>
            ))}
          </div>
        )}

        {!resultsSelection && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Select a type from the right panel to view results.
          </div>
        )}
      </div>

      {/* ── MIDDLE: City name + Map ──────────────────────────────────── */}
      {showVehicle && cityName && (
        <div className="flex-[2] min-w-0 min-h-0 flex flex-col gap-1">
          {/* City name above map */}
          <div className="text-base font-bold text-gray-800 tracking-tight flex-shrink-0">
            {cityName}
          </div>
          {/* Map fills remaining height */}
          <div className="flex-1 min-h-0">
            <CityTractMap
              cityName={cityName} mode={chartMode}
              selectedTractId={selectedTractId} hoveredTractId={hoveredTractId}
              onTractSelect={handleTractSelect} onTractHover={handleTractHover}
            />
          </div>
        </div>
      )}

      {/* ── RIGHT: Controls ──────────────────────────────────────────── */}
      <div className="flex-[1] min-w-0 min-h-0 flex flex-col gap-2">

        {/* Vehicle / Grid */}
        <div className="flex-shrink-0">
          <Dropdown
            label="Vehicle / Grid"
            value={resultsSelection}
            onChange={setResultsSelection}
            options={[
              { value: "", label: "Select..." },
              { value: "VEHICLE", label: "Vehicle" },
              { value: "GRID", label: "Grid" },
            ]}
          />
        </div>

        {/* Daily / Annual */}
        {showVehicle && (
          <div className="flex-shrink-0">
            <Dropdown
              label="Daily / Annual"
              value={dailyAnnualSelection}
              onChange={setDailyAnnualSelection}
              options={[
                { value: "DAILY", label: "Daily" },
                { value: "ANNUAL", label: "Annual" },
              ]}
            />
          </div>
        )}

        {/* Download */}
        {cityName && showVehicle && (
          <div className="flex-shrink-0 mt-2">
            <button
              type="button"
              onClick={() => downloadCsv(cityName, chartMode)}
              className="w-full flex items-center justify-center gap-1.5 border border-gray-300 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download CSV
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default FinalResultsPage;
