# 🌍 Multi-Region App Store Review Collection

This application now supports collecting reviews from multiple geographic regions for App Store apps, providing more comprehensive insights into global user feedback.

## 🎯 Geographic Scope Options

### 🇷🇺 Russia Only (single)
- **Regions**: Russia (ru)
- **Use case**: Quick analysis for Russian market
- **Speed**: ⚡ Fastest (1 region)

### 🌟 Major Countries (major) - *Default*
- **Regions**: Russia, USA, UK, Germany, France, Japan
- **Use case**: Balanced coverage of major markets
- **Speed**: ⚡⚡ Fast (6 regions)

### 🇺🇸 English Speaking (english)
- **Regions**: USA, UK, Australia, Canada
- **Use case**: English-language feedback analysis
- **Speed**: ⚡⚡ Fast (4 regions)

### 🇪🇺 Europe (europe)
- **Regions**: UK, Germany, France, Italy, Spain, Russia
- **Use case**: European market analysis
- **Speed**: ⚡⚡ Medium (6 regions)

### 🌎 Americas (americas)
- **Regions**: USA, Canada, Brazil, Mexico
- **Use case**: North & South American markets
- **Speed**: ⚡⚡ Medium (4 regions)

### 🌏 Asia (asia)
- **Regions**: Japan, South Korea, India, China
- **Use case**: Asian market analysis
- **Speed**: ⚡⚡ Medium (4 regions)

### 🌍 All Regions (all)
- **Regions**: All 15 major countries worldwide
- **Use case**: Comprehensive global analysis
- **Speed**: ⚡ Slower (15 regions)

## 🚀 How It Works

1. **Parallel Collection**: Reviews are fetched from multiple regions simultaneously in batches
2. **Rate Limiting**: Built-in delays prevent overwhelming Apple's servers
3. **Deduplication**: Identical reviews across regions are automatically removed
4. **Statistics**: Detailed breakdown shows reviews collected per country

## 📊 Benefits

- **More Data**: Significantly more reviews for better AI analysis
- **Global Perspective**: Understand how your app performs in different markets
- **Language Diversity**: Reviews in multiple languages for broader insights
- **Cultural Insights**: Different regions may highlight different features/issues

## 🎛️ Usage

1. Select **App Store** as platform
2. Choose your desired **Geographic Scope**
3. Enter your App Store ID
4. Click **Get Reviews**

The system will automatically:
- Fetch reviews from selected regions
- Remove duplicates
- Show collection statistics
- Provide comprehensive analysis

## ⚠️ Important Notes

- **Google Play**: Currently uses single region (Russia) - multi-region support coming soon
- **Performance**: More regions = longer collection time but richer data
- **Rate Limits**: Built-in protections prevent API abuse
- **Caching**: Results are cached to avoid unnecessary re-collection

## 📈 Example Results

With **Major Countries** scope for a popular app:
- Russia: 45 reviews
- USA: 128 reviews  
- UK: 67 reviews
- Germany: 89 reviews
- France: 52 reviews
- Japan: 34 reviews
- **Total**: 415 unique reviews vs 45 from single region

This provides 9x more data for AI analysis!