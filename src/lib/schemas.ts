import { z } from 'zod';

// Variant schema
export const VariantSchema = z.object({
  chrom: z.string(),
  pos: z.number(),
  ref: z.string(),
  alt: z.string(),
  gene: z.string().optional(),
  vaf: z.number().optional(),
});

export type Variant = z.infer<typeof VariantSchema>;

export const VariantArraySchema = z.array(VariantSchema);

// Annotation schema
export const AnnotationSchema = z.object({
  gene: z.string(),
  variant: z.string(),
  cancerTypes: z.array(z.string()).optional(),
  oncogenicity: z.enum(['Oncogenic', 'Likely Oncogenic', 'Unknown']).optional(),
  actionability: z
    .array(
      z.object({
        drug: z.string(),
        level: z.string(),
      })
    )
    .optional(),
});

export type Annotation = z.infer<typeof AnnotationSchema>;

// FHIR Bundle schema
export const FhirBundleSchema = z.object({
  resourceType: z.literal('Bundle'),
  type: z.literal('collection'),
  entry: z.array(
    z.object({
      resource: z.object({
        resourceType: z.string(),
        id: z.string().optional(),
      }).and(
        z.union([
          // Patient resource
          z.object({
            resourceType: z.literal('Patient'),
            name: z.array(z.object({
              family: z.string().optional(),
              given: z.array(z.string()).optional(),
            })).optional(),
            gender: z.string().optional(),
            birthDate: z.string().optional(),
          }),
          
          // Specimen resource
          z.object({
            resourceType: z.literal('Specimen'),
            type: z.object({
              coding: z.array(z.object({
                system: z.string(),
                code: z.string(),
                display: z.string().optional(),
              })),
            }).optional(),
            collection: z.object({
              collectedDateTime: z.string().optional(),
            }).optional(),
          }),
          
          // Observation resource (genomics)
          z.object({
            resourceType: z.literal('Observation'),
            status: z.string(),
            category: z.array(z.object({
              coding: z.array(z.object({
                system: z.string(),
                code: z.string(),
                display: z.string().optional(),
              })),
            })),
            code: z.object({
              coding: z.array(z.object({
                system: z.string(),
                code: z.string(),
                display: z.string().optional(),
              })),
              text: z.string().optional(),
            }),
            subject: z.object({
              reference: z.string(),
            }),
            component: z.array(z.object({
              code: z.object({
                coding: z.array(z.object({
                  system: z.string(),
                  code: z.string(),
                  display: z.string().optional(),
                })),
              }),
              valueString: z.string().optional(),
              valueQuantity: z.object({
                value: z.number(),
                unit: z.string(),
                system: z.string().optional(),
                code: z.string().optional(),
              }).optional(),
            })).optional(),
          }),
        ])
      ),
    })
  ),
});

export type FhirBundle = z.infer<typeof FhirBundleSchema>;
