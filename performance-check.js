#!/usr/bin/env node

import puppeteer from "puppeteer";
import { PredefinedNetworkConditions } from "puppeteer";
import pti from "puppeteer-to-istanbul";
import lighthouse from "lighthouse";
import { URL } from "url";
import { writeFile } from "fs/promises";
import { generateReport } from "lighthouse";
import { generateTraceReport } from "./trace-generator.js";

export const runPerformanceCheck = async (url) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // let abc = await page.goto(url);

    // Throttling the page
    // await page.emulateNetworkConditions(PredefinedNetworkConditions["Slow 3G"]);
    // await page.emulateCPUThrottling(6);

    // Exrtacting all js scripts
    console.log("Scraping all js scripts used in " + url);
    await saveScripts(page);

    // Running lighthouse performance check
    console.log("Lighthouse Performance check initiating");
    await runLighthouseCheck(url, browser, page);

    // console.log("Performance Check initiated");
    // generateTraceReport(url, "true", "./results/trace.json");

    console.log("Running lhr test with no JS");
    await generateNoJsLighthouseReport(url);

    // Generating Code coverage report
    console.log("Generating code covereage report");
    await getCodeCoverageReport(url);


    return true;
};

const generateNoJsLighthouseReport = async (url) => {
    const browser = await puppeteer.launch({});
    const page = await browser.newPage();

    page.setDefaultTimeout(100000);

    // Block all JS requests
    try {
        page.setRequestInterception(true);
        page.on("request", (request) => {
            if (request.resourceType() === "script") {
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.goto(url);

        // **Run Lighthouse Analysis**
        const lighthouseOptions = {
            port: new URL(browser.wsEndpoint()).port,
            // throttling: {
            //     rttMs: 150,
            //     throughputKbps: 1638.4,
            //     cpuSlowdownMultiplier: 6,
            // },
            // throttlingMethod: "devtools",
        };

        const { lhr } = await lighthouse(url, lighthouseOptions, undefined, page);

        const htmlReport = generateReport(lhr, "html");
        await writeFile(
            "./views/lighthouse-report-noJS.html",
            htmlReport,
            function (err) {
                if (err) throw err;
            }
        );

        console.log("report saved successfully");
    } catch (err) {
        console.log(err);
    }

    await browser.close(); // Close after Lighthouse analysis
};

const runLighthouseCheck = async (url, browser, page) => {
    const lighthouseOptions = {
        port: new URL(browser.wsEndpoint()).port,
        // throttling: {
        //     rttMs: 150,
        //     throughputKbps: 1638.4,
        //     cpuSlowdownMultiplier: 6,
        // },
        // throttlingMethod: "devtools",
    };

    const { lhr } = await lighthouse(url, lighthouseOptions, undefined, page);

    await browser.close();

    const htmlReport = generateReport(lhr, "html");
    await writeFile(
        "./views/lighthouse-report.html",
        htmlReport,
        function (err) {
            if (err) throw err;
        }
    );

    console.log("\nPerformance check completed successfully");
    await saveJSONReport(lhr, "./results/lighthouse-report.json");

    return 1;
};

const saveJSONReport = async (report, fileName) => {
    await writeFile(fileName, JSON.stringify(report, null, 2));
    console.log(`✅ Performance report saved to ${fileName}`);
};

/**
 * Function to scrape all the scripts from the page and save data along with their loading strategy.
 *
 * @param {object} page The page object created by puppeteer
 * @param {string} outputFile The path of the output file
 */
const saveScripts = async (
    page,
    outputFile = "./results/scraped_scripts.json"
) => {
    // Get all script tags and their innerHTML (content)
    const scripts = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll("script"));

        return scripts.map((script, index) => {
            let key = script.getAttribute("src");
            key = null === key ? `inline` : `network-request`;
            let executionType =
                script.getAttribute("defer") !== null
                    ? script.getAttribute("async") !== null
                        ? "defer-async"
                        : "defer"
                    : "sync";
            if (
                script.getAttribute("defer") === null &&
                script.getAttribute("async") !== null
            ) {
                executionType = "async";
            }

            return {
                scriptSrc: script.getAttribute("src")
                    ? script.getAttribute("src")
                    : "-",
                scriptType: key,
                scriptInitiator: script.getAttribute("baseURI"),
                scriptContents: script.innerHTML ? script.innerHTML : "-",
                scriptExecutionType: executionType,
            };
        });
    });

    // Save scraped scripts to JSON file
    await writeFile(outputFile, JSON.stringify(scripts, null, 2));
    console.log(`Scripts scraped and saved to: ${outputFile}`);
};

// Generate Code coverage report
const getCodeCoverageReport = async (url) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Enable both JavaScript and CSS coverage
    await Promise.all([
        page.coverage.startJSCoverage(),
        page.coverage.startCSSCoverage(),
    ]);

    // Navigate to page
    await page.goto(url);

    // Disable both JavaScript and CSS coverage
    const [jsCoverage, cssCoverage] = await Promise.all([
        page.coverage.stopJSCoverage(),
        page.coverage.stopCSSCoverage(),
    ]);

    // saving JS code coverage report
    saveJSONReport(jsCoverage, "./results/jsCoverage-report.json");

    // saving CSS code coverage report
    saveJSONReport(cssCoverage, "./results/cssCoverage-report.json");

    const coverage = [
        ...addCodeSize(jsCoverage, "JS"),
        ...addCodeSize(cssCoverage, "CSS"),
    ];

    saveJSONReport(coverage, "./results/coverage-report.json");

    // Generating coverage report using puppeteer-to-istanbul library
    pti.write([...jsCoverage, ...cssCoverage], {
        includeHostname: true,
        storagePath: "./.nyc_output",
    });
    await browser.close();
};

/**
 * Function to modify the code coverage report generated by puppeteer and add used and unused bytes size.
 *
 * @param {object} coverageReport Code coverage report generated using puppeteer
 * @param {string} reportType Report type to
 * @returns {object} modified code coverage report.
 */
const addCodeSize = (coverageReport, reportType) => {
    let totalBytes = 0;
    let usedBytes = 0;

    for (const entry of coverageReport) {
        totalBytes += entry.text.length;
        for (const range of entry.ranges)
            usedBytes += range.end - range.start - 1;

        entry.entryCoverage = {
            usedBytes: usedBytes,
            totalBytes: totalBytes,
            unusedBytes: totalBytes - usedBytes,
        };
        entry.resourceType = reportType;
    }

    return coverageReport;
};
