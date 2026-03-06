const express = require('express');
const { validationResult } = require('express-validator');
const Activity = require('../models/Activity');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { activityValidation, objectIdValidation } = require('../utils/validation');

const router = express.Router();

// @route   GET /api/activities
// @desc    Get activities for current user (assigned to them or created by them)
// @access  Private
router.get('/', auth, async (req, res, next) => {
    try {
        const { search, priority, startDate, endDate, page = 1, limit = 20 } = req.query;

        // Build query
        const query = {
            $or: [
                { assignees: req.user._id },
                { createdBy: req.user._id }
            ]
        };

        // Search filter
        if (search) {
            query.$and = [
                { $or: query.$or },
                {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } }
                    ]
                }
            ];
            delete query.$or;
        }

        // Priority filter
        if (priority && ['low', 'medium', 'high'].includes(priority)) {
            query.priority = priority;
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
            .populate('assignees', 'username email')
            .populate('createdBy', 'username')
            .sort({ startDate: 1 })
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

// @route   GET /api/activities/:id
// @desc    Get single activity
// @access  Private
router.get('/:id', auth, objectIdValidation, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const activity = await Activity.findById(req.params.id)
            .populate('assignees', 'username email phoneNumber')
            .populate('createdBy', 'username');

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        // Check if user has access (is assignee or creator or admin)
        const isAssignee = activity.assignees.some(a => a._id.toString() === req.user._id.toString());
        const isCreator = activity.createdBy._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'admin';

        if (!isAssignee && !isCreator && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: activity
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/activities
// @desc    Create new activity
// @access  Private
router.post('/', auth, activityValidation, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, priority, assignees, sub, startDate, endDate, description } = req.body;

        // Resolve assignees (can be usernames or IDs)
        let assigneeIds = [];
        if (assignees && assignees.length > 0) {
            for (const assignee of assignees) {
                let user;
                if (assignee.match(/^[0-9a-fA-F]{24}$/)) {
                    user = await User.findById(assignee);
                } else {
                    user = await User.findOne({ username: assignee });
                }
                if (user) {
                    assigneeIds.push(user._id);
                }
            }
        }

        // Always include creator as assignee if not already included
        if (!assigneeIds.some(id => id.toString() === req.user._id.toString())) {
            assigneeIds.push(req.user._id);
        }

        const activity = await Activity.create({
            name,
            priority: priority || 'medium',
            assignees: assigneeIds,
            sub: sub || '',
            startDate,
            endDate,
            description,
            createdBy: req.user._id
        });

        const populatedActivity = await Activity.findById(activity._id)
            .populate('assignees', 'username email')
            .populate('createdBy', 'username');

        res.status(201).json({
            success: true,
            message: 'Activity created successfully',
            data: populatedActivity
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/activities/:id
// @desc    Update activity (Admin only)
// @access  Private (Admin)
router.put('/:id', auth, roleCheck('admin'), objectIdValidation, activityValidation, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const activity = await Activity.findById(req.params.id);

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        const { name, priority, assignees, sub, startDate, endDate, description } = req.body;

        // Resolve assignees
        let assigneeIds = [];
        if (assignees && assignees.length > 0) {
            for (const assignee of assignees) {
                let user;
                if (assignee.match(/^[0-9a-fA-F]{24}$/)) {
                    user = await User.findById(assignee);
                } else {
                    user = await User.findOne({ username: assignee });
                }
                if (user) {
                    assigneeIds.push(user._id);
                }
            }
        }

        activity.name = name || activity.name;
        activity.priority = priority || activity.priority;
        activity.assignees = assigneeIds.length > 0 ? assigneeIds : activity.assignees;
        activity.sub = sub !== undefined ? sub : activity.sub;
        activity.startDate = startDate || activity.startDate;
        activity.endDate = endDate || activity.endDate;
        activity.description = description !== undefined ? description : activity.description;

        await activity.save();

        const updatedActivity = await Activity.findById(activity._id)
            .populate('assignees', 'username email')
            .populate('createdBy', 'username');

        res.json({
            success: true,
            message: 'Activity updated successfully',
            data: updatedActivity
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/activities/:id
// @desc    Delete activity (Admin only)
// @access  Private (Admin)
router.delete('/:id', auth, roleCheck('admin'), objectIdValidation, async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const activity = await Activity.findByIdAndDelete(req.params.id);

        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        res.json({
            success: true,
            message: 'Activity deleted successfully'
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/activities/calendar/events
// @desc    Get activities for calendar view
// @access  Private
router.get('/calendar/events', auth, async (req, res, next) => {
    try {
        const { start, end } = req.query;

        const query = {
            $or: [
                { assignees: req.user._id },
                { createdBy: req.user._id }
            ]
        };

        if (start) {
            query.startDate = { $gte: new Date(start) };
        }
        if (end) {
            query.endDate = { ...query.endDate, $lte: new Date(end) };
        }

        const activities = await Activity.find(query)
            .populate('assignees', 'username')
            .select('name startDate endDate priority');

        // Format for FullCalendar
        const events = activities.map(activity => ({
            id: activity._id,
            title: activity.name,
            start: activity.startDate,
            end: activity.endDate,
            backgroundColor: activity.priority === 'high' ? '#ef4444' :
                activity.priority === 'medium' ? '#f59e0b' : '#22c55e',
            borderColor: 'transparent',
            extendedProps: {
                priority: activity.priority,
                assignees: activity.assignees
            }
        }));

        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
