import { Patient, Variant } from '@/types/fhir';
import getConfig from 'next/config';

// Get server-side runtime config
const { serverRuntimeConfig } = getConfig() || { serverRuntimeConfig: {} };

// Gemini API configuration
interface GeminiConfig {
  vertexLocation: string;
  modelName: string;
}

// Default configuration from environment variables
const defaultConfig: GeminiConfig = {
  vertexLocation: serverRuntimeConfig.gcpVertexLocation || process.env.GCP_VERTEX_LOCATION || '',
  modelName: serverRuntimeConfig.geminiModel || process.env.GEMINI_MODEL || 'gemini-1.5-pro',
};

/**
 * Call Gemini API to summarize findings and suggest therapies
 * @param variants - List of genomic variants
 * @param patient - Patient information
 * @returns Array of detected issues with therapy suggestions
 */
export async function summarizeFindings(
  variants: Variant[],
  patient: Patient
) {
  const config = defaultConfig;
  
  // Check if Gemini is configured
  if (!config.vertexLocation || !config.modelName) {
    throw new Error('Gemini API not configured. Check environment variables.');
  }
  
  try {
    // Prepare the system prompt
    const systemPrompt = `You are a clinical assistant specialized in oncology genomics. Given variants and minimal patient context, summarize key actionable alterations and propose evidence-based therapy suggestions. Avoid hallucinations; state uncertainty; produce short, structured JSON.`;
    
    // Prepare the user prompt with variant information
    const variantDescriptions = variants.map(variant => {
      return {
        gene: variant.gene,
        hgvs: variant.hgvs,
        consequence: variant.consequence,
        clinvar_significance: variant.clinvarSignificance || 'unknown',
        vaf: variant.vaf ? (variant.vaf * 100).toFixed(2) + '%' : 'unknown',
        known_evidence: variant.evidenceUrls || []
      };
    });
    
    // Extract minimal patient context
    const patientContext = {
      id: patient.id,
      gender: patient.gender || 'unknown',
      age: patient.birthDate ? calculateAge(patient.birthDate) : 'unknown'
    };
    
    const userPrompt = `
      Please analyze the following genomic variants and provide clinical insights:
      
      Patient context:
      ${JSON.stringify(patientContext, null, 2)}
      
      Variants:
      ${JSON.stringify(variantDescriptions, null, 2)}
      
      For each actionable variant, provide:
      1. issueTitle: A concise title for the clinical issue
      2. rationale: 1-2 lines explaining the clinical significance
      3. suggestions: Array of recommended therapies or drug classes
      4. evidenceRefs: Array of URLs to supporting evidence, or ['unknown'] if uncertain
      5. severity: "high", "moderate", or "low" based on clinical urgency
      
      Return a JSON array of issues. Only include variants with clear clinical significance.
      Format: [{"issueTitle": "...", "rationale": "...", "suggestions": ["..."], "evidenceRefs": ["..."], "severity": "..."}]
    `;
    
    // Call Gemini API
    // In a real implementation, this would use the Vertex AI SDK or REST API
    // For this demo, we'll simulate a response
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a simulated response based on the variants
    const response = simulateGeminiResponse(variants);
    
    return response.map(item => ({
      title: item.issueTitle,
      detail: item.issueTitle,
      severity: item.severity as 'high' | 'moderate' | 'low',
      evidence: item.rationale,
      suggestions: item.suggestions,
      evidenceRefs: item.evidenceRefs.filter(url => url !== 'unknown')
    }));
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

/**
 * Calculate age from birthdate
 * @param birthDate - ISO date string
 * @returns Age in years as a string
 */
function calculateAge(birthDate: string): string {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return `${age} years`;
}

/**
 * Simulate Gemini API response for demo purposes
 * @param variants - List of genomic variants
 * @returns Simulated Gemini response
 */
function simulateGeminiResponse(variants: Variant[]) {
  const response = [];
  
  // Check for common actionable variants
  for (const variant of variants) {
    // EGFR mutations
    if (variant.gene === 'EGFR' && (
      variant.hgvs.includes('L858R') || 
      variant.hgvs.includes('exon19del') ||
      variant.hgvs.includes('T790M')
    )) {
      response.push({
        issueTitle: `EGFR ${variant.hgvs} - Targetable Driver Mutation`,
        rationale: `EGFR ${variant.hgvs} is a well-established driver mutation in non-small cell lung cancer that predicts response to EGFR tyrosine kinase inhibitors.`,
        suggestions: ['Osimertinib', 'Gefitinib', 'Erlotinib', 'Afatinib'],
        evidenceRefs: [
          'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1450',
          'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6933030/'
        ],
        severity: 'high'
      });
    }
    
    // BRAF V600E
    if (variant.gene === 'BRAF' && variant.hgvs.includes('V600E')) {
      response.push({
        issueTitle: 'BRAF V600E - Targetable Driver Mutation',
        rationale: 'BRAF V600E mutation is a well-established driver in melanoma and other cancers, predicting response to BRAF inhibitors.',
        suggestions: ['Vemurafenib', 'Dabrafenib', 'Dabrafenib + Trametinib'],
        evidenceRefs: [
          'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1461',
          'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5010093/'
        ],
        severity: 'high'
      });
    }
    
    // ALK fusions
    if (variant.gene === 'ALK' && variant.hgvs.includes('fusion')) {
      response.push({
        issueTitle: 'ALK Fusion - Targetable Driver Mutation',
        rationale: 'ALK gene fusions are established drivers in a subset of non-small cell lung cancers and predict response to ALK inhibitors.',
        suggestions: ['Alectinib', 'Lorlatinib', 'Brigatinib', 'Crizotinib'],
        evidenceRefs: [
          'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1450',
          'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6932758/'
        ],
        severity: 'high'
      });
    }
    
    // KRAS G12C
    if (variant.gene === 'KRAS' && variant.hgvs.includes('G12C')) {
      response.push({
        issueTitle: 'KRAS G12C - Newly Targetable Mutation',
        rationale: 'KRAS G12C is now targetable with specific inhibitors in non-small cell lung cancer and other tumors.',
        suggestions: ['Sotorasib', 'Adagrasib', 'Clinical trial enrollment'],
        evidenceRefs: [
          'https://www.fda.gov/drugs/resources-information-approved-drugs/fda-grants-accelerated-approval-sotorasib-kras-g12c-mutated-nsclc',
          'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8118268/'
        ],
        severity: 'high'
      });
    }
    
    // BRCA1/2 mutations
    if ((variant.gene === 'BRCA1' || variant.gene === 'BRCA2') && 
        (variant.consequence.includes('frameshift') || variant.consequence.includes('nonsense'))) {
      response.push({
        issueTitle: `${variant.gene} Loss-of-Function - PARP Inhibitor Sensitivity`,
        rationale: `Loss-of-function mutations in ${variant.gene} predict sensitivity to PARP inhibitors in ovarian, breast, pancreatic, and prostate cancers.`,
        suggestions: ['Olaparib', 'Niraparib', 'Rucaparib', 'Talazoparib'],
        evidenceRefs: [
          'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1453',
          'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6355451/'
        ],
        severity: 'moderate'
      });
    }
    
    // MSI-High markers (MLH1, MSH2, MSH6, PMS2)
    if (['MLH1', 'MSH2', 'MSH6', 'PMS2'].includes(variant.gene) && 
        (variant.consequence.includes('frameshift') || variant.consequence.includes('nonsense'))) {
      response.push({
        issueTitle: 'Mismatch Repair Deficiency - Immunotherapy Response',
        rationale: 'Loss of mismatch repair proteins suggests microsatellite instability (MSI-High) status, which predicts response to immune checkpoint inhibitors.',
        suggestions: ['Pembrolizumab', 'Nivolumab', 'Nivolumab + Ipilimumab'],
        evidenceRefs: [
          'https://www.fda.gov/drugs/resources-information-approved-drugs/fda-grants-accelerated-approval-pembrolizumab-first-tissue-site-agnostic-indication',
          'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5953546/'
        ],
        severity: 'moderate'
      });
    }
  }
  
  // Add generic high TMB suggestion if many variants
  if (variants.length > 20) {
    response.push({
      issueTitle: 'Potential High Tumor Mutation Burden - Consider Immunotherapy',
      rationale: 'The high number of mutations detected suggests elevated tumor mutation burden, which may predict response to immune checkpoint inhibitors.',
      suggestions: ['Pembrolizumab', 'Nivolumab', 'TMB testing confirmation'],
      evidenceRefs: [
        'https://www.fda.gov/drugs/drug-approvals-and-databases/fda-approves-pembrolizumab-adults-and-children-tmb-h-solid-tumors',
        'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6133188/'
      ],
      severity: 'low'
    });
  }
  
  return response;
}
