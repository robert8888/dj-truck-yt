const fetch = require('node-fetch');

const ApiKeys = [
    'AIzaSyCRUDY5A0rFdMzeQzvL6F3APSxAWJQPkTM', // djtruck-1
    'AIzaSyANKS3cfFFgxiZP8IHYbpIgCFtCEeA6Rv8', // djtruck-3
    'AIzaSyCRUDY5A0rFdMzeQzvL6F3APSxAWJQPkTM',
    'AIzaSyDEBtvg09qL_L1ONMZPhh7ldmxaNrrluqc',
    'AIzaSyCRUDY5A0rFdMzeQzvL6F3APSxAWJQPkTM', // djtruck-0
    'AIzaSyCRUDY5A0rFdMzeQzvL6F3APSxAWJQPkTM', // djtruck-1
    'AIzaSyC_PilTZXdEInudbPazpI9X7SqHq01eULc', // djtruck-2



    'AIzaSyAkBcTUMAXeTa6LloEgqiRWfg9x66u7GhU',
    'AIzaSyB0-G7yzkW8qOlwWxZEL41mqw2Q25WLswg',
    'AIzaSyDwRqL0obqrZaEGH-5OLWdzooxKAchhmZ4',
    'AIzaSyCRUDY5A0rFdMzeQzvL6F3APSxAWJQPkTM',

];

let currentApi = 0;

const link = (comand, param,  _part , options = "") => {
    console.log('api key nr: ', currentApi);
    const preLink ='https://www.googleapis.com/youtube/v3/'
    const key = "&key=" + ApiKeys[currentApi];
    const part = "&part=" + _part;

    let url = preLink + comand  + param + part + options +  key ;
    return encodeURI(url);
}

const snippedOptions = (maxResults) =>{
    const options = [];
    if(maxResults){
        options.push("&maxResults=" + maxResults);
    }
    options.push("&type=video")
    return options.join('');
}

async function get(queryString, maxResults = null){
    const part = ['snippet', 'contentDetails'];
    const snippedUrl = link("search?q=", queryString, part[0],  snippedOptions(maxResults));
 
    //if current api key limit is exceeded then take next api key
    let snipped;
    try  {
        snipped = await call(snippedUrl);
        if(snipped.error) throw new Error();
    } catch {
            if( currentApi++ < ApiKeys.length ){
                return get(...arguments);
            }
            console.log('tu')
            snipped = snipped || {error : "limit exceeded no more api keys, try to reset api key by /reset"};
            snipped.curentApiKey = currentApi;
            snipped.allApiKeysNumber = ApiKeys.length ;
            return [ snipped ];
    }


   

    let results = parseSnipped (snipped);

    const ids = results.map( item => item.id);
    const detailsUrl = link("videos?id=", ids.join(","), part[1]);
    
    const details = await call(detailsUrl);

    if(!details.error){
        results = merge(results, details.items);
    }
    
    return results;
}

async function call(url){
    try {
        let response = await fetch(url);
        return await response.json();
    } catch(error){
        return {error : error.message};
    }


}

function parseSnipped(snipped){
    let results = [];
    for(let item of snipped.items){
        (item.id.videoId && results.push({
            sourceId : item.id.videoId,
            etag : item.etag,
            title : item.snippet.title,
            description: item.snippet.description,
            thumbnails : item.snippet.thumbnails,
            source: "YouTube"
        }))
    }
    return results;
}

function merge(results, details){
    if(!results || !details) return results;

    for(item of details){
        let duration = item.contentDetails.duration;
        let quality = item.contentDetails.definition;
        let id = item.id;
        results = results.map( item => {
            if(item.id === id){
                item.duration = duration;
                item.quality = quality;
            }
            return item;
        })
    }
    return results;
}

     
module.exports = {
    get : get,
};
