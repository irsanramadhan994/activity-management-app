const { body, param, query } = require('express-validator');

const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('phoneNumber')
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Please provide a valid phone number with country code (e.g., +1234567890)'),
    body('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('Role must be either user or admin')
];

const loginValidation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const activityValidation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Activity name is required and must not exceed 200 characters'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high'])
        .withMessage('Priority must be low, medium, or high'),
    body('assignees')
        .optional()
        .isArray()
        .withMessage('Assignees must be an array'),
    body('startDate')
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    body('endDate')
        .isISO8601()
        .withMessage('End date must be a valid date'),
    body('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters')
];

const objectIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid ID format')
];

const reminderValidation = [
    body('reminderTime')
        .isISO8601()
        .withMessage('Reminder time must be a valid date')
];

module.exports = {
    registerValidation,
    loginValidation,
    activityValidation,
    objectIdValidation,
    reminderValidation
};
