const mongoose = require('mongoose');

const activityReportSchema = new mongoose.Schema({
    activityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
        required: [true, 'Activity ID is required']
    },
    photosGuestList: [{
        type: String,
        required: true
    }],
    photosActivity: [{
        type: String,
        required: true
    }],
    reportDate: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
}, {
    timestamps: true
});

// Index for efficient queries
activityReportSchema.index({ activityId: 1 });
activityReportSchema.index({ userId: 1 });

// Ensure at least one photo in each category
activityReportSchema.pre('save', function (next) {
    if (this.photosGuestList.length === 0) {
        const error = new Error('At least one guest list photo is required');
        error.statusCode = 400;
        return next(error);
    }
    if (this.photosActivity.length === 0) {
        const error = new Error('At least one activity photo is required');
        error.statusCode = 400;
        return next(error);
    }
    next();
});

module.exports = mongoose.model('ActivityReport', activityReportSchema);
