import React, { useRef, useEffect } from "react";

import GASvgRaw from "../assets/Georgia.svg?raw";
import CASvgRaw from "../assets/California.svg?raw";
import NYSvgRaw from "../assets/NewYork.svg?raw";
import WASvgRaw from "../assets/Seattle.svg?raw";

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

const CITY_TO_SVG_RAW = {
  Atlanta: GASvgRaw,
  "Los Angeles": CASvgRaw,
  LosAngeles: CASvgRaw,
  NewYork: NYSvgRaw,
  Seattle: WASvgRaw,
};

export default function CityTractMap({
  cityName, mode,
  selectedTractId = null,
  hoveredTractId = null,
  onTractSelect = () => {},
  onTractHover = () => {},
}) {
  const mapRef = useRef(null);

  // Ref so click handler always sees the latest selectedTractId without re-attaching listeners
  const selectedTractIdRef = useRef(selectedTractId);
  useEffect(() => { selectedTractIdRef.current = selectedTractId; }, [selectedTractId]);

  const state    = CITY_TO_STATE[cityName] || CITY_TO_STATE[cityName?.replace(/\s/g, "")] || null;
  const fileKey  = state ? `${state}_${mode === "R2" ? "R2" : "R1"}` : null;
  const fileData = fileKey ? DATA_MAP[fileKey] : null;
  const firstMetric = fileData ? Object.keys(fileData)[0] : null;
  const tractIds = firstMetric ? Object.keys(fileData[firstMetric]?.tracts || {}) : [];

  const svgRaw = CITY_TO_SVG_RAW[cityName] || CITY_TO_SVG_RAW[cityName?.replace(/\s/g, "")];

  // ── Parse SVG, tag each PatchCollection with tract ID, inject into DOM ──
  useEffect(() => {
    if (!mapRef.current || !svgRaw || tractIds.length === 0) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgRaw, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return;

    // Make SVG responsive
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("style", "width:100%;height:100%;display:block;");

    // Tag each census tract group with its ID
    tractIds.forEach((tractId, idx) => {
      const group = svg.getElementById(`PatchCollection_${idx + 1}`);
      if (!group) return;
      group.setAttribute("data-tract-id", tractId);
      group.style.cursor = "pointer";
      group.style.transition = "opacity 0.12s";
    });

    mapRef.current.innerHTML = svg.outerHTML;
  }, [svgRaw]); // tractIds are stable for a given svgRaw (same city)

  // ── Update tract stroke on hover / selection — no opacity/fill changes ──
  useEffect(() => {
    if (!mapRef.current || tractIds.length === 0) return;

    tractIds.forEach((tractId) => {
      const group = mapRef.current.querySelector(`[data-tract-id="${tractId}"]`);
      if (!group) return;
      const isSelected = selectedTractId === tractId;
      const isHovered  = hoveredTractId  === tractId;

      group.querySelectorAll("use").forEach((u) => {
        // Keep fill unchanged — only vary stroke thickness
        u.style.strokeWidth = isSelected ? "3.5" : isHovered ? "2.5" : "0.5";
        u.style.stroke      = isSelected ? "#111" : isHovered ? "#333" : "#000";
      });
    });
  }, [tractIds, selectedTractId, hoveredTractId]);

  // ── Event delegation on the map container ──
  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    const handleMouseOver = (e) => {
      const group = e.target.closest("[data-tract-id]");
      onTractHover(group?.dataset?.tractId ?? null);
    };
    const handleMouseLeave = () => onTractHover(null);
    const handleClick = (e) => {
      const group = e.target.closest("[data-tract-id]");
      if (group) {
        const tractId = group.dataset.tractId;
        onTractSelect(selectedTractIdRef.current === tractId ? null : tractId);
      }
    };

    container.addEventListener("mouseover", handleMouseOver);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("click", handleClick);
    return () => {
      container.removeEventListener("mouseover", handleMouseOver);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("click", handleClick);
    };
  }, [onTractHover, onTractSelect]);

  if (!svgRaw) {
    return (
      <div className="border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center" style={{ height: "100%" }}>
        <span className="text-gray-400 text-sm">Select a city</span>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="border border-gray-200 rounded-lg bg-white overflow-hidden"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
