import 'cypress-file-upload';

Cypress.skipAfterFail = ({ skipAllSuits = false } = {}) => {
  before(function() {
    // stop all if an important test failed before
    cy.task('dynamicSharedStore', { name: 'cancelTests' }).then(
      hasImportantTestFallen => {
        if (hasImportantTestFallen) {
          Cypress.runner.stop();
        }
      },
    );
  });
  afterEach(function() {
    if (this.currentTest.state === 'failed') {
      if (!Cypress.config('isInteractive')) {
        // isInteractive is true for headed browsers (suite started with 'cypress open' command)
        // and false for headless ('cypress run')
        // This will skip remaining test in the current context when a test fails.
        Cypress.runner.stop();
      }
      if (skipAllSuits) {
        cy.task('dynamicSharedStore', {
          name: 'cancelTests',
          value: true,
        }).then(() => {
          cy.log('Skipping all remaining tests');
        });
      }
    }
  });
};

Cypress.Commands.add(
  'shouldHaveTrimmedText',
  { prevSubject: true },
  (subject, equalTo) => {
    expect(subject.text().trim()).to.eq(equalTo);
    return subject;
  },
);

Cypress.Commands.add('checkItemOnGenericListLink', resourceName => {
  cy.get('ui5-table-row')
    .find('ui5-table-cell')
    .contains('ui5-text', resourceName)
    .should('be.visible');
});

Cypress.Commands.add('clickGenericListLink', resourceName => {
  cy.get('ui5-table-row')
    .find('ui5-table-cell')
    .contains('ui5-text', resourceName)
    .click();
});

Cypress.Commands.add('clickListLink', resourceName => {
  cy.get('ui5-table-row')
    .find('ui5-table-cell')
    .contains('ui5-link', resourceName)
    .click();
});

Cypress.Commands.add('filterWithNoValue', { prevSubject: true }, $elements =>
  $elements.filter((_, e) => !e.value),
);

Cypress.Commands.add('goToNamespaceDetails', namespace => {
  // Go to the details of namespace
  cy.getLeftNav()
    .find('ui5-side-navigation-item')
    .contains('Namespaces')
    .click();

  cy.clickListLink(namespace ?? Cypress.env('NAMESPACE_NAME'));

  return cy.end();
});

Cypress.Commands.add('clearInput', { prevSubject: true }, element => {
  return cy
    .wrap(element)

    .type(
      `${Cypress.platform === 'darwin' ? '{cmd}a' : '{ctrl}a'} {backspace}`,
    );
});

/**
 * Simulates a paste event.
 *
 * @example
 * cy.get('some-selector').paste({
 *  pastePayload: 'String example'
 *  });
 */
Cypress.Commands.add(
  'paste',
  {
    prevSubject: true,
  },
  paste,
);

/**
 * Simulates a paste event.
 *
 * @param subject A jQuery context representing a DOM element.
 * @param pastePayload Simulated String that is on the clipboard.
 *
 * @returns The subject parameter.
 */
function paste(subject, { pastePayload }) {
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event
  const pasteEvent = Object.assign(
    new Event('paste', { bubbles: true, cancelable: false }),
    {
      clipboardData: {
        getData: (type = 'text') => pastePayload,
      },
    },
  );
  subject[0].dispatchEvent(pasteEvent);

  return subject;
}

Cypress.Commands.add('getLeftNav', () => {
  return cy.get('aside');
});

Cypress.Commands.add('getMidColumn', () => {
  return cy.get('div[slot="midColumn"]');
});

Cypress.Commands.add('getEndColumn', () => {
  return cy.get('div[slot="endColumn"]');
});

Cypress.Commands.add(
  'deleteInDetails',
  (resourceType, resourceName, columnLayout = false) => {
    if (columnLayout) {
      cy.wait(1000); //wait for button

      cy.getMidColumn()
        .contains('ui5-button', 'Delete')
        .should('be.visible')
        .click();
    } else {
      cy.get('ui5-button')
        .contains('Delete')
        .should('be.visible')
        .click();
    }

    cy.contains(`delete ${resourceType} ${resourceName}`);

    cy.get(`[header-text="Delete ${resourceType}"]:visible`)
      .find('[data-testid="delete-confirmation"]')
      .click();

    cy.contains(/deleted/).should('be.visible');

    cy.getMidColumn().should('not.be.visible');
  },
);

