const express = require("express");
const router = express.Router();
const path = require("path");
const { spawn } = require("child_process");
const { PassThrough } = require("stream");

const contentDisposition = require("content-disposition");
const { createPartialContentHandler } = require("express-partial-content");

const ytdl = require("@distube/ytdl-core");
const { getFormat, getId } = require("./../utils");

const ytDlpPath = path.resolve(__dirname, "../bin/yt-dlp");

const normalizeString = str => {
    return contentDisposition(str).split("attachment; filename=")[0];
};

const streamContentProvider = async req => {
    const _url = req.query.url;
    const _id = req.query.id;
    const url = _url || `https://www.youtube.com/watch?v=${_id}`;
    const id = _id || getId(url);

    const info = await ytdl.getBasicInfo(url);
    const format = await getFormat(id); // powinien zawierać format.itag

    const mimeType = format.mimeType.split(";")[0];
    const totalSize = parseInt(format.contentLength, 10);

    const { PassThrough } = require("stream");
    const EventEmitter = require("events");

    const getStream = (range) => {
        const emitter = new EventEmitter();

        const args = ["-f", format.itag.toString(), "-o", "-", url];
        const ytDlp = spawn(ytDlpPath, args);
        const passthrough = new PassThrough();

        let byteOffset = 0;
        const total = range ? (range.end - range.start + 1) : totalSize;

        ytDlp.stdout.on("data", chunk => {
            byteOffset += chunk.length;
            const progress = Math.min(100, Math.round((byteOffset / total) * 100));
            emitter.emit("loading", progress);

            if (!range) {
                passthrough.write(chunk);
            } else {
                const start = range.start;
                const end = range.end;
                const chunkEnd = byteOffset;

                let sliceStart = 0;
                let sliceEnd = chunk.length;

                if (byteOffset - chunk.length < start) {
                    sliceStart = start - (byteOffset - chunk.length);
                }
                if (chunkEnd > end) {
                    sliceEnd = sliceEnd - (chunkEnd - end);
                }

                const sliced = chunk.slice(sliceStart, sliceEnd);
                passthrough.write(sliced);

                if (byteOffset >= end) {
                    passthrough.end();
                    ytDlp.kill("SIGKILL");
                }
            }
        });

        ytDlp.stderr.on("data", data => console.error("yt-dlp stderr:", data.toString()));
        ytDlp.on("close", () => passthrough.end());

        // Podpinamy emitter do strumienia
        passthrough.on = function (...args) {
            emitter.on(...args);
            return passthrough;
        };

        return passthrough;
    };

    return {
        fileName: normalizeString(info.videoDetails.title),
        totalSize,
        mimeType,
        getStream
    };
};

let handler = (req, res) => {
    res.status(500).send("Can't stream content");
};

try {
    handler = createPartialContentHandler(streamContentProvider, {
        debug: msg => console.log("[Partial]", msg),
    });
} catch (error) {
    console.error(error);
}

router.get("/stream", handler);

module.exports = router;
