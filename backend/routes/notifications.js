const express = require('express');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Activity = require('../models/Activity');
const User = require('../models/User');
const whatsappService = require('../services/whatsappService');

const router = express.Router();

// @route   POST /api/notifications/send
// @desc    Manually send notification for an activity
// @access  Admin
router.post('/send', auth, roleCheck('admin'), async (req, res, next) => {
    try {
        const { activityId, message } = req.body;

        if (!activityId) {
            return res.status(400).json({
                success: false,
                message: 'Activity ID is required'
            });
        }

        const activity = await Activity.findById(activityId)
            .populate('assignees', 'username phoneNumber');

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        const customMessage = message || `Reminder: Activity "${activity.name}" is scheduled for ${activity.startDate.toLocaleDateString()}`;

        // Send to all assignees
        const results = await Promise.allSettled(
            activity.assignees.map(async (user) => {
                if (user.phoneNumber) {
                    return whatsappService.sendMessage(user.phoneNumber, customMessage);
                }
                return { success: false, reason: 'No phone number' };
            })
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failed = results.length - successful;

        res.json({
            success: true,
            message: `Notifications sent: ${successful} successful, ${failed} failed`,
            results
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/notifications/test
// @desc    Send test notification to a phone number
// @access  Admin
router.post('/test', auth, roleCheck('admin'), async (req, res, next) => {
    try {
        const { phoneNumber, message } = req.body;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        const testMessage = message || 'This is a test notification from Activity Management App';
        const result = await whatsappService.sendMessage(phoneNumber, testMessage);

        res.json({
            success: result.success,
            message: result.success ? 'Test notification sent successfully' : 'Failed to send notification',
            error: result.error
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
