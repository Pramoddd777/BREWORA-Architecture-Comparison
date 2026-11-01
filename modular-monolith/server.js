
const express = require("express");
const { instrument } = require("../shared/metrics");

const app = express();

app.use(express.json());

// Register Prometheus metrics
instrument(app, "modular_monolith", "monolith");

// Product module
const product = {
    get: (id) => ({
        id,
        name: "Brewora House Coffee",
        price: 250
    })
};

// Catalog module
const catalog = {
    search: (query) => {
        const items = [
            {
                id: "coffee-1",
                name: "Brewora House Coffee",
                price: 250
            }
        ];

        return items.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase())
        );
    }
};

// Inventory module
const inventory = {
    stock: 100,

    reserve(quantity) {
        if (process.env.INVENTORY_FAIL === "true") {
            throw new Error("Simulated inventory failure");
        }

        if (this.stock < quantity) {
            return false;
        }

        this.stock -= quantity;
        return true;
    },

    adjust(amount) {
        this.stock += amount;
        return this.stock;
    }
};

// Payment module
const payment = {
    charge: () => {
        if (process.env.PAYMENT_FAIL === "true") {
            throw new Error("Simulated payment failure");
        }

        return {
            status: "paid",
            transactionId: "pay-" + Date.now()
        };
    }
};

// Kitchen module
const kitchen = {
    accept: () => ({
        status: "accepted"
    })
};

// Notification module
const notification = {
    send: () => ({
        status: "queued"
    })
};

// Order module
const order = {
    create(body) {
        const quantity = Math.max(
            1,
            Number(body.quantity) || 1
        );

        const productId = body.productId || "coffee-1";

        // 1. Reserve inventory
        let reserved;

        try {
            reserved = inventory.reserve(quantity);
        } catch (error) {
            return {
                status: 503,
                body: {
                    error: error.message,
                    stage: "inventory"
                }
            };
        }

        if (!reserved) {
            return {
                status: 409,
                body: {
                    error: "Insufficient inventory",
                    stage: "inventory"
                }
            };
        }

        // 2. Process payment
        let paymentResult;

        try {
            paymentResult = payment.charge();
        } catch (error) {
            return {
                status: 502,
                body: {
                    error: error.message,
                    stage: "payment",
                    compensation: "not-implemented"
                }
            };
        }

        // 3. Kitchen acceptance
        const kitchenResult = kitchen.accept();

        // 4. Notification
        const notificationResult = notification.send();

        // 5. Return order result
        return {
            status: 201,
            body: {
                orderId: "ord-" + Date.now(),
                productId,
                quantity,
                payment: paymentResult,
                kitchen: kitchenResult,
                notification: notificationResult,
                orderStatus: "confirmed"
            }
        };
    }
};

// Health check
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        architecture: "modular-monolith"
    });
});

// Product API
app.get("/api/products/:id", (req, res) => {
    res.json(product.get(req.params.id));
});

// Catalog API
app.get("/api/catalog/search", (req, res) => {
    res.json({
        items: catalog.search(String(req.query.q || ""))
    });
});

// Inventory API
app.get("/api/inventory/:id", (_req, res) => {
    res.json({
        stock: inventory.stock
    });
});

// Order API
app.post("/api/orders", (req, res) => {
    const result = order.create(req.body || {});
    res.status(result.status).json(result.body);
});

const port = Number(process.env.PORT || 5100);

app.listen(port, () => {
    console.log(`Modular Monolith: http://localhost:${port}`);
});
