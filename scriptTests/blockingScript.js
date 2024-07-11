import puppeteer from "puppeteer";
import fs from 'fs'; // Import the 'fs' module for file system access

(async () => {
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
        // Add other properties you're interested in (e.g., response data)
      };

      networkData.push(requestData);
      // Optional: request.continue();  // uncomment to allow requests
    });

    await page.goto('https://rtcamp.com/');

    // Save network data to a JSON file after page loads
    await fs.writeFile('./results/network_data.json', JSON.stringify(networkData, null, 2), (err) => {
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
})();
