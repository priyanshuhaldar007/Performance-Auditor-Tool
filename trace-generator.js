import puppeteer from "puppeteer";

async function generateTraceReport(url, outputPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const client = await page.createCDPSession();
    await client.send("Network.enable");
    // Simulated network throttling (Slow 3G)
    await client.send("Network.emulateNetworkConditions", {
        // Network connectivity is absent
        offline: false,
        // Download speed (bytes/s)
        downloadThroughput: ((500 * 1024) / 8) * 0.8,
        // Upload speed (bytes/s)
        uploadThroughput: ((500 * 1024) / 8) * 0.8,
        // Latency (ms)
        latency: 400 * 5,
    });
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

    // Enable Chrome DevTools Performance Monitoring
    // await client.Tracing.start({ transferMode: 'ReturnAsStream'});
    await client.send("Tracing.start", {
        transferMode: "ReturnAsStream",
        streamFormat: "json",
    });

    // Navigate to the website
    // await client.navigate(url);
    await client.send("Page.navigate", { url: url });

    // Stop tracing
    // await client.tracing.stop();
    await client.send("Tracing.end");

    // Close the browser
    await browser.close();

    console.log(`Trace report generated at ${outputPath}`);
}

// Accept command line arguments
const args = process.argv.slice(2);
const url = args[0];
const outputPath = args[1] || "trace.json";

if (!url) {
    console.error("Please provide a URL.");
    process.exit(1);
}

generateTraceReport(url, outputPath).catch(console.error);

let NETWORK_PRESETS = {
    GPRS: {
        offline: false,
        downloadThroughput: (50 * 1024) / 8,
        uploadThroughput: (20 * 1024) / 8,
        latency: 500,
    },
    Regular2G: {
        offline: false,
        downloadThroughput: (250 * 1024) / 8,
        uploadThroughput: (50 * 1024) / 8,
        latency: 300,
    },
    Good2G: {
        offline: false,
        downloadThroughput: (450 * 1024) / 8,
        uploadThroughput: (150 * 1024) / 8,
        latency: 150,
    },
    Regular3G: {
        offline: false,
        downloadThroughput: (750 * 1024) / 8,
        uploadThroughput: (250 * 1024) / 8,
        latency: 100,
    },
    Good3G: {
        offline: false,
        downloadThroughput: (1.5 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
        latency: 40,
    },
    Regular4G: {
        offline: false,
        downloadThroughput: (4 * 1024 * 1024) / 8,
        uploadThroughput: (3 * 1024 * 1024) / 8,
        latency: 20,
    },
    DSL: {
        offline: false,
        downloadThroughput: (2 * 1024 * 1024) / 8,
        uploadThroughput: (1 * 1024 * 1024) / 8,
        latency: 5,
    },
    WiFi: {
        offline: false,
        downloadThroughput: (30 * 1024 * 1024) / 8,
        uploadThroughput: (15 * 1024 * 1024) / 8,
        latency: 2,
    },
};
