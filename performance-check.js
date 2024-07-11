#!/usr/bin/env node

import puppeteer from "puppeteer";
import { PredefinedNetworkConditions } from "puppeteer";
import pti from "puppeteer-to-istanbul";
import lighthouse from "lighthouse";
import { URL } from "url";
import { writeFile, readFile } from "fs/promises";
import { generateReport } from "lighthouse";
import { generateTraceReport } from "./trace-generator.js";
import { getNetworkRequestList} from './scripts/networkRequest.js'
import { read } from "fs";

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

    console.log("Performance Check initiated");
    generateTraceReport(url, "true", "./results/json/trace.json");

    console.log("Running lhr test with no JS");
    await generateNoJsLighthouseReport(url);

    console.log("Running lhr test with no 3P JS");
    await generateNo3pJsLighthouseReport(url);

    // Generating Code coverage report
    console.log("Generating code covereage report");
    await getCodeCoverageReport(url);

    // Monitoring all network requests
    console.log("Monitoring all requests");
    getNetworkRequestList(url);


    return true;
};

const generateNo3pJsLighthouseReport = async (url) =>{
    const browser = await puppeteer.launch({});
    const page = await browser.newPage();

    const _3pData = await readFile('./results/json/network_data_3p.json');
    const parsed3pData = JSON.parse(_3pData);

    const _3pURL = parsed3pData.map(item => item.url);


    page.setDefaultTimeout(100000);

    // Block all JS requests
    try {
        page.setRequestInterception(true);
        page.on("request", (request) => {
            if (_3pURL.includes(request.url())) {
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.goto(url);

        // Defining lighthouse flags
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

        // Saving report in JSON format
        console.log("\nPerformance check completed successfully");
        await saveJSONReport(lhr, "./results/json/lighthouse-report-no3pJs.json");

        const htmlReport = generateReport(lhr, "html");
        await writeFile(
            "./views/lighthouse-report-no3pJs.html",
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

        // Defining lighthouse flags
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

        // Saving report in JSON format
        console.log("\nPerformance check completed successfully");
        await saveJSONReport(lhr, "./results/json/lighthouse-report-noJS.json");

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

    // get3p scripts
    get3PScripts(lhr.audits['network-requests']);

    const htmlReport = generateReport(lhr, "html");
    await writeFile(
        "./views/lighthouse-report.html",
        htmlReport,
        function (err) {
            if (err) throw err;
        }
    );

    console.log("\nPerformance check completed successfully");
    await saveJSONReport(lhr, "./results/json/lighthouse-report.json");

    return 1;
};

const saveJSONReport = async (report, fileName) => {
    await writeFile(fileName, JSON.stringify(report, null, 2));
    console.log(`✅ Report saved to ${fileName}`);
};

/**
 * Function to scrape all the scripts from the page and save data along with their loading strategy.
 *
 * @param {object} page The page object created by puppeteer
 * @param {string} outputFile The path of the output file
 */
const saveScripts = async (
    page,
    outputFile = "./results/json/scraped_scripts.json"
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
    saveJSONReport(jsCoverage, "./results/json/jsCoverage-report.json");

    // saving CSS code coverage report
    saveJSONReport(cssCoverage, "./results/json/cssCoverage-report.json");

    const coverage = [
        ...addCodeSize(jsCoverage, "JS"),
        ...addCodeSize(cssCoverage, "CSS"),
    ];

    saveJSONReport(coverage, "./results/json/coverage-report.json");

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


/**
 * Get 3P scripts from lhr.json
 * 
 * @param {object} lhr JSON format lhr report
 */
const get3PScripts = (networkRequestData) => {
    const allRequests = networkRequestData.details.items;


    // save all network requests
    // fs.writeFile('./results/json/network_data_lhr.json', JSON.stringify(allRequests, null, 2), (err) => {
    //     if (err) {
    //       console.error('Error saving network data:', err);
    //     } else {
    //       console.log('Network data saved successfully to network_data.json');
    //     }
    //   });
    saveJSONReport(allRequests,'./results/json/network_data_lhr.json');

    const homeEntity = allRequests[0].entity;

    const _3pRequests = allRequests.filter(request => request.entity!==homeEntity);


    saveJSONReport(_3pRequests,'./results/json/network_data_3p.json');
    // console.log(_3pRequests);
};