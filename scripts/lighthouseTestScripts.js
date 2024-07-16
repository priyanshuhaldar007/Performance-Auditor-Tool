import { URL } from "url";
import lighthouse, { generateReport } from "lighthouse";
import { get3PScripts, getRenderBlockBlockingResources } from "./otherScripts.js";
import { saveHTMLReport, saveJSONReport } from "./saveScripts.js";
import { readFile } from "fs/promises";

export const runLighthouseCheck = async (browser, url, resDir, TestScenarios) => {
    const page = await browser.newPage();
    page.setDefaultTimeout(100000);

    await page.goto(url);
    // console.log(resDir);
    try {
        const lighthouseOptions = {
            port: new URL(browser.wsEndpoint()).port,
        };

        const { lhr } = await lighthouse(url, lighthouseOptions, undefined, page);

        // get3p scripts
        get3PScripts(lhr.audits["network-requests"], resDir);

        // getrenderblocking resources
        getRenderBlockBlockingResources(lhr.audits["render-blocking-resources"], resDir, TestScenarios);

        const htmlReport = generateReport(lhr, "html");

        await saveHTMLReport( htmlReport, `${resDir}/htmlReports/lighthouse-report.html` );

        await saveJSONReport(lhr, `${resDir}/jsonReports/lighthouse-report.json`);
        // console.log(`✅ JSON trace report successfully saved to ${outputPath}`);
    }catch(e) {
        console.log(`❌ Failed to generate lighthouse report`, e);
    }
};

export const generateNoJsLighthouseReport = async (browser, url, resDir) => {
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
        };

        const { lhr } = await lighthouse(
            url,
            lighthouseOptions,
            undefined,
            page
        );

        const htmlReport = generateReport(lhr, "html");

        await saveHTMLReport( htmlReport, `${resDir}/htmlReports/lighthouse-report-NoJS.html` );

        await saveJSONReport(lhr, `${resDir}/jsonReports/lighthouse-report-NoJS.json`);
    } catch (e) {
        console.log(`❌ Failed to generate No JS lighthouse report`, e);
    }
};

export const generateNo3pJsLighthouseReport = async (browser, url, resDir) => {
    const page = await browser.newPage();

    const _3pData = await readFile(`${resDir}/jsonReports/network_data_3p.json`);
    const parsed3pData = JSON.parse(_3pData);

    const _3pURL = parsed3pData.map((item) => item.url);

    page.setDefaultTimeout(100000);

    // Block all 3P JS requests
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
        };

        const { lhr } = await lighthouse(
            url,
            lighthouseOptions,
            undefined,
            page
        );

        await saveJSONReport( lhr, `${resDir}/jsonReports/lighthouse-report-no3pJs.json` );

        const htmlReport = generateReport(lhr, "html");

        await saveHTMLReport(htmlReport,`${resDir}/htmlReports/lighthouse-report-no3pJs.html`);
    } catch (e) {
        console.log(`❌ Failed to generate No 3P JS lighthouse report`, e);
    }
};

export const generateNoRenderBlockingLighthouseReport = async (browser, url, resDir) => {
    const page = await browser.newPage();

    const jsonData = await readFile( `${resDir}/jsonReports/render_blocking_data_lhr.json` );
    const parsedData = JSON.parse(jsonData);

    const renderBlockingURL = parsedData.map((item) => item.url);

    page.setDefaultTimeout(100000);

    // Block all JS requests
    try {
        page.setRequestInterception(true);
        page.on("request", (request) => {
            if (renderBlockingURL.includes(request.url())) {
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.goto(url);

        // Defining lighthouse flags
        const lighthouseOptions = {
            port: new URL(browser.wsEndpoint()).port,
        };

        const { lhr } = await lighthouse(
            url,
            lighthouseOptions,
            undefined,
            page
        );

        const htmlReport = generateReport(lhr, "html");

        await saveHTMLReport( htmlReport, `${resDir}/htmlReports/lighthouse-report-NoRenderBlocking.html` );

        await saveJSONReport(lhr, `${resDir}/jsonReports/lighthouse-report-NoRenderBlocking.json`);
    } catch (e) {
        console.log(`❌ Failed to generate No Render Blocking lighthouse report`, e);
    }
};

export const lowCodeCoverageLighthouseReport = async (browser, url, resDir) => {
    const page = await browser.newPage();

    const coverageJsonData = await readFile(
        `${resDir}/jsonReports/coverage-report.json`
    );
    const parsedData = JSON.parse(coverageJsonData);

    const lowCodeCoverage = parsedData.filter((item) => {
        let unusedPercent = (item.entryCoverage.unusedBytes / item.entryCoverage.totalBytes)*100;
        if( unusedPercent > 80 ){
            return item.url;
        }
    });

    page.setDefaultTimeout(100000);

    // Block all JS requests
    try {
        page.setRequestInterception(true);
        page.on("request", (request) => {
            if (lowCodeCoverage.includes(request.url())) {
                request.abort();
            } else {
                request.continue();
            }
        });

        await page.goto(url);

        // Defining lighthouse flags
        const lighthouseOptions = {
            port: new URL(browser.wsEndpoint()).port,
        };

        const { lhr } = await lighthouse(
            url,
            lighthouseOptions,
            undefined,
            page
        );
        
        const htmlReport = generateReport(lhr, "html");

        await saveHTMLReport( htmlReport, `${resDir}/htmlReports/lighthouse-report-lowCodeCoverage.html` );

        await saveJSONReport(lhr, `${resDir}/jsonReports/lighthouse-report-lowCodeCoverage.json`);
    } catch (e) {
        console.log(`❌ Failed to generate Low code coverage lighthouse report`, e);
    }
};