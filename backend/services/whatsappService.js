const axios = require('axios');

class WhatsAppService {
    constructor() {
        this.token = null;
        this.initialized = false;
    }

    initialize() {
        this.token = process.env.FONNTE_TOKEN;

        if (this.token) {
            this.initialized = true;
            console.log('WhatsApp service (Fonnte) initialized successfully');
        } else {
            console.warn('WhatsApp service not configured. Missing FONNTE_TOKEN.');
        }
    }

    async sendMessage(target, message) {
        if (!this.initialized) {
            console.warn('WhatsApp service not initialized. Skipping message.');
            return {
                success: false,
                error: 'WhatsApp service not configured'
            };
        }

        try {
            // Remove whatsapp: prefix if present (Twilio legacy format)
            let formattedTarget = target;
            if (formattedTarget.startsWith('whatsapp:')) {
                formattedTarget = formattedTarget.replace('whatsapp:', '');
            }

            const formData = new URLSearchParams();
            formData.append('target', formattedTarget);
            formData.append('message', message);

            const response = await axios.post(
                'https://api.fonnte.com/send',
                formData.toString(),
                {
                    headers: {
                        'Authorization': this.token,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            console.log(`WhatsApp message sent to ${target}:`, response.data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error(`Failed to send WhatsApp message to ${target}:`, error?.response?.data || error.message);
            return {
                success: false,
                error: error?.response?.data || error.message
            };
        }
    }

    async sendActivityReminder(activity, users) {
        const message = `🔔 Reminder Kegiatan\n\n` +
            `📌 ${activity.name}\n` +
            `📅 Tanngal Mulai: ${new Date(activity.startDate).toLocaleDateString('en-GB')}\n` +
            `📅 Tanggal Selesai: ${new Date(activity.endDate).toLocaleDateString('en-GB')}\n` +
            `⚡ Prioritas: ${activity.priority.toUpperCase()}\n` +
            (activity.description ? `📝 ${activity.description.substring(0, 100)}...` : '');

        const results = await Promise.allSettled(
            users.map(user => this.sendMessage(user.phoneNumber, message))
        );

        return results;
    }
}

module.exports = new WhatsAppService();
