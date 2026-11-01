
const { spawn } = require("child_process");
const path = require("path");

const children = [];

const paymentFail = process.env.PAYMENT_FAIL || "false";

const services = [
    ["user", 5001],
    ["product", 5002],
    ["catalog", 5003],
    ["inventory", 5004],
    ["cart", 5005],
    ["order", 5006],
    ["payment", 5007],
    ["refund", 5008],
    ["kitchen", 5009],
    ["notification", 5010],
    ["pos", 5011],
    ["settings", 5012],
    ["catalog2", 5013]
];

function start(name, port, script) {
    const child = spawn(process.execPath, [script], {
        stdio: "inherit",
        env: {
            ...process.env,
            SERVICE_NAME: name,
            PORT: String(port),

            PAYMENT_FAIL:
                name === "payment"
                    ? paymentFail
                    : "false"
        }
    });

    children.push(child);

    child.on("error", (error) => {
        console.error(
            `Error starting ${name}: ${error.message}`
        );
    });

    child.on("exit", (code, signal) => {
        if (code !== 0) {
            console.error(
                `${name} stopped. Exit code: ${code}, Signal: ${signal}`
            );
        }
    });
}

// Start all 13 microservices
for (const [name, port] of services) {
    start(
        name,
        port,
        path.join(__dirname, "service.js")
    );
}

// Start API Gateway
start(
    "gateway",
    5000,
    path.join(__dirname, "gateway.js")
);

function stop() {
    console.log("\nStopping all Microservices...");

    for (const child of children) {
        if (!child.killed) {
            child.kill();
        }
    }

    process.exit(0);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);

console.log("======================================");
console.log("BREWORA MICROSERVICES ARCHITECTURE");
console.log("======================================");
console.log("Gateway and 13 services launched.");
console.log(
    `Payment failure simulation: ${paymentFail}`
);
console.log("Gateway: http://localhost:5000");
console.log("Press Ctrl+C to stop all services.");
