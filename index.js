#!/usr/bin/env node

import puppeteer from "puppeteer";
import lighthouse from "lighthouse";
import { URL } from "url";
import { writeFile } from "fs/promises";

const runPerformanceCheck = async (url) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    saveScripts(page);

    const lighthouseOptions = {
        port: new URL(browser.wsEndpoint()).port,
        throttling: {
            rttMs: 150,
            throughputKbps: 1638.4,
            cpuSlowdownMultiplier: 6,
        },
        throttlingMethod: "devtools",
    };

    const { lhr } = await lighthouse(url, lighthouseOptions);

    await browser.close();

    return lhr;
};

const saveReport = async (report) => {
    const fileName = `performance-report-${Date.now()}.json`;
    await writeFile(fileName, JSON.stringify(report, null, 2));
    console.log(`Performance report saved to ${fileName}`);
};

const main = async () => {
    const url = process.argv[2];
    if (!url) {
        console.error("Please provide a URL as a command line argument");
        process.exit(1);
    }

    console.log(`Running performance check for ${url}`);
    try {
        const report = await runPerformanceCheck(url);
        console.log("Performance check completed successfully");
        await saveReport(report);
    } catch (error) {
        console.error("An error occurred:", error);
    }
};

const saveScripts = async (page, outputFile = "scraped_scripts.json") => {
    // Get all script tags and their innerHTML (content)
    const scripts = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll("script"));
        return scripts.map((script) => script.innerHTML);
    });

    console.log(scripts);

    // Save scraped scripts to JSON file
    await writeFile(outputFile, JSON.stringify(scripts, null, 2));
    console.log(`Scripts scraped and saved to: ${outputFile}`);
};

main();
