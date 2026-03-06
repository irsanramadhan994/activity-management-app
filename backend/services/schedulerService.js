const cron = require('node-cron');
const Activity = require('../models/Activity');
const whatsappService = require('./whatsappService');

class SchedulerService {
    constructor() {
        this.job = null;
    }

    start() {
        // Run every minute to check for pending reminders
        this.job = cron.schedule('* * * * *', async () => {
            await this.checkReminders();
        });

        console.log('Scheduler service started - checking reminders every minute');
    }

    stop() {
        if (this.job) {
            this.job.stop();
            console.log('Scheduler service stopped');
        }
    }

    async checkReminders() {
        try {
            const now = new Date();
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

            // Find activities with reminders due in the past 5 minutes that haven't been sent
            const activities = await Activity.find({
                reminderTime: {
                    $lte: now,
                    $gte: fiveMinutesAgo
                },
                reminderSent: false
            }).populate('assignees', 'username phoneNumber');

            for (const activity of activities) {
                console.log(`Sending reminder for activity: ${activity.name}`);

                // Send WhatsApp reminders
                const usersWithPhone = activity.assignees.filter(u => u.phoneNumber);

                if (usersWithPhone.length > 0) {
                    await whatsappService.sendActivityReminder(activity, usersWithPhone);
                }

                // Mark reminder as sent
                activity.reminderSent = true;
                await activity.save();

                console.log(`Reminder sent for activity: ${activity.name}`);
            }
        } catch (error) {
            console.error('Error checking reminders:', error.message);
        }
    }

    // Send reminders for activities starting soon (called periodically)
    async sendUpcomingReminders() {
        try {
            const now = new Date();
            const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

            // Find activities starting in the next hour without custom reminder set
            const activities = await Activity.find({
                startDate: {
                    $gte: now,
                    $lte: oneHourFromNow
                },
                reminderTime: null,
                reminderSent: false
            }).populate('assignees', 'username phoneNumber');

            for (const activity of activities) {
                const usersWithPhone = activity.assignees.filter(u => u.phoneNumber);

                if (usersWithPhone.length > 0) {
                    const message = `⏰ Your activity "${activity.name}" starts in less than an hour!`;

                    for (const user of usersWithPhone) {
                        await whatsappService.sendMessage(user.phoneNumber, message);
                    }
                }

                activity.reminderSent = true;
                await activity.save();
            }
        } catch (error) {
            console.error('Error sending upcoming reminders:', error.message);
        }
    }
}

module.exports = new SchedulerService();
