#!/usr/bin/env tsx

/**
 * Setup Validation Script
 * 
 * This script validates that all test files are properly set up
 * and the App Store parser can be imported without errors
 * 
 * Usage: npx tsx scripts/validate-setup.ts
 */

import { promises as fs } from 'fs';
import path from 'path';

interface ValidationResult {
  name: string;
  success: boolean;
  message: string;
}

async function validateFile(filePath: string, description: string): Promise<ValidationResult> {
  try {
    await fs.access(filePath);
    const stats = await fs.stat(filePath);
    
    if (stats.isFile()) {
      return {
        name: description,
        success: true,
        message: `✅ ${description} exists and is readable`
      };
    } else {
      return {
        name: description,
        success: false,
        message: `❌ ${description} path exists but is not a file`
      };
    }
  } catch (error) {
    return {
      name: description,
      success: false,
      message: `❌ ${description} not found or not accessible`
    };
  }
}

async function validateImport(modulePath: string, description: string): Promise<ValidationResult> {
  try {
    const module = await import(modulePath);
    
    // Check if the expected functions exist
    const expectedFunctions = [
      'parseAppStoreReviews',
      'parseAppStoreReviewsAllRegions',
      'parseAppStoreReviewsFromRegions',
      'parseAppStoreReviewsSingleCountry'
    ];
    
    const missingFunctions = expectedFunctions.filter(func => typeof module[func] !== 'function');
    
    if (missingFunctions.length === 0) {
      return {
        name: description,
        success: true,
        message: `✅ ${description} imports successfully with all expected functions`
      };
    } else {
      return {
        name: description,
        success: false,
        message: `❌ ${description} missing functions: ${missingFunctions.join(', ')}`
      };
    }
  } catch (error) {
    return {
      name: description,
      success: false,
      message: `❌ ${description} import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function validateDependencies(): Promise<ValidationResult> {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    
    const requiredDeps = ['axios', 'cheerio', 'tsx'];
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );
    
    if (missingDeps.length === 0) {
      return {
        name: 'Dependencies',
        success: true,
        message: '✅ All required dependencies are present'
      };
    } else {
      return {
        name: 'Dependencies',
        success: false,
        message: `❌ Missing dependencies: ${missingDeps.join(', ')}`
      };
    }
  } catch (error) {
    return {
      name: 'Dependencies',
      success: false,
      message: `❌ Failed to check dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

async function validateSetup(): Promise<void> {
  console.log('🔍 Validating App Store Parser Test Setup');
  console.log('=========================================');
  console.log('');
  
  const validations: ValidationResult[] = [];
  
  // Validate test files
  const testFiles = [
    { path: 'scripts/test-appstore-parser.ts', desc: 'Main TypeScript test script' },
    { path: 'scripts/test-appstore-parser.js', desc: 'JavaScript test script' },
    { path: 'scripts/quick-test.ts', desc: 'Quick test script' },
    { path: 'scripts/run-tests.sh', desc: 'Shell test runner' },
    { path: 'scripts/README.md', desc: 'Test documentation' }
  ];
  
  for (const { path: filePath, desc } of testFiles) {
    const result = await validateFile(filePath, desc);
    validations.push(result);
  }
  
  // Validate source files
  const sourceFiles = [
    { path: 'src/lib/parsers/appstore.ts', desc: 'App Store parser source' },
    { path: 'src/types/index.ts', desc: 'Type definitions' },
    { path: 'package.json', desc: 'Package configuration' }
  ];
  
  for (const { path: filePath, desc } of sourceFiles) {
    const result = await validateFile(filePath, desc);
    validations.push(result);
  }
  
  // Validate dependencies
  const depsResult = await validateDependencies();
  validations.push(depsResult);
  
  // Validate parser imports
  const importResult = await validateImport('../src/lib/parsers/appstore', 'App Store parser module');
  validations.push(importResult);
  
  // Display results
  console.log('📋 Validation Results:');
  console.log('======================');
  
  validations.forEach(result => {
    console.log(result.message);
  });
  
  // Summary
  const successful = validations.filter(v => v.success).length;
  const total = validations.length;
  const failedValidations = validations.filter(v => !v.success);
  
  console.log('');
  console.log('📊 Summary:');
  console.log(`✅ Successful validations: ${successful}/${total}`);
  console.log(`❌ Failed validations: ${total - successful}/${total}`);
  console.log(`📈 Success rate: ${Math.round((successful / total) * 100)}%`);
  
  if (failedValidations.length > 0) {
    console.log('');
    console.log('⚠️  Issues found:');
    failedValidations.forEach(validation => {
      console.log(`   • ${validation.name}: ${validation.message.replace(/❌\s*/, '')}`);
    });
    
    console.log('');
    console.log('🔧 Recommended actions:');
    console.log('   1. Run "npm install" to install missing dependencies');
    console.log('   2. Ensure all test files are properly created');
    console.log('   3. Check that the App Store parser source files exist');
    console.log('   4. Verify TypeScript compilation is working');
    
    process.exit(1);
  } else {
    console.log('');
    console.log('🎉 All validations passed!');
    console.log('✅ The test setup is complete and ready to use.');
    console.log('');
    console.log('🚀 You can now run the tests:');
    console.log('   • Quick test: npm run test:quick');
    console.log('   • Full test suite: npm run test:appstore');
    console.log('   • Interactive runner: ./scripts/run-tests.sh');
  }
}

validateSetup().catch(error => {
  console.error('❌ Setup validation failed:', error);
  process.exit(1);
});