import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import { request } from 'http';

(async () => {
  const browser = await puppeteer.launch({});
  const data = [];

  try {
    const page = await browser.newPage();
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

    page.on('request', request => {
        console.log(request.url(),request.response());
        // if (
        //   interceptedRequest.url().endsWith('.png') ||
        //   interceptedRequest.url().endsWith('.jpg')
        // )
        //   interceptedRequest.abort();
        // else interceptedRequest.continue();
      });

    await page.goto('https://rtcamp.com/');

    // Save data to JSON file after navigation completes
    await fs.writeFile('./scriptTests/resource_timing.json', JSON.stringify(data, null, 2));
  } catch (e) {
    console.log(e);
  } finally {
    await browser.close();
  }
})();
