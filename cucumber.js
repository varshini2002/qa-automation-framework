module.exports = {
  default: {
    require: ['src/steps/hooks.ts', 'src/steps/**/*.steps.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress-bar', 'html:reports/html-reports/cucumber-report.html'],
    formatOptions: { snippetInterface: 'async-await' }
  }
};
