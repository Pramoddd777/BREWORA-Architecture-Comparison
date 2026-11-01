
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_FILE = ROOT / "results" / "architecture-comparison.csv"
OUTPUT_DIR = ROOT / "results"

df = pd.read_csv(CSV_FILE)

# Dark dashboard theme
BG = "#101827"
PANEL = "#172337"
TEXT = "#E5E7EB"
MUTED = "#94A3B8"
COLORS = ["#38BDF8", "#F59E0B"]
SUCCESS = "#34D399"
FAILURE = "#F87171"

plt.rcParams.update({
    "figure.facecolor": BG,
    "axes.facecolor": PANEL,
    "text.color": TEXT,
    "axes.labelcolor": TEXT,
    "xtick.color": MUTED,
    "ytick.color": MUTED,
    "font.family": "DejaVu Sans",
})

def save_chart(fig, filename):
    fig.savefig(
        OUTPUT_DIR / filename,
        dpi=300,
        bbox_inches="tight",
        facecolor=BG
    )
    plt.show()
    plt.close(fig)


# 1. Line graph: Average latency
fig, ax = plt.subplots(figsize=(10, 6))

ax.plot(
    df["Architecture"],
    df["Average_Latency_ms"],
    marker="o",
    markersize=12,
    linewidth=3,
    color=COLORS[0]
)

for i, value in enumerate(df["Average_Latency_ms"]):
    ax.annotate(
        f"{value:.2f} ms",
        (i, value),
        xytext=(0, 15),
        textcoords="offset points",
        ha="center",
        fontweight="bold"
    )

ax.set_title("Average Response Latency", fontsize=17, fontweight="bold", pad=20)
ax.set_ylabel("Latency (ms)")
ax.grid(alpha=0.2)
ax.spines[["top", "right"]].set_visible(False)

save_chart(fig, "line_average_latency.png")


# 2. Line graph: Latency percentiles
fig, ax = plt.subplots(figsize=(10, 6))

percentiles = ["P50_ms", "P90_ms", "P95_ms"]
labels = ["P50", "P90", "P95"]

for i, row in df.iterrows():
    values = [row[column] for column in percentiles]

    ax.plot(
        labels,
        values,
        marker="o",
        markersize=9,
        linewidth=3,
        color=COLORS[i],
        label=row["Architecture"]
    )

    for x, value in enumerate(values):
        ax.annotate(
            f"{value:.2f}",
            (x, value),
            xytext=(0, 10),
            textcoords="offset points",
            ha="center",
            fontsize=9
        )

ax.set_title("Latency Percentile Comparison", fontsize=17, fontweight="bold", pad=20)
ax.set_ylabel("Latency (ms)")
ax.legend(frameon=False)
ax.grid(alpha=0.2)
ax.spines[["top", "right"]].set_visible(False)

save_chart(fig, "line_latency_percentiles.png")


# 3. Donut chart: Throughput share
fig, ax = plt.subplots(figsize=(8, 7))

throughput = df["Throughput_req_sec"].tolist()

wedges, texts, autotexts = ax.pie(
    throughput,
    labels=df["Architecture"],
    colors=COLORS,
    autopct="%1.1f%%",
    startangle=90,
    pctdistance=0.75,
    wedgeprops={"width": 0.38, "edgecolor": BG, "linewidth": 3}
)

for text in texts + autotexts:
    text.set_color(TEXT)

ax.text(
    0, 0,
    f"{sum(throughput):,.0f}\nreq/s combined",
    ha="center",
    va="center",
    fontsize=15,
    fontweight="bold"
)

ax.set_title("Throughput Share of Measured Results", fontsize=16, fontweight="bold", pad=20)

save_chart(fig, "donut_throughput_share.png")


# 4. Donut charts: Success and failure rates
fig, axes = plt.subplots(1, 2, figsize=(12, 6))

for i, (_, row) in enumerate(df.iterrows()):
    error_rate = row["Error_Rate"]
    success_rate = 100 - error_rate

    axes[i].pie(
        [success_rate, error_rate],
        labels=["Successful", "Failed"],
        colors=[SUCCESS, FAILURE],
        autopct="%1.2f%%",
        startangle=90,
        pctdistance=0.75,
        wedgeprops={"width": 0.38, "edgecolor": BG, "linewidth": 3}
    )

    axes[i].text(
        0, 0,
        f"{success_rate:.0f}%\nSuccess",
        ha="center",
        va="center",
        fontsize=14,
        fontweight="bold"
    )

    axes[i].set_title(row["Architecture"], fontsize=12, fontweight="bold")

fig.suptitle("Request Success and Failure Rates", fontsize=17, fontweight="bold")
fig.tight_layout()

save_chart(fig, "donut_error_rates.png")

print("\nAll four charts generated successfully!")
print("Saved inside:", OUTPUT_DIR)
