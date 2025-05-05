const ytdl = require('@distube/ytdl-core');
const path = require("path");
const os = require("os");
const fs = require("fs");

const getCookiesFilePath = (type = "txt") => {
    return path.join(__dirname, `/../cookies/www.youtube.com_cookies.${type}`);
}

const getCookiesJson = () => {
    return fs.readFileSync(getCookiesFilePath("json"));
}

const getFormat = async id => {
    const agent = ytdl.createAgent(JSON.parse(getCookiesJson()));

    const info = await ytdl.getInfo(id, {agent});
    const format = ytdl.chooseFormat(info.formats, {
        quality: 'highestaudio',
        filter: 'audioonly'
    })
    return format
}

const getId = url => {
    console.log("the get id url", url)
    const match = url.match(/watch\?v=(?<id>[^&]+)/) 
    if(!match) return null;
    return match.groups.id;
}


module.exports = {
    getCookiesJson,
    getCookiesFilePath,
    getFormat,
    getId,
}