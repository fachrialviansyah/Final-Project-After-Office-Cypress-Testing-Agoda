import 'cypress-mochawesome-reporter/register';
import './commands';

// Agoda's third-party scripts (analytics, ads) throw errors unrelated to the booking flow.
Cypress.on('uncaught:exception', () => false);
