// eslint-disable-next-line import/no-unresolved
const istanbul = require('istanbul');
const fs = require('fs');

const collector = new istanbul.Collector();
const reporter = new istanbul.Reporter(null, '../coverage');
const sync = true;

collector.add(JSON.parse(fs.readFileSync('coverage/coverage-final.json', 'utf8')));
collector.add(JSON.parse(fs.readFileSync('../server/coverage/coverage-final.json', 'utf8')));

reporter.addAll(['clover', 'html', 'text-summary']);
reporter.write(collector, sync, () => console.log('Coverage Reports Built'));
