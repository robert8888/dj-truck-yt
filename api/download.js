const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");
const contentDisposition = require("content-disposition");
const mfe = require("mime-file-extension");
const path = require("path");
const { getCookiesFilePath } = require("./../utils");


const ytDlpPath = path.resolve(__dirname, "../bin/yt-dlp");
const cookiesFilePath = getCookiesFilePath()

router.get("/download", async (req, res) => {
    const url = req.query.url;

    if (!url) return res.status(400).send("Missing URL");

    try {
        const meta = spawn(ytDlpPath, [
            "--dump-json",
            "--cookies", cookiesFilePath,
            url,
        ]);

        let json = "";

        meta.stdout.on("data", chunk => json += chunk.toString());
        meta.stderr.on("data", data => console.error("yt-dlp metadata stderr:", data.toString()));

        meta.on("close", () => {
            let info;
            try {
                info = JSON.parse(json);
            } catch (e) {
                return res.status(500).send("Metadata parse error");
            }

            const format = info.formats
                .filter(f => f.vcodec === "none" && f.acodec !== "none")
                .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];

            if (!format) return res.status(404).send("No suitable audio format found");

            const mimeType = format.mime_type?.split(";")[0] || "application/octet-stream";
            const extension = mfe.getFileExtensions(mimeType, true)[0] || ".mp3";
            const filename = contentDisposition(`${info.title}${extension}`);
            const filesize = format.filesize || format.filesize_approx;

            res.setHeader("Content-Disposition", filename);
            res.setHeader("Content-Type", mimeType);
            if (filesize) res.setHeader("Content-Length", filesize);
            res.setHeader("Accept-Ranges", "bytes");

            const dl = spawn(ytDlpPath, [
                "--cookies", cookiesFilePath,
                "-f", format.format_id,
                "-o", "-",
                "--no-part",
                url,
            ]);

            dl.stdout.pipe(res);
            dl.stderr.on("data", data => console.error("yt-dlp stderr:", data.toString()));
            dl.on("error", err => {
                console.error("yt-dlp error:", err);
                if (!res.headersSent) res.status(500).send("Download failed");
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

