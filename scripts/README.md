# Test Scripts for App Store Parser

This directory contains test scripts to validate the App Store review collection functionality.

## Available Tests

### 1. `test-appstore-parser.ts` (Recommended)
TypeScript test script that comprehensively tests the App Store parser functionality.

**Features tested:**
- ✅ 15-page limit per country
- ✅ Multi-region collection from 15+ countries
- ✅ Rate limiting and timeout handling
- ✅ Error handling and recovery
- ✅ Duplicate detection and removal
- ✅ Review quality validation

**Usage:**
```bash
# Using npm script (recommended)
npm run test:appstore

# Using tsx directly
npx tsx scripts/test-appstore-parser.ts

# Using ts-node (if available)
npx ts-node scripts/test-appstore-parser.ts
```

### 2. `test-appstore-parser.js`
JavaScript version of the test script for environments without TypeScript support.

**Usage:**
```bash
node scripts/test-appstore-parser.js
```

### 3. `run-tests.sh`
Interactive shell script that provides a menu to run different test options.

**Usage:**
```bash
./scripts/run-tests.sh
```

## Test Scenarios

### Test Apps
The script tests with the following apps:
- **1065290732** - Previously problematic app (stress test)
- **686449807** - Telegram (popular app with many reviews)
- **310633997** - WhatsApp (reliable test app)

### Test Scenarios
- **Single Country**: Tests collection from Russia only
- **Major Countries**: Tests collection from RU, US, GB, DE (default)
- **English Speaking**: Tests collection from US, GB, AU, CA
- **All Regions**: Tests collection from 6+ regions (limited for speed)

### Multi-Region Features
- Tests `parseAppStoreReviewsFromRegions()` with regional groupings
- Tests `parseAppStoreReviewsAllRegions()` with all 15 countries
- Tests `parseAppStoreReviewsSingleCountry()` for single country collection
- Validates rate limiting between country batches

## Expected Results

### Success Indicators
- ✅ All tests pass without errors
- ✅ Review counts are reasonable (varies by app popularity)
- ✅ Multi-region collection shows increased review counts
- ✅ Rate limiting prevents timeout errors
- ✅ No duplicate reviews across regions

### Performance Expectations
- **Single Country**: ~10-30 seconds
- **Major Countries**: ~30-60 seconds
- **All Regions**: ~2-5 minutes
- **Rate Limiting**: 500ms delay between pages, 1s between country batches

### Review Count Expectations
- **Popular Apps** (Telegram, WhatsApp): 100-500+ reviews per country
- **Problematic App**: May have fewer reviews, but should not fail
- **Multi-Region**: Should show significantly more reviews than single country

## Troubleshooting

### Common Issues

1. **TypeScript compilation errors**
   ```bash
   npm run build
   npm run test:appstore
   ```

2. **Missing dependencies**
   ```bash
   npm install
   npm run test:appstore
   ```

3. **Rate limiting errors**
   - The script includes built-in rate limiting
   - If you still get errors, try running with a single app first

4. **Network connectivity issues**
   - Ensure you have a stable internet connection
   - Some regions may be blocked in certain countries

5. **Low review counts**
   - This is normal for less popular apps
   - The key is that collection doesn't fail with errors

### Environment Requirements
- Node.js 18+ (as specified in package.json)
- TypeScript support (tsx or ts-node)
- Stable internet connection
- No corporate firewall blocking iTunes APIs

## Understanding the Output

### Test Results
Each test shows:
- **App Name & ID**: Which app is being tested
- **Scenario**: Which test scenario is running
- **Countries**: Which regions are being tested
- **Success/Failure**: Whether the test passed
- **Review Count**: Number of reviews collected
- **Average Rating**: Average star rating of reviews
- **Duration**: Time taken to complete the test

### Rating Distribution
Shows breakdown of reviews by star rating (1-5 stars) with percentages.

### Recent Reviews
Shows how many reviews are from the last 30 days, indicating freshness of data.

### Summary Report
- **Total execution time**: Overall test duration
- **Success rate**: Percentage of tests that passed
- **Top performers**: Apps/scenarios that collected the most reviews
- **Error summary**: Any failures that occurred

## What to Look For

### Positive Indicators
- ✅ High success rate (90%+)
- ✅ Reasonable review counts for popular apps
- ✅ Multi-region collection shows more reviews than single country
- ✅ No timeout or rate limiting errors
- ✅ Recent reviews indicate fresh data

### Warning Signs
- ⚠️ Low success rate (<80%)
- ⚠️ Consistently low review counts across all apps
- ⚠️ Rate limiting or timeout errors
- ⚠️ No recent reviews (all reviews older than 30 days)

### Known Limitations
- Some apps may have limited reviews in certain regions
- Rate limiting may slow down collection (this is intentional)
- Network issues can cause temporary failures
- Some countries may have different review formats

## Contributing

If you encounter issues with the test scripts:

1. Check the console output for specific error messages
2. Verify your internet connection and network settings
3. Try running with a single app first to isolate issues
4. Check if the App Store RSS feeds are accessible from your location
5. Report any persistent issues with full error logs

## Notes

- The test scripts are designed to be non-destructive and read-only
- No data is written to databases during testing
- Rate limiting is intentionally conservative to avoid IP blocks
- The scripts provide detailed logging for debugging purposes
- All tests use real App Store data, so results may vary over time