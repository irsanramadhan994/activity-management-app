const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Activity name is required'],
        trim: true,
        maxlength: [200, 'Name cannot exceed 200 characters']
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    assignees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    sub: {
        type: String,
        trim: true,
        default: ''
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reminderTime: {
        type: Date,
        default: null
    },
    reminderSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
activitySchema.index({ startDate: 1 });
activitySchema.index({ endDate: 1 });
activitySchema.index({ assignees: 1 });
activitySchema.index({ createdBy: 1 });
activitySchema.index({ reminderTime: 1, reminderSent: 1 });

// Validate end date is after start date
activitySchema.pre('save', function (next) {
    if (this.endDate < this.startDate) {
        const error = new Error('End date must be after start date');
        error.statusCode = 400;
        return next(error);
    }
    next();
});

module.exports = mongoose.model('Activity', activitySchema);
