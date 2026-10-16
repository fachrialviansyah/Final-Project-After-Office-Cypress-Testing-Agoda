import homePage from '../pages/HomePage';
import flightSearchPage from '../pages/FlightSearchPage';
import flightResultsPage from '../pages/FlightResultsPage';
import passengerDetailsPage from '../pages/PassengerDetailsPage';
import paymentPage from '../pages/PaymentPage';
import { getTomorrow } from '../support/utils/helpers';

const env = {
  departureCity: Cypress.expose('DEPARTURE_CITY'),
  departureAirport: Cypress.expose('DEPARTURE_AIRPORT'),
  destinationCity: Cypress.expose('DESTINATION_CITY'),
  destinationAirport: Cypress.expose('DESTINATION_AIRPORT'),
  passengerCount: Number(Cypress.expose('PASSENGER_COUNT')),
  airline: Cypress.expose('AIRLINE_NAME'),
};
const fullName = (p) => `${p.firstName} ${p.lastName}`.toLowerCase();

describe('Agoda flight booking — one way, earliest flight of the configured airline', () => {
  const departure = getTomorrow();
  const expected = { flight: null, totalPrice: null };

  beforeEach(function () {
    cy.fixture('passenger').as('pax');
  });

  it(`books ${env.departureAirport} → ${env.destinationAirport} for tomorrow up to the payment page without paying`, function () {
    const { contact, passenger } = this.pax;

    // Step 1 — open Agoda and go to Flights
    homePage.open();
    homePage.goToFlights();

    // Step 2 — search one-way, tomorrow, 1 adult
    flightSearchPage.selectOneWay();
    flightSearchPage.selectOrigin(env.departureCity, env.departureAirport);
    flightSearchPage.selectDestination(env.destinationCity, env.destinationAirport);
    flightSearchPage.selectDepartureDate(departure.iso);
    flightSearchPage.verifyPassengerCount(env.passengerCount);
    flightResultsPage.interceptSearch();
    flightSearchPage.search();

    flightResultsPage.waitForSearchComplete();
    flightResultsPage.verifyLoaded({
      origin: env.departureAirport,
      destination: env.destinationAirport,
      date: departure.iso,
      adults: env.passengerCount,
    });

    // Step 3 — earliest departure of the airline across all loaded results
    flightResultsPage.filterByAirline(env.airline);
    flightResultsPage.loadAllResults();
    flightResultsPage
      .findEarliestFlight(env.airline)
      .then((earliest) => flightResultsPage.selectFlight(earliest))
      .then((flight) => {
        expected.flight = flight;
        expect(flight.airline, 'selected airline').to.eq(env.airline);
        expect(flight.departureAirport, 'selected departure airport').to.eq(env.departureAirport);
        expect(flight.arrivalAirport, 'selected arrival airport').to.eq(env.destinationAirport);
        expect(flight.departureDate, 'selected departure date').to.eq(departure.shortLabel);
        cy.addTestContext({ title: 'Selected flight (expected)', value: flight });
      });

    // Step 4 — passenger details from fixture
    passengerDetailsPage.verifyLoaded();
    passengerDetailsPage.fillContact(contact);
    passengerDetailsPage.fillPassenger(passenger);
    passengerDetailsPage.verifyContact(contact);
    passengerDetailsPage.verifyPassenger(passenger);
    passengerDetailsPage.declineTripProtection();
    passengerDetailsPage.getSummaryTotal().then((total) => {
      expected.totalPrice = total;
      cy.addTestContext({ title: 'Expected total price (booking summary)', value: total });
    });
    passengerDetailsPage.continueToPayment();
    paymentPage.verifyLoaded();

    // Step 5 — total price matches the booking summary (same component: total incl. taxes & discounts)
    paymentPage.getTotal().then((actual) => {
      cy.addTestContext({ title: 'Actual total price (payment page)', value: actual });
      expect(actual.currencyCode, 'payment total currency').to.eq(expected.totalPrice.currencyCode);
      expect(actual.currency, 'payment total currency symbol').to.eq(expected.totalPrice.currency);
      expect(actual.amount, 'payment total amount').to.eq(expected.totalPrice.amount);
    });

    // Step 6 — passenger & contact details
    paymentPage.getContact().then((shown) => {
      expect(shown.name.toLowerCase(), 'contact full name').to.eq(fullName(contact));
      expect(shown.email, 'contact email').to.eq(contact.email);
      expect(shown.phone.replace(/\s/g, ''), 'contact phone').to.eq(`${contact.phoneCountryCode}${contact.phoneNumber}`);
    });
    paymentPage.getPassengers().then((passengers) => {
      expect(passengers, 'passenger count').to.have.length(env.passengerCount);
      expect(passengers[0].name.toLowerCase(), 'passenger full name').to.eq(fullName(passenger));
      expect(passengers[0].details, 'passenger passport').to.include(`Passport: ${passenger.passport.number}`);
    });

    // Step 7 — flight route, date, times (both pages show each airport's local time)
    paymentPage.getFlight().then((shown) => {
      const { flight } = expected;
      expect(shown.routeText, 'airline').to.include(env.airline);
      expect(shown.departureAirport, 'departure airport').to.eq(flight.departureAirport);
      expect(shown.arrivalAirport, 'destination airport').to.eq(flight.arrivalAirport);
      expect(shown.departureDate, 'departure date').to.eq(departure.longLabel);
      expect(shown.departureTime, 'departure time').to.eq(flight.departureTime);
      expect(shown.arrivalTime, 'arrival time').to.eq(flight.arrivalTime);
      expect(shown.arrivalDayOffset, 'arrival day offset').to.eq(flight.arrivalDayOffset);
    });

    // Step 8 — stop before paying
    paymentPage.verifyNotPaid();
  });
});
