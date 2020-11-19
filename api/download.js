const express = require("express");
const router = express.Router();
const ytdl = require('ytdl-core');
const contentDisposition = require('content-disposition');
const { getFormat, getId } = require("./../utils");
const mfe = require("mime-file-extension");

router.get("/download", async (req, res) => {
    let _url = req.query.url;
    let _id = req.query.id;

    const url = _url || `https://www.youtube.com/watch?v=${_id}`;
    const id = _id || getId(url);
    const details = await ytdl.getBasicInfo(url);
    const format = await getFormat(id);

    const mimeType = format.mimeType.split(";")[0];
    const fileExtensions = mfe.getFileExtensions(mimeType, true);

    const filename = contentDisposition((details.title || "sample") + fileExtensions[0]);
    res.header('Content-Dispositon', 'attachment; filename=' + filename);
    res.header("Content-Type", mimeType)

    ytdl(url, {
        quality: format.itag,
    }).pipe(res)
})

module.exports = router;