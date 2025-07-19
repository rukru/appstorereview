# 🔧 Scripts Directory

Development and testing scripts for App Store Review Analyzer.

## 📁 Structure

```
scripts/
├── README.md              # This file
├── testing/               # Test scripts
│   ├── test-appstore-parser.ts
│   ├── test-specific-issues.ts
│   ├── quick-test.ts
│   └── validate-setup.ts
├── development/           # Development utilities
│   ├── setup-db.ts
│   ├── seed-data.ts
│   └── cleanup.ts
├── deployment/            # Deployment scripts
│   ├── pre-deploy.ts
│   └── post-deploy.ts
└── utils/                 # Utility functions
    ├── logger.ts
    └── helpers.ts
```

## 🚀 Available Scripts

### Testing
```bash
# Validate environment setup
npm run test:validate

# Quick functionality test
npm run test:quick

# Full test suite
npm run test:appstore

# Test specific issues
npm run test:issues
```

### Development
```bash
# Setup development environment
npm run setup:dev

# Seed test data
npm run seed:data

# Clean up temporary files
npm run cleanup
```

### Deployment
```bash
# Pre-deployment checks
npm run pre-deploy

# Post-deployment validation
npm run post-deploy
```

## 📊 Test Reports

All test results are automatically saved to:
- `docs/testing/reports/` for detailed reports
- Console output for immediate feedback
- Timestamped files for historical tracking

## 🔧 Configuration

Scripts use environment variables from `.env.local`:
- `DATABASE_URL` - Database connection
- `OPENAI_API_KEY` - AI analysis (optional for basic tests)
- `NODE_ENV` - Environment setting

## 📝 Adding New Scripts

1. Create script in appropriate subdirectory
2. Add to `package.json` scripts section
3. Update this README
4. Add error handling and logging
5. Include in CI/CD pipeline if needed

## 🛠️ Maintenance

Scripts are automatically updated and maintained. Report issues or suggest improvements through GitHub issues.