// Global type declarations for the project

// Extend the NodeJS namespace
declare namespace NodeJS {
  interface ProcessEnv {
    GOOGLE_PROJECT_ID: string;
    GOOGLE_LOCATION: string;
    HEALTHCARE_DATASET: string;
    FHIR_STORE: string;
    GOOGLE_APPLICATION_CREDENTIALS?: string;
    ONCOKB_API_KEY?: string;
    GCP_VERTEX_LOCATION?: string;
    GEMINI_MODEL?: string;
    DEMO_SECRET: string;
    NEXT_PUBLIC_DEMO_SECRET?: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}

// Declare global variables for Jest
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }
}
