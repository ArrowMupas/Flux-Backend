const express = require('express');
const router = express.Router();
const { upload } = require('../utilities/cloudinary');

router.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.status(200).json({
        success: true,
        message: 'Uploaded!',
        data: {
            url: req.file.path,
            public_id: req.file.filename,
        },
    });
});

module.exports = router;
