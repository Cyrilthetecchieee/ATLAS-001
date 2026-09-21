# ATLAS-001

Embedded Monitoring & Telemetry System

A transport-independent telemetry platform supporting Wi-Fi (current), simulation, and future LoRa gateway communication.

## Project Structure

```
ATLAS-001/
├── dist/                  # Frontend — static telemetry console
│   ├── index.html
│   ├── app.js
│   ├── service.js
│   └── style.css
├── backend/               # Backend — Node.js/Express REST API
│   ├── src/
│   │   ├── config/        # Centralized constants & enums
│   │   ├── middleware/     # Error handler, body validator
│   │   ├── models/        # In-memory Store, Device Registry
│   │   ├── routes/        # health, telemetry, devices, events, logs
│   │   ├── services/      # Telemetry, Event, Log services
│   │   ├── utils/         # Network utility (local IP detection)
│   │   ├── validators/    # Telemetry, Event, Log validators
│   │   ├── app.js         # Express application setup
│   │   └── server.js      # Server entry point (0.0.0.0:5000)
│   └── package.json
└── README.md
```

## Run the Frontend

Serve the `dist` folder with any static server:

```bash
npx -y http-server ./dist -p 8080
```

Open http://localhost:8080. ES modules require HTTP; do not double-click index.html.

## Run the Backend

```bash
cd backend
npm install
npm run dev
```

The backend starts on `0.0.0.0:5000` — accessible from other devices on the same network.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Backend status |
| POST | `/api/telemetry` | Ingest telemetry (any transport) |
| GET | `/api/telemetry/latest` | Most recent telemetry packet |
| GET | `/api/telemetry/history` | Filtered telemetry history |
| GET | `/api/devices` | List all devices |
| GET | `/api/devices/:deviceId` | Single device info |
| POST | `/api/events` | Create a system event |
| GET | `/api/events` | Query events |
| POST | `/api/logs` | Create a log entry |
| GET | `/api/logs` | Query logs |

## Transport Architecture

The `transport` field decouples telemetry processing from the communication method:

| Transport | Mode | Usage |
|-----------|------|-------|
| `WIFI` | `REAL` | ESP32 sending telemetry via Wi-Fi (current hardware) |
| `SIMULATION` | `SIMULATION` | Frontend simulation engine |
| `LORA_GATEWAY` | `REAL` | Future E22-900T22S LoRa gateway |

## Architecture

Replace the exported service with an adapter exposing current, history, subscribe, reading, health, and associated event/query methods for real integration. Readings have value, unit, timestamp, quality, and source. Hardware commands and authentication are intentionally absent.

Reports contain synthetic samples only. Both MPU6050 units share one reference trace; pressure comes from BMP280, humidity from DHT22, and temperature is a shared demonstration value. No calibrated thresholds, RSSI/SNR, battery percentage, or certification claims are provided. Communication loss becomes stale after 6 seconds and offline after 12 seconds; these are UI demonstration freshness settings. All simulation state resets on reload. Only the display theme persists locally.
