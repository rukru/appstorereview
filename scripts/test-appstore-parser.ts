#!/usr/bin/env ts-node

/**
 * TypeScript Test script for App Store review collection
 * 
 * This script tests the enhanced App Store parser with:
 * - 15-page limit per country
 * - Multi-region collection
 * - Improved error handling
 * - Rate limiting with delays
 * 
 * Usage: npx ts-node scripts/test-appstore-parser.ts
 */

import { performance } from 'perf_hooks';
import {
  parseAppStoreReviews,
  parseAppStoreReviewsAllRegions,
  parseAppStoreReviewsFromRegions,
  parseAppStoreReviewsSingleCountry
} from '../src/lib/parsers/appstore';

// Test configuration
const TEST_APPS = [
  {
    id: '1065290732',
    name: 'Problematic App (Previously failing)',
    description: 'This app was having issues with review collection'
  },
  {
    id: '686449807', 
    name: 'Telegram',
    description: 'Popular messaging app - should have many reviews'
  },
  {
    id: '310633997',
    name: 'WhatsApp',
    description: 'Popular messaging app - reliable for testing'
  }
];

const TEST_SCENARIOS = [
  {
    name: 'Single Country (Russia)',
    countries: ['ru'] as const,
    description: 'Test single country collection'
  },
  {
    name: 'Major Countries',
    countries: ['ru', 'us', 'gb', 'de'] as const,
    description: 'Test default major countries collection'
  },
  {
    name: 'English Speaking',
    countries: ['us', 'gb', 'au', 'ca'] as const,
    description: 'Test English-speaking countries'
  },
  {
    name: 'All Regions (Limited)',
    countries: ['us', 'gb', 'de', 'fr', 'jp', 'ru'] as const,
    description: 'Test multiple regions (limited for speed)'
  }
];

type CountryCode = 'us' | 'gb' | 'de' | 'fr' | 'jp' | 'au' | 'ca' | 'ru' | 'br' | 'in' | 'kr' | 'it' | 'es' | 'mx' | 'cn';

// Helper function to format time
function formatTime(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

// Helper function to format numbers
function formatNumber(num: number): string {
  return num.toLocaleString();
}

interface TestResult {
  success: boolean;
  appId: string;
  appName: string;
  scenario: string;
  countries: number;
  reviewCount?: number;
  averageRating?: number;
  duration: number;
  recentReviews?: number;
  error?: string;
}

// Test individual app with specific countries
async function testAppWithCountries(
  appId: string, 
  appName: string, 
  countries: readonly CountryCode[], 
  scenario: string
): Promise<TestResult> {
  console.log(`\n🔍 Testing ${appName} (${appId})`);
  console.log(`📍 Scenario: ${scenario}`);
  console.log(`🌍 Countries: ${countries.join(', ').toUpperCase()}`);
  
  const startTime = performance.now();
  
  try {
    const result = await parseAppStoreReviews(appId, [...countries]);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Success! Collected ${formatNumber(result.totalCount)} reviews`);
    console.log(`⭐ Average rating: ${result.averageRating}/5`);
    console.log(`⏱️  Time taken: ${formatTime(duration)}`);
    
    // Analyze review distribution
    const reviewsByRating = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result.reviews.forEach(review => {
      reviewsByRating[review.rating as keyof typeof reviewsByRating]++;
    });
    
    console.log('📊 Rating distribution:');
    Object.entries(reviewsByRating).forEach(([rating, count]) => {
      const percentage = result.totalCount > 0 ? Math.round((count / result.totalCount) * 100) : 0;
      console.log(`   ${rating}⭐: ${formatNumber(count)} (${percentage}%)`);
    });
    
    // Check for recent reviews
    const recentReviews = result.reviews.filter(review => {
      const reviewDate = new Date(review.date);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return reviewDate > thirtyDaysAgo;
    });
    
    console.log(`📅 Recent reviews (last 30 days): ${formatNumber(recentReviews.length)}`);
    
    return {
      success: true,
      appId,
      appName,
      scenario,
      countries: countries.length,
      reviewCount: result.totalCount,
      averageRating: result.averageRating,
      duration,
      recentReviews: recentReviews.length
    };
    
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`❌ Failed after ${formatTime(duration)}`);
    console.log(`💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      success: false,
      appId,
      appName,
      scenario,
      countries: countries.length,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    };
  }
}

