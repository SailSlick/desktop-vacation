// Part of the boilerplate, generates coverage reports
const istanbul = require('istanbul');
const mocha = require('mocha');

module.exports = function (runner, options) {
  mocha.reporters.Base.call(this, runner);

  const reporterOpts = { dir: 'coverage' };
  let reporters = ['text-summary', 'json'];

  options = options || {};
  if (options.reporters) reporters = options.reporters.split(',');
  if (process.env.ISTANBUL_REPORTERS) reporters = process.env.ISTANBUL_REPORTERS.split(',');
  if (options.reportDir) reporterOpts.dir = options.reportDir;
  if (process.env.ISTANBUL_REPORT_DIR) reporterOpts.dir = process.env.ISTANBUL_REPORT_DIR;

  runner.on('end', () => {
    // eslint-disable-next-line no-underscore-dangle
    const cov = global.__coverage__ || {};
    const collector = new istanbul.Collector();

    collector.add(cov);

    reporters.forEach(reporter =>
      istanbul.Report.create(reporter, reporterOpts).writeReport(collector, true)
    );
  });
};
