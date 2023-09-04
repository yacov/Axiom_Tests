/// <reference types="cypress" />
import 'cy-spok'
import selectors from '../fixtures/selectors.json';
import flow from '../fixtures/createRequestFlow.json';

Cypress.Commands.add('login', (selectors) => {
    const email = Cypress.env('email');
    const password = Cypress.env('password');
    cy.visit('/');
    cy.get(selectors.email).clear().type(email);
    cy.get(selectors.password).clear().type(password);
    cy.get(selectors.submitButton).click();
});
Cypress.Commands.add('mockUserInfo', () => {
    cy.intercept('GET', 'https://login.develop.axiom.security/userinfo', {
        body: {
            sub: 'auth0|62bd6eca022b1234ff8489cb',
            given_name: 'fe-tests',
            family_name: 'fe-tests',
            nickname: 'fe-tests',
            name: 'fe-tests@axiom.com',
            picture:
                'https://s.gravatar.com/avatar/ac276ea07d388d7ba0139aba08e5227b?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fte.png',
            updated_at: '2022-07-17T13:04:52.631Z',
            email: 'fe-tests@axiom.com',
            email_verified: true,
        },
    }).as('Auth0 User Info');
});
Cypress.Commands.add('loginSession', (user) => {
    cy.session(
        'axiom_login',
        () => {
            cy.mockUserInfo();
            cy.visit('/');
            cy.get('#1-email').type(user ? user.email : 'fe-tests@axiom.com');
            cy.get('#1-password').type(user ? user.password : 'hvL8z5UhcQ_8683w');
            cy.get('#1-submit').click();
            cy.url().should('satisfy', (url) => {
                return !url.includes('/login');
            });
            cy.getLocalStorage('access_token').should('not.be.undefined');
        },
        {
            cacheAcrossSpecs: true,
        }
    );
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
    cy.get(selector, {timeout: 15000}).then(($el) => {
        cy.wrap($el).wait(2000).click().within(() => {
            cy.get('[type="checkbox"]').if().each((checkbox) => {
                cy.wrap(checkbox).uncheck({force: true})
            });
            cy.contains(option).click({force: true});
        });
    });
});

Cypress.Commands.add('fillForWhat', (data, integration) => {

    flow[integration].forEach(elem => {
        cy.selectDropdown(selectors["dropdown"][elem], data[elem])
    });

});
Cypress.Commands.add('fillForWho', (data) => {
    cy.selectDropdown(selectors["dropdown"]["forWhoFilter"], data["requestAccessFor"]);
});
Cypress.Commands.add('selectRole', (role, selector) => {
    cy.contains(selector, role).click().should('have.class', 'selected-role');
});

Cypress.Commands.add('fillForHowLong', (data) => {
    //cy.get(durationTypeSelector).click();
    cy.contains('button', data.durationType).click({force: true});
    cy.get(selectors.durationPeriod).clear().type(data.durationPeriod);
    // cy.contains(durationPeriod).click({force: true});
});
Cypress.Commands.add('fillWhatFor', (data) => {

    cy.get(selectors.justifications).type(data.justification);
    cy.get(selectors.requestName)
        .should('contain.value', data.requestAccessFor, "Verify request access for").and('contain.value', data.durationPeriod, "Verify Duration period").and('contain.value', data.durationType.charAt(0).toLowerCase() + data.durationType.slice(1), "Verify Duration type");
});

Cypress.Commands.add('verifyModalContent', (expectedContent, modalSelector) => {
    cy.get(modalSelector).within(() => {
        for (let key in expectedContent) {
            cy.get(`[data-cy='${key}']`).contains('.title', expectedContent[key].title);
            cy.get(`[data-cy='${key}']`).contains('.content', expectedContent[key].content);
        }
    });
});

Cypress.Commands.add('verifyRequest', (alias, testData, data) => {
    cy.wait(alias).then((interception) => {
        expect(interception.response.statusCode, 'Verify status code').to.equal(200);
        expect(interception.response.body.original_request.reason, 'Verify reason').to.equal(testData.justification);
        expect(interception.response.body.original_request.duration.period.toString(), 'Verify duration period').to.equal(testData.durationPeriod);
        expect(testData.durationType.toLowerCase(), 'Verify duration type').to.contain(interception.response.body.original_request.duration.type);
        expect(interception.response.body.original_request.payload.postgresql_database, 'Verify database').to.equal(testData.secondaryFilter);
        expect(interception.response.body.original_request.addressee.title, 'Verify email').to.equal(Cypress.env('email'));
        expect(interception.response.body.original_request.source, 'Verify platform').to.equal(testData.platform.toUpperCase());
        expect(interception.response.body.original_request.title, 'Verify title').to.equal(`${testData.role} to ${Cypress.env('email')} for (${testData.durationPeriod} ${testData.durationType.toLowerCase()})`);
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
Cypress.Commands.add('verifyRequestDetails', (testData, status) => {
    cy.contains("[data-cy='status']", status).should('be.visible', 'Status should be ' + status);
    cy.contains('Created').next().should('contain.text', Cypress.env('email'), '"Created by" should match user email');
    cy.contains('Addressee').next().should('contain.text', Cypress.env('email'), '"For Who" should be correct');
    cy.contains('Reason').next().should('have.text', testData.justification, 'Justification should be correct');
    cy.contains('Duration').next().should('contain.text', `${testData.durationPeriod} ${testData.durationType.toLowerCase()}`, 'Duration should be correct');
});
