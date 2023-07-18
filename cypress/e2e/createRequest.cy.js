import testData from '../fixtures/testData.json';
import selectors from '../fixtures/selectors.json';

describe('Create request', () => {
    beforeEach(() => {
        cy.intercept('POST', `/v1/requests?addressee=${testData.loginData.email}&addressee_type=user`).as('createRequest');
        cy.intercept('GET', '/v1/requests*').as('getRequests');
        cy.login(selectors.login, testData.loginData);
        cy.verifyUserIsLoggedIn();
    });

    it('Create request for approval', () => {
        cy.visit("/requests");
        cy.contains(selectors.newRequestButton, {timeout: 10000}).click();
        cy.contains(new RegExp(testData.mandatoryFields.platform)).click();
        cy.url().should('include', `new?source=${testData.mandatoryFields.platform.toUpperCase()}`, {timeout: 10000});
        cy.selectDropdown(selectors.dropdown.nameFilter, testData.mandatoryFields.server);
        cy.selectDropdown(selectors.dropdown.databaseSelector, testData.mandatoryFields.database);
        cy.selectDropdown(selectors.dropdown.role, testData.mandatoryFields.role);
        cy.selectDurationTypeAndPeriod(testData.mandatoryFields.durationType, testData.mandatoryFields.durationPeriod, selectors.durationType, selectors.durationPeriod);
        cy.get(selectors.justifications).type(testData.mandatoryFields.justification);
        cy.get(selectors.requestName)
            .should('have.value', `${testData.mandatoryFields.role} to ${testData.loginData.email} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.charAt(0).toLowerCase() + testData.mandatoryFields.durationType.slice(1)})`, {matchCase: false});
        cy.contains('button', 'Submit').click();

        // Verify modal content
       // cy.verifyModalContent(testData.modalContent, selectors.creationFormModal);

        // Click on Submit Request button
        cy.contains(selectors.submitRequestButton, 'Submit').click();

        cy.wait('@createRequest').then((interception) => {
            expect(interception.response.statusCode, "Request created successfully").to.equal(200);
            const requestId = interception.response.body["request_id"];
            cy.wrap(requestId).as('requestId');
            Cypress.env('requestId', requestId);
        });

        cy.wait('@getRequests').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
        });

        cy.get('@requestId').then((requestId) => {
            cy.visit(`/requests/${requestId}`);
            cy.get('[data-cy="title"]').should('have.text', new RegExp(testData.mandatoryFields.requestName), 'Title should match the request name from test data');
            cy.get('[data-cy="created-by"]').should('contain.text', testData.loginData.email, 'Requested by should match the email from test data');
            cy.get('[data-cy="requested-for"]').should('contain.text', testData.loginData.email, 'Requested for should match the email from test data');
            cy.get('[data-cy="resource-owner"]').should('contain.text', 'QA Admin', 'Resource owner should be QA Admin');
            cy.get('[data-cy="source"] [data-cy="text"]').should('have.text', testData.mandatoryFields.platform, 'Requesting to should match the platform from test data');
            cy.get('[data-cy="database"]').should('contain.text', testData.mandatoryFields.database, 'Database should match the database from test data');
            cy.get('[data-cy="justification"]').should('have.text', testData.mandatoryFields.justification, 'Justification should match the justification from test data');
            cy.get('[data-cy="duration"]').should('contain.text', `${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.charAt(0).toUpperCase() + testData.mandatoryFields.durationType.slice(1)}`, 'Duration should match the duration from test data');
        });
    });
});
