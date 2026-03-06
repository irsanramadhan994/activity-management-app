const express = require('express');
const { validationResult } = require('express-validator');
const Activity = require('../models/Activity');
const User = require('../models/User');
const ActivityReport = require('../models/ActivityReport');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { objectIdValidation, reminderValidation } = require('../utils/validation');

const router = express.Router();

// All admin routes require admin role
router.use(auth, roleCheck('admin'));

// @route   GET /api/admin/activities
// @desc    Get all activities (admin view)
// @access  Admin
router.get('/activities', async (req, res, next) => {
    try {
        const { search, priority, username, startDate, endDate, page = 1, limit = 20 } = req.query;

        let query = {};

        // Search filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Priority filter
        if (priority && ['low', 'medium', 'high'].includes(priority)) {
            query.priority = priority;
        }

        // Username filter
        if (username) {
            const user = await User.findOne({ username: { $regex: username, $options: 'i' } });
            if (user) {
                query.$or = [
                    { assignees: user._id },
                    { createdBy: user._id }
                ];
            }
        }

        // Date range filter
        if (startDate) {
            query.startDate = { $gte: new Date(startDate) };
        }
        if (endDate) {
            query.endDate = { ...query.endDate, $lte: new Date(endDate) };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const activities = await Activity.find(query)
            .populate('assignees', 'username email phoneNumber')
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Activity.countDocuments(query);

        res.json({
            success: true,
            data: activities,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/admin/activities/:id
// @desc    Get single activity details (admin)
// @access  Admin
router.get('/activities/:id', objectIdValidation, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const activity = await Activity.findById(req.params.id)
            .populate('assignees', 'username email phoneNumber')
            .populate('createdBy', 'username email');

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        // Also get report if exists
        const report = await ActivityReport.findOne({ activityId: activity._id });

        res.json({
            success: true,
            data: {
                ...activity.toObject(),
                hasReport: !!report,
                report
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/admin/activities/:id/reminder
// @desc    Set reminder time for activity
// @access  Admin
router.put('/activities/:id/reminder', objectIdValidation, reminderValidation, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { reminderTime } = req.body;

        const activity = await Activity.findById(req.params.id);

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        activity.reminderTime = new Date(reminderTime);
        activity.reminderSent = false;
        await activity.save();

        res.json({
            success: true,
            message: 'Reminder set successfully',
            data: {
                activityId: activity._id,
                reminderTime: activity.reminderTime
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/admin/activities/:id/reminder
// @desc    Remove reminder from activity
// @access  Admin
router.delete('/activities/:id/reminder', objectIdValidation, async (req, res, next) => {
    try {
        const activity = await Activity.findById(req.params.id);

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        activity.reminderTime = null;
        activity.reminderSent = false;
        await activity.save();

        res.json({
            success: true,
            message: 'Reminder removed successfully'
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', async (req, res, next) => {
    try {
        const { search, role, page = 1, limit = 20 } = req.query;

        let query = {};

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (role && ['user', 'admin'].includes(role)) {
            query.role = role;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Admin
router.get('/stats', async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalActivities = await Activity.countDocuments();
        const totalReports = await ActivityReport.countDocuments();

        const now = new Date();
        const upcomingActivities = await Activity.countDocuments({
            startDate: { $gte: now }
        });

        const activitiesByPriority = await Activity.aggregate([
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalActivities,
                totalReports,
                upcomingActivities,
                activitiesByPriority
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
