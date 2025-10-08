# OncoKB Insights Tab

This tab provides integration with the OncoKB knowledge base for precision oncology.

## Features

- Query OncoKB API for annotations on genomic variants
- Filter results by tumor type, evidence level, and sensitivity/resistance
- View summary statistics of annotations
- Browse suggested therapies in a sortable table
- Explore detailed variant information with summaries and evidence

## Setup

To use the OncoKB Insights tab, you need to set up the following environment variables in your `.env.local` file:

```
ONCOKB_BASE_URL=https://www.oncokb.org/api/v1
ONCOKB_AUTH_TOKEN=your_oncokb_api_token
```

You can obtain an OncoKB API token by registering at [oncokb.org](https://www.oncokb.org/).

## Usage

The OncoKB Insights tab accepts annotations in the following format:

```typescript
type Annotation = {
  geneSymbol: string;  // Required
  variant?: string;    // Protein change, e.g. "V600E"
  hgvs?: string;       // HGVS notation
  tumorType?: string;  // OncoTree code
  referenceGenome?: "GRCh37" | "GRCh38";
  alterationType?: "MUTATION" | "CNA" | "SV";
};
```

At least one of `variant` or `hgvs` must be provided for each annotation.

## Implementation Details

- Uses React Query for data fetching with caching (TTL: 15 minutes)
- Implements exponential backoff for API rate limiting
- Batches queries by type (protein change, HGVS, CNA, SV)
- Normalizes tumor types using OncoTree codes
- Infers therapies from highest levels when treatments are empty

## API Endpoints Used

- `/api/v1/annotate/mutations/byProteinChange`
- `/api/v1/annotate/mutations/byHGVSg`
- `/api/v1/annotate/mutations/byGenomicChange`
- `/api/v1/annotate/copyNumberAlterations`
- `/api/v1/annotate/structuralVariants`

## Error Handling

The tab includes comprehensive error handling:
- Displays a warning when OncoKB API token is not configured
- Shows loading states during API requests
- Provides retry functionality for failed requests
- Handles empty or partial results gracefully
