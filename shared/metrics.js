const client = require("prom-client");
const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry, prefix: "brewora_" });
const requests = new client.Counter({
  name: "brewora_http_requests_total", help: "HTTP requests",
  labelNames: ["architecture","component","method","route","status"], registers: [registry]
});
const duration = new client.Histogram({
  name: "brewora_http_request_duration_seconds", help: "HTTP request duration in seconds",
  labelNames: ["architecture","component","method","route","status"],
  buckets: [0.005,0.01,0.025,0.05,0.1,0.25,0.5,1,2,5], registers: [registry]
});
function instrument(app, architecture, component) {
  app.use((req,res,next) => {
    if (req.path === "/metrics") return next();
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const labels = {architecture,component,method:req.method,route:String(req.route?.path || req.path).slice(0,100),status:String(res.statusCode)};
      requests.inc(labels);
      duration.observe(labels, Number(process.hrtime.bigint()-start)/1e9);
    });
    next();
  });
  app.get("/metrics", async (_req,res) => { res.set("Content-Type",registry.contentType); res.end(await registry.metrics()); });
}
module.exports = { instrument };
