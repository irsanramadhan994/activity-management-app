const express = require('express');
const multer = require('multer');
const ActivityReport = require('../models/ActivityReport');
const Activity = require('../models/Activity');
const Image = require('../models/Image');
const auth = require('../middleware/auth');
const { objectIdValidation } = require('../utils/validation');
const { validationResult } = require('express-validator');

const router = express.Router();

// Multer configuration for memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, png, gif, webp)'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 10 // Max 10 files total
    }
});

/**
 * Save multiple uploaded files to MongoDB
 * @param {Array} files - Array of multer file objects
 * @returns {Promise<Array<string>>} - Array of image URLs
 */
async function saveImagesToDb(files) {
    const savePromises = files.map(async (file) => {
        const image = await Image.create({
            data: file.buffer,
            contentType: file.mimetype,
            filename: file.originalname,
            size: file.size
        });
        return `/api/images/${image._id}`;
    });
    return Promise.all(savePromises);
}

// @route   POST /api/reports
// @desc    Create activity report with photos
// @access  Private
router.post('/', auth, upload.fields([
    { name: 'photosGuestList', maxCount: 5 },
    { name: 'photosActivity', maxCount: 5 }
]), async (req, res, next) => {
    try {
        const { activityId, notes } = req.body;

        // Validate activity exists
        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        // Check user is assignee or creator
        const isAssignee = activity.assignees.some(a => a.toString() === req.user._id.toString());
        const isCreator = activity.createdBy.toString() === req.user._id.toString();

        if (!isAssignee && !isCreator) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to create a report for this activity'
            });
        }

        // Check if photos are provided
        if (!req.files || !req.files.photosGuestList || !req.files.photosActivity) {
            return res.status(400).json({
                success: false,
                message: 'Both guest list photos and activity photos are required'
            });
        }

        // Save photos to MongoDB
        const photosGuestList = await saveImagesToDb(req.files.photosGuestList);
        const photosActivity = await saveImagesToDb(req.files.photosActivity);

        // Check if report already exists for this activity
        const existingReport = await ActivityReport.findOne({ activityId });
        if (existingReport) {
            return res.status(400).json({
                success: false,
                message: 'A report already exists for this activity'
            });
        }

        const report = await ActivityReport.create({
            activityId,
            photosGuestList,
            photosActivity,
            userId: req.user._id,
            notes: notes || ''
        });

        const populatedReport = await ActivityReport.findById(report._id)
            .populate('activityId', 'name startDate endDate')
            .populate('userId', 'username');

        res.status(201).json({
            success: true,
            message: 'Report created successfully',
            data: populatedReport
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/reports/:activityId
// @desc    Get report for an activity
// @access  Private
router.get('/:activityId', auth, async (req, res, next) => {
    try {
        const { activityId } = req.params;

        const report = await ActivityReport.findOne({ activityId })
            .populate('activityId', 'name startDate endDate description priority')
            .populate('userId', 'username email');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/reports
// @desc    Get all reports for current user
// @access  Private
router.get('/', auth, async (req, res, next) => {
    try {
        const reports = await ActivityReport.find({ userId: req.user._id })
            .populate('activityId', 'name startDate endDate priority')
            .sort({ reportDate: -1 });

        res.json({
            success: true,
            data: reports
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
