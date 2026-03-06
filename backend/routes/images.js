const express = require('express');
const Image = require('../models/Image');

const router = express.Router();

/**
 * @route   GET /api/images/:id
 * @desc    Serve an image by its MongoDB ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);

        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        // Set cache headers (images don't change once uploaded)
        res.set('Cache-Control', 'public, max-age=86400');
        res.set('Content-Type', image.contentType);
        res.set('Content-Length', image.size);
        res.send(image.data);
    } catch (error) {
        console.error('Error serving image:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve image'
        });
    }
});

module.exports = router;
