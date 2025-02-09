import { mockHomePage } from '../../support/utils';

describe('Autocomplete', () => {
  beforeEach(() => {
    mockHomePage();

    // Set up/override routes & fixtures that are specific to this file
    cy.fixture('autocompletion/autocompletions.json').as('autocompletionsJSON');

    // Set an alias for the search input
    cy.findByPlaceholderText('Search').as('searchInput');
  });

  // Autocomplete tests
  describe('When typing an incomplete word in the input', () => {
    const expectedAutocompletions = ['have', 'helm', 'how', 'hadoop', 'hive', 'hostname', 'high'];

    beforeEach(() => {
      cy.route(
        'GET',
        '**/autocompletion?version=2019-01-01&prefix=h&count=7',
        '@autocompletionsJSON'
      ).as('getAutocompletions');
      cy.get('@searchInput').type('h');
      cy.wait('@getAutocompletions');
    });

    it('displays a dropdown of autocomplete suggestions', () => {
      cy.get('.bx--search-autocompletion__term').each((autocompletionTerm, i) => {
        expect(autocompletionTerm).to.contain('h');
        expect(autocompletionTerm).to.contain(expectedAutocompletions[i].slice(1));
      });
    });

    describe('and clicking on an autocomplete option', () => {
      beforeEach(() => {
        cy.get('.bx--search-autocompletion__item')
          .first()
          .click();
      });

      it('updates the query with the correct completion', () => {
        cy.get('@searchInput').should('have.value', `${expectedAutocompletions[0]} `);
      });
    });

    describe('and clicking away from the SearchInput', () => {
      beforeEach(() => {
        cy.get('@searchInput').blur();
      });

      it('autocomplete dropdown disappears', () => {
        cy.get('@searchInput').should('exist'); // make sure that this test doesn't pass on whitescreen
        cy.findByTestId('completions-dropdown-test-id').should('not.exist');
      });
    });
  });

  describe('When typing " " into the search input', () => {
    beforeEach(() => {
      cy.route('POST', '**/query?version=2019-01-01', '@queryJSON').as('postQuery');
      cy.get('@searchInput').type(' ');
    });

    it('does not display the autocomplete dropdown', () => {
      cy.get('@searchInput').should('exist'); // make sure that this test doesn't pass on whitescreen
      cy.findByTestId('completions-dropdown-test-id').should('not.exist');
    });

    describe('and hit enter', () => {
      beforeEach(() => {
        cy.get('@searchInput').type('{enter}');
        cy.wait('@postQuery');
        cy.wait('@postQuery').as('queryObject');
      });

      it('performs a query with the correct term', () => {
        cy.get('@queryObject')
          .its('requestBody.natural_language_query')
          .should('be.eq', ' ');
      });
    });
  });
});
