import puppeteer from 'puppeteer';

async function generateTraceReport(url, outputPath) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();


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
