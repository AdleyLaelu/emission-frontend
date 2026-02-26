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
import GA_R1 from "../assets/r1r2data/GA_R1.json";
import GA_R2 from "../assets/r1r2data/GA_R2.json";
import CA_R1 from "../assets/r1r2data/CA_R1.json";
import CA_R2 from "../assets/r1r2data/CA_R2.json";
import NY_R1 from "../assets/r1r2data/NY_R1.json";
import NY_R2 from "../assets/r1r2data/NY_R2.json";
import WA_R1 from "../assets/r1r2data/WA_R1.json";
import WA_R2 from "../assets/r1r2data/WA_R2.json";

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
  GA_R1, GA_R2,
  CA_R1, CA_R2,
  NY_R1, NY_R2,
  WA_R1, WA_R2,
};

const CITY_TO_STATE = {
  Atlanta: "GA",
  "Los Angeles": "CA",
  LosAngeles: "CA",
  NewYork: "NY",
  Seattle: "WA",
};

// 30 distinct colors (tab20-style) for census tracts
const TRACT_COLORS = [
  "#1f77b4","#aec7e8","#ff7f0e","#ffbb78","#2ca02c",
  "#98df8a","#d62728","#ff9896","#9467bd","#c5b0d5",
  "#8c564b","#c49c94","#e377c2","#f7b6d2","#7f7f7f",
  "#c7c7c7","#bcbd22","#dbdb8d","#17becf","#9edae5",
  "#393b79","#637939","#8c6d31","#843c39","#7b4173",
  "#5254a3","#8ca252","#bd9e39","#ad494a","#a55194",
];

const ZoomToolbar = ({ chartRef }) => (
  <div className="absolute top-2 right-2 z-10 flex bg-white rounded border border-gray-300 shadow-sm overflow-hidden select-none">
    <button type="button" onClick={() => chartRef.current?.zoom(1.2)}
      className="px-3 py-1 text-blue-600 hover:bg-gray-50 border-r border-gray-200 text-lg font-bold leading-none" title="Zoom In">+</button>
    <button type="button" onClick={() => chartRef.current?.zoom(0.8)}
      className="px-3 py-1 text-blue-600 hover:bg-gray-50 border-r border-gray-200 text-lg font-bold leading-none" title="Zoom Out">-</button>
    <button type="button" onClick={() => chartRef.current?.resetZoom()}
      className="px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-gray-50 uppercase tracking-wide" title="Reset Zoom">RESET</button>
  </div>
);

/**
 * VehicleChartR1R2
 * Props:
 *   metric   - "CO2" | "NOx" | "PM2.5B" | "PM2.5T" | "Gasoline" | "Diesel" | "Electricity" | "Ethanol" | "CNG"
 *   cityName - "Atlanta" | "Los Angeles" | "LosAngeles" | "NewYork" | "Seattle"
 *   mode     - "R1" (daily) | "R2" (annual)
 */
export default function VehicleChartR1R2({ metric, cityName, mode }) {
  const chartRef = useRef(null);

  const state = CITY_TO_STATE[cityName] || CITY_TO_STATE[cityName?.replace(/\s/g, "")] || null;
  const fileKey = state && mode ? `${state}_${mode}` : null;
  const fileData = fileKey ? DATA_MAP[fileKey] : null;
  const metricData = fileData && metric ? fileData[metric] : null;

  if (!metricData) {
    return (
      <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm border border-gray-200 rounded-lg bg-gray-50">
        {!cityName || !metric ? "Select a city and metric to view the chart." : `No data available for ${metric} — ${cityName}.`}
      </div>
    );
  }

  const { labels, unit, tracts } = metricData;
  const tractIds = Object.keys(tracts);

  const datasets = tractIds.map((tractId, idx) => ({
    label: `Tract ${tractId}`,
    data: tracts[tractId],
    borderColor: TRACT_COLORS[idx % TRACT_COLORS.length],
    backgroundColor: "rgba(0,0,0,0)",
    borderWidth: 1.5,
    pointRadius: 0,
    pointHoverRadius: 5,
    tension: 0.3,
  }));

  const xLabel = mode === "R1" ? "Hour of Day" : "Year";

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: "nearest",
        intersect: false,
        backgroundColor: "#fff",
        titleColor: "#222",
        bodyColor: "#222",
        borderColor: "#ccc",
        borderWidth: 1,
        displayColors: true,
        callbacks: {
          title: (items) => items[0]?.label || "",
          label: (item) => ` ${item.dataset.label}: ${item.parsed.y?.toFixed(4)} ${unit}`,
          labelColor: (item) => ({
            borderColor: item.dataset.borderColor,
            backgroundColor: item.dataset.borderColor,
          }),
          labelTextColor: () => "#222",
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
        title: { display: true, text: xLabel },
      },
      y: {
        title: { display: true, text: unit },
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
