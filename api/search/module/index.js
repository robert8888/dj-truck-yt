require("dotenv").config()

const fetch = require('node-fetch');

const link = (comand, param, _part, options = "") => {
    const preLink = 'https://www.googleapis.com/youtube/v3/'
    const key = "&key=" + process.env.YT_API_KEY;
    const part = "&part=" + _part;

    let url = preLink + comand + param + part + options + key;
    return encodeURI(url);
}

const snippedOptions = (maxResults) => {
    const options = [];
    if (maxResults) {
        options.push("&maxResults=" + maxResults);
    }
    options.push("&type=video")
    return options.join('');
}

async function get(queryString, maxResults = null) {
    const part = ['snippet', 'contentDetails'];
    const snippedUrl = link("search?q=", queryString, part[0], snippedOptions(maxResults));

    //if current api key limit is exceeded then take next api key
    let snipped;
    try {
        snipped = await call(snippedUrl);
        if (snipped.error) throw new Error();
    } catch {
        return get(...arguments);
    }

    let results = parseSnipped(snipped);

    const ids = results.map(item => item.sourceId);
    const detailsUrl = link("videos?id=", ids.join(","), part[1]);

    const details = await call(detailsUrl);

    if (!details.error) {
        results = merge(results, details.items);
    }

    return results;
}

async function call(url) {
    try {
        let response = await fetch(url);
        return await response.json();
    } catch (error) {
        return { error: error.message };
    }


}

function parseSnipped(snipped) {
    let results = [];
    for (let item of snipped.items) {
        (item.id.videoId && results.push({
            sourceId: item.id.videoId,
            etag: item.etag,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnails: item.snippet.thumbnails,
            source: "YouTube",
            sourceUrl: "https://www.youtube.com/watch?v=" + item.id.videoId
        }))
    }
    return results;
}

function merge(results, details) {
    if (!results || !details) return results;

    for (rItem of details) {
        let duration = rItem.contentDetails.duration;
        let quality = rItem.contentDetails.definition;
        let id = rItem.id;
        results = results.map(dItem => {
            if (dItem.sourceId === id) {
                dItem.duration = duration;
                dItem.quality = quality;
            }
            return dItem;
        })
    }
    return results;
}


module.exports = {
    get: get,
};
