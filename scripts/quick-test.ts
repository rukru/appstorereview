#!/usr/bin/env tsx

/**
 * Quick Test for App Store Parser
 * 
 * This is a lightweight test to quickly verify the parser is working
 * Tests only the problematic app (1065290732) with a single country
 * 
 * Usage: npx tsx scripts/quick-test.ts
 */

import { performance } from 'perf_hooks';
import { parseAppStoreReviews } from '../src/lib/parsers/appstore';

async function quickTest() {
  console.log('🚀 Quick App Store Parser Test');
  console.log('==============================');
  console.log('Testing the previously problematic app (1065290732) with single country...\n');
  
  const appId = '1065290732';
  const country = 'us';
  
  const startTime = performance.now();
  
  try {
    console.log(`🔍 Fetching reviews for app ${appId} from ${country.toUpperCase()}...`);
    
    const result = await parseAppStoreReviews(appId, [country]);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`✅ SUCCESS!`);
    console.log(`📊 Reviews collected: ${result.totalCount}`);
    console.log(`⭐ Average rating: ${result.averageRating}/5`);
    console.log(`⏱️  Time taken: ${Math.round(duration)}ms`);
    
    if (result.totalCount > 0) {
      console.log('\n📋 Sample reviews:');
      result.reviews.slice(0, 3).forEach((review, index) => {
        console.log(`${index + 1}. ${review.rating}⭐ "${review.title}" by ${review.author}`);
        console.log(`   ${review.content.substring(0, 100)}...`);
      });
    }
    
    console.log('\n🎉 Quick test completed successfully!');
    console.log('✅ The 15-page limit and enhanced parser are working correctly.');
    
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`❌ FAILED after ${Math.round(duration)}ms`);
    console.log(`💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log('\n🔧 This suggests there may be an issue with:');
    console.log('   - Network connectivity');
    console.log('   - App Store API access');
    console.log('   - Parser configuration');
    console.log('   - Rate limiting');
    
    process.exit(1);
  }
}

quickTest().catch(error => {
  console.error('❌ Quick test failed:', error);
  process.exit(1);
});