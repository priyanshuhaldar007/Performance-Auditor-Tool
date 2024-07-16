#!/usr/bin/env node

import puppeteer from "puppeteer";
import path from "path";
import { PredefinedNetworkConditions } from "puppeteer";
import pti from "puppeteer-to-istanbul";
import lighthouse from "lighthouse";
import { URL } from "url";
import { writeFile, readFile, mkdir } from "fs/promises";
import { generateReport } from "lighthouse";
import { generateTraceReport } from "./scripts/trace-generator.js";
// import { getNetworkRequestList } from "./scripts/networkRequest.js";
import {saveHTMLReport, saveJSONReport} from './scripts/saveScripts.js';
import { getScrapedScripts } from "./scripts/puppeteerScripts";
import { generateNo3pJsLighthouseReport, generateNoJsLighthouseReport, generateNoRenderBlockingLighthouseReport, lowCodeCoverageLighthouseReport, runLighthouseCheck, } from "./scripts/lighthouseTestScripts.js";
import { getCodeCoverageReport } from "./scripts/puppeteerScripts";
import { getNetworkRequestList } from "./scripts/puppeteerScripts";

let TestScenarios = {
    noRenderBlocking: 1,
};
const __dirname = path.resolve();

export const runPerformanceCheck = async (url) => {


    const resDir = await makeResDir(url, { recursive: true });
    const browser = await puppeteer.launch();

    // let abc = await page.goto(url);
    
    // Throttling the page
    // await page.emulateNetworkConditions(PredefinedNetworkConditions["Slow 3G"]);
    // await page.emulateCPUThrottling(6);
    
    // Exrtacting all js scripts
    console.log("Scraping all js scripts used in " + url);
    await getScrapedScripts( browser, url, `./results/${resDir}/jsonReports/`);
    
    console.log("Performance Check initiated");
    await generateTraceReport(browser, url, "true", `./results/${resDir}/jsonReports/trace.json`);

    // Running lighthouse performance check
    console.log("Lighthouse Performance check initiating");
    await runLighthouseCheck(browser, url, `./results/${resDir}`, TestScenarios);
    
    
    console.log("Running lhr test with no JS");
    await generateNoJsLighthouseReport(browser, url, `./results/${resDir}`);
    
    console.log("Running lhr test with no 3P JS");
    await generateNo3pJsLighthouseReport(browser, url, `./results/${resDir}`);
    
    if (TestScenarios.noRenderBlocking) {
        console.log("Running lhr test with no RenderBlocking");
        await generateNoRenderBlockingLighthouseReport(browser, url, `./results/${resDir}`);
    }
        
    // Generating Code coverage report
    console.log("Generating code covereage report");
    await getCodeCoverageReport(browser, url, `./results/${resDir}/jsonReports/`);
    
    console.log("Running lhr test with Low Code coverage blocked");
    await lowCodeCoverageLighthouseReport(browser, url, `./results/${resDir}`);
    
    // Monitoring all network requests
    // console.log("Monitoring all requests");
    // getNetworkRequestList(browser, url, `./results/${resDir}/jsonReports/`);

    browser.close();

    return true;
};

/**
 * Creates a directory to store all the results of tests
 * 
 * @param {string} url 
 * @returns string dirname
 */
const makeResDir = async (url)=>{
    const siteName = url.includes('www') ? 
                        url.split('.')[1] :
                        url.split('/')[2].split('.')[0];

    // const timeStamp = new Date().toISOString().split('.')[0].replaceAll(':', '-');
    const timeStamp = getFormattedTime();
    
    try{
        await mkdir(`./results/${siteName}-${timeStamp}`);
        await mkdir(`./results/${siteName}-${timeStamp}/jsonReports`);
        await mkdir(`./results/${siteName}-${timeStamp}/htmlReports`);
    }catch(e){
        console.log('Error making site directory', e);
        process.exit(0);
    }

    return `${siteName}-${timeStamp}`;
}

const getFormattedTime = ()=>{
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0'); // Pad with leading zeros
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = now.getFullYear();
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
  
    return `${day}-${month}-${year}-${hour}-${minute}-${second}`;
  }
