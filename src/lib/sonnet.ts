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
  const modelId = model === 'claude-sonnet-4.5' ? 'claude-3-7-sonnet-2025-04-21' : model;
  
  try {
    // First attempt with temperature 0.1
    const response = await anthropic.messages.create({
      model: modelId,
      system: system,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.1,
      max_tokens: 4000,
    });
    
    const content = response.content[0].text;
    
    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(content);
      
      // Validate with Zod
      const validationResult = zodSchema.safeParse(jsonData);
      
      if (validationResult.success) {
        return validationResult.data;
      } else {
        console.error(`JSON validation failed for ${schemaName}:`, validationResult.error);
        throw new Error(`Invalid ${schemaName} format: ${validationResult.error.message}`);
      }
    } catch (parseError) {
      console.error(`Failed to parse JSON from Sonnet response for ${schemaName}:`, parseError);
      
      // Retry with temperature 0
      console.log('Retrying with temperature 0...');
      const retryResponse = await anthropic.messages.create({
        model: modelId,
        system: `${system} IMPORTANT: You MUST respond with valid JSON only, no markdown or other text.`,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0,
        max_tokens: 4000,
      });
      
      const retryContent = retryResponse.content[0].text;
      
      try {
        const retryJsonData = JSON.parse(retryContent);
        const retryValidationResult = zodSchema.safeParse(retryJsonData);
        
        if (retryValidationResult.success) {
          return retryValidationResult.data;
        } else {
          throw new Error(`Invalid ${schemaName} format after retry: ${retryValidationResult.error.message}`);
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
