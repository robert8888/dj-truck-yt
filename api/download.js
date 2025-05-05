const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const contentDisposition = require("content-disposition");
const { getFormat, getId } = require("./../utils");
const mfe = require("mime-file-extension");
const path = require("path");
const ytDlpPath = path.resolve(__dirname, "../bin/yt-dlp");

router.get("/download", async (req, res) => {
    const _url = req.query.url;
    const _id = req.query.id;

    const url = _url || `https://www.youtube.com/watch?v=${_id}`;
    const id = _id || getId(url);

    try {
        const format = await getFormat(id);
        const mimeType = format.mimeType.split(";")[0];
        const totalSize = parseInt(format.contentLength, 10);
        const fileExtensions = mfe.getFileExtensions(mimeType, true);
        const extension = fileExtensions[0] || ".mp4";

        const meta = spawn(ytDlpPath, ["--dump-json", url]);
        let json = "";
        let title = "download";

        meta.stdout.on("data", chunk => json += chunk.toString());

        meta.stderr.on("data", data => {
            console.error("yt-dlp metadata stderr:", data.toString());
        });

        meta.on("close", () => {
            try {
                const info = JSON.parse(json);
                title = info.title || title;
            } catch (e) {
                console.warn("Metadata parse failed, fallback filename used.");
            }

            const filename = contentDisposition(title + extension);
            res.setHeader("Content-Disposition", filename);
            res.setHeader("Content-Type", mimeType);
            res.setHeader("Content-Length", totalSize);
            res.setHeader("Accept-Ranges", "bytes");

            const ytdlp = spawn(ytDlpPath, [
                "-f", format.itag.toString(),
                "-o", "-",
                "--no-part",
                url
            ]);

            ytdlp.stdout.pipe(res);

            ytdlp.stderr.on("data", data => {
                console.error("yt-dlp stderr:", data.toString());
            });

            ytdlp.on("error", err => {
                console.error("yt-dlp error:", err);
                if (!res.headersSent) res.status(500).send("Download failed");
            });

            ytdlp.on("close", code => {
                if (code !== 0) {
                    console.error("yt-dlp exited with code", code);
                }
            });
        });
    } catch (err) {
        console.error("Unexpected error:", err);
        res.status(500).send("Server error");
    }
});

module.exports = router;
