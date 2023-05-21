const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: 'oo8r93',
  experimentalStudio: true,

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'https://app.develop.axiom.security',
    email: '',
    password: '',
    requestId: ''
  },

});
