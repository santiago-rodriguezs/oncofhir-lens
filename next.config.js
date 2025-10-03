/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverRuntimeConfig: {
    // Will only be available on the server side
    googleProjectId: process.env.GOOGLE_PROJECT_ID,
    googleLocation: process.env.GOOGLE_LOCATION,
    healthcareDataset: process.env.HEALTHCARE_DATASET,
    fhirStore: process.env.FHIR_STORE,
    oncokbApiKey: process.env.ONCOKB_API_KEY,
    gcpVertexLocation: process.env.GCP_VERTEX_LOCATION,
    geminiModel: process.env.GEMINI_MODEL,
    demoSecret: process.env.DEMO_SECRET
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    appName: 'OncoFHIR Lens'
  },
  // Configure for large file uploads
  experimental: {
    serverComponentsExternalPackages: ['@googleapis/healthcare']
  },
};

module.exports = nextConfig;
