import { parseMoney } from './utils/helpers';

/**
 * Agoda dropdowns are react-aria comboboxes: a `[role="combobox"]` button that opens a
 * `[role="listbox"]` of `<li>` items. Selects the item whose text equals `text` exactly.
 */
Cypress.Commands.add('selectListboxOption', (fieldTestId, text) => {
  cy.get(`[data-testid="${fieldTestId}"] [role="combobox"]`).click();
  cy.get('[role="listbox"]')
    .filter(':visible')
    .contains('li', new RegExp(`^${Cypress._.escapeRegExp(text)}$`))
    .scrollIntoView()
    .click();
  cy.verifyListboxValue(fieldTestId, text);
});

/** Combobox shows the chosen option, sometimes abbreviated ("June" -> "Jun"). */
Cypress.Commands.add('verifyListboxValue', (fieldTestId, text) => {
  cy.get(`[data-testid="${fieldTestId}"] [role="combobox"]`)
    .invoke('text')
    .should((shown) => {
      expect(shown.trim(), `${fieldTestId} selected value`).to.not.be.empty;
      expect(text.toLowerCase(), `${fieldTestId} selected value`).to.include(shown.trim().toLowerCase());
    });
});

/**
 * Reads the booking total from the price summary sidebar (same component on the
 * passenger-details and payment pages). Yields { currency, currencyCode, amount }.
 */
Cypress.Commands.add('readSummaryTotal', (label) => {
  // Text is e.g. "Rp 2,657,937Secured Payment…"; parseMoney takes the first currency + amount.
  cy.get('[data-component="mob-flight-price-total-desc"]')
    .should(($total) => expect($total.text(), `${label}: total price`).to.match(/\d/))
    .then(($total) => ({ ...parseMoney($total.text()), currencyCode: $total.attr('data-currency') }));
});
