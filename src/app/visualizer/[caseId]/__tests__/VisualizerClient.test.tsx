import { render, screen, fireEvent } from '@testing-library/react';
import { VisualizerClient } from '../VisualizerClient';

const mockInitialData = {
  metadata: {
    patientId: 'TEST-001',
    reportSource: 'PDF' as const,
    parsingConfidence: 0.95,
    timestamp: new Date().toISOString(),
  },
  variants: [
    {
      gene: 'BRAF',
      hgvs: 'p.V600E',
      effect: 'missense_variant',
      type: 'SNV' as const,
      evidenceLinks: [],
    },
  ],
  evidence: [
    {
      evidenceId: 'EV-001',
      source: 'OncoKB' as const,
      level: '1',
      description: 'Test evidence',
      drugAssociations: ['Drug A'],
      citations: [],
      timestamp: new Date().toISOString(),
    },
  ],
  therapies: [
    {
      drug: 'Drug A',
      level: '1',
      biomarker: 'BRAF V600E',
      tumorType: 'Melanoma',
      evidenceId: 'EV-001',
    },
  ],
  qc: {
    source: 'PDF' as const,
    metrics: {},
    flags: [],
    confidence: 0.95,
  },
};

describe('VisualizerClient', () => {
  it('renders all tabs', () => {
    render(
      <VisualizerClient
        caseId="TEST-001"
        initialData={mockInitialData}
      />
    );

    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('Variants')).toBeInTheDocument();
    expect(screen.getByText('Annotations')).toBeInTheDocument();
    expect(screen.getByText('Therapies')).toBeInTheDocument();
    expect(screen.getByText('Report Viewer')).toBeInTheDocument();
    expect(screen.getByText('QC & Provenance')).toBeInTheDocument();
    expect(screen.getByText('Audit & Notes')).toBeInTheDocument();
  });

  it('displays patient ID in header', () => {
    render(
      <VisualizerClient
        caseId="TEST-001"
        initialData={mockInitialData}
      />
    );

    expect(screen.getByText('TEST-001')).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    render(
      <VisualizerClient
        caseId="TEST-001"
        initialData={mockInitialData}
      />
    );

    // Click on Variants tab
    fireEvent.click(screen.getByText('Variants'));
    expect(screen.getByText('BRAF')).toBeInTheDocument();
    expect(screen.getByText('p.V600E')).toBeInTheDocument();

    // Click on Therapies tab
    fireEvent.click(screen.getByText('Therapies'));
    expect(screen.getByText('Drug A')).toBeInTheDocument();
    expect(screen.getByText('Melanoma')).toBeInTheDocument();
  });

  it('updates URL when switching tabs', () => {
    render(
      <VisualizerClient
        caseId="TEST-001"
        initialData={mockInitialData}
      />
    );

    // Click on Variants tab
    fireEvent.click(screen.getByText('Variants'));
    expect(window.location.search).toContain('tab=variants');

    // Click on Therapies tab
    fireEvent.click(screen.getByText('Therapies'));
    expect(window.location.search).toContain('tab=therapies');
  });

  it('filters variants using search', () => {
    render(
      <VisualizerClient
        caseId="TEST-001"
        initialData={mockInitialData}
      />
    );

    // Click on Variants tab
    fireEvent.click(screen.getByText('Variants'));

    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search variants, genes, or evidence...');
    fireEvent.change(searchInput, { target: { value: 'BRAF' } });

    // Should still show BRAF variant
    expect(screen.getByText('BRAF')).toBeInTheDocument();
    expect(screen.getByText('p.V600E')).toBeInTheDocument();

    // Search for non-existent variant
    fireEvent.change(searchInput, { target: { value: 'EGFR' } });

    // Should show no results
    expect(screen.getByText('No variants found.')).toBeInTheDocument();
  });

  it('highlights related evidence when selecting a variant', () => {
    render(
      <VisualizerClient
        caseId="TEST-001"
        initialData={mockInitialData}
      />
    );

    // Click on Variants tab and select BRAF variant
    fireEvent.click(screen.getByText('Variants'));
    fireEvent.click(screen.getByText('BRAF'));

    // Switch to Annotations tab
    fireEvent.click(screen.getByText('Annotations'));

    // Should show related evidence
    expect(screen.getByText('Test evidence')).toBeInTheDocument();
    expect(screen.getByText('OncoKB')).toBeInTheDocument();
    expect(screen.getByText('Level 1')).toBeInTheDocument();
  });
});
