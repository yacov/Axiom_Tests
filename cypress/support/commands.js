/// <reference types="cypress" />
Cypress.Commands.add('login', (selectors, credentials) => {
    cy.visit('/');
    cy.get(selectors.email).clear().type(credentials.email);
    cy.get(selectors.password).clear().type(credentials.password);
    cy.get(selectors.submitButton).click();
});


Cypress.Commands.add('verifyUserIsLoggedIn', () => {
    cy.contains('Dashboard', {timeout: 10000}).should('be.visible');
});

Cypress.Commands.add('getSelector', (key) => {
    cy.fixture('selectors.json').then((selectors) => {
        return selectors[key];
    });
});
Cypress.Commands.add('requestData', (key) => {
    cy.fixture('testData.json').then((data) => {
        return data[key];
    });
});

Cypress.Commands.add('selectDropdown', (selector, option) => {
    cy.get(selector,{timeout: 10000}).click();
    //cy.get('.search-filter').type(option);
    cy.contains(option).click();
});

Cypress.Commands.add('selectRole', (role, selector) => {
    cy.contains(selector, role).click().should('have.class', 'selected-role');
});

Cypress.Commands.add('selectDurationTypeAndPeriod', (durationType, durationPeriod, durationTypeSelector, durationPeriodSelector) => {
    //cy.get(durationTypeSelector).click();
    cy.contains('button', durationType).click({force: true});
    cy.get(durationPeriodSelector).clear().type(durationPeriod);
   // cy.contains(durationPeriod).click({force: true});
});

Cypress.Commands.add('verifyModalContent', (expectedContent, modalSelector) => {
    cy.get(modalSelector).within(() => {
        for (let key in expectedContent) {
            cy.get(`[data-cy='${key}']`).contains('.title', expectedContent[key].title);
            cy.get(`[data-cy='${key}']`).contains('.content', expectedContent[key].content);
        }
    });
});

Cypress.Commands.add('verifyCreateRequest', (confirmationMessageSelector) => {
    cy.contains(confirmationMessageSelector);
    cy.wait('@createRequest').then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
        const requestId = interception.response.body.id;
        Cypress.env('requestId', requestId);
        cy.contains('Everything looks good!').should('be.visible');
        cy.contains('Access request created successfully').should('be.visible');
    });
});

Cypress.Commands.add('verifyTableRowContent', (expectedContent) => {
    for (let key in expectedContent) {
        cy.contains(`[data-cy='${key}']`, expectedContent[key]).should('be.visible');
    }
});
