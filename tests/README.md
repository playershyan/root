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
npm run test          # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:unit     # Run unit tests only
npm run test:integration # Run integration tests only
```

## Test Files

- Unit tests: `*.test.{ts,tsx}` or `*.spec.{ts,tsx}`
- Integration tests: `*.integration.test.{ts,tsx}`
- E2E tests: `*.e2e.test.{ts,tsx}`

## Coverage

Target coverage: 70% for branches, functions, lines, and statements.

## Mocks

- Supabase client is mocked in `jest.setup.js`
- Next.js router and navigation are mocked
- Toast notifications are mocked