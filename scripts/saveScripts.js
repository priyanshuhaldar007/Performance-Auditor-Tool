import { writeFile } from "fs/promises";

export const saveJSONReport = async (jsonReport, fileName) => {
    try{
        await writeFile(fileName, JSON.stringify(jsonReport, null, 2));
        console.log(`✅ JSON report successfully saved to ${fileName}`);
    }catch(e){
        console.log(`❌ Failed to save JSON report`, e);
    }
}
export const saveHTMLReport = async (htmlReport, fileName) => {
    try{
        await writeFile(fileName, htmlReport);
        console.log(`✅ HTML report successfully saved to ${fileName}`);
    }catch(e){
        console.log(`❌ Failed to save HTML report`, e);
    }
}