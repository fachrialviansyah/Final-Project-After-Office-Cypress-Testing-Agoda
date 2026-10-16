class HomePage {
  flightsTab() {
    return cy.get('[data-element-name="flight-tab"]');
  }

  open() {
    cy.visit('/');
    cy.title().should('match', /agoda/i);
    this.flightsTab().should('be.visible');
  }

  goToFlights() {
    this.flightsTab().click();
    cy.get('[data-component="flight-search-type-oneWay"]').should('be.visible');
  }
}

export default new HomePage();
