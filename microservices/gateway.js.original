
const express = require("express");
const { instrument } = require("../shared/metrics");

const app = express();

app.use(express.json());
instrument(app, "microservices", "gateway");

// Service ports
const ports = {
  user: 5001,
  product: 5002,
  catalog: 5003,
  inventory: 5004,
  cart: 5005,
  order: 5006,
  payment: 5007,
  refund: 5008,
  kitchen: 5009,
  notification: 5010,
  pos: 5011,
  settings: 5012,
  catalog2: 5013
};

// Build a service URL
const endpoint = (service, path) =>
  `http://127.0.0.1:${ports[service]}${path}`;

// Call a service over HTTP
async function call(service, path, options) {
  const response = await fetch(endpoint(service, path), options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.error || `${service} returned ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

// POST request helper
const post = body => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
});

// Health check for all services
app.get("/health", async (_req, res) => {
  const services = {};

  await Promise.all(
    Object.entries(ports).map(async ([name, port]) => {
      try {
        const response = await fetch(
          `http://127.0.0.1:${port}/health`,
          { signal: AbortSignal.timeout(700) }
        );

        services[name] = response.ok ? "up" : "down";
      } catch {
        services[name] = "down";
      }
    })
  );

  const status = Object.values(services).every(
    value => value === "up"
  ) ? "ok" : "degraded";

  res.json({ status, services });
});

// Product API
app.get("/api/products/:id", async (req, res) => {
  try {
    const result = await call(
      "product",
      `/internal/product/${encodeURIComponent(req.params.id)}`
    );

    res.json(result);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

// Simple round-robin Catalog routing
let catalogTurn = 0;

app.get("/api/catalog/search", async (req, res) => {
  const service =
    catalogTurn++ % 2 === 0 ? "catalog" : "catalog2";

  try {
    const result = await call(
      service,
      `/internal/catalog/search?q=${encodeURIComponent(
        req.query.q || ""
      )}`
    );

    res.set("X-Catalog-Instance", service);
    res.json(result);
  } catch (error) {
    res.status(502).json({
      error: error.message,
      catalogInstance: service
    });
  }
});

// Inventory API
app.get("/api/inventory/:id", async (_req, res) => {
  try {
    const result = await call(
      "inventory",
      "/internal/inventory"
    );

    res.json(result);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.post("/api/inventory/adjust", async (req, res) => {
  try {
    const result = await call(
      "inventory",
      "/internal/inventory/adjust",
      post(req.body || {})
    );

    res.json(result);
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

// Order workflow
app.post("/api/orders", async (req, res) => {
  const body = req.body || {};
  const quantity = Math.max(1, Number(body.quantity) || 1);
  const productId = body.productId || "coffee-1";

  // 1. Reserve inventory
  try {
    await call(
      "inventory",
      "/internal/inventory/reserve",
      post({ productId, quantity })
    );
  } catch (error) {
    return res.status(error.status || 502).json({
      error: error.message,
      stage: "inventory"
    });
  }

  // 2. Process payment
  let payment;

  try {
    payment = await call(
      "payment",
      "/internal/payment/charge",
      post({ productId, quantity })
    );
  } catch (error) {
    // Compensation: restore reserved inventory
    await call(
      "inventory",
      "/internal/inventory/adjust",
      post({ amount: quantity })
    ).catch(() => {});

    return res.status(502).json({
      error: error.message,
      stage: "payment",
      compensation: "inventory-restore-requested"
    });
  }

  // 3. Kitchen acceptance
  const kitchen = await call(
    "kitchen",
    "/internal/kitchen/accept",
    post({ productId, quantity })
  ).catch(() => ({ status: "unavailable" }));

  // 4. Notification is best-effort
  const notification = await call(
    "notification",
    "/internal/notification/send",
    post({ productId, quantity })
  ).catch(() => ({ status: "unavailable" }));

  // 5. Return order result
  res.status(201).json({
    orderId: `ord-${Date.now()}`,
    productId,
    quantity,
    payment,
    kitchen,
    notification,
    orderStatus: "confirmed"
  });
});

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(`Gateway: http://localhost:${port}`);
});
