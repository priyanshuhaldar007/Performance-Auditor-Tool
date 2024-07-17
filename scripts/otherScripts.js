import { saveJSONReport } from "./saveScripts.js";

/**
 * Get 3P scripts from lhr.json
 *
 * @param {object} lhr JSON format lhr report
 */
export const get3PScripts = (networkRequestData, resDir) => {
    const allRequests = networkRequestData.details.items;

    saveJSONReport(allRequests, `${resDir}/jsonReports/network_data_lhr.json`);

    const homeEntity = allRequests[0].entity;
    const _3pRequests = allRequests.filter(
        (request) => request.entity !== homeEntity
    );

    saveJSONReport(_3pRequests, `${resDir}/jsonReports/network_data_3p.json`);
};

/**
 * Get render blocking resources from lhr.json
 *
 * @param {object} renderBlockBlockingResources
 */
export const getRenderBlockBlockingResources = (renderBlockBlockingResources, resDir, TestScenarios) => {
    const blockingResources = renderBlockBlockingResources.details.items;

    if (0 === blockingResources.length) {
        console.log("No render blocking resources");
        return;
    }
    else{
        TestScenarios.noRenderBlocking = 1;
    }

    saveJSONReport(
        blockingResources,
        `${resDir}/jsonReports/render_blocking_data_lhr.json`
    );
};
