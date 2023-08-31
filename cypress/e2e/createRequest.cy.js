import data from '../fixtures/testData.json';
import selectors from '../fixtures/selectors.json';
import spok from 'cy-spok'
 beforeEach(() => {
        cy.intercept('POST', `/v1/requests?addressee=${data.loginData.email}&addressee_type=user`).as('createRequest');

        cy.intercept('GET', '/v1/requests*').as('getRequests');
        cy.login(selectors.login, data.loginData);
        cy.verifyUserIsLoggedIn();
    });
describe('Postgres request', () => {
    const integration = "Postgres";
    const testData = data.Postgres;


    it.only('Create, approve, then revoke request', () => {
        cy.visit("/requests");
        cy.contains(selectors.newRequestButton, {timeout: 20000}).click();
        cy.contains(new RegExp(testData.mandatoryFields.platform)).click();
        cy.url().should('include', `new?source=${testData.mandatoryFields.platform.toUpperCase()}`, {timeout: 10000});
        cy.fillForWhat(integration);
        cy.selectDurationTypeAndPeriod(testData.mandatoryFields.durationType, testData.mandatoryFields.durationPeriod, selectors.durationType, selectors.durationPeriod);
        cy.get(selectors.justifications).type(testData.mandatoryFields.justification);
        cy.get(selectors.requestName)
            .should('have.value', `${testData.mandatoryFields.role} to ${data.loginData.email} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.charAt(0).toLowerCase() + testData.mandatoryFields.durationType.slice(1)})`, {matchCase: false});
        cy.contains('button', 'Submit').click();


        // Verify modal content
        // cy.verifyModalContent(testData.modalContent, selectors.creationFormModal);

        // Click on Submit Request button
        cy.contains(selectors.submitRequestButton, 'Submit').click();
cy.wait("@createRequest")
.its('response').should(spok({statusCode:200}));
        cy.wait('@createRequest').then((interception) => {
            expect(interception.response.statusCode, "Request created successfully").to.equal(200);
            const requestId = interception.response.body["request_id"];
            cy.wrap(requestId).as('requestId');
            Cypress.env('requestId', requestId);
        });

        // cy.wait('@getRequests').then((interception) => {
        //     expect(interception.response.statusCode).to.equal(200);
        // });

        cy.get('@requestId').then((requestId) => {
            cy.intercept('GET', `/v1/requests/${requestId}`).as('newRequest');
cy.visit(`/requests/${requestId}`);
cy.wait('@newRequest').then((interception) => {
  expect(interception.response.body.request.reason).to.equal(testData.mandatoryFields.justification);
  expect(interception.response.body.request.duration.period.toString()).to.equal(testData.mandatoryFields.durationPeriod);
  expect(interception.response.body.request.duration.type).to.be.a('string');
  expect(interception.response.body.request.payload.postgresql_database).to.equal(testData.mandatoryFields.secondaryFilter);
  // expect(interception.response.body.request.payload.postgresql_role_id).to.equal(testData.mandatoryFields.role.toLowerCase());
  expect(interception.response.body.request.addressee.title).to.equal(data.loginData.email);
  expect(interception.response.body.request.source).to.equal(testData.mandatoryFields.platform.toUpperCase());
  expect(interception.response.body.request.title).to.equal(`${testData.mandatoryFields.role} to ${data.loginData.email} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()})`);
});

            //  cy.get('[data-cy="title"]').should('have.text', new RegExp(testData.mandatoryFields.requestName), 'Title should match the request name from test data');
            cy.contains("[data-cy='status']", 'PENDING').should('be.visible', 'Status should be Pending');
            cy.contains('Created').next().should('contain.text', data.loginData.email, 'Requested by should match the email from test data');
            cy.contains('Addressee').next().should('contain.text', data.loginData.email, 'Requested for should match the email from test data');
            cy.contains(testData.mandatoryFields.platform).should('be.visible', 'Platform should be correct');
            cy.contains(testData.mandatoryFields.secondaryFilter).should('be.visible', 'Database should be correct');
            cy.contains('Reason').next().should('have.text', testData.mandatoryFields.justification, 'Justification should match the justification from test data');
            cy.contains('Duration').next().should('contain.text', `${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()}`, 'Duration should match the duration from test data');
        });
        cy.contains('button', 'Approve').click();
        cy.get("[data-cy='duration-type']").should('contain.text', testData.mandatoryFields.durationType);
        cy.get("[data-cy='duration-period']").should('contain.text', testData.mandatoryFields.durationPeriod);
        cy.get("[data-cy='modal-action']").click();
        cy.get('@requestId').then((requestId) => {
            cy.intercept('GET', `/v1/requests/${requestId}`).as('updatedRequest');
            cy.intercept('POST', `/requests/${requestId}/decide?decision=approve`).as('approveRequest');
            cy.visit(`/requests/${requestId}`);
            cy.wait('@updatedRequest').then((interception) => {
                expect(interception.response.statusCode, 'Verify status code').to.equal(200);
                expect(interception.response.body.original_request.reason, 'Verify reason').to.equal(testData.mandatoryFields.justification);
                expect(interception.response.body.original_request.duration.period.toString(), 'Verify duration period').to.equal(testData.mandatoryFields.durationPeriod);
                expect(testData.mandatoryFields.durationType.toLowerCase(), 'Verify duration type').to.contain(interception.response.body.original_request.duration.type);
                expect(interception.response.body.original_request.payload.postgresql_database, 'Verify database').to.equal(testData.mandatoryFields.secondaryFilter);
// expect(interception.response.body.original_request.payload.postgresql_role_id).to.equal(testData.mandatoryFields.role.toLowerCase());
                expect(interception.response.body.original_request.addressee.title, 'Verify email').to.equal(data.loginData.email);
                expect(interception.response.body.original_request.source, 'Verify platform').to.equal(testData.mandatoryFields.platform.toUpperCase());
                expect(interception.response.body.original_request.title, 'Verify title').to.equal(`${testData.mandatoryFields.role} to ${data.loginData.email} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()})`);

            });
            // cy.wait('@approveRequest').then((interception) => {
            //     expect(interception.response.statusCode, 'Verify status code').to.equal(200);
            //
            // });
            //  cy.get('[data-cy="title"]').should('have.text', new RegExp(testData.mandatoryFields.requestName), 'Title should match the request name from test data');
            cy.contains("[data-cy='status']", 'APPROVED').should('be.visible', 'Status should be Approved');
            cy.contains('Created').next().should('contain.text', data.loginData.email, 'Requested by should match the email from test data');
            cy.contains('Addressee').next().should('contain.text', data.loginData.email, 'Requested for should match the email from test data');
            cy.contains(testData.mandatoryFields.platform).should('be.visible', 'Platform should be correct');
            cy.contains(testData.mandatoryFields.secondaryFilter).should('be.visible', 'Database should be correct');
            cy.contains('Reason').next().should('have.text', testData.mandatoryFields.justification, 'Justification should match the justification from test data');
            cy.contains('Duration').next().should('contain.text', `${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()}`, 'Duration should match the duration from test data');
        });
        cy.get("[data-cy='revoke-button']").should('be.visible').click();
        cy.get("textarea[name='reason']").type(testData.mandatoryFields.revokeReason);
        cy.get("[data-cy='modal-action']").click();
        cy.get('@requestId').then((requestId) => {
            cy.intercept('GET', `/v1/requests/${requestId}`).as('revokedRequest');
            cy.intercept('GET', `/v1/requests/${requestId}/revoke`).as('revoke');
            cy.visit(`/requests/${requestId}`);
            cy.wait('@revokedRequest').then((interception) => {
                expect(interception.response.statusCode, 'Verify status code').to.equal(200);
                expect(interception.response.body.original_request.reason, 'Verify reason').to.equal(testData.mandatoryFields.justification);
                expect(interception.response.body.original_request.duration.period.toString(), 'Verify duration period').to.equal(testData.mandatoryFields.durationPeriod);
                expect(testData.mandatoryFields.durationType.toLowerCase(), 'Verify duration type').to.contain(interception.response.body.original_request.duration.type);
                expect(interception.response.body.original_request.payload.postgresql_database, 'Verify database').to.equal(testData.mandatoryFields.secondaryFilter);
// expect(interception.response.body.original_request.payload.postgresql_role_id).to.equal(testData.mandatoryFields.role.toLowerCase());
                expect(interception.response.body.original_request.addressee.title, 'Verify email').to.equal(data.loginData.email);
                expect(interception.response.body.original_request.source, 'Verify platform').to.equal(testData.mandatoryFields.platform.toUpperCase());
                expect(interception.response.body.original_request.title, 'Verify title').to.equal(`${testData.mandatoryFields.role} to ${data.loginData.email} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()})`);

            });
            //  cy.get('[data-cy="title"]').should('have.text', new RegExp(testData.mandatoryFields.requestName), 'Title should match the request name from test data');
            cy.contains('button', 'Approve').should('be.disabled', 'Approve button should be disabled');
            cy.contains('button', 'Deny').should('be.disabled', 'Deny button should be disabled');
            cy.contains("[data-cy='status']", 'REVOKED').should('be.visible', 'Status should be Revoked');
            cy.contains('Created').next().should('contain.text', data.loginData.email, 'Requested by should match the email from test data');
            cy.contains('Addressee').next().should('contain.text', data.loginData.email, 'Requested for should match the email from test data');
            cy.contains(testData.mandatoryFields.platform).should('be.visible', 'Platform should be correct');
            cy.contains(testData.mandatoryFields.secondaryFilter).should('be.visible', 'Database should be correct');
            cy.contains('Reason').next().should('have.text', testData.mandatoryFields.justification, 'Justification should match the justification from test data');
            cy.contains('Duration').next().should('contain.text', `${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()}`, 'Duration should match the duration from test data');
        });
    });
    it('Create, then deny request', () => {
        cy.visit("/requests");
        cy.contains(selectors.newRequestButton, {timeout: 20000}).click();
        cy.contains(new RegExp(testData.mandatoryFields.platform)).click();
        cy.url().should('include', `new?source=${testData.mandatoryFields.platform.toUpperCase()}`, {timeout: 10000});
        cy.selectDropdown(selectors.dropdown.primaryFilter, testData.mandatoryFields.primaryFilter);
        cy.selectDropdown(selectors.dropdown.secondaryFilter, testData.mandatoryFields.secondaryFilter);
        cy.selectDropdown(selectors.dropdown.role, testData.mandatoryFields.role);
        cy.selectDurationTypeAndPeriod(testData.mandatoryFields.durationType, testData.mandatoryFields.durationPeriod, selectors.durationType, selectors.durationPeriod);
        cy.get(selectors.justifications).type(testData.mandatoryFields.justification);
        cy.get(selectors.requestName)
            .should('have.value', `${testData.mandatoryFields.role} to ${data.loginData.email} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.charAt(0).toLowerCase() + testData.mandatoryFields.durationType.slice(1)})`, {matchCase: false});
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

        // cy.wait('@getRequests').then((interception) => {
        //     expect(interception.response.statusCode).to.equal(200);
        // });

        cy.get('@requestId').then((requestId) => {
            cy.intercept('GET', `/v1/requests/${requestId}`).as('newRequest');
            cy.visit(`/requests/${requestId}`);
            cy.wait('@newRequest').then((interception) => {
                expect(interception.response.statusCode, 'Verify status code').to.equal(200);
                expect(interception.response.body.request.reason, 'Verify reason').to.equal(testData.mandatoryFields.justification);
                expect(interception.response.body.request.duration.period.toString(), 'Verify duration period').to.equal(testData.mandatoryFields.durationPeriod);
                expect(testData.mandatoryFields.durationType.toLowerCase(), 'Verify duration type').to.contain(interception.response.body.request.duration.type);
                expect(interception.response.body.request.payload.postgresql_database, 'Verify database').to.equal(testData.mandatoryFields.secondaryFilter);
// expect(interception.response.body.original_request.payload.postgresql_role_id).to.equal(testData.mandatoryFields.role.toLowerCase());
                expect(interception.response.body.request.addressee.title, 'Verify email').to.equal(data.loginData.email);
                expect(interception.response.body.request.source, 'Verify platform').to.equal(testData.mandatoryFields.platform.toUpperCase());
                expect(interception.response.body.request.title, 'Verify title').to.equal(`${testData.mandatoryFields.role} to ${data.loginData.email} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()})`);

            });
            //  cy.get('[data-cy="title"]').should('have.text', new RegExp(testData.mandatoryFields.requestName), 'Title should match the request name from test data');
            cy.get('div.grid.text-main').within(() => {
                cy.contains("[data-cy='status']", 'PENDING').should('be.visible', 'Status should be Pending');
                cy.contains('Created').next().should('contain.text', data.loginData.email, 'Requested by should match the email from test data');
                cy.contains('Addressee').next().should('contain.text', data.loginData.email, 'Requested for should match the email from test data');
                cy.contains(testData.mandatoryFields.platform).should('be.visible', 'Platform should be correct');
                cy.contains(testData.mandatoryFields.secondaryFilter).should('be.visible', 'Database should be correct');
                cy.contains('Reason').next().should('have.text', testData.mandatoryFields.justification, 'Justification should match the justification from test data');
                cy.contains('Duration').next().should('contain.text', `${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()}`, 'Duration should match the duration from test data');
            });
        cy.contains('button', 'Deny').click();
        cy.get("textarea[name='reason']").type(testData.mandatoryFields.denyReason);
        cy.get("[data-cy='modal-action']").click();
        cy.get('@requestId').then((requestId) => {
            cy.intercept('GET', `/v1/requests/${requestId}`).as('updatedRequest');
            cy.intercept('POST', `/v1/requests/${requestId}/decide?decision=approve`).as('approveRequest');
            cy.visit(`/requests/${requestId}`);
            cy.wait('@updatedRequest').then((interception) => {
                expect(interception.response.statusCode, 'Verify status code').to.equal(200);
                expect(interception.response.body.original_request.reason, 'Verify reason').to.equal(testData.mandatoryFields.justification);
                expect(interception.response.body.original_request.duration.period.toString(), 'Verify duration period').to.equal(testData.mandatoryFields.durationPeriod);
                expect(testData.mandatoryFields.durationType.toLowerCase(), 'Verify duration type').to.contain(interception.response.body.original_request.duration.type);
                expect(interception.response.body.original_request.payload.postgresql_database, 'Verify database').to.equal(testData.mandatoryFields.secondaryFilter);
// expect(interception.response.body.original_request.payload.postgresql_role_id).to.equal(testData.mandatoryFields.role.toLowerCase());
                expect(interception.response.body.original_request.addressee.title, 'Verify email').to.equal(data.loginData.email);
                expect(interception.response.body.original_request.source, 'Verify platform').to.equal(testData.mandatoryFields.platform.toUpperCase());
                expect(interception.response.body.original_request.title, 'Verify title').to.equal(`${testData.mandatoryFields.role} to ${data.loginData.email} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()})`);

            });
            // cy.wait('@approveRequest').then((interception) => {
            //     expect(interception.response.statusCode, 'Verify status code').to.equal(200);
            //
            // });
            //  cy.get('[data-cy="title"]').should('have.text', new RegExp(testData.mandatoryFields.requestName), 'Title should match the request name from test data');
            cy.contains("[data-cy='status']", 'DENIED').should('be.visible', 'Status should be Denied');
            cy.contains('button', 'Approve').should('be.disabled', 'Approve button should be disabled');
            cy.contains('button', 'Deny').should('be.disabled', 'Deny button should be disabled');
            cy.contains('Created').next().should('contain.text', data.loginData.email, 'Requested by should match the email from test data');
            cy.contains('Addressee').next().should('contain.text', data.loginData.email, 'Requested for should match the email from test data');
            cy.contains(testData.mandatoryFields.platform).should('be.visible', 'Platform should be correct');
            cy.contains(testData.mandatoryFields.secondaryFilter).should('be.visible', 'Database should be correct');
            cy.contains('Reason').next().should('have.text', testData.mandatoryFields.justification, 'Justification should match the justification from test data');
            cy.contains('Duration').next().should('contain.text', `${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()}`, 'Duration should match the duration from test data');
            cy.contains('Decision').next().should('contain.text', `Denied`, 'Decision should be Denied');
            cy.contains('Decision comment').next().should('contain.text', `${testData.mandatoryFields.denyReason}`, 'Decision comment should match the decision comment');
        });

    });
});
});
describe('Okta request', () => {
    const testData = data.Okta;


    it('Create, approve, then revoke request', () => {
        cy.visit("/requests");
        cy.contains(selectors.newRequestButton, {timeout: 20000}).click();
        cy.contains(new RegExp(testData.mandatoryFields.platform)).click();
        cy.url().should('include', `new?source=${testData.mandatoryFields.platform.toUpperCase()}`, {timeout: 10000});
        cy.selectDropdown(selectors.dropdown.role, testData.mandatoryFields.role);
        cy.selectDropdown(selectors.dropdown.forWhoFilter, data.loginData.email);
        cy.selectDurationTypeAndPeriod(testData.mandatoryFields.durationType, testData.mandatoryFields.durationPeriod, selectors.durationType, selectors.durationPeriod);
        cy.get(selectors.justifications).type(testData.mandatoryFields.justification);
        cy.get(selectors.requestName)
            .should('have.value', `${testData.mandatoryFields.role} to ${data.loginData.email} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.charAt(0).toLowerCase() + testData.mandatoryFields.durationType.slice(1)})`, {matchCase: false});
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

        // cy.wait('@getRequests').then((interception) => {
        //     expect(interception.response.statusCode).to.equal(200);
        // });

        cy.get('@requestId').then((requestId) => {
            cy.intercept('GET', `/v1/requests/${requestId}`).as('newRequest');
            cy.visit(`/requests/${requestId}`);
            cy.wait('@newRequest').then((interception) => {
                expect(interception.response.statusCode, 'Verify status code').to.equal(200);
                expect(interception.response.body.request.reason, 'Verify reason').to.equal(testData.mandatoryFields.justification);
                expect(interception.response.body.request.duration.period.toString(), 'Verify duration period').to.equal(testData.mandatoryFields.durationPeriod);
                expect(testData.mandatoryFields.durationType.toLowerCase(), 'Verify duration type').to.contain(interception.response.body.request.duration.type);
// expect(interception.response.body.original_request.payload.postgresql_role_id).to.equal(testData.mandatoryFields.role.toLowerCase());
                expect(interception.response.body.request.addressee.title, 'Verify email').to.equal(data.loginData.email);
                expect(interception.response.body.request.source, 'Verify platform').to.equal(testData.mandatoryFields.platform.toUpperCase());
                expect(interception.response.body.request.title, 'Verify title').to.equal(`${testData.mandatoryFields.role} to ${data.loginData.email} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()})`);

            });
            //  cy.get('[data-cy="title"]').should('have.text', new RegExp(testData.mandatoryFields.requestName), 'Title should match the request name from test data');
            cy.contains("[data-cy='status']", 'PENDING').should('be.visible', 'Status should be Pending');
            cy.contains('Created').next().should('contain.text', data.loginData.email, 'Requested by should match the email from test data');
            cy.contains('Addressee').next().should('contain.text', data.loginData.email, 'Requested for should match the email from test data');
            cy.contains(testData.mandatoryFields.platform).should('be.visible', 'Platform should be correct');
            cy.contains('Reason').next().should('have.text', testData.mandatoryFields.justification, 'Justification should match the justification from test data');
            cy.contains('Duration').next().should('contain.text', `${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()}`, 'Duration should match the duration from test data');
        });
        cy.contains('button', 'Approve').click();
        cy.get("[data-cy='duration-type']").should('contain.text', testData.mandatoryFields.durationType);
        cy.get("[data-cy='duration-period']").should('contain.text', testData.mandatoryFields.durationPeriod);
        cy.get("[data-cy='modal-action']").click();
        cy.get('@requestId').then((requestId) => {
            cy.intercept('GET', `/v1/requests/${requestId}`).as('updatedRequest');
            cy.intercept('POST', `/v1/requests/${requestId}/decide?decision=approve`).as('approveRequest');
            cy.visit(`/requests/${requestId}`);
            cy.wait('@updatedRequest').then((interception) => {
                expect(interception.response.statusCode, 'Verify status code').to.equal(200);
                expect(interception.response.body.original_request.reason, 'Verify reason').to.equal(testData.mandatoryFields.justification);
                expect(interception.response.body.original_request.duration.period.toString(), 'Verify duration period').to.equal(testData.mandatoryFields.durationPeriod);
                expect(testData.mandatoryFields.durationType.toLowerCase(), 'Verify duration type').to.contain(interception.response.body.original_request.duration.type);
// expect(interception.response.body.original_request.payload.postgresql_role_id).to.equal(testData.mandatoryFields.role.toLowerCase());
                expect(interception.response.body.original_request.addressee.title, 'Verify email').to.equal(data.loginData.email);
                expect(interception.response.body.original_request.source, 'Verify platform').to.equal(testData.mandatoryFields.platform.toUpperCase());
                expect(interception.response.body.original_request.title, 'Verify title').to.equal(`${testData.mandatoryFields.role} to ${data.loginData.email} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()})`);

            });
            // cy.wait('@approveRequest').then((interception) => {
            //     expect(interception.response.statusCode, 'Verify status code').to.equal(200);
            //
            // });
            //  cy.get('[data-cy="title"]').should('have.text', new RegExp(testData.mandatoryFields.requestName), 'Title should match the request name from test data');
            cy.contains("[data-cy='status']", 'APPROVED').should('be.visible', 'Status should be Approved');
            cy.contains('Created').next().should('contain.text', data.loginData.email, 'Requested by should match the email from test data');
            cy.contains('Addressee').next().should('contain.text', data.loginData.email, 'Requested for should match the email from test data');
            cy.contains(testData.mandatoryFields.platform).should('be.visible', 'Platform should be correct');
            cy.contains('Reason').next().should('have.text', testData.mandatoryFields.justification, 'Justification should match the justification from test data');
            cy.contains('Duration').next().should('contain.text', `${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()}`, 'Duration should match the duration from test data');
        });
        cy.get("[data-cy='revoke-button']").should('be.visible').click();
        cy.get("textarea[name='reason']").type(testData.mandatoryFields.revokeReason);
        cy.get("[data-cy='modal-action']").click();
        cy.get('@requestId').then((requestId) => {
            cy.intercept('GET', `/v1/requests/${requestId}`).as('revokedRequest');
            cy.intercept('GET', `/v1/requests/${requestId}/revoke`).as('revoke');
            cy.visit(`/requests/${requestId}`);
            cy.wait('@revokedRequest').then((interception) => {
                expect(interception.response.statusCode, 'Verify status code').to.equal(200);
                expect(interception.response.body.original_request.reason, 'Verify reason').to.equal(testData.mandatoryFields.justification);
                expect(interception.response.body.original_request.duration.period.toString(), 'Verify duration period').to.equal(testData.mandatoryFields.durationPeriod);
                expect(testData.mandatoryFields.durationType.toLowerCase(), 'Verify duration type').to.contain(interception.response.body.original_request.duration.type);
                expect(interception.response.body.original_request.payload.postgresql_database, 'Verify database').to.equal(testData.mandatoryFields.secondaryFilter);
// expect(interception.response.body.original_request.payload.postgresql_role_id).to.equal(testData.mandatoryFields.role.toLowerCase());
                expect(interception.response.body.original_request.addressee.title, 'Verify email').to.equal(data.loginData.email);
                expect(interception.response.body.original_request.source, 'Verify platform').to.equal(testData.mandatoryFields.platform.toUpperCase());
                expect(interception.response.body.original_request.title, 'Verify title').to.equal(`${testData.mandatoryFields.role} to ${data.loginData.email} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()})`);

            });
            //  cy.get('[data-cy="title"]').should('have.text', new RegExp(testData.mandatoryFields.requestName), 'Title should match the request name from test data');
            cy.contains('button', 'Approve').should('be.disabled', 'Approve button should be disabled');
            cy.contains('button', 'Deny').should('be.disabled', 'Deny button should be disabled');
            cy.contains("[data-cy='status']", 'REVOKED').should('be.visible', 'Status should be Revoked');
            cy.contains('Created').next().should('contain.text', data.loginData.email, 'Requested by should match the email from test data');
            cy.contains('Addressee').next().should('contain.text', data.loginData.email, 'Requested for should match the email from test data');
            cy.contains(testData.mandatoryFields.platform).should('be.visible', 'Platform should be correct');
            cy.contains(testData.mandatoryFields.secondaryFilter).should('be.visible', 'Database should be correct');
            cy.contains('Reason').next().should('have.text', testData.mandatoryFields.justification, 'Justification should match the justification from test data');
            cy.contains('Duration').next().should('contain.text', `${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()}`, 'Duration should match the duration from test data');
        });
    });
    it('Create, then deny request', () => {
        cy.visit("/requests");
        cy.contains(selectors.newRequestButton, {timeout: 20000}).click();
        cy.contains(new RegExp(testData.mandatoryFields.platform)).click();
        cy.url().should('include', `new?source=${testData.mandatoryFields.platform.toUpperCase()}`, {timeout: 10000});
        cy.selectDropdown(selectors.dropdown.role, testData.mandatoryFields.role);
        cy.contains('For who?').click({force: true});
        cy.selectDropdown(selectors.dropdown.forWhoFilter, data.loginData.email);
        cy.contains('For who?').click({force: true});
        cy.selectDurationTypeAndPeriod(testData.mandatoryFields.durationType, testData.mandatoryFields.durationPeriod, selectors.durationType, selectors.durationPeriod);
        cy.get(selectors.justifications).type(testData.mandatoryFields.justification);
        cy.get(selectors.requestName)
            .should('have.value', `${testData.mandatoryFields.role} to ${testData.mandatoryFields.requestAccessFor} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.charAt(0).toLowerCase() + testData.mandatoryFields.durationType.slice(1)})`, {matchCase: false});
        cy.contains('button', 'Submit').click();

        // Verify modal content
        // cy.verifyModalContent(testData.modalContent, selectors.creationFormModal);

        // Click on Submit Request button
        cy.contains(selectors.submitRequestButton, 'Submit').click();

        cy.wait('@createRequest', {timeout:20000}).then((interception) => {
            expect(interception.response.statusCode, "Request created successfully").to.equal(200);
            const requestId = interception.response.body["request_id"];
            cy.wrap(requestId).as('requestId');
            Cypress.env('requestId', requestId);
        });

        // cy.wait('@getRequests').then((interception) => {
        //     expect(interception.response.statusCode).to.equal(200);
        // });

        cy.get('@requestId').then((requestId) => {
            cy.intercept('GET', `/v1/requests/${requestId}`).as('newRequest');
            cy.visit(`/requests/${requestId}`);
            cy.wait('@newRequest').then((interception) => {
                expect(interception.response.statusCode, 'Verify status code').to.equal(200);
                expect(interception.response.body.request.reason, 'Verify reason').to.equal(testData.mandatoryFields.justification);
                expect(interception.response.body.request.duration.period.toString(), 'Verify duration period').to.equal(testData.mandatoryFields.durationPeriod);
                expect(testData.mandatoryFields.durationType.toLowerCase(), 'Verify duration type').to.contain(interception.response.body.request.duration.type);
                expect(interception.response.body.request.addressee.title, 'Verify email').to.equal(data.loginData.email);
                expect(interception.response.body.request.source, 'Verify platform').to.equal(testData.mandatoryFields.platform.toUpperCase());
                expect(interception.response.body.request.title, 'Verify title').to.equal(`${testData.mandatoryFields.role} to ${data.loginData.email} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()})`);

            });
            //  cy.get('[data-cy="title"]').should('have.text', new RegExp(testData.mandatoryFields.requestName), 'Title should match the request name from test data');
            cy.contains("[data-cy='status']", 'PENDING').should('be.visible', 'Status should be Pending');
            cy.contains('Created').next().should('contain.text', data.loginData.email, 'Requested by should match the email from test data');
            cy.contains('Addressee').next().should('contain.text', data.loginData.email, 'Requested for should match the email from test data');
            cy.contains(testData.mandatoryFields.platform).should('be.visible', 'Platform should be correct');
            cy.contains('Reason').next().should('have.text', testData.mandatoryFields.justification, 'Justification should match the justification from test data');
            cy.contains('Duration').next().should('contain.text', `${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()}`, 'Duration should match the duration from test data');
        });
        cy.contains('button', 'Deny').click();
        cy.get("textarea[name='reason']").type(testData.mandatoryFields.denyReason);
        cy.get("[data-cy='modal-action']").click();
        cy.get('@requestId').then((requestId) => {
            cy.intercept('GET', `/v1/requests/${requestId}`).as('updatedRequest');
            cy.intercept('POST', `/v1/requests/${requestId}/decide?decision=approve`).as('approveRequest');
            cy.visit(`/requests/${requestId}`);
            cy.wait('@updatedRequest').then((interception) => {
                expect(interception.response.statusCode, 'Verify status code').to.equal(200);
                expect(interception.response.body.original_request.reason, 'Verify reason').to.equal(testData.mandatoryFields.justification);
                expect(interception.response.body.original_request.duration.period.toString(), 'Verify duration period').to.equal(testData.mandatoryFields.durationPeriod);
                expect(testData.mandatoryFields.durationType.toLowerCase(), 'Verify duration type').to.contain(interception.response.body.original_request.duration.type);
// expect(interception.response.body.original_request.payload.postgresql_role_id).to.equal(testData.mandatoryFields.role.toLowerCase());
                expect(interception.response.body.original_request.addressee.title, 'Verify email').to.equal(data.loginData.email);
                expect(interception.response.body.original_request.source, 'Verify platform').to.equal(testData.mandatoryFields.platform.toUpperCase());
                expect(interception.response.body.original_request.title, 'Verify title').to.equal(`${testData.mandatoryFields.role} to ${data.loginData.email} for (${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()})`);

            });
            // cy.wait('@approveRequest').then((interception) => {
            //     expect(interception.response.statusCode, 'Verify status code').to.equal(200);
            //
            // });
            //  cy.get('[data-cy="title"]').should('have.text', new RegExp(testData.mandatoryFields.requestName), 'Title should match the request name from test data');
            cy.contains("[data-cy='status']", 'DENIED').should('be.visible', 'Status should be Denied');
            cy.contains('button', 'Approve').should('be.disabled', 'Approve button should be disabled');
            cy.contains('button', 'Deny').should('be.disabled', 'Deny button should be disabled');
            cy.contains('Created').next().should('contain.text', data.loginData.email, 'Requested by should match the email from test data');
            cy.contains('Addressee').next().should('contain.text', data.loginData.email, 'Requested for should match the email from test data');
            cy.contains(testData.mandatoryFields.platform).should('be.visible', 'Platform should be correct');
            cy.contains('Reason').next().should('have.text', testData.mandatoryFields.justification, 'Justification should match the justification from test data');
            cy.contains('Duration').next().should('contain.text', `${testData.mandatoryFields.durationPeriod} ${testData.mandatoryFields.durationType.toLowerCase()}`, 'Duration should match the duration from test data');
            cy.contains('Decision').next().should('contain.text', `Denied`, 'Decision should be Denied');
            cy.contains('Decision comment').next().should('contain.text', `${testData.mandatoryFields.denyReason}`, 'Decision comment should match the decision comment');
        });

    });
});

