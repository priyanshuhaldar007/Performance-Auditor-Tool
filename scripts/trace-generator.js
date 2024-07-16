

export async function generateTraceReport(browser, url, throttleFlag, outputPath) {
    try {
        const page = await browser.newPage();

        page.setDefaultTimeout(100000);

        if(throttleFlag){
            console.log('Throttling CPU by 4x and Network to slow 3G');
            // For throttling CPU and Network before generating trace report
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
        }
        // Enable Chrome DevTools Performance Monitoring
        await page.tracing.start({ path: outputPath, screenshots: true });

        // Navigate to the website
        await page.goto(url);

        // Stop tracing
        await page.tracing.stop();

        // Close the browser
        // await browser.close();

        console.log(`✅ JSON trace report successfully saved to ${outputPath}`);
    }catch(e) {
        console.log(`❌ Failed to save JSON report`, e);
    }
}
