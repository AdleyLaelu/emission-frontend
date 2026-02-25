# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NEEMAT** (Transportation Energy and Emission Modeling and Analysis Tool) — a React web app for analyzing vehicle emissions, energy consumption, and grid emissions using uploaded CSV data. It communicates with a local Python/Flask backend at `http://localhost:5003`.

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Build production bundle
npm run lint      # Run ESLint
npm run preview   # Preview production build
```

There are no test commands configured.

## Architecture

### User Flow

Three-step wizard: **Input Data → Analysis → Results**

```
ArrowStepper.jsx
  └── InputStepper.jsx        (Step 1: upload CSV data)
        ├── VehicleClassification.jsx   (editable Handsontable)
        ├── VehiclePenetration.jsx      (CSV upload)
        ├── VehicleTrafficVolume.jsx    (traffic data + speed calc)
        └── ProjectedDemand.jsx         (future demand upload)
  └── AnalysisStepper.jsx     (Step 2: configure analysis)
        ├── EnergyConsumptionAndEmissionRates.jsx
        └── GridEmissionRates.jsx
  └── FinalResultsPage.jsx    (Step 3: charts and images)
```

### State Management

All global state lives in `src/useAppStore.js` (Zustand). Key state slices:
- **Classification:** base year, vehicle type, city, file data
- **Penetration:** projected year, file data
- **Traffic Volume:** volume file, MFT parameters, computed speed table
- **Consumption & Emission:** fuel type, emission type, vehicle age
- **Grid Emission:** emission type
- **Projected Demand:** traffic volume projections
- **Notifications:** bell notification system with read/unread
- **Theme:** dark/light mode toggle
- **Payload Builders:** methods on the store that construct API request bodies

### API Integration

Backend base URL: `http://localhost:5003`

Key endpoints (called from `src/api/prediction.ts`):
- `POST /admin/clear_db` — called on app init
- `POST /upload/vehicle_classification`
- `POST /upload/penetration_rate`
- `POST /upload/traffic_volume`
- `POST /upload/projected_demand`
- `POST /predict/vehicle-consumption`
- `POST /predict/grid-emission`

Transaction IDs are persisted to `localStorage` across uploads.

### Key Libraries

| Purpose | Library |
|---|---|
| Data tables | Handsontable 15.3.0 |
| Charts | Chart.js 4.5.0 + react-chartjs-2 (with zoom/annotation plugins) |
| UI components | Material-UI 7.3.1 |
| File parsing | XLSX 0.18.5 |
| Forms | React Hook Form 7.60.0 |
| Notifications | React Toastify 11.0.5 |

### Utilities (`src/lib/`)

- `mfd.js` — Greenshields traffic model for speed computation
- `compute-speed-table.js` — derives speed table from traffic volume data
- `derive-vehicle-weight.js` / `fetch-vehicle-weight.js` — vehicle weight extraction

### Results Display

Results are shown as **pre-generated images** (not live charts), mapped by selections (fuel type, emission type, city, vehicle age) via lookup tables in `src/utils/resultsOneAssets.js`, `resultsTwoAssets.js`, and `resultsThirdAssets.js`. Images live under `src/assets/`.

### City-to-Model Mapping

`src/cityModel.ts` maps city selections (CA, GA, NY, WA) to emission model identifiers used in API payloads.

## Tech Stack

- **Framework:** React 19 + Vite 6
- **Styling:** Tailwind CSS 4 + Emotion (MUI)
- **State:** Zustand 5
- **Routing:** React Router DOM 7
- **Language:** JavaScript (JSX), with a few `.ts` files
