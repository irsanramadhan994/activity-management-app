const express = require('express');
const axios = require('axios');

const router = express.Router();

const FONNTE_TOKEN = process.env.FONNTE_TOKEN;

// @route   POST /api/whatsapp/send-whatsapp
// @desc    Send a WhatsApp message via Fonnte
// @access  Public (add auth middleware if needed)
router.post('/send-whatsapp', async (req, res) => {
    try {
        const { target, message } = req.body;

        // Basic validation
        if (!target || !message) {
            return res.status(400).json({
                success: false,
                error: 'target and message are required'
            });
        }

        const formData = new URLSearchParams();
        formData.append('target', target);
        formData.append('message', message);

        const response = await axios.post(
            'https://api.fonnte.com/send',
            formData.toString(),
            {
                headers: {
                    'Authorization': FONNTE_TOKEN,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        return res.json({
            success: true,
            data: response.data
        });

    } catch (error) {
        console.error('Fonnte error:', error?.response?.data || error.message);

        return res.status(500).json({
            success: false,
            error: error?.response?.data || error.message || 'Failed to send message'
        });
    }
});

module.exports = router;