Cypress.Commands.add(
  'deleteFromGenericList',
  (resourceType, resourceName, options = {}) => {
    const {
      confirmationEnabled = true,
      deletedVisible = true,
      clearSearch = true,
      checkIfResourceIsRemoved = true,
      selectSearchResult = false,
      searchInPlainTableText = false,
      parentSelector = null,
      waitForDelete = 0,
    } = options;

    cy.wait(500);
    if (parentSelector) {
      cy.get(parentSelector)
        .find('ui5-input[id="search-input"]:visible')
        .find('input')
        .type(resourceName);
    } else {
      cy.get('ui5-input[id="search-input"]:visible')
        .find('input')
        .type(resourceName);
    }

    cy.wait(1000);

    if (selectSearchResult) {
      cy.get('ui5-suggestion-item:visible')
        .contains('li', resourceName)
        .click();
    }

    if (searchInPlainTableText) {
      //  TODO: Modules in tests are unmannaged and text is not in ui5-text component
      cy.get('ui5-table-row')
        .find('ui5-table-cell')
        .contains(resourceName)
        .should('be.visible');
    } else {
      cy.checkItemOnGenericListLink(resourceName);
    }

    cy.get('ui5-button[data-testid="delete"]').click();

    if (confirmationEnabled) {
      cy.contains(`delete ${resourceType} ${resourceName}`);

      // TODO: This wait allows 'community modules add/edit/delete' to download needed resources to apply from backend.
      // The download is initiated when user mark module to install and then when user click delete, it deleted what is was able to download
      if (waitForDelete !== 0) {
        cy.wait(waitForDelete);
      }

      cy.get(`[header-text="Delete ${resourceType}"]:visible`)
        .find('[data-testid="delete-confirmation"]')
        .click();

      if (deletedVisible) {
        cy.contains('ui5-toast', /deleted/).should('be.visible');
      }

      if (checkIfResourceIsRemoved) {
        cy.get('ui5-table')
          .contains(resourceName)
          .should('not.exist');
      }
    }

    if (clearSearch) {
      if (parentSelector) {
        cy.get(parentSelector)
          .find('ui5-input[id="search-input"]:visible')
          .find('input')
          .wait(1000)
          .clear();
      } else {
        cy.get('ui5-input[id="search-input"]:visible')
          .find('input')
          .wait(1000)
          .clear();
      }
    }
  },
);

Cypress.Commands.add('changeCluster', clusterName => {
  cy.get('header')
    .find('button[aria-haspopup="menu"][data-ui5-stable="menu"]:visible')
    .click({ force: true });

  cy.get(`[accessible-name="${clusterName}"]:visible`)
    .find('span[part="title"]')
    .click({ force: true });
});

Cypress.Commands.add(
  'testMidColumnLayout',
  (resourceName, checkIfNotExist = true) => {
    cy.getMidColumn()
      .find('ui5-button[accessible-name="enter-full-screen"]')
      .click();

    cy.get('ui5-table-row')
      .find('ui5-table-cell')
      .contains('ui5-text', resourceName)
      .should('not.be.visible');

    cy.getMidColumn()
      .find('ui5-button[accessible-name="close-full-screen"]')
      .click();

    cy.checkItemOnGenericListLink(resourceName);

    cy.closeMidColumn(checkIfNotExist);
  },
);

Cypress.Commands.add(
  'testEndColumnLayout',
  (resourceName, checkIfNotExist = true) => {
    cy.getEndColumn()
      .find('ui5-button[accessible-name="enter-full-screen"]')
      .click();

    cy.get('ui5-table-row')
      .find('ui5-table-cell')
      .contains('ui5-text', resourceName)
      .should('not.be.visible');

    cy.getEndColumn()
      .find('ui5-button[accessible-name="close-full-screen"]')
      .click();

    cy.checkItemOnGenericListLink(resourceName);

    cy.closeEndColumn(checkIfNotExist);
  },
);

Cypress.Commands.add(
  'closeMidColumn',
  (checkIfNotExist = false, hiddenButtons = false) => {
    if (hiddenButtons) {
      cy.getMidColumn()
        .find('header')
        .find('ui5-toggle-button:visible')
        .click();

      cy.get('[data-component-name="ToolbarOverflowPopoverContent"]')
        .find('ui5-button[accessible-name="close-column"]')
        .click();
    } else
      cy.getMidColumn()
        .find('ui5-button[accessible-name="close-column"]')
        .click();

    cy.wait(1000);
    if (checkIfNotExist) cy.getMidColumn().should('not.exist');
    else cy.getMidColumn().should('not.be.visible');
  },
);

Cypress.Commands.add('closeEndColumn', (checkIfNotExist = false) => {
  cy.getEndColumn()
    .find('ui5-button[accessible-name="close-column"]')
    .click();

  if (checkIfNotExist) cy.getEndColumn().should('not.exist');
  else cy.getEndColumn().should('not.be.visible');
});
