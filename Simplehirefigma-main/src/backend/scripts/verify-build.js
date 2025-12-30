const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const errorsPath = path.join(distPath, 'utils', 'errors.js');

console.log('Verifying build output...');

if (!fs.existsSync(distPath)) {
  console.error('❌ ERROR: dist folder does not exist!');
  process.exit(1);
}

if (!fs.existsSync(errorsPath)) {
  console.error('❌ ERROR: dist/utils/errors.js does not exist!');
  process.exit(1);
}

const errorsContent = fs.readFileSync(errorsPath, 'utf8');

// Check for AppError class in compiled output
if (!errorsContent.includes('AppError')) {
  console.error('❌ ERROR: AppError class not properly compiled!');
  console.log('Content preview:', errorsContent.substring(0, 500));
  process.exit(1);
}

console.log('✅ Build verification passed!');
console.log('✅ AppError class compiled successfully');
