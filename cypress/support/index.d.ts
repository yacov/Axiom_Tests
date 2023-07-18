declare namespace Cypress
{
    interface Chainable < Subject > {
        login(selectors: any, credentials: any): Chainable<any>;
        verifyUserIsLoggedIn(): Chainable<any>;
        getSelector(key: string): Chainable<any>;
        requestData(key: string): Chainable<any>;
        selectDropdown(selector: string, option: string): Chainable<any>;
        selectRole(role: string, selector: string): Chainable<any>;
        selectDurationTypeAndPeriod(durationType: string, durationPeriod: string, durationTypeSelector: string, durationPeriodSelector: string): Chainable<any>;
        verifyModalContent(expectedContent: any, modalSelector: string): Chainable<any>;
        verifyCreateRequest(confirmationMessageSelector: string): Chainable<any>;
        verifyTableRowContent(expectedContent: any): Chainable<any>;
    }
}
