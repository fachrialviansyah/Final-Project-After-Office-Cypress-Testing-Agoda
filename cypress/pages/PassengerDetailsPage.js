const PAX = 'flight.forms.i0.units.i0.'; // first (and only) adult passenger form
const byTestId = (id) => cy.get(`[data-testid="${id}"]`);

class PassengerDetailsPage {
  verifyLoaded() {
    cy.location('pathname', { timeout: 60000 }).should('eq', '/packages/book');
    byTestId('contact.contactFirstName').should('be.visible');
  }

  fillContact(contact) {
    byTestId('contact.contactFirstName').clear().type(contact.firstName);
    byTestId('contact.contactLastName').clear().type(contact.lastName);
    byTestId('contact.contactEmail').clear().type(contact.email);
    cy.selectListboxOption('contact.contactCountryOfResidenceId', contact.countryOfResidence);
    byTestId('contact.contactPhoneNumber-PhoneNumberDataTestId').clear().type(contact.phoneNumber);
  }

  fillPassenger(passenger) {
    cy.selectListboxOption(`${PAX}passengerNationality`, passenger.nationality);
    cy.get(`[data-testid="${PAX}passengerGender"] input[aria-label="${passenger.gender}"]`).check({ force: true });
    byTestId(`${PAX}passengerFirstName`).clear().type(passenger.firstName);
    byTestId(`${PAX}passengerLastName`).clear().type(passenger.lastName);
    this.fillDate(`${PAX}passengerDateOfBirth`, passenger.dateOfBirth);
    byTestId(`${PAX}passportNumber`).clear().type(passenger.passport.number);
    cy.selectListboxOption(`${PAX}passportCountryOfIssue`, passenger.passport.countryOfIssue);
    this.fillDate(`${PAX}passportExpiryDate`, passenger.passport.expiryDate);
  }

  fillDate(field, { day, month, year }) {
    byTestId(`${field}-DateInputDataTestId`).clear().type(day);
    cy.selectListboxOption(`${field}-MonthInputDataTestId`, month);
    byTestId(`${field}-YearInputDataTestId`).clear().type(year);
  }

  verifyContact(contact) {
    byTestId('contact.contactFirstName').should('have.value', contact.firstName);
    byTestId('contact.contactLastName').should('have.value', contact.lastName);
    byTestId('contact.contactEmail').should('have.value', contact.email);
    cy.verifyListboxValue('contact.contactCountryOfResidenceId', contact.countryOfResidence);
    byTestId('contact.contactPhoneNumber-CountryCodeDataTestId').should('contain.text', contact.phoneCountryCode);
    byTestId('contact.contactPhoneNumber-PhoneNumberDataTestId').should('have.value', contact.phoneNumber);
  }

  verifyPassenger(passenger) {
    cy.verifyListboxValue(`${PAX}passengerNationality`, passenger.nationality);
    cy.get(`[data-testid="${PAX}passengerGender"] input[aria-label="${passenger.gender}"]`).should('be.checked');
    byTestId(`${PAX}passengerFirstName`).should('have.value', passenger.firstName);
    byTestId(`${PAX}passengerLastName`).should('have.value', passenger.lastName);
    this.verifyDate(`${PAX}passengerDateOfBirth`, passenger.dateOfBirth);
    byTestId(`${PAX}passportNumber`).should('have.value', passenger.passport.number);
    cy.verifyListboxValue(`${PAX}passportCountryOfIssue`, passenger.passport.countryOfIssue);
    this.verifyDate(`${PAX}passportExpiryDate`, passenger.passport.expiryDate);
  }

  verifyDate(field, { day, month, year }) {
    byTestId(`${field}-DateInputDataTestId`).should('have.value', day);
    cy.verifyListboxValue(`${field}-MonthInputDataTestId`, month);
    byTestId(`${field}-YearInputDataTestId`).should('have.value', year);
  }

  /** Trip protection is a required yes/no choice; "No" keeps the price unchanged. */
  declineTripProtection() {
    byTestId('radio-button-option-no').click();
  }

  /** Total of the booking summary sidebar, e.g. { currency: 'Rp', currencyCode: 'IDR', amount: 2657937 }. */
  getSummaryTotal() {
    return cy.readSummaryTotal('Booking summary (passenger details page)');
  }

  /** Clicks continue; declines the "Upgrade your support level" upsell modal if Agoda shows it. */
  continueToPayment() {
    byTestId('continue-to-payment-button').click();
    cy.get('[data-component="last-chance-decline-button"], [data-component="contact-summary"]', { timeout: 30000 }).then(($el) => {
      if ($el.is('[data-component="last-chance-decline-button"]')) cy.wrap($el).click();
    });
  }
}

export default new PassengerDetailsPage();
