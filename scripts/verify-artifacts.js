// Checks that the last `cypress run` produced the video and HTML report. Run: npm run cy:verify
const fs = require('node:fs');

const artifacts = {
  video: 'cypress/videos/flight-booking.cy.js.mp4',
  'HTML report': 'cypress/reports/index.html',
  'JSON results': 'cypress/reports/.jsons/mochawesome.json',
};

let ok = true;
for (const [label, file] of Object.entries(artifacts)) {
  const size = fs.existsSync(file) ? fs.statSync(file).size : 0;
  console.log(`${size ? 'OK     ' : 'MISSING'} ${label}: ${file}${size ? ` (${(size / 1024).toFixed(0)} KB)` : ''}`);
  ok &&= size > 0;
}

const json = artifacts['JSON results'];
if (fs.existsSync(json)) {
  const { stats } = JSON.parse(fs.readFileSync(json, 'utf8'));
  console.log(`Tests: ${stats.tests}, passed: ${stats.passes}, failed: ${stats.failures}, duration: ${(stats.duration / 1000).toFixed(1)}s`);
  ok &&= stats.failures === 0 && stats.passes > 0;
}

process.exit(ok ? 0 : 1);
