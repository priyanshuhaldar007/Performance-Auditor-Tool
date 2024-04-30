import puppeteer from 'puppeteer';

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
    await page.tracing.start({ path: outputPath });

    // Navigate to the website
    await page.goto(url);

    // Stop tracing
    await page.tracing.stop();

    // Close the browser
    await browser.close();

    console.log(`Trace report generated at ${outputPath}`);
}

// Accept command line arguments
const args = process.argv.slice(2);
const url = args[0];
const outputPath = args[1] || 'trace.json';

if (!url) {
    console.error('Please provide a URL.');
    process.exit(1);
}

generateTraceReport(url, outputPath).catch(console.error);
