# OncoKB Integration for OncoFHIR Lens

This document provides information about the OncoKB integration in the OncoFHIR Lens application.

## Overview

The OncoKB integration allows users to access precision oncology knowledge from the [OncoKB](https://www.oncokb.org/) database directly within the OncoFHIR Lens application. It provides information about:

- Oncogenicity of genomic alterations
- Hotspot mutations
- Therapeutic implications with evidence levels
- Gene and variant summaries
- Diagnostic and prognostic implications

## Setup

To use the OncoKB integration, you need to:

1. Obtain an API token from [OncoKB](https://www.oncokb.org/apiAccess)
2. Add the following environment variables to your `.env.local` file:

```
ONCOKB_AUTH_TOKEN=your-oncokb-api-token
ONCOKB_BASE_URL=https://www.oncokb.org
```

## Features

### OncoKB Client

The OncoKB client (`src/lib/oncokb/client.ts`) provides the following functionality:

- API endpoints for different types of alterations:
  - Mutations by protein change
  - Mutations by HGVSg
  - Mutations by genomic change
  - Copy number alterations
  - Structural variants (fusions)
- Rate limiting and backoff handling
- Response normalization
- Batching of queries by type

### OncoTree Helper

The OncoTree helper (`src/lib/oncokb/oncotree.ts`) provides functions for:

- Normalizing tumor types to OncoTree codes
- Getting display names and main types for OncoTree codes
- Listing available OncoTree codes

### React Query Hooks

The React Query hooks (`src/lib/oncokb/hooks.ts`) provide:

- Data fetching with caching (15 minutes TTL)
- Filtering results by tumor type, evidence level, and sensitivity/resistance
- Aggregating drugs across results
- Calculating summary statistics

### UI Components

The UI components include:

- `OncoKbInsightsContent`: Main component for the OncoKB Insights tab
- `OncoKbFilterBar`: Filter controls for tumor type, evidence level, and sensitivity/resistance
- `OncoKbSummaryCards`: Summary statistics cards
- `OncoKbDrugsTable`: Sortable table of suggested therapies
- `OncoKbVariantDetails`: Detailed variant information with summaries and evidence

## Usage

1. Process variants in the OncoFHIR Lens application
2. Annotate the variants
3. Navigate to the "OncoKB Insights" tab
4. Use the filters to refine the results
5. Explore the suggested therapies and variant details

## Evidence Levels

OncoKB uses the following evidence levels:

- Level 1: FDA-recognized biomarker predictive of response to an FDA-approved drug
- Level 2: Standard care biomarker predictive of response to an FDA-approved drug
- Level 3: Clinical evidence links biomarker to drug response
- Level 4: Biological evidence links biomarker to drug response
- Level R1: Standard care biomarker predictive of resistance to an FDA-approved drug
- Level R2: Clinical evidence links biomarker to drug resistance
- Dx: Diagnostic implication
- Px: Prognostic implication

## References

- [OncoKB API Documentation](https://www.oncokb.org/api/v1/swagger-ui.html)
- [OncoTree](http://oncotree.mskcc.org/)
- [Levels of Evidence](https://www.oncokb.org/levels)
