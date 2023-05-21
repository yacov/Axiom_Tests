const testData = require('../fixtures/testData.json');
const selectors = require('../fixtures/selectors.json');
describe('Create request', () => {

    beforeEach(function () {
        cy.intercept('POST', `/v1/requests?addressee=${testData.loginData.email}&addressee_type=user`).as('createRequest');
        cy.intercept('GET', '/v1/requests*').as('getRequests');
        cy.login(selectors.login, testData.loginData);
        cy.verifyUserIsLoggedIn();
    });

    it('Create request for approval', function () {
        cy.visit("/requests");
        cy.contains(selectors.newRequestButton,{timeout:10000}).click();
        cy.contains(testData.mandatoryFields.platform).click();
        cy.url().should('include', `new?source=${testData.mandatoryFields.platform.toUpperCase()}`, {timeout: 10000});
        cy.selectDropdown(selectors.dropdown.assigneeFilter, testData.mandatoryFields.requestAccessFor);
        cy.selectDropdown(selectors.dropdown.nameFilter, testData.mandatoryFields.server);
        //cy.get(selectors.dropdown.databaseSelector, {timeout: 10000}).click();
        cy.selectDropdown(selectors.dropdown.databaseSelector, testData.mandatoryFields.database);
        cy.selectRole(testData.mandatoryFields.role, selectors.role);
        cy.selectDurationTypeAndPeriod(testData.mandatoryFields.durationType, testData.mandatoryFields.durationPeriod, selectors.durationType, selectors.durationPeriod);
        cy.get(selectors.justifications).type(testData.mandatoryFields.justification);
        cy.get(selectors.requestName)
            .should('have.value', `Read only to ${testData.loginData.email} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.charAt(0).toLowerCase() + testData.mandatoryFields.durationType.slice(1)})`,{matchCase: false})
            .click()
            .clear()
            .type(testData.mandatoryFields.requestName);
        cy.get(selectors.reviewRequestButton).click();

        // Verify modal content
        cy.verifyModalContent(testData.modalContent, selectors.creationFormModal);

        // Click on Submit Request button
        cy.contains(selectors.submitRequestButton, 'Submit Request').click();

        cy.wait('@createRequest').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
            const requestId = interception.response.body.request_id;
            cy.wrap(requestId).as('requestId');
            Cypress.env('requestId', requestId);
        });


        cy.wait('@getRequests').then((interception) => {
            expect(interception.response.statusCode).to.equal(200);
        });
cy.get('@requestId').then((requestId) => {
    cy.visit(`/requests/${requestId}`);
        cy.get('[data-cy="title"]').should('have.text', testData.mandatoryFields.requestName, 'Title should match the request name from test data');
        cy.get('[data-cy="created-by"]').should('contain.text', testData.loginData.email, 'Requested by should match the email from test data');
        cy.get('[data-cy="requested-for"]').should('contain.text', testData.loginData.email, 'Requested for should match the email from test data');
        cy.get('[data-cy="resource-owner"]').should('contain.text', 'QA Admin', 'Resource owner should be QA Admin');
        cy.get('[data-cy="source"] [data-cy="text"]').should('have.text', testData.mandatoryFields.platform, 'Requesting to should match the platform from test data');
        cy.get('[data-cy="database"]').should('contain.text', testData.mandatoryFields.database, 'Database should match the database from test data');
        cy.get('[data-cy="justification"]').should('have.text', testData.mandatoryFields.justification, 'Justification should match the justification from test data');
        cy.get('[data-cy="duration"]').should('contain.text', `${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.charAt(0).toUpperCase() + testData.mandatoryFields.durationType.slice(1)}`, 'Duration should match the duration from test data');
})// Negative tests and other scenarios can be added here
})
});
