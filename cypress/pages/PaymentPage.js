import { normalizeTime } from '../support/utils/helpers';

const squash = (s) => (s || '').replace(/\s+/g, ' ').trim();

class PaymentPage {
  verifyLoaded() {
    cy.location('pathname', { timeout: 60000 }).should('eq', '/packages/payment');
    cy.get('[data-testid="payment-details"]').should('be.visible');
    cy.get('[data-component="contact-summary"]').should('be.visible');
  }

  getTotal() {
    return cy.readSummaryTotal('Payment page');
  }

  /** { name, email, phone } from the "Contact details" summary. */
  getContact() {
    // "contact-summary" is only the heading; the contact block is its next sibling.
    return cy
      .get('[data-component="contact-summary"] + [data-component="name-container"]')
      .should('have.length', 1)
      .then(($c) => {
      const details = [...$c[0].querySelectorAll('[data-component="name-container-detail"] > span')].map((s) => squash(s.textContent));
      return { name: squash($c.find('[data-component="name-container-name"]').text()), email: details[0], phone: details[1] };
    });
  }

  /** [{ name, details: [...] }] from the "Passenger details" summary. */
  getPassengers() {
    return cy.get('[data-component="passenger-summary-list"] [data-component="name-container"]').then(($items) =>
      [...$items].map((item) => ({
        name: squash(item.querySelector('[data-component="name-container-name"]').textContent),
        details: [...item.querySelectorAll('[data-component="name-container-detail"] > span')].map((s) => squash(s.textContent)),
      })),
    );
  }

  /**
   * Flight summary: "Depart - Sat, Oct 17, 2026" and "CGK 12:15 → SIN 00:10 +1 Malaysia Airlines".
   * Times are the airports' local times, same as on the results card.
   */
  getFlight() {
    return cy.get('[data-testid="flight-slice-item-container"]').then(($slice) => {
      const route = $slice.find('[data-testid="flight-slice-item-origin-dest"]')[0];
      const legs = [...route.children].map((el) => squash(el.textContent)).filter(Boolean);
      const [dep, arr] = legs.map((t) => /^([A-Z]{3}) (\d{1,2}:\d{2})\s*(\+\d)?/.exec(t)).filter(Boolean);
      expect(dep, `departure leg in "${legs.join(' | ')}"`).to.exist;
      expect(arr, `arrival leg in "${legs.join(' | ')}"`).to.exist;
      return {
        departureDate: squash($slice.find('[data-testid="flight-slice-item-departure-date"]').text()).replace(/^Depart\s*-\s*/, ''),
        departureAirport: dep[1],
        departureTime: normalizeTime(dep[2]),
        arrivalAirport: arr[1],
        arrivalTime: normalizeTime(arr[2]),
        arrivalDayOffset: arr[3] || '',
        routeText: squash($slice.find('[data-testid="flight-route-info"]').text()), // includes airline name
      };
    });
  }

  /** The flow must end here: Pay button present but untouched, booking not confirmed (step 3). */
  verifyNotPaid() {
    cy.get('[data-component="payment-PayNow"]').should('exist');
    cy.location('pathname').should('eq', '/packages/payment');
  }
}

export default new PaymentPage();
