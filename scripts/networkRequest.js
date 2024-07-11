import puppeteer from "puppeteer";
import fs from 'fs'; // Import the 'fs' module for file system access

export const getNetworkRequestList = async (url) => {
  const browser = await puppeteer.launch({});
  const networkData = []; // Array to store network request data

  try {
    const page = await browser.newPage();
    page.on('request', (request) => {
      const requestData = {
        url: request.url(),
        initiator: request.initiator(),
        resourceType: request.resourceType(),
        method: request.method(),
        headers: request.headers(), // Include request headers
      };

      networkData.push(requestData);
    });

    await page.goto(url);

    // Save network data to a JSON file after page loads
    fs.writeFile('./results/json/network_data_puppeteer.json', JSON.stringify(networkData, null, 2), (err) => {
      if (err) {
        console.error('Error saving network data:', err);
      } else {
        console.log('Network data saved successfully to network_data.json');
      }
    });
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
};
