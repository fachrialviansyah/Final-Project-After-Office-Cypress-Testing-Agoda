class FlightSearchPage {
  originInput() {
    return cy.get('[data-selenium="flight-origin-search-input"]');
  }

  destinationInput() {
    return cy.get('[data-selenium="flight-destination-search-input"]');
  }

  occupancy() {
    return cy.get('[data-element-name="flight-occupancy"]');
  }

  selectOneWay() {
    cy.get('[data-component="flight-search-type-oneWay"]').click();
  }

  // The first suggestion with the airport code is the direct match; later ones are "Nearby" duplicates.
  selectOrigin(city, airportCode) {
    this.originInput().click().type(city);
    cy.get(`[data-element-name="flight-origin-search-result"][data-objectid="${airportCode}"]`).first().click();
    this.originInput().should('have.value', `${city} (${airportCode})`);
  }

  selectDestination(city, airportCode) {
    this.destinationInput().click().type(city);
    cy.get(`[data-element-name="flight-destination-search-result"][data-objectid="${airportCode}"]`).first().click();
    this.destinationInput().invoke('val').should('include', city);
  }

  /**
   * The calendar opens by itself after the destination is picked and shows two months,
   * so tomorrow is always rendered (incl. month/year rollover).
   */
  selectDepartureDate(isoDate) {
    cy.get('[data-testid="flight-search-calendar-drone"]').should('be.visible');
    cy.get(`td[data-day="${isoDate}"] button`).click();
    cy.get('[data-component="flight-search-departureDate"]').should('not.contain.text', 'Departure');
  }

  // ponytail: only verifies the default (1 adult) which this scenario needs; add +/- controls if PASSENGER_COUNT changes.
  verifyPassengerCount(count) {
    this.occupancy().should('contain.text', `${count} Passenger`);
  }

  search() {
    cy.get('[data-element-name="flight-search"]').click();
  }
}

export default new FlightSearchPage();
