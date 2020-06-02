const express = require("express");
const router = express.Router();
const ytdl = require('ytdl-core');
const contentDisposition = require("content-disposition")

const { createPartialContentHandler } = require("express-partial-content");
const { getFormat, getId } = require("./../utils");

const normalizeString = str => {
    return contentDisposition(str).split("attachment; filename=")[0];
}

const streamContentProvider = async req => {
    let _url = req.query.url;
    let _id = req.query.id;

    const url = _url || `https://www.youtube.com/watch?v=${_id}`;
    const id = _id || getId(url);

    const details = await ytdl.getBasicInfo(url);
    const format = await getFormat(id);

    getStream = range => {
        if (!range) {
            return ytdl(url, { quality: format.itag })
        }
        return ytdl(url, { quality: format.itag, range })
    }

    return {
        fileName: normalizeString(details.title),
        totalSize: format.contentLength,
        mimeType: format.mimeType,
        getStream
    };

}

let handler = (req, res) => {
    res.status(500).send("Can't share file stream")
}

try{
    handler = createPartialContentHandler(streamContentProvider, {
        debug: msg => console.log(msg),
    })
    
} catch(error){
    console.log(errro)
}

router.get("/stream", handler)

module.exports = router;