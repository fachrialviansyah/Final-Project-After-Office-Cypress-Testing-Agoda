require('dotenv').config();
const { defineConfig } = require('cypress');

const REQUIRED_ENV = [
  'AGODA_BASE_URL',
  'DEPARTURE_CITY',
  'DEPARTURE_AIRPORT',
  'DESTINATION_CITY',
  'DESTINATION_AIRPORT',
  'PASSENGER_COUNT',
  'AIRLINE_NAME',
];

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env.`);
}

module.exports = defineConfig({
  video: true,
  videosFolder: 'cypress/videos',
  screenshotsFolder: 'cypress/screenshots',
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    reportPageTitle: 'Agoda Flight Booking E2E',
    charts: true,
    embeddedScreenshots: true,
    inlineAssets: true,
    saveJson: true,
    // Keep merged JSON + config so `npm run cy:report` can rebuild the HTML without re-running.
    configOutput: true,
    removeJsonsFolderAfterMerge: false,
  },
  e2e: {
    baseUrl: process.env.AGODA_BASE_URL,
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1920,
    viewportHeight: 1080,
    defaultCommandTimeout: 20000,
    pageLoadTimeout: 90000,
    // Cypress 16 replaced Cypress.env() with Cypress.expose() for non-sensitive values.
    expose: Object.fromEntries(REQUIRED_ENV.map((key) => [key, process.env[key]])),
    setupNodeEvents(on, config) {
      require('cypress-mochawesome-reporter/plugin')(on);
      return config;
    },
  },
});
