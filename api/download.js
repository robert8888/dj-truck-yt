// const express = require("express");
// const router = express.Router();
// const { spawn } = require("child_process");
// const contentDisposition = require("content-disposition");
// const { getFormat, getId } = require("./../utils");
// const mfe = require("mime-file-extension");
// const path = require("path");
// const ytDlpPath = path.resolve(__dirname, "../bin/yt-dlp");
//
// router.get("/download", async (req, res) => {
//     console.log("helow from donwlaod")
//     const _url = req.query.url;
//     const _id = req.query.id;
//
//     const url = _url || `https://www.youtube.com/watch?v=${_id}`;
//     const id = _id || getId(url);
//
//     try {
//         const format = await getFormat(id);
//         const mimeType = format.mimeType.split(";")[0];
//         const totalSize = parseInt(format.contentLength, 10);
//         console.log("the total size", totalSize)
//         console.log("FORMAT: ", format)
//         const fileExtensions = mfe.getFileExtensions(mimeType, true);
//         const extension = fileExtensions[0] || ".mp4";
//
//         const meta = spawn(ytDlpPath, ["--dump-json", url]);
//         let json = "";
//         let title = "download";
//
//         meta.stdout.on("data", chunk => json += chunk.toString());
//
//         meta.stderr.on("data", data => {
//             console.error("yt-dlp metadata stderr:", data.toString());
//         });
//
//         meta.on("close", () => {
//             try {
//                 const info = JSON.parse(json);
//                 title = info.title || title;
//             } catch (e) {
//                 console.warn("Metadata parse failed, fallback filename used.");
//             }
//
//             const filename = contentDisposition(title + extension);
//             res.setHeader("Content-Disposition", filename);
//             res.setHeader("Content-Type", mimeType);
//             res.setHeader("Content-Length", totalSize);
//             res.setHeader("Accept-Ranges", "bytes");
//
//             const ytdlp = spawn(ytDlpPath, [
//                 "-f", format.itag.toString(),
//                 "-o", "-",
//                 "--no-part",
//                 url
//             ]);
//
//             ytdlp.stdout.pipe(res);
//
//             ytdlp.stderr.on("data", data => {
//                 console.error("yt-dlp stderr:", data.toString());
//             });
//
//             ytdlp.on("error", err => {
//                 console.error("yt-dlp error:", err);
//                 if (!res.headersSent) res.status(500).send("Download failed");
//             });
//
//             ytdlp.on("close", code => {
//                 if (code !== 0) {
//                     console.error("yt-dlp exited with code", code);
//                 }
//             });
//         });
//     } catch (err) {
//         console.error("Unexpected error:", err);
//         res.status(500).send("Server error");
//     }
// });
//
// module.exports = router;
const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const contentDisposition = require("content-disposition");
const path = require("path");
const mfe = require("mime-file-extension");

const ytDlpPath = path.resolve(__dirname, "../bin/yt-dlp");

router.get("/download", async (req, res) => {
    const _url = req.query.url;
    const _id = req.query.id;
    const url = _url || `https://www.youtube.com/watch?v=${_id}`;

    try {
        // Use yt-dlp to get metadata in JSON
        const metaProc = spawn(ytDlpPath, ["--dump-json", url]);
        let json = "";

        metaProc.stdout.on("data", chunk => json += chunk.toString());
        metaProc.stderr.on("data", data => console.error("yt-dlp stderr:", data.toString()));

        metaProc.on("close", () => {
            let info;
            try {
                info = JSON.parse(json);
            } catch (e) {
                console.error("Metadata parse failed:", e);
                return res.status(500).send("Failed to parse video metadata.");
            }

            const title = info.title || "download";
            const bestAudio = info.formats.find(f => f.format_id === info.format_id || f.format_note === 'bestaudio') || info.formats.find(f => f.vcodec === "none");

            if (!bestAudio) {
                console.error("No suitable audio format found.");
                return res.status(404).send("No audio format found.");
            }

            const mimeType = bestAudio.ext === 'webm' ? 'audio/webm' : 'audio/mpeg';
            const extension = mfe.getFileExtensions(mimeType, true)[0] || ".mp3";

            const filename = contentDisposition(`${title}${extension}`);
            res.setHeader("Content-Disposition", filename);
            res.setHeader("Content-Type", mimeType);
            if (bestAudio.filesize) {
                res.setHeader("Content-Length", bestAudio.filesize);
            }
            res.setHeader("Accept-Ranges", "bytes");

            // Stream directly from yt-dlp
            const dl = spawn(ytDlpPath, ["-f", bestAudio.format_id, "-o", "-", "--no-part", url]);

            dl.stdout.pipe(res);
            dl.stderr.on("data", data => console.error("yt-dlp download stderr:", data.toString()));
            dl.on("error", err => {
                console.error("yt-dlp process error:", err);
                if (!res.headersSent) res.status(500).send("Download error");
            });
            dl.on("close", code => {
                if (code !== 0) console.error("yt-dlp exited with code", code);
            });
        });
    } catch (err) {
        console.error("Unexpected error:", err);
        res.status(500).send("Server error");
    }
});

module.exports = router;
