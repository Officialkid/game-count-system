/**
 * Uptime Monitor Configuration
 * For use with UptimeRobot, Pingdom, or similar services
 */

export const uptimeConfig = {
  // Health check endpoints to monitor
  endpoints: [
    {
      name: 'API Health',
      url: 'https://your-app.vercel.app/api/health',
      method: 'GET',
      interval: 300, // 5 minutes
      expectedStatus: 200,
      timeout: 10000, // 10 seconds
    },
    {
      name: 'Metrics Endpoint',
      url: 'https://your-app.vercel.app/api/metrics',
      method: 'GET',
      interval: 600, // 10 minutes
      expectedStatus: 200,
      timeout: 10000,
    },
  ],

  // Alert contacts
  alerts: {
    email: process.env.ADMIN_EMAIL || 'admin@yourdomain.com',
    slack: process.env.SLACK_WEBHOOK,
  },

  // Thresholds
  thresholds: {
    responseTime: 3000, // Alert if response time > 3 seconds
    downtime: 300, // Alert after 5 minutes of downtime
    availability: 99.5, // Alert if availability drops below 99.5%
  },
};

/**
 * UptimeRobot API Configuration
 * https://uptimerobot.com/api/
 */
export const uptimeRobotConfig = {
  apiKey: process.env.UPTIMEROBOT_API_KEY,
  monitors: [
    {
      friendly_name: 'Camp Countdown - API',
      url: 'https://your-app.vercel.app/api/health',
      type: 1, // HTTP(s)
      interval: 300, // 5 minutes
      http_method: 1, // GET
      alert_contacts: process.env.UPTIMEROBOT_ALERT_CONTACTS,
    },
    {
      friendly_name: 'Camp Countdown - Appwrite',
      url: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT + '/health',
      type: 1,
      interval: 300,
      http_method: 1,
      alert_contacts: process.env.UPTIMEROBOT_ALERT_CONTACTS,
    },
  ],
};

/**
 * Better Stack (formerly Better Uptime) Configuration
 * https://betterstack.com/uptime
 */
export const betterStackConfig = {
  apiKey: process.env.BETTERSTACK_API_KEY,
  monitors: [
    {
      url: 'https://your-app.vercel.app',
      monitor_type: 'status',
      pronounceable_name: 'Camp Countdown App',
      check_frequency: 300,
      request_timeout: 30,
      confirmation_period: 300,
      regions: ['us', 'eu', 'as'],
    },
    {
      url: 'https://your-app.vercel.app/api/health',
      monitor_type: 'status',
      pronounceable_name: 'Camp Countdown API',
      check_frequency: 300,
      request_timeout: 10,
      confirmation_period: 180,
    },
  ],
};
