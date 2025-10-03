import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';

/**
 * Get Anthropic client instance
 * @returns Anthropic client
 */
export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }
  
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });
}

/**
 * Call Claude Sonnet with JSON output validation using Zod
 * @param model - Anthropic model to use
 * @param system - System prompt
 * @param userPrompt - User prompt
 * @param schemaName - Name of the schema for error messages
 * @param zodSchema - Zod schema to validate response
 * @returns Validated response object
 */
export async function sonnetJson<T>(
  model: string,
  system: string,
  userPrompt: string,
  schemaName: string,
  zodSchema: z.ZodType<T>
): Promise<T> {
  const anthropic = getAnthropic();
  // Use the model string directly
  
  try {
    // First attempt with temperature 0.1
    const response = await anthropic.messages.create({
      model: model,
      system: system,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.1,
      max_tokens: 4000,
    });
    
    let content = response.content[0].text;
    
    try {
      // Clean the content from markdown formatting
      content = cleanJsonContent(content);
      
      // Try to parse as JSON
      const jsonData = JSON.parse(content);
      
      // Validate with Zod
      const validationResult = zodSchema.safeParse(jsonData);
      
      if (validationResult.success) {
        return validationResult.data;
      } else {
        console.error(`JSON validation failed for ${schemaName}:`, validationResult.error);
        
        // Format the error message in a more readable way
        const formattedError = JSON.stringify(validationResult.error.format(), null, 2);
        console.error(`Formatted validation errors: ${formattedError}`);
        
        // Check for specific validation issues we want to highlight
        const errorString = validationResult.error.message;
        
        // Check for missing category field in Observation resources
        if (errorString.includes("category") && schemaName === "FhirBundle") {
          console.error("CRITICAL ERROR: Missing 'category' field in Observation resource. Each Observation MUST include the 'category' field with at least one element for 'laboratory'.");
          throw new Error(`Invalid ${schemaName} format: Missing 'category' field in Observation resource. Each Observation MUST include the 'category' field.`);
        }
        
        throw new Error(`Invalid ${schemaName} format: ${validationResult.error.message}`);
      }
    } catch (parseError) {
      console.error(`Failed to parse JSON from Sonnet response for ${schemaName}:`, parseError);
      
      // Retry with temperature 0
      console.log('Retrying with temperature 0...');
      const retryResponse = await anthropic.messages.create({
        model: model,
        system: `${system} IMPORTANT: You MUST respond with valid JSON only, no markdown or other text.`,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0,
        max_tokens: 4000,
      });
      
      let retryContent = retryResponse.content[0].text;
      
      try {
        // Clean the retry content from markdown formatting
        retryContent = cleanJsonContent(retryContent);
        
        const retryJsonData = JSON.parse(retryContent);
        const retryValidationResult = zodSchema.safeParse(retryJsonData);
        
        if (retryValidationResult.success) {
          return retryValidationResult.data;
        } else {
          // Format the retry error message in a more readable way
          const formattedError = JSON.stringify(retryValidationResult.error.format(), null, 2);
          console.error(`Formatted validation errors after retry: ${formattedError}`);
          
          // Check for specific validation issues we want to highlight
          const errorString = retryValidationResult.error.message;
          
          // Check for missing category field in Observation resources
          if (errorString.includes("category") && schemaName === "FhirBundle") {
            console.error("CRITICAL ERROR: Missing 'category' field in Observation resource. Each Observation MUST include the 'category' field with at least one element for 'laboratory'.");
            throw new Error(`Invalid ${schemaName} format after retry: Missing 'category' field in Observation resource. Each Observation MUST include the 'category' field.`);
          }
          
          throw new Error(`Invalid ${schemaName} format after retry: ${formattedError}`);
        }
      } catch (retryError) {
        throw new Error(`Failed to get valid ${schemaName} JSON after retry: ${retryError}`);
      }
    }
  } catch (error) {
    console.error(`Error calling Anthropic API for ${schemaName}:`, error);
    throw error;
  }
}

/**
 * Clean JSON content from markdown formatting
 * @param content - Content to clean
 * @returns Cleaned content
 */
function cleanJsonContent(content: string): string {
  // Remove markdown code block formatting if present
  let cleaned = content.trim();
  
  // Remove markdown code block backticks and json language identifier
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7).trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3).trim();
  }
  
  // Remove trailing backticks if present
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3).trim();
  }
  
  // Log the cleaning process for debugging
  if (cleaned !== content) {
    console.log('Cleaned JSON content from markdown formatting');
  }
  
  return cleaned;
}
