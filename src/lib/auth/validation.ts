import getConfig from 'next/config';

// Get server-side runtime config
const { serverRuntimeConfig } = getConfig() || { serverRuntimeConfig: {} };

/**
 * Validate authentication token from request headers
 * This is a simple demo implementation - in production, use a proper auth system
 * 
 * @param authHeader - Authorization header from request
 * @returns boolean indicating if token is valid
 */
export function validateToken(authHeader: string | null): boolean {
  if (!authHeader) {
    return false;
  }
  
  // Extract token from Bearer format
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;
  
  // Get demo secret from environment
  const demoSecret = serverRuntimeConfig.demoSecret || process.env.DEMO_SECRET;
  
  if (!demoSecret) {
    console.warn('DEMO_SECRET not configured in environment variables');
    return false;
  }
  
  // Simple token comparison
  return token === demoSecret;
}

/**
 * Check if user has physician role
 * This is a placeholder for a real role-based access control system
 * 
 * @param userId - User ID to check
 * @returns boolean indicating if user has physician role
 */
export function hasPhysicianRole(userId: string): boolean {
  // In a real system, this would check against a database or auth provider
  // For demo purposes, all authenticated users have physician role
  return true;
}

/**
 * Generate a demo token for client-side use
 * In production, use a proper auth system with JWTs or session cookies
 * 
 * @returns Demo token for client-side API calls
 */
export function generateDemoToken(): string {
  // In a real system, this would generate a proper JWT or session token
  // For demo purposes, return the demo secret
  return process.env.NEXT_PUBLIC_DEMO_SECRET || 'demo_token';
}
