// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock next/config
jest.mock('next/config', () => () => ({
  serverRuntimeConfig: {
    googleProjectId: 'test-project',
    googleLocation: 'test-location',
    healthcareDataset: 'test-dataset',
    fhirStore: 'test-store',
    demoSecret: 'test-secret'
  },
  publicRuntimeConfig: {
    appName: 'OncoFHIR Lens'
  },
}));

// Mock environment variables
process.env = {
  ...process.env,
  GOOGLE_PROJECT_ID: 'test-project',
  GOOGLE_LOCATION: 'test-location',
  HEALTHCARE_DATASET: 'test-dataset',
  FHIR_STORE: 'test-store',
  DEMO_SECRET: 'test-secret',
  NEXT_PUBLIC_DEMO_SECRET: 'test-secret'
};
