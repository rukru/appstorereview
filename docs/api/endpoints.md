# 🔗 API Endpoints Reference

Complete API documentation for App Store Review Analyzer.

## 📋 Overview

Base URL: `https://your-app.vercel.app/api` (production) or `http://localhost:3000/api` (development)

## 📊 Review Collection

### GET `/api/reviews`
Collect reviews for a specific app.

**Parameters:**
- `appId` (required): App Store ID or Google Play package name
- `platform` (required): `appstore` or `googleplay`
- `forceRefresh` (optional): `true` to bypass cache

**Response:**
```json
{
  "reviews": [
    {
      "id": "unique-review-id",
      "title": "Review title",
      "content": "Review content",
      "rating": 5,
      "author": "Author name",
      "date": "2024-01-01T00:00:00Z",
      "platform": "appstore",
      "appId": "1065290732"
    }
  ],
  "totalCount": 3245,
  "averageRating": 4.2,
  "appName": "App Name",
  "platform": "appstore",
  "fromCache": false
}
```

## 🤖 AI Analysis

### POST `/api/analyze`
Generate AI analysis for collected reviews.

**Request Body:**
```json
{
  "appId": "1065290732",
  "platform": "appstore",
  "dateFilter": "30days"
}
```

**Response:**
```json
{
  "id": "analysis-id",
  "shareId": "public-share-id",
  "sentiment": "positive",
  "score": 8.5,
  "summary": "Overall positive reception...",
  "appreciatedFeatures": [...],
  "featureRequests": [...],
  "problems": [...],
  "themes": [...],
  "recommendations": [...],
  "isPublic": false
}
```

## 🔍 App Search

### GET `/api/search`
Search for apps by name or ID.

**Parameters:**
- `query` (required): Search term
- `platform` (required): `appstore` or `googleplay`

**Response:**
```json
{
  "results": [
    {
      "id": "1065290732",
      "name": "App Name",
      "icon": "https://app-icon-url.jpg",
      "rating": 4.2,
      "platform": "appstore"
    }
  ]
}
```

## 📈 Analytics

### GET `/api/analytics`
Get analytics data for the application.

**Response:**
```json
{
  "totalApps": 156,
  "totalReviews": 45230,
  "totalAnalyses": 89,
  "recentActivity": [...],
  "popularApps": [...],
  "platformStats": {
    "appstore": 75,
    "googleplay": 81
  }
}
```

## 📱 App Information

### GET `/api/app-info`
Get detailed app information.

**Parameters:**
- `appId` (required): App Store ID or package name
- `platform` (required): `appstore` or `googleplay`

**Response:**
```json
{
  "name": "App Name",
  "icon": "https://app-icon-url.jpg",
  "bundleId": "com.example.app",
  "description": "App description",
  "averageRating": 4.2,
  "ratingCount": 12500
}
```

## 📋 Saved Apps

### GET `/api/apps`
Get list of saved apps with review counts.

**Response:**
```json
[
  {
    "id": "database-id",
    "appId": "1065290732",
    "platform": "APPSTORE",
    "name": "App Name",
    "updatedAt": "2024-01-01T00:00:00Z",
    "_count": {
      "reviews": 3245,
      "analyses": 5
    }
  }
]
```

## 🔓 Public Analysis

### GET `/api/analysis/[shareId]`
Get public analysis by share ID.

**Parameters:**
- `shareId` (required): Public share identifier

**Response:**
```json
{
  "analysis": { ... },
  "appInfo": { ... },
  "reviewsCount": 3245
}
```

### PATCH `/api/analysis/[shareId]`
Update analysis visibility.

**Request Body:**
```json
{
  "isPublic": true
}
```

## 🔧 Error Handling

### Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details"
}
```

### HTTP Status Codes
- `200`: Success
- `400`: Bad Request (missing parameters)
- `404`: Not Found (app/analysis not found)
- `429`: Rate Limited
- `500`: Internal Server Error

## 🚀 Rate Limiting

All endpoints are rate-limited to prevent abuse:
- **Review collection**: 1 request per 10 seconds per IP
- **AI analysis**: 1 request per 30 seconds per IP
- **Other endpoints**: 10 requests per minute per IP

## 📊 Response Times

Typical response times:
- **App search**: < 1 second
- **Review collection**: 30-120 seconds
- **AI analysis**: 10-30 seconds
- **Other endpoints**: < 2 seconds