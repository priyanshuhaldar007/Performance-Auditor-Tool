import express from 'express';
import path from 'path';
import ejs from 'ejs';
import { fileURLToPath } from 'url';
import { runPerformanceCheck } from './performance-check.js';


const app = express();
app.use(express.json());

app.set('port', 8080);
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.engine('html', ejs.renderFile)

app.get('/', (req, res) => {
    var mascots = [
        { name: 'Sammy', organization: "DigitalOcean", birth_year: 2012},
        { name: 'Tux', organization: "Linux", birth_year: 1996},
        { name: 'Moby Dock', organization: "Docker", birth_year: 2013}
      ];
      var tagline = "No programming concept is complete without a cute animal mascot.";
    
      res.render('index', {
        mascots: mascots,
        tagline: tagline
      });
});


app.post('/get-url', (req, res) => {
    const data = req.body.url;
    console.log(data);
    res.send('ji');
})

app.listen(8080,()=>{
    console.log('express server running');
    main();
})

const main = async () => {
    const url = process.argv[2];
    if (!url) {
        console.error("Please provide a URL as a command line argument");
        process.exit(1);
    }

    console.log(`Running performance check for ${url}`);
    try {
        // const report = await runPerformanceCheck(url);
        runPerformanceCheck(url);

        // saving in html format
        // const htmlReport = generateReport(report, "html");
        // await writeFile("report.html", htmlReport, function (err) {
        //     if (err) throw err;
        // });

        // console.log("Performance check completed successfully");
        // await saveReport(report);
    } catch (error) {
        console.error("An error occurred:", error);
    }

};
