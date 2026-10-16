import { parseMoney, normalizeTime, pickEarliestFlight } from '../support/utils/helpers';

const CARD = '[data-component="flight-card"]';
const responseBody = (interception) =>
  typeof interception.response.body === 'string' ? JSON.parse(interception.response.body) : interception.response.body;

class FlightResultsPage {
  /** Must be registered before the search is triggered. */
  interceptSearch() {
    cy.intercept('POST', '**/api/flights-bff/search/v1/flights').as('flightSearch');
  }

  /** Agoda polls the search API until `polling.completed` is true. */
  waitForSearchComplete() {
    cy.wait('@flightSearch', { timeout: 60000 }).then((interception) => {
      expect(interception.response.statusCode, 'flight search API status').to.eq(200);
      if (!responseBody(interception).data.polling.completed) this.waitForSearchComplete();
    });
  }

  verifyLoaded({ origin, destination, date, adults }) {
    cy.location('pathname').should('eq', '/flights/results');
    cy.location('search')
      .should('include', `departureFrom=${origin}`)
      .and('include', `arrivalTo=${destination}`)
      .and('include', `departDate=${date}`)
      .and('include', `adults=${adults}`)
      .and('include', 'searchType=1');
    cy.get(CARD, { timeout: 60000 }).should('have.length.greaterThan', 0);
  }

  /**
   * Agoda's airline filter only sends `carrier.preferred` (it re-ranks, it does not exclude),
   * so the airline is also enforced in collectFlights().
   */
  filterByAirline(airline) {
    cy.get('[data-testid="show-all-flight-filter-item-airline"]').click();
    cy.contains('[data-testid="flight-filter-item-airline"] p', new RegExp(`^${Cypress._.escapeRegExp(airline)}$`))
      .closest('[data-testid="flight-filter-item-airline"]')
      .click()
      .should('have.attr', 'aria-selected', 'true');
    this.waitForSearchComplete();
  }

  /** Infinite scroll: keep scrolling to the loader until the API reports the last page (loader disappears). */
  loadAllResults() {
    cy.get('body').then(($body) => {
      if (!$body.find('[data-testid="loading"]').length) return;
      cy.get('[data-testid="loading"]').scrollIntoView();
      cy.wait('@flightSearch', { timeout: 60000 }).then((interception) => {
        if (!responseBody(interception).data.pagination.lastPage) this.loadAllResults();
      });
    });
    cy.get('[data-testid="loading"]').should('not.exist');
  }

  /** Reads every rendered card operated by `airline` (exact name match, so mixed-carrier itineraries are excluded). */
  collectFlights(airline) {
    return cy.get(CARD).then(($cards) => {
      const text = (el, sel) => el.querySelector(sel)?.textContent.trim() || '';
      return [...$cards]
        .map((card, index) => ({
          index,
          airline: text(card, '[data-testid="flightCard-flight-detail"] p'),
          departureAirport: text(card, '[data-testid="origin"]'),
          arrivalAirport: text(card, '[data-testid="destination"]'),
          departureTime: normalizeTime(text(card, '[data-testid="departure-time"] h3')),
          arrivalTime: normalizeTime(text(card, '[data-testid="arrival-time"] h3')),
          arrivalDayOffset: text(card, '[data-testid="arrival-time"] span'), // e.g. "+1", empty when same day
          stops: Number(text(card, '[data-testid="layover"]') || 0),
          duration: text(card, '[data-testid="duration"]'),
          price: parseMoney(text(card, '[data-testid="flight-price-breakdown"]')),
        }))
        .filter((flight) => flight.airline === airline);
    });
  }

  /** Yields the earliest-departing flight of `airline`; fails clearly if the airline has no results. */
  findEarliestFlight(airline) {
    return this.collectFlights(airline).then((flights) => {
      expect(flights, `${airline} flights found in search results`).to.not.be.empty;
      const earliest = pickEarliestFlight(flights);
      cy.log(`${flights.length} ${airline} flights; departures: ${flights.map((f) => f.departureTime).join(', ')}`);
      cy.addTestContext({
        title: `${airline} candidates (departure → arrival, price)`,
        value: flights.map((f) => `${f.departureTime} → ${f.arrivalTime}${f.arrivalDayOffset} | ${f.stops} stop(s) | ${f.duration} | ${f.price.currency} ${f.price.amount}`),
      });
      cy.log(`Earliest: ${earliest.departureTime} -> ${earliest.arrivalTime}${earliest.arrivalDayOffset} ${earliest.price.currency} ${earliest.price.amount}`);
      return cy.wrap(earliest);
    });
  }

  /**
   * Expands the chosen card (index captured after all pages loaded, so it is stable),
   * enriches the flight with date/transit details shown in the expanded view, then clicks Select.
   */
  selectFlight(flight) {
    cy.get(CARD).eq(flight.index).as('selectedCard');
    cy.get('@selectedCard').find('[data-testid="flightCard-flight-detail"]').click();
    cy.get('@selectedCard').find('[data-testid="flight-details-expand"]').should('be.visible');
    return cy.get('@selectedCard').then(($card) => {
      const details = $card[0].querySelector('[data-testid="flight-details-expand"]');
      const selected = {
        ...flight,
        departureDate: details.querySelector('[data-testid="departure-date"]')?.textContent.trim(),
        transit: [...details.querySelectorAll('[data-testid="layover"]')].map((l) =>
          l.textContent.replace(/\s+/g, ' ').trim(),
        ),
      };
      cy.wrap($card).find('[data-testid="flight-detail-select-button"]').click();
      return cy.wrap(selected);
    });
  }
}

export default new FlightResultsPage();
