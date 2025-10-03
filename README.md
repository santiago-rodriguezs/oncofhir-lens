# OncoFHIR Lens

OncoFHIR Lens is a Next.js 14 application that helps physicians interpret genomic studies by transforming sequencing results (VCF) into clinician-friendly insights. The application leverages HL7 Genomics on FHIR standards to store and retrieve genomic data, and uses Google's Gemini AI to provide clinical suggestions.

## Features

- Upload and process genomic studies (VCF files)
- View interpretable variant tables with filtering capabilities
- Receive AI-assisted clinical suggestions
- Persist data using Google Healthcare API (FHIR store)
- Secure server-side processing of sensitive operations

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API routes (server runtime)
- **Data Storage**: Google Healthcare API (FHIR)
- **AI**: Google Gemini (Vertex AI)
- **Authentication**: Simple token-based auth (for demo purposes)

## Data Mapping

```
VCF File → Parse → FHIR Resources
                    ├── Patient
                    ├── Specimen
                    ├── Observation(s) [Genomics profile]
                    └── DetectedIssue(s) [Clinical suggestions]
```

## Prerequisites

- Node.js 18.x or higher
- Google Cloud Platform account with Healthcare API enabled
- Google Cloud service account with appropriate permissions
- (Optional) OncoKB API key for variant annotation
- (Optional) Google Vertex AI API access for Gemini

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Google Cloud Healthcare API Configuration
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_LOCATION=us-central1
HEALTHCARE_DATASET=oncofhir-dataset
FHIR_STORE=oncofhir-store
# Optional: Path to service account key if not using Application Default Credentials
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Optional: OncoKB API Key
# ONCOKB_API_KEY=your-oncokb-api-key

# Google Vertex AI / Gemini Configuration
GCP_VERTEX_LOCATION=us-central1
GEMINI_MODEL=gemini-1.5-pro

# Demo Authentication
DEMO_SECRET=change_this_in_production
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/oncofhir-lens.git
cd oncofhir-lens
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Setting up Google Healthcare API FHIR Store

1. Create a Google Cloud project (or use an existing one)
2. Enable the Cloud Healthcare API
3. Create a dataset and FHIR store:

```bash
# Install Google Cloud SDK if you haven't already
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Create a dataset
gcloud healthcare datasets create oncofhir-dataset --location=us-central1

# Create a FHIR store within the dataset
gcloud healthcare fhir-stores create oncofhir-store \
  --dataset=oncofhir-dataset \
  --location=us-central1 \
  --version=R4 \
  --enable-update-create
```

4. Create a service account and download the key:
```bash
gcloud iam service-accounts create oncofhir-service-account \
  --display-name="OncoFHIR Service Account"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:oncofhir-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/healthcare.fhirStoreAdmin"

gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=oncofhir-service-account@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

5. Move the service account key to a secure location and update your `.env.local` file.

## Switching Gemini On/Off

- To enable Gemini AI suggestions, set the `GCP_VERTEX_LOCATION` and `GEMINI_MODEL` environment variables.
- To disable Gemini, remove or comment out these variables. The application will fall back to rule-based suggestions.

## Demo Data

The application includes a sample VCF file in the `public/demo-data` directory that you can use for testing. It contains common oncogenic variants including EGFR L858R and KRAS G12C.

## Example FHIR Resources

### Genomic Observation Example

```json
{
  "resourceType": "Observation",
  "id": "example-genomic-observation",
  "status": "final",
  "category": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "laboratory",
          "display": "Laboratory"
        },
        {
          "system": "http://terminology.hl7.org/CodeSystem/observation-category",
          "code": "genomics",
          "display": "Genomics"
        }
      ]
    }
  ],
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "69548-6",
        "display": "Genetic variant assessment"
      }
    ],
    "text": "Variant: EGFR p.L858R"
  },
  "subject": {
    "reference": "Patient/patient-demo-001"
  },
  "specimen": {
    "reference": "Specimen/specimen-demo-001"
  },
  "effectiveDateTime": "2025-09-15T14:30:00Z",
  "issued": "2025-09-15T14:30:00Z",
  "component": [
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "48018-6",
            "display": "Gene studied"
          }
        ]
      },
      "valueString": "EGFR"
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "48004-6",
            "display": "DNA change (c.HGVS)"
          }
        ]
      },
      "valueString": "p.L858R"
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "48001-2",
            "display": "Chromosome"
          }
        ]
      },
      "valueString": "7"
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "48005-3",
            "display": "Amino acid change (p.HGVS)"
          }
        ]
      },
      "valueString": "missense_variant"
    },
    {
      "code": {
        "coding": [
          {
            "system": "http://loinc.org",
            "code": "81258-6",
            "display": "Variant allele frequency"
          }
        ]
      },
      "valueString": "0.35"
    }
  ]
}
```

### DetectedIssue Example

```json
{
  "resourceType": "DetectedIssue",
  "id": "example-detected-issue",
  "status": "final",
  "code": {
    "coding": [
      {
        "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        "code": "GENTHERAPY",
        "display": "Genomic Therapy Issue"
      }
    ],
    "text": "EGFR L858R - Targetable Driver Mutation"
  },
  "severity": "high",
  "patient": {
    "reference": "Patient/patient-demo-001"
  },
  "identifiedDateTime": "2025-09-15T14:35:00Z",
  "evidence": "EGFR L858R is a well-established driver mutation in non-small cell lung cancer that predicts response to EGFR tyrosine kinase inhibitors.",
  "detail": "EGFR L858R - Targetable Driver Mutation",
  "mitigation": [
    "Osimertinib",
    "Gefitinib",
    "Erlotinib",
    "Afatinib"
  ]
}
```

## Deployment

This application can be deployed to Google Cloud Run:

1. Build the Docker image:
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/oncofhir-lens
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy oncofhir-lens \
  --image gcr.io/YOUR_PROJECT_ID/oncofhir-lens \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_PROJECT_ID=your-project-id,GOOGLE_LOCATION=us-central1,HEALTHCARE_DATASET=oncofhir-dataset,FHIR_STORE=oncofhir-store,DEMO_SECRET=your-secret"
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- HL7 FHIR Genomics Implementation Guide
- Google Healthcare API Documentation
- Google Vertex AI / Gemini Documentation
