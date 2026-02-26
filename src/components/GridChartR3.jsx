import React, { useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";

// --- Static JSON imports (Vite requires static paths) ---
import GA_CO2 from "../assets/r3data/GA_CO2.json";
import GA_CH4 from "../assets/r3data/GA_CH4.json";
import GA_N2O from "../assets/r3data/GA_N2O.json";
import CA_CO2 from "../assets/r3data/CA_CO2.json";
import CA_CH4 from "../assets/r3data/CA_CH4.json";
import CA_N2O from "../assets/r3data/CA_N2O.json";
import NY_CO2 from "../assets/r3data/NY_CO2.json";
import NY_CH4 from "../assets/r3data/NY_CH4.json";
import NY_N2O from "../assets/r3data/NY_N2O.json";
import WA_CO2 from "../assets/r3data/WA_CO2.json";
import WA_CH4 from "../assets/r3data/WA_CH4.json";
import WA_N2O from "../assets/r3data/WA_N2O.json";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

const DATA_MAP = {
  GA_CO2, GA_CH4, GA_N2O,
  CA_CO2, CA_CH4, CA_N2O,
  NY_CO2, NY_CH4, NY_N2O,
  WA_CO2, WA_CH4, WA_N2O,
};

const CITY_TO_STATE = {
  Atlanta: "GA",
  "Los Angeles": "CA",
  LosAngeles: "CA",
  NewYork: "NY",
  Seattle: "WA",
};

const SCENARIO_COLORS = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728",
  "#9467bd", "#8c564b", "#e377c2", "#17becf",
];

const EMISSION_LABELS = {
  CO2: "CO₂ (lb/MWh)",
  CH4: "CH₄ (lb/MWh)",
  N2O: "N₂O (lb/MWh)",
};

const ZoomToolbar = ({ chartRef }) => (
  <div className="absolute top-3 right-3 z-10 flex bg-white rounded border border-gray-300 shadow-sm overflow-hidden select-none">
    <button type="button" onClick={() => chartRef.current?.zoom(1.2)}
      className="px-3 py-1 text-blue-600 hover:bg-gray-50 border-r border-gray-200 text-lg font-bold leading-none" title="Zoom In">+</button>
    <button type="button" onClick={() => chartRef.current?.zoom(0.8)}
      className="px-3 py-1 text-blue-600 hover:bg-gray-50 border-r border-gray-200 text-lg font-bold leading-none" title="Zoom Out">-</button>
    <button type="button" onClick={() => chartRef.current?.resetZoom()}
      className="px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-gray-50 uppercase tracking-wide" title="Reset Zoom">RESET</button>
  </div>
);

export default function GridChartR3({ emissionType, cityName }) {
  const chartRef = useRef(null);

  const state = CITY_TO_STATE[cityName] || CITY_TO_STATE[cityName?.replace(/\s/g, "")] || null;
  const key = state && emissionType ? `${state}_${emissionType}` : null;
  const jsonData = key ? DATA_MAP[key] : null;

  if (!jsonData) {
    return (
      <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm border border-gray-200 rounded-lg bg-gray-50">
        {!cityName || !emissionType ? "Select a city and emission type to view the chart." : `No data available for ${emissionType} — ${cityName}.`}
      </div>
    );
  }

  const scenarios = jsonData.scenarios || {};
  const scenarioNames = Object.keys(scenarios);
  const labels = (scenarios[scenarioNames[0]] || []).map((p) => p.date);

  const datasets = scenarioNames.map((name, idx) => ({
    label: name,
    data: (scenarios[name] || []).map((p) => p.value),
    borderColor: SCENARIO_COLORS[idx % SCENARIO_COLORS.length],
    backgroundColor: "rgba(0,0,0,0)",
    borderWidth: 1.5,
    pointRadius: 0,
    tension: 0.3,
  }));

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "#fff",
        titleColor: "#222",
        bodyColor: "#333",
        borderColor: "#ddd",
        borderWidth: 1,
        callbacks: {
          label: (item) => `${item.dataset.label}: ${item.parsed.y?.toFixed(4)}`,
        },
      },
      zoom: {
        pan: { enabled: true, mode: "x" },
        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" },
      },
    },
    scales: {
      x: {
        ticks: { maxTicksLimit: 12, maxRotation: 45, font: { size: 11 } },
        title: { display: true, text: "Date" },
      },
      y: {
        title: { display: true, text: EMISSION_LABELS[emissionType] || emissionType },
      },
    },
  };

  return (
    <div className="relative w-full h-[220px]">
      <Line ref={chartRef} data={{ labels, datasets }} options={options} />
      <ZoomToolbar chartRef={chartRef} />
    </div>
  );
}
