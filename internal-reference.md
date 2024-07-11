## lhr JSON report data mapping

- Site URL: jsonData.mainDocumentUrl

- FCP: jsonData.audits.first-contentful-paint
- LCP: jsonData.audits.largest-contentful-paint
- CLS: jsonData.audits.cumulative-layout-shift
- Max-potential FID: jsonData.audits.max-potential-fid
- TBT: jsonData.audits.total-blocking-time
- errors-in-console: jsonData.audits.errors-in-console
- server-response-time: jsonData.audits.server-response-time
- main-thread-breakdown: jsonData.audits.main-thread-breakdown
- network-requests: jsonData.audits.network-requests



to get a trace report along with a lighthouse report we have to pass -GA flag to lighthouse [ref](https://github.com/GoogleChrome/lighthouse/discussions/12085)



Feature
- code coverage => puppeteer
- network-requests => lighthouse + puppeteer
