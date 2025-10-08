import { NextRequest, NextResponse } from 'next/server';

// Environment variables
const ONCOKB_BASE_URL = process.env.ONCOKB_BASE_URL || 'https://www.oncokb.org/api/v1';
const ONCOKB_AUTH_TOKEN = process.env.ONCOKB_AUTH_TOKEN;

// Helper function to handle rate limiting and retries
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      // If rate limited, wait and retry
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '5';
        const waitTime = parseInt(retryAfter, 10) * 1000;
        console.log(`Rate limited. Waiting for ${waitTime}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }
      
      // If server error, wait and retry
      if (response.status >= 500) {
        const waitTime = Math.min(1000 * Math.pow(2, retries), 10000);
        console.log(`Server error (${response.status}). Waiting for ${waitTime}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }
      
      return response;
    } catch (error) {
      if (retries < maxRetries - 1) {
        const waitTime = Math.min(1000 * Math.pow(2, retries), 10000);
        console.log(`Network error. Waiting for ${waitTime}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
      } else {
        throw error;
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} retries`);
}

export async function POST(request: NextRequest) {
  if (!ONCOKB_AUTH_TOKEN) {
    return NextResponse.json({ error: 'OncoKB API token not configured' }, { status: 500 });
  }
  
  try {
    // Get the endpoint path from the request
    const { endpoint } = await request.json();
    
    if (!endpoint) {
      return NextResponse.json({ error: 'No endpoint specified' }, { status: 400 });
    }
    
    // Get the body from the request
    const body = await request.json();
    
    // Remove the endpoint from the body
    const { endpoint: _, ...requestBody } = body;
    
    // Construct the full URL
    const url = `${ONCOKB_BASE_URL}${endpoint}`;
    
    console.log(`Proxying request to OncoKB: ${url}`);
    
    // Make the request to OncoKB
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ONCOKB_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody.queries || requestBody),
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in OncoKB API proxy:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
