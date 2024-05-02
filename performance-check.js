#!/usr/bin/env node

import puppeteer from "puppeteer";
import lighthouse from "lighthouse";
import { URL } from "url";
import { writeFile } from "fs/promises";
import { generateReport } from "lighthouse";

export const runPerformanceCheck = async (url) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    // Exrtacting all js scripts
    console.log('Scraping all js scripts used in ' + url);
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

    const htmlReport = generateReport(lhr, "html");
    await writeFile("./views/lighthouse-report.html", htmlReport, function (err) {
        if (err) throw err;
    });

    console.log("Performance check completed successfully");
    await saveJSONReport(lhr);

    // return lhr;
};

const saveJSONReport = async (report) => {
    const fileName = `./results/lighthouse-report-${Date.now()}.json`;
    await writeFile(fileName, JSON.stringify(report, null, 2));
    console.log(`Performance report saved to ${fileName}`);
};

const saveScripts = async (page, outputFile = "./results/scraped_scripts.json") => {
    // Get all script tags and their innerHTML (content)
    const scripts = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll("script"));
        // let syncScripts=[]
        return scripts.map((script, index) => {
            let key = script.getAttribute("src");
            key = null === key ? `inline-${index}` : `network-request-${index}`;
            let executionType =
                script.getAttribute("defer") !== null
                    ? script.getAttribute("async") !== null
                        ? "defer-async"
                        : "defer"
                    : "sync";

            return {
                scriptSrc: script.getAttribute("src"),
                scriptType: key,
                scriptContents: script.innerHTML,
                scriptExecutionType: executionType,
            };
        });
    });

    // Save scraped scripts to JSON file
    await writeFile(outputFile, JSON.stringify(scripts, null, 2));
    console.log(`Scripts scraped and saved to: ${outputFile}`);
};

// main();