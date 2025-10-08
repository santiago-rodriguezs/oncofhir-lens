// OncoTree helper functions for tumor type normalization

// Common OncoTree codes and their mappings
const ONCOTREE_MAPPINGS: Record<string, { code: string; name: string; mainType: string }> = {
  // Lung cancer
  'LUAD': { code: 'LUAD', name: 'Lung Adenocarcinoma', mainType: 'Non-Small Cell Lung Cancer' },
  'LUSC': { code: 'LUSC', name: 'Lung Squamous Cell Carcinoma', mainType: 'Non-Small Cell Lung Cancer' },
  'SCLC': { code: 'SCLC', name: 'Small Cell Lung Cancer', mainType: 'Small Cell Lung Cancer' },
  
  // Breast cancer
  'IDC': { code: 'IDC', name: 'Invasive Ductal Carcinoma', mainType: 'Breast Cancer' },
  'ILC': { code: 'ILC', name: 'Invasive Lobular Carcinoma', mainType: 'Breast Cancer' },
  'TNBC': { code: 'TNBC', name: 'Triple-Negative Breast Cancer', mainType: 'Breast Cancer' },
  
  // Colorectal cancer
  'COAD': { code: 'COAD', name: 'Colon Adenocarcinoma', mainType: 'Colorectal Cancer' },
  'READ': { code: 'READ', name: 'Rectal Adenocarcinoma', mainType: 'Colorectal Cancer' },
  
  // Melanoma
  'MEL': { code: 'MEL', name: 'Melanoma', mainType: 'Melanoma' },
  
  // Leukemia
  'AML': { code: 'AML', name: 'Acute Myeloid Leukemia', mainType: 'Acute Myeloid Leukemia' },
  'ALL': { code: 'ALL', name: 'Acute Lymphoid Leukemia', mainType: 'Acute Lymphoid Leukemia' },
  'CLL': { code: 'CLL', name: 'Chronic Lymphocytic Leukemia', mainType: 'Chronic Lymphocytic Leukemia' },
  'CML': { code: 'CML', name: 'Chronic Myelogenous Leukemia', mainType: 'Chronic Myelogenous Leukemia' },
  
  // Other common cancers
  'GBM': { code: 'GBM', name: 'Glioblastoma', mainType: 'Glioma' },
  'OV': { code: 'OV', name: 'Ovarian Cancer', mainType: 'Ovarian Cancer' },
  'PRAD': { code: 'PRAD', name: 'Prostate Adenocarcinoma', mainType: 'Prostate Cancer' },
  'PAAD': { code: 'PAAD', name: 'Pancreatic Adenocarcinoma', mainType: 'Pancreatic Cancer' },
};

/**
 * Normalize a tumor type string to a valid OncoTree code
 * Accepts OncoTree code, name, or main type
 * 
 * @param tumorType - The tumor type string to normalize
 * @returns The normalized OncoTree code or the original string if no match found
 */
export function normalizeTumorType(tumorType: string | undefined): string {
  if (!tumorType) return '';
  
  // Clean up the input
  const normalizedInput = tumorType.trim().toUpperCase();
  
  // Direct code match
  if (ONCOTREE_MAPPINGS[normalizedInput]) {
    return normalizedInput;
  }
  
  // Search by name or main type
  for (const [code, mapping] of Object.entries(ONCOTREE_MAPPINGS)) {
    if (
      mapping.name.toUpperCase().includes(normalizedInput) ||
      normalizedInput.includes(mapping.name.toUpperCase()) ||
      mapping.mainType.toUpperCase().includes(normalizedInput) ||
      normalizedInput.includes(mapping.mainType.toUpperCase())
    ) {
      return code;
    }
  }
  
  // No match found, return the original string
  return tumorType;
}

/**
 * Get the display name for an OncoTree code
 * 
 * @param code - The OncoTree code
 * @returns The display name or the code if not found
 */
export function getTumorTypeDisplayName(code: string | undefined): string {
  if (!code) return '';
  
  const normalizedCode = code.trim().toUpperCase();
  return ONCOTREE_MAPPINGS[normalizedCode]?.name || code;
}

/**
 * Get the main type for an OncoTree code
 * 
 * @param code - The OncoTree code
 * @returns The main type or the code if not found
 */
export function getTumorTypeMainType(code: string | undefined): string {
  if (!code) return '';
  
  const normalizedCode = code.trim().toUpperCase();
  return ONCOTREE_MAPPINGS[normalizedCode]?.mainType || code;
}

/**
 * Get all available OncoTree codes
 * 
 * @returns Array of OncoTree codes with their names and main types
 */
export function getAllOncoTreeCodes(): Array<{ code: string; name: string; mainType: string }> {
  return Object.entries(ONCOTREE_MAPPINGS).map(([code, mapping]) => ({
    code,
    name: mapping.name,
    mainType: mapping.mainType
  }));
}
