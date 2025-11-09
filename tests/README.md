# Tests Directory

This directory contains all test files for the application.

## Structure

- `/unit` - Unit tests for individual functions and components
  - `/lib` - Tests for library utilities and services
  - `/utils` - Tests for utility functions
  - `/components` - Tests for React components
- `/integration` - Integration tests for API routes and features
  - `/api` - Tests for API endpoints
- `/e2e` - End-to-end tests for user flows

## Running Tests

```bash
# Jest tests (unit + integration)
npm run test          # Run all Jest tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:unit     # Run unit tests only
npm run test:integration # Run integration tests only

# Playwright E2E tests
npm run test:e2e         # Run E2E tests (headless)
npm run test:e2e:ui      # Run E2E tests with UI mode
npm run test:e2e:headed  # Run E2E tests in headed mode

# CI
npm run test:ci       # Run all tests (Jest + Playwright)
```

## Test Files

- Unit tests: `*.test.{ts,tsx}` or `*.spec.{ts,tsx}` (Jest)
- Integration tests: `*.integration.test.{ts,tsx}` (Jest)
- E2E tests: `*.e2e.test.{ts,tsx}` (Playwright)

## Coverage

Target coverage: 70% for branches, functions, lines, and statements.

## Mocks

- Supabase client is mocked in `jest.setup.js`
- Next.js router and navigation are mocked
- Toast notifications are mocked