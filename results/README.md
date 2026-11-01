# BREWORA – Architecture Benchmark Results

## 1. Project Overview

BREWORA is an architecture comparison project that evaluates two software architecture approaches:

- Modular Monolith
- Real Microservices

The project compares their performance, communication overhead, fault handling and scalability characteristics.

## 2. Benchmark Environment

| Parameter | Configuration |
|---|---|
| Runtime | Node.js |
| Load Testing Tool | Grafana k6 |
| Microservices Gateway | Port 5000 |
| Modular Monolith | Port 5100 |
| Test Virtual Users | 20 |
| Test Duration | 30 seconds |
| Workload | Catalog search API |
| Output Format | JSON and CSV |

## 3. Experiment 1 – Architecture Performance Comparison

A 30-second k6 test was conducted against the catalog search endpoint of each architecture.

### Measured Results

| Metric | Modular Monolith | Microservices |
|---|---:|---:|
| Completed Requests | 105,564 | 46,690 |
| Average Latency | 5.54 ms | 12.69 ms |
| P50 Latency | 5.20 ms | 11.51 ms |
| P90 Latency | 6.78 ms | 15.68 ms |
| P95 Latency | 7.75 ms | 19.74 ms |
| Maximum Latency | 30.44 ms | 66.15 ms |
| Throughput | 3,518.66 req/s | 1,556.00 req/s |
| Error Rate | 0% | 0% |

### Observations

- The Modular Monolith recorded lower average response latency.
- The Modular Monolith achieved higher throughput in this test.
- Both architectures completed their requests without recorded HTTP failures.
- The Microservices architecture showed higher latency for this particular workload.

These observations apply to the tested catalog-search workload and do not establish that one architecture is universally better.

## 4. Experiment 2 – Catalog Service Scaling

The catalog service was tested using one instance and two instances.

The two-instance configuration used gateway round-robin routing.

### Observations

- Both configurations passed 10,000 HTTP 200 response checks.
- Two instances showed a small improvement in average latency and throughput.
- P95 and maximum latency were higher in the two-instance test.
- Gateway routing was verified with 10 requests, distributed evenly between the two instances.

The results are inconclusive and require repeated trials.

## 5. Experiment 3 – Payment Failure and Compensation

Payment failure was injected to observe order-processing behaviour.

### Modular Monolith

- Order request returned HTTP 502.
- Inventory decreased from 100 to 99.
- Inventory compensation was not implemented in the tested flow.

### Microservices

- Order request returned HTTP 502.
- Inventory was restored to 100.
- The gateway reported `inventory-restore-requested`.

This demonstrates the difference in the current implementations' compensation behaviour.

## 6. Experiment 4 – Inventory Failure

Inventory failure was tested in both architectures.

- Modular Monolith: HTTP 503, with the failure reported at the inventory stage.
- Microservices: The inventory service was stopped; gateway health became degraded and the order request returned HTTP 502.

The failure conditions were not identical, so this is a behavioural comparison rather than a strict equivalent fault-injection benchmark.

## 7. Experiment 5 – Notification Service Failure

The recorded experiment showed:

- The notification service became unavailable.
- The gateway remained operational.
- Payment succeeded.
- Kitchen processing was accepted.
- The order returned HTTP 201.
- The other services recovered after the notification service was restarted.

This indicates that the tested order flow could complete without notification availability.

## 8. Experiment 6 – Resource Consumption Comparison

### Objective

To compare CPU utilization and memory consumption of the Modular Monolith and Microservices architectures under concurrent load.

### Experimental Setup

| Parameter | Configuration |
|---|---|
| Monitoring Tool | Custom PowerShell script |
| Load Testing Tool | Grafana k6 |
| Virtual Users | 20 |
| k6 Test Duration | 30 seconds |
| Resource Monitoring Duration | 40 seconds |
| Logical Processors | 8 |
| Microservices Processes | 14 |
| Modular Monolith Processes | 1 |

Resource monitoring was performed while k6 load testing was running.

### Measured Resource Consumption

| Metric | Modular Monolith | Microservices |
|---|---:|---:|
| Application Processes | 1 | 14 |
| Average CPU Utilization | 9.21% | 4.27% |
| Maximum CPU Utilization | 12.46% | 12.48% |
| Average Memory | 31.49 MB | 660.07 MB |
| Maximum Memory | 42.39 MB | 661.71 MB |
| Monitoring Samples | 39 | 32 |

### Observations

1. Microservices consumed approximately 20.96 times more average memory than the Modular Monolith in these measurements.
2. The Modular Monolith recorded higher average CPU utilization.
3. Both architectures successfully completed their respective load tests without HTTP failures.
4. The Microservices architecture required 14 application processes, whereas the Modular Monolith required only one application process.
5. The results demonstrate the memory overhead associated with running multiple independent service processes in this implementation.

### Resource Monitoring Files

- `resource-monitoring/microservices-resources-corrected.csv`
- `resource-monitoring/monolith-resources-corrected.csv`

## 9. Generated Graphs

The following visualizations are generated using Python, Pandas and Matplotlib.

| File | Visualization |
|---|---|
| `line_average_latency.png` | Average latency line graph |
| `line_latency_percentiles.png` | Latency percentile line graph |
| `donut_throughput_share.png` | Throughput share donut chart |
| `donut_error_rates.png` | Request success and failure donut charts |

## 10. Limitations

- The validated architecture benchmark currently has one 30-second run per architecture.
- The benchmark runs were conducted separately.
- Resource measurements represent the monitored Node.js application processes, not total system or container resource consumption.
- CPU utilization is calculated as a percentage of total machine capacity across 8 logical processors.
- Memory measurements represent the combined Working Set of the monitored Node.js processes.
- Resource monitoring lasted 40 seconds, while k6 generated load for 30 seconds.
- Catalog scaling results require further investigation.
- Repeated trials and reversed execution order are recommended.
- Results represent the current project implementation and test environment.

## 11. Conclusion

The experiments demonstrate measurable differences between the Modular Monolith and Microservices implementations.

In the validated catalog-search benchmark, the Modular Monolith achieved lower response latency and higher throughput.

The resource consumption experiment showed that the Modular Monolith used considerably less memory in the tested environment, while the Microservices implementation operated through 14 independent application processes.

The Microservices implementation demonstrated separate service processes, gateway-based communication, service-level failure handling and inventory compensation in the tested payment-failure scenario.

The experiments highlight the trade-offs between in-process modular communication and distributed service communication.

Further repeated testing, resource monitoring and broader workloads are required before drawing general conclusions about the architectures.

