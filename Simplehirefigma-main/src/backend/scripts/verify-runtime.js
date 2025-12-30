#!/usr/bin/env node

/**
 * Runtime verification script
 * Verifies that critical modules load correctly before starting the server
 */

console.log('🔍 Starting runtime verification...\n');

const errors = [];

// Test 1: Verify Error constructor is available
try {
  if (typeof Error === 'undefined') {
    throw new Error('Error constructor is undefined!');
  }
  console.log('✓ Error constructor is available');
} catch (e) {
  console.error('✗ Error constructor check failed:', e.message);
  errors.push(e);
}

// Test 2: Load and instantiate AppError
try {
  const { AppError } = require('../dist/utils/errors');
  
  if (typeof AppError !== 'function') {
    throw new Error(`AppError is not a constructor (type: ${typeof AppError})`);
  }
  
  const testError = new AppError('Test error', 500, 'TEST');
  
  if (!(testError instanceof Error)) {
    throw new Error('AppError instance is not instanceof Error');
  }
  
  if (!(testError instanceof AppError)) {
    throw new Error('AppError instance is not instanceof AppError');
  }
  
  console.log('✓ AppError loads and instantiates correctly');
  console.log(`  - Name: ${testError.name}`);
  console.log(`  - Message: ${testError.message}`);
  console.log(`  - StatusCode: ${testError.statusCode}`);
  console.log(`  - Code: ${testError.code}`);
  console.log(`  - Has stack: ${!!testError.stack}`);
} catch (e) {
  console.error('✗ AppError verification failed:', e.message);
  console.error('  Stack:', e.stack);
  errors.push(e);
}

// Test 3: Verify factory functions work
try {
  const { createValidationError, createNotFoundError, createUnauthorizedError } = require('../dist/utils/errors');
  
  const validationErr = createValidationError('Test validation', { field: 'email' });
  const notFoundErr = createNotFoundError('Resource not found');
  const unauthorizedErr = createUnauthorizedError();
  
  console.log('✓ Factory functions work correctly');
  console.log(`  - Validation error: ${validationErr.code} (${validationErr.statusCode})`);
  console.log(`  - Not found error: ${notFoundErr.code} (${notFoundErr.statusCode})`);
  console.log(`  - Unauthorized error: ${unauthorizedErr.code} (${unauthorizedErr.statusCode})`);
} catch (e) {
  console.error('✗ Factory functions verification failed:', e.message);
  errors.push(e);
}

// Summary
console.log('\n' + '='.repeat(50));
if (errors.length === 0) {
  console.log('✅ All runtime verifications passed!');
  process.exit(0);
} else {
  console.error(`❌ ${errors.length} verification(s) failed!`);
  process.exit(1);
}