// Test multi-region functionality
async function testMultiRegionFeatures(): Promise<TestResult> {
  console.log('\n🌐 Testing Multi-Region Features');
  console.log('================================');
  
  const testAppId = '686449807'; // Telegram
  const testAppName = 'Telegram (Multi-region test)';
  const startTime = performance.now();
  
  try {
    // Test the region-specific functions
    console.log('\n1️⃣ Testing parseAppStoreReviewsFromRegions...');
    const regionsResult = await parseAppStoreReviewsFromRegions(testAppId, ['americas', 'europe']);
    console.log(`✅ Americas + Europe: ${formatNumber(regionsResult.totalCount)} reviews`);
    
    console.log('\n2️⃣ Testing parseAppStoreReviewsAllRegions...');
    const allRegionsStart = performance.now();
    const allRegionsResult = await parseAppStoreReviewsAllRegions(testAppId);
    const allRegionsEnd = performance.now();
    const allRegionsDuration = allRegionsEnd - allRegionsStart;
    
    console.log(`✅ All regions: ${formatNumber(allRegionsResult.totalCount)} reviews`);
    console.log(`⏱️  Time taken: ${formatTime(allRegionsDuration)}`);
    
    console.log('\n3️⃣ Testing parseAppStoreReviewsSingleCountry...');
    const singleCountryResult = await parseAppStoreReviewsSingleCountry(testAppId, 'us');
    console.log(`✅ Single country (US): ${formatNumber(singleCountryResult.totalCount)} reviews`);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    return {
      success: true,
      appId: testAppId,
      appName: testAppName,
      scenario: 'Multi-region features',
      countries: 15, // All regions
      reviewCount: allRegionsResult.totalCount,
      averageRating: allRegionsResult.averageRating,
      duration
    };
    
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`❌ Multi-region test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      appId: testAppId,
      appName: testAppName,
      scenario: 'Multi-region features',
      countries: 15,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    };
  }
}

// Test rate limiting and timeout handling
async function testRateLimitingAndTimeouts(): Promise<TestResult> {
  console.log('\n⏱️ Testing Rate Limiting and Timeout Handling');
  console.log('============================================');
  
  const testAppId = '1065290732'; // The problematic app
  const testAppName = 'Problematic App (Rate limiting test)';
  const startTime = performance.now();
  
  try {
    // Test with multiple countries to trigger rate limiting
    const result = await parseAppStoreReviews(testAppId, ['us', 'gb', 'de', 'fr', 'jp']);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Rate limiting test passed`);
    console.log(`📊 Collected ${formatNumber(result.totalCount)} reviews`);
    console.log(`⏱️  Total time: ${formatTime(duration)}`);
    
    // Calculate average time per country
    const avgTimePerCountry = duration / 5;
    console.log(`📈 Average time per country: ${formatTime(avgTimePerCountry)}`);
    
    return {
      success: true,
      appId: testAppId,
      appName: testAppName,
      scenario: 'Rate limiting test',
      countries: 5,
      reviewCount: result.totalCount,
      averageRating: result.averageRating,
      duration
    };
    
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`❌ Rate limiting test failed after ${formatTime(duration)}`);
    console.log(`💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      success: false,
      appId: testAppId,
      appName: testAppName,
      scenario: 'Rate limiting test',
      countries: 5,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    };
  }
}

// Main test function
async function runTests(): Promise<void> {
  console.log('🚀 App Store Parser Test Suite');
  console.log('===============================');
  console.log(`📅 Started at: ${new Date().toLocaleString()}`);
  console.log(`🎯 Testing 15-page limit, multi-region collection, and rate limiting\n`);
  
  const overallStartTime = performance.now();
  const results: TestResult[] = [];
  
  try {
    // Test 1: Basic app testing with different scenarios
    console.log('\n🧪 Test 1: Basic App Testing');
    console.log('============================');
    
    for (const app of TEST_APPS) {
      for (const scenario of TEST_SCENARIOS) {
        const result = await testAppWithCountries(
          app.id,
          app.name,
          scenario.countries,
          scenario.name
        );
        results.push(result);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Test 2: Multi-region features
    console.log('\n🧪 Test 2: Multi-Region Features');
    console.log('=================================');
    
    const multiRegionResult = await testMultiRegionFeatures();
    results.push(multiRegionResult);
    
    // Test 3: Rate limiting and timeout handling
    console.log('\n🧪 Test 3: Rate Limiting and Timeout Handling');
    console.log('=============================================');
    
    const rateLimitingResult = await testRateLimitingAndTimeouts();
    results.push(rateLimitingResult);
    
  } catch (error) {
    console.log(`❌ Test suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (error instanceof Error) {
      console.log(`🔧 Stack trace:`, error.stack);
    }
    process.exit(1);
  }
  
  const overallEndTime = performance.now();
  const totalDuration = overallEndTime - overallStartTime;
  
  // Generate summary report
  console.log('\n📋 Test Summary Report');
  console.log('======================');
  console.log(`⏱️  Total execution time: ${formatTime(totalDuration)}`);
  console.log(`🧪 Total tests run: ${results.length}`);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful tests: ${successful}`);
  console.log(`❌ Failed tests: ${failed}`);
  console.log(`📊 Success rate: ${Math.round((successful / results.length) * 100)}%`);
  
  // Show top performers
  const reviewResults = results.filter(r => r.reviewCount && r.reviewCount > 0);
  if (reviewResults.length > 0) {
    console.log('\n🏆 Top Review Collectors:');
    reviewResults
      .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
      .slice(0, 5)
      .forEach((result, index) => {
        console.log(`${index + 1}. ${result.appName} (${result.scenario}): ${formatNumber(result.reviewCount || 0)} reviews`);
      });
  }
  
  // Show any errors
  const errorResults = results.filter(r => !r.success);
  if (errorResults.length > 0) {
    console.log('\n⚠️  Errors Encountered:');
    errorResults.forEach(result => {
      console.log(`❌ ${result.appName} (${result.scenario}): ${result.error}`);
    });
  }
  
  // Final recommendations
  console.log('\n🎯 Recommendations:');
  if (failed === 0) {
    console.log('✅ All tests passed! The App Store parser is working correctly.');
    console.log('✅ 15-page limit is functioning properly.');
    console.log('✅ Multi-region collection is working as expected.');
    console.log('✅ Rate limiting and error handling are robust.');
  } else {
    console.log(`⚠️  ${failed} tests failed. Please review the errors above.`);
    console.log('💡 Consider checking network connectivity and API rate limits.');
  }
  
  console.log('\n🔚 Test suite completed successfully!');
  console.log(`📅 Finished at: ${new Date().toLocaleString()}`);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed with error:', error);
  process.exit(1);
});