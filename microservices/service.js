
const express = require("express");
const { instrument } = require("../shared/metrics");

const name = process.env.SERVICE_NAME || "product";
const port = Number(process.env.PORT || 5002);

const app = express();

app.use(express.json());
instrument(app, "microservices", name);

// In-memory inventory
let stock = 100;

// Health check
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        service: name,
        port
    });
});

// Product service
app.get("/internal/product/:id", (req, res) => {
    res.json({
        id: req.params.id,
        name: "Brewora House Coffee",
        price: 250,
        service: name
    });
});

// Catalog service
app.get("/internal/catalog/search", (req, res) => {
    const product = {
        id: "coffee-1",
        name: "Brewora House Coffee",
        price: 250
    };

    const query = String(req.query.q || "").toLowerCase();

    res.json({
        items: product.name.toLowerCase().includes(query)
            ? [product]
            : []
    });
});

// Inventory lookup
app.get("/internal/inventory", (_req, res) => {
    res.json({ stock });
});

// Reserve inventory
app.post("/internal/inventory/reserve", (req, res) => {
    const quantity = Math.max(
        1,
        Number(req.body.quantity) || 1
    );

    if (stock < quantity) {
        return res.status(409).json({
            error: "Insufficient inventory"
        });
    }

    stock -= quantity;

    res.json({
        reserved: true,
        stock
    });
});

// Restore or adjust inventory
app.post("/internal/inventory/adjust", (req, res) => {
    stock += Number(req.body.amount) || 0;

    res.json({ stock });
});

// Payment service with controlled failure simulation
app.post("/internal/payment/charge", (_req, res) => {
    if (process.env.PAYMENT_FAIL === "true") {
        return res.status(503).json({
            error: "Simulated payment failure"
        });
    }

    return res.json({
        status: "paid",
        transactionId: "pay-" + Date.now()
    });
});

// Kitchen service
app.post("/internal/kitchen/accept", (_req, res) => {
    res.json({
        status: "accepted"
    });
});

// Notification service
app.post("/internal/notification/send", (_req, res) => {
    res.json({
        status: "queued"
    });
});

// Start service
app.listen(port, () => {
    console.log(`${name} service: http://localhost:${port}`);
});
