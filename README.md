# BREWORA Comparison Starter

A separate demo project. It does not modify your original application.

## Requirements
- Node.js 18+
- Docker Desktop (for Prometheus/Grafana)

## Start
In PowerShell, from this folder:
1. `npm install`
2. Terminal 1: `npm run monolith` (port 5100)
3. Terminal 2: `npm run microservices` (gateway 5000; services 5001–5012)
4. Terminal 3: `docker compose -f monitoring/docker-compose.yml up -d`

Open Grafana at http://localhost:3000 (login `admin`, password `brewora-demo`).
Open Prometheus at http://localhost:9090 and targets at http://localhost:9090/targets.

## Test
```powershell
curl.exe http://localhost:5100/api/products/coffee-1
curl.exe http://localhost:5000/api/products/coffee-1
curl.exe "http://localhost:5100/api/catalog/search?q=coffee"
curl.exe "http://localhost:5000/api/catalog/search?q=coffee"
curl.exe -X POST http://localhost:5100/api/orders -H "Content-Type: application/json" -d "{\"productId\":\"coffee-1\",\"quantity\":1}"
curl.exe -X POST http://localhost:5000/api/orders -H "Content-Type: application/json" -d "{\"productId\":\"coffee-1\",\"quantity\":1}"
```

Run `npm run benchmark` after both apps are up. Results are written to `results/benchmark-results.json`.

## What is implemented
- Monolith: one process; modules call functions in-process.
- Microservices: API gateway plus 12 separate Node.js processes; HTTP calls between gateway and services.
- Prometheus scrapes `/metrics`; Grafana is provisioned with Prometheus as its data source.
- Metrics: request count, latency histogram, process CPU/memory/runtime metrics.
- Best-effort notification in the order workflow; notification failure should not fail order confirmation.

## Important limits
This is a one-day starter/demo, not production commerce software. Payment is simulated; data is in memory; there is no real authentication or durable database. Benchmark runner is a basic sequential smoke test, not a formal load test. Do not invent results. Repeat tests under identical conditions.
The monolith uses port 5100 so both architectures can run simultaneously; the monolith's normal standalone port can be changed to 5000.
