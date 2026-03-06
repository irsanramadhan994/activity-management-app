require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const whatsappService = require('./services/whatsappService');
const schedulerService = require('./services/schedulerService');

// Import routes
const authRoutes = require('./routes/auth');
const imageRoutes = require('./routes/images');
const activityRoutes = require('./routes/activities');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const whatsappRoutes = require('./routes/whatsapp');

const app = express();

// Connect to MongoDB
connectDB();

// Initialize WhatsApp service
whatsappService.initialize();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Start scheduler service
    schedulerService.start();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    schedulerService.stop();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    schedulerService.stop();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;
