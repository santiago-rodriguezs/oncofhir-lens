/**
 * Validates required environment variables for the application
 * This is run at startup to ensure all necessary configuration is present
 */

export function validateEnvironment(): { valid: boolean; messages: string[] } {
  const messages: string[] = [];
  const requiredVars = [
    'GOOGLE_PROJECT_ID',
    'GOOGLE_LOCATION',
    'HEALTHCARE_DATASET',
    'FHIR_STORE',
    'DEMO_SECRET'
  ];
  
  const optionalVars = [
    'GOOGLE_APPLICATION_CREDENTIALS',
    'ONCOKB_API_KEY',
    'GCP_VERTEX_LOCATION',
    'GEMINI_MODEL'
  ];
  
  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      messages.push(`Missing required environment variable: ${varName}`);
    }
  }
  
  // Check optional variables
  for (const varName of optionalVars) {
    if (!process.env[varName]) {
      messages.push(`Warning: Optional environment variable not set: ${varName}`);
    }
  }
  
  // Check specific combinations
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    messages.push('Warning: GOOGLE_APPLICATION_CREDENTIALS not set. Application Default Credentials will be used.');
  }
  
  if (!process.env.ONCOKB_API_KEY) {
    messages.push('Warning: ONCOKB_API_KEY not set. OncoKB annotation will not be available.');
  }
  
  if (!process.env.GCP_VERTEX_LOCATION || !process.env.GEMINI_MODEL) {
    messages.push('Warning: Gemini AI configuration incomplete. AI-assisted suggestions will not be available.');
  }
  
  return {
    valid: !messages.some(msg => msg.startsWith('Missing required')),
    messages
  };
}

/**
 * Logs environment validation results
 */
export function logEnvironmentValidation(): void {
  const { valid, messages } = validateEnvironment();
  
  if (valid) {
    console.log('✅ Environment validation passed with warnings:');
  } else {
    console.error('❌ Environment validation failed:');
  }
  
  messages.forEach(message => {
    if (message.startsWith('Missing required')) {
      console.error(`  - ${message}`);
    } else {
      console.warn(`  - ${message}`);
    }
  });
  
  if (valid) {
    console.log('Application can start with limited functionality.');
  } else {
    console.error('Please set the required environment variables before starting the application.');
  }
}
