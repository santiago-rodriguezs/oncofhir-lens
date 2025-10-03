# OncoFHIR Lens Library

This directory contains the core library modules for the OncoFHIR Lens application.

## Directory Structure

```
lib/
├── index.ts              # Main entry point for all library exports
├── auth/                 # Authentication and authorization utilities
│   ├── index.ts          # Auth module exports
│   └── validation.ts     # Token validation and role-based access control
├── cds/                  # Clinical Decision Support utilities
│   ├── index.ts          # CDS module exports
│   └── rules.ts          # Rule-based therapy suggestions
├── fhir/                 # FHIR API client and resources
│   ├── index.ts          # FHIR module exports
│   ├── client.ts         # FHIR API client for Google Healthcare API
│   └── resources.ts      # FHIR resource creation and management
├── gemini/               # Gemini AI integration
│   ├── index.ts          # Gemini module exports
│   └── api.ts            # Gemini API client for clinical insights
├── utils/                # Common utilities
│   ├── index.ts          # Utils module exports
│   ├── demo-data.ts      # Demo data for testing
│   └── env-validator.ts  # Environment variable validation
└── vcf/                  # VCF file parsing utilities
    ├── index.ts          # VCF module exports
    └── parser.ts         # VCF file parsing and variant extraction
```

## Usage

Import modules from the main entry point:

```typescript
import { validateToken } from '@/lib/auth';
import { fhirClient, upsertPatient } from '@/lib/fhir';
import { summarizeFindings } from '@/lib/gemini';
import { parseVcf } from '@/lib/vcf';
import { applySimpleRules } from '@/lib/cds';
import { validateEnvironment, demoCaseData } from '@/lib/utils';
```

Or import specific modules directly:

```typescript
import { validateToken } from '@/lib/auth/validation';
import { fhirClient } from '@/lib/fhir/client';
import { upsertPatient } from '@/lib/fhir/resources';
```
