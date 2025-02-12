const client = mqtt.connect("ws://localhost:9001");

// Chart configurations with unique colors
const chartConfigs = {
    flowChart: { topic: "/MQTT/FlowRate", label: "Flow Rate", color: "rgb(255, 99, 132)" },
    velocityChart: { topic: "/MQTT/FlowVelocity", label: "Flow Velocity", color: "rgb(54, 162, 235)" },
    percentChart: { topic: "/MQTT/FlowPercentage", label: "Flow Percentage", color: "rgb(255, 206, 86)" },
    heatChart: { topic: "/MQTT/InstantHeat", label: "Instant Heat", color: "rgb(75, 192, 192)" },
    inputTempChart: { topic: "/MQTT/InputTemp", label: "Input Temperature", color: "rgb(153, 102, 255)" },
    outputTempChart: { topic: "/MQTT/OutputTemp", label: "Output Temperature", color: "rgb(255, 159, 64)" }
};

// Store chart references
const charts = {};

document.addEventListener("DOMContentLoaded", function () {
    Object.keys(chartConfigs).forEach(chartId => {
        const canvas = document.getElementById(chartId);
        if (canvas) {
            const ctx = canvas.getContext("2d");
            charts[chartId] = new Chart(ctx, {
                type: "line",
                data: { 
                    labels: [], 
                    datasets: [{
                        label: chartConfigs[chartId].label,
                        data: [],
                        fill: true,
                        borderColor: chartConfigs[chartId].color,
                        backgroundColor: chartConfigs[chartId].color.replace("rgb", "rgba").replace(")", ", 0.2)"),
                        tension: 0.4
                    }]
                },
                options: {
                    scales: {
                        xAxes: [{  // Note the array syntax for v2.9.4
                            type: 'time',
                            time: {
                                unit: 'second',
                                displayFormats: {
                                    second: 'HH:mm:ss'
                                },
                                stepSize: 5  // Show label every 10 seconds
                            },
                            ticks: {
                                maxRotation: 45,
                                minRotation: 45,
                                autoSkip: true,
                                maxTicksLimit: 8,
                                source: 'auto'
                            },
                            gridLines: {
                                display: true
                            }
                        }],
                        yAxes: [{  // Note the array syntax for v2.9.4
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    },
                    responsive: true,
                    maintainAspectRatio: true,
                    layout: {
                        padding: {
                            left: 10,
                            right: 30,
                            top: 10,
                            bottom: 20
                        }
                    }
                }
            });
        }
    });

    // MQTT connection setup
    client.on("connect", function () {
        Object.values(chartConfigs).forEach(config => {
            client.subscribe(config.topic);
        });
    });

    client.on("message", function (topic, message) {
        const now = new Date();
        const reading = parseFloat(message.toString());

        Object.keys(chartConfigs).forEach(chartId => {
            if (chartConfigs[chartId].topic === topic && charts[chartId]) {
                const chartData = charts[chartId].data;

                chartData.labels.push(now);
                chartData.datasets[0].data.push(reading);

                while (chartData.labels.length > 60) {
                    chartData.labels.shift();
                    chartData.datasets[0].data.shift();
                }
                charts[chartId].update();
            }
        });
    });
});

function updateChartData(data) {
    Object.keys(charts).forEach(chartId => {
        const chart = charts[chartId];
        chart.data.labels = data.map(d => d.time);
        chart.data.datasets[0].data = data.filter(d => d.sensor_type === chartConfigs[chartId].label).map(d => d.reading);
        chart.update();
    });
}
