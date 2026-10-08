import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // UI Testing
  baseURL: process.env.BASE_URL || 'https://emicalculator.net/',
  headless: process.env.HEADLESS !== 'false',
  slowMo: parseInt(process.env.SLOW_MO || '0'),
  timeout: parseInt(process.env.TIMEOUT || '30000'),
  navigationTimeout: parseInt(process.env.NAVIGATION_TIMEOUT || '30000'),

  // API Testing
  apiBaseURL: process.env.API_BASE_URL || 'http://localhost:3000',
  apiTimeout: parseInt(process.env.API_TIMEOUT || '10000'),

  // Reporting
  screenshotOnFailure: process.env.SCREENSHOT_ON_FAILURE !== 'false',
  videoOnFailure: process.env.VIDEO_ON_FAILURE !== 'false',

  // Environment
  environment: process.env.ENVIRONMENT || 'local',
  isCI: process.env.CI === 'true',
};

export default config;
