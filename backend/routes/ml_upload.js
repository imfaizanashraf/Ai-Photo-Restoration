// 

const express = require('express');
const multer = require('multer');
const path = require('path');
require('dotenv').config();
const fetch = require('node-fetch');
const Replicate = require("replicate");
const fs = require("fs");
const { pool } = require('../config/db');
const { createWriteStream } = require('fs');
const { Readable } = require('stream');
const auth = require('../middleware/auth');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extname) {
        return cb(null, true);
    }
    cb('Error: Only images are allowed (jpeg, jpg, png, gif).');
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 }, // 10MB limit
    fileFilter: fileFilter
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Helper function to save a web ReadableStream to a file
async function saveWebStreamToFile(webStream, filePath) {
    const nodeStream = require('fs').createWriteStream(filePath);
    const reader = webStream.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        nodeStream.write(Buffer.from(value));
    }
    nodeStream.end();
}

// @route   POST /api/restore
// @desc    Accepts an image, processes it using Replicate, returns restored image URL
// @access  Private (requires login and active plan)
router.post('/api/restore', auth, upload.single('photo'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded.' });
    }

    // Use your new ngrok public URL
    const ngrokUrl = process.env.PUBLIC_BASE_URL;
    const imageUrl = `${ngrokUrl}/uploads/${req.file.filename}`;

    try {
        // 1. Get user ID from req.user (set by auth middleware)
        const userId = req.user.id;

        // 2. Get current credits
        const [rows] = await pool.query('SELECT photo_credits FROM users WHERE id = ?', [userId]);
        if (!rows.length || rows[0].photo_credits <= 0) {
            return res.status(403).json({ msg: 'No photo credits remaining.' });
        }

        // 3. Decrement credits
        const newCredits = rows[0].photo_credits - 1;
        await pool.query('UPDATE users SET photo_credits = ? WHERE id = ?', [newCredits, userId]);

        const input = {
            input_image: imageUrl,
            output_format: "png",
            safety_tolerance: 2
        };
        const output = await replicate.run("flux-kontext-apps/restore-image", { input });
        console.log("Replicate output type:", typeof output, output && output.constructor && output.constructor.name);
        console.log('Replicate output full object:', output);

        if (output && typeof output === 'object' && output.constructor && output.constructor.name === 'FileOutput') {
            const baseName = path.parse(req.file.filename).name; // removes extension
            const restoredFilename = `restored-${baseName}.png`;
            const restoredPath = path.join(__dirname, '../../uploads', restoredFilename);
            if (typeof output.buffer === 'function') {
                try {
                    const buffer = await output.buffer();
                    fs.writeFileSync(restoredPath, buffer);
                    const restoredUrl = `${ngrokUrl}/uploads/${restoredFilename}`;
                    console.log('Restored image URL:', restoredUrl);
                    res.json({ restored: restoredUrl, photo_credits: newCredits });
                    return;
                } catch (err) {
                    console.error('Error writing buffer to file:', err);
                    res.status(500).json({ msg: 'Error writing buffer to file', error: err.message });
                    return;
                }
            }
            if (typeof output.arrayBuffer === 'function') {
                try {
                    const arrayBuffer = await output.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    fs.writeFileSync(restoredPath, buffer);
                    const restoredUrl = `${ngrokUrl}/uploads/${restoredFilename}`;
                    console.log('Restored image URL:', restoredUrl);
                    res.json({ restored: restoredUrl, photo_credits: newCredits });
                    return;
                } catch (err) {
                    console.error('Error writing arrayBuffer to file:', err);
                    res.status(500).json({ msg: 'Error writing arrayBuffer to file', error: err.message });
                    return;
                }
            }
            try {
                await saveWebStreamToFile(output, restoredPath);
                const restoredUrl = `${ngrokUrl}/uploads/${restoredFilename}`;
                console.log('Restored image URL:', restoredUrl);
                res.json({ restored: restoredUrl, photo_credits: newCredits });
            } catch (err) {
                console.error('Error manually saving web stream to file:', err);
                res.status(500).json({ msg: 'Error manually saving web stream to file', error: err.message });
            }
            return;
        } else {
            let restoredUrl;
            if (Array.isArray(output)) {
                restoredUrl = output[0];
            } else if (typeof output === 'object' && output !== null) {
                restoredUrl = output.url || output.output || Object.values(output)[0];
            } else {
                restoredUrl = output;
            }
            console.log('Restored image URL:', restoredUrl);
            res.json({ restored: restoredUrl, photo_credits: newCredits });
        }
    } catch (err) {
        console.error('Error in restore endpoint:', err);
        res.status(500).json({ msg: 'Error restoring image', error: err.message });
    }
});

module.exports = router; 