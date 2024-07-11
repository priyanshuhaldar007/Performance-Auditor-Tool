import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { request } from 'http';
import lighthouse from "lighthouse";
import { URL } from "url";

(async () => {
  const browser = await puppeteer.launch({});
  const data = [];

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(100000);
    // await page.setRequestInterception(true); 

    // const observer = new PerformanceObserver((list) => {
    //   list.getEntries().forEach((entry) => {
    //     if (entry.name === 'resource') {
    //       data.push({
    //         url: entry.name,
    //         startTime: entry.startTime,
    //         duration: Math.round(entry.duration), // Round to milliseconds
    //         initiatorType: entry.initiatorType,
    //       });
    //     }
    //   });
    // });
    // observer.observe({ type: 'resource' });

    // page.on('request', request => {
    //     console.log(request.url(),request.response());
    //     // if (
    //     //   interceptedRequest.url().endsWith('.png') ||
    //     //   interceptedRequest.url().endsWith('.jpg')
    //     // )
    //     //   interceptedRequest.abort();
    //     // else interceptedRequest.continue();
    //   });

    await page.goto('https://rtcamp.com/');
    const lighthouseOptions = {
      port: new URL(browser.wsEndpoint()).port,
      /** Flag indicating the run should only audit. */ 
      auditMode: true,
      /** Flag indicating the run should only gather. */ 
      gatherMode: true,
      // throttling: {
      //     rttMs: 150,
      //     throughputKbps: 1638.4,
      //     cpuSlowdownMultiplier: 6,
      // },
      // throttlingMethod: "devtools",
  };

  const {lhr, artifacts, report} = await lighthouse('https://rtcamp.com/', lighthouseOptions, undefined, page);

  console.log('done');


    // Save data to JSON file after navigation completes
    await fs.writeFile('./scripts/result-lhr.json', JSON.stringify(lhr, null, 2));
    await fs.writeFile('./scripts/result-trace.json', JSON.stringify(artifacts.Trace, null, 2));
  } catch (e) {
    console.log(e);
  } finally {
    await browser.close();
  }
})();
