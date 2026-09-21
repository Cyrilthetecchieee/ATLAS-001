# ATLAS-001

Embedded Monitoring & Telemetry System

A standalone, dependency-free telemetry console. No backend, credentials, or hardware required.

## Run locally
Serve the dist folder with any static server, for example `python -m http.server 8000 --directory dist`, then open http://localhost:8000. ES modules require HTTP; do not double-click index.html.

## Architecture
- dist/app.js: views, navigation, charts, controls, reports, and subscription binding.
- dist/service.js: centralized SimulationService, telemetry metadata, sensor models, events, logs, and history.
- dist/style.css: responsive console theme.

Replace the exported service with an adapter exposing current, history, subscribe, reading, health, and associated event/query methods for real integration. Readings have value, unit, timestamp, quality, and source. Hardware commands and authentication are intentionally absent.

Reports contain synthetic samples only. Both MPU6050 units share one reference trace; pressure comes from BMP280, humidity from DHT22, and temperature is a shared demonstration value. No calibrated thresholds, RSSI/SNR, battery percentage, or certification claims are provided. Communication loss becomes stale after 6 seconds and offline after 12 seconds; these are UI demonstration freshness settings. All simulation state resets on reload. Only the display theme persists locally.
