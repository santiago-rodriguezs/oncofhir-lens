import { test, expect } from '@playwright/test';

/**
 * E2E test: VCF example flow
 *
 * 1. Authenticate via demo credentials
 * 2. Load sample VCF
 * 3. Process VCF
 * 4. Verify navigation to visualizer
 * 5. Validate variants, annotations, FHIR bundle
 */

async function signIn(page: import('@playwright/test').Page) {
  const csrfRes = await page.request.get('/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();

  await page.request.post('/api/auth/callback/credentials', {
    form: {
      secret: 'demo',
      csrfToken,
      callbackUrl: '/',
      json: 'true',
    },
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Fallback: try demo provider if redirected to login
  if (page.url().includes('/login')) {
    const csrf2 = await page.request.get('/api/auth/csrf');
    const { csrfToken: token2 } = await csrf2.json();
    await page.request.post('/api/auth/callback/demo', {
      form: { secret: 'demo', csrfToken: token2, callbackUrl: '/', json: 'true' },
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  }
}

test.describe('VCF Example Flow', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('loads sample VCF, processes it, and shows annotated variants in visualizer', async ({
    page,
  }) => {
    // Should be on home page
    await expect(page.locator('h1')).toContainText('OncoFHIR Lens', { timeout: 10_000 });

    // Switch to VCF tab
    await page.getByRole('button', { name: 'Procesar VCF (opcional)' }).click();

    // Wait for VCF section to appear
    await expect(page.locator('textarea')).toBeVisible({ timeout: 10_000 });

    // Click "Cargar ejemplo VCF" to load sample
    await page.locator('button', { hasText: /^Cargar ejemplo VCF$/ }).click();

    // Wait for textarea to be populated with VCF content
    const textarea = page.locator('textarea');
    await expect(textarea).not.toBeEmpty({ timeout: 5000 });
    const vcfContent = await textarea.inputValue();
    expect(vcfContent).toContain('##fileformat=VCF');
    expect(vcfContent).toContain('EGFR');
    expect(vcfContent).toContain('TP53');

    // Click "Procesar VCF" button
    await page.click('button:has-text("Procesar VCF"):not(:has-text("opcional"))');

    // Wait for navigation to visualizer (annotation can take a while)
    await page.waitForURL(/\/visualizer\//, { timeout: 90_000 });

    // --- Visualizer Assertions ---
    await expect(page.locator('body')).toContainText('VCF', { timeout: 10_000 });

    // Check variants tab
    const variantsTab = page.locator('[role="tab"]:has-text("Variant"), button:has-text("Variant"), [data-value="variants"]');
    if (await variantsTab.count() > 0) {
      await variantsTab.first().click();
      for (const gene of ['EGFR', 'TP53', 'PIK3CA']) {
        await expect(page.locator('body')).toContainText(gene, { timeout: 10_000 });
      }
    }

    // Check annotations tab
    const annotationsTab = page.locator('[role="tab"]:has-text("Annotation"), button:has-text("Annotation"), [data-value="annotations"]');
    if (await annotationsTab.count() > 0) {
      await annotationsTab.first().click();
      await page.waitForTimeout(2000);
      const body = await page.locator('body').textContent();
      const hasAnnotations =
        body?.includes('OncoKB') ||
        body?.includes('ClinVar') ||
        body?.includes('DGIdb') ||
        body?.includes('Evidence') ||
        body?.includes('evidence');
      expect(hasAnnotations).toBeTruthy();
    }

    // Check FHIR tab
    const fhirTab = page.locator('[role="tab"]:has-text("FHIR"), button:has-text("FHIR"), [data-value="fhir"]');
    if (await fhirTab.count() > 0) {
      await fhirTab.first().click();
      await page.waitForTimeout(2000);
      const fhirContent = await page.locator('body').textContent();
      const hasFhir =
        fhirContent?.includes('Bundle') ||
        fhirContent?.includes('DiagnosticReport') ||
        fhirContent?.includes('Observation') ||
        fhirContent?.includes('FHIR');
      expect(hasFhir).toBeTruthy();
    }
  });

  test('VCF upload API returns valid structure', async ({ request }) => {
    const csrfRes = await request.get('/api/auth/csrf');
    const { csrfToken } = await csrfRes.json();

    await request.post('/api/auth/callback/demo', {
      form: { secret: 'demo', csrfToken, callbackUrl: '/', json: 'true' },
    });

    const sampleVcf = [
      '##fileformat=VCFv4.2',
      '##FILTER=<ID=PASS,Description="All filters passed">',
      '##reference=GRCh38',
      '##INFO=<ID=GENE,Number=1,Type=String,Description="Gene symbol">',
      '##INFO=<ID=AF,Number=1,Type=Float,Description="Allele Frequency">',
      '#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tSAMPLE1',
      'chr7\t55249071\t.\tC\tT\t100\tPASS\tGENE=EGFR;AF=0.35\tGT:AD:AF\t0/1:65,35:0.35',
      'chr17\t7675088\t.\tC\tT\t100\tPASS\tGENE=TP53;AF=0.42\tGT:AD:AF\t0/1:58,42:0.42',
    ].join('\n');

    const uploadRes = await request.post('/api/vcf/upload', {
      data: { vcf: sampleVcf },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(uploadRes.ok()).toBeTruthy();
    const json = await uploadRes.json();

    // Validate response structure
    expect(json).toHaveProperty('caseId');
    expect(json).toHaveProperty('variants');
    expect(json.caseId).toBeTruthy();
    expect(Array.isArray(json.variants)).toBeTruthy();
    expect(json.variants.length).toBe(2);

    // Validate variant structure
    const egfr = json.variants.find((v: any) => v.gene === 'EGFR');
    expect(egfr).toBeTruthy();
    expect(egfr.chrom).toContain('7');
    expect(egfr.pos).toBe(55249071);
    expect(egfr.ref).toBe('C');
    expect(egfr.alt).toBe('T');

    const tp53 = json.variants.find((v: any) => v.gene === 'TP53');
    expect(tp53).toBeTruthy();
  });
});
