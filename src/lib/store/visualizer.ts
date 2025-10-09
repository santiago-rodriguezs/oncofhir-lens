import { create } from 'zustand';
import { Variant, Evidence, Therapy } from '@/core/models';

type NavigationDirection = 'next' | 'previous';

interface VisualizerFilters {
  gene?: string;
  consequence?: string;
  vafRange?: [number, number];
  oncokbLevel?: string;
  pathogenicity?: string;
}

interface VisualizerState {
  // Selected items
  selectedVariant?: Variant;
  selectedEvidence?: Evidence;
  selectedTherapy?: Therapy;

  // Global filters
  filters: VisualizerFilters;
  searchQuery: string;

  // Variant navigation
  currentVariantIndex: number;
  filteredVariants: Variant[];
  navigateVariants: (direction: NavigationDirection) => void;
  
  // Actions
  setSelectedVariant: (variant?: Variant) => void;
  setSelectedEvidence: (evidence?: Evidence) => void;
  setSelectedTherapy: (therapy?: Therapy) => void;
  setFilters: (filters: Partial<VisualizerFilters>) => void;
  setSearchQuery: (query: string) => void;
  clearSelections: () => void;
  clearFilters: () => void;
  setFilteredVariants: (variants: Variant[]) => void;
}

export const useVisualizerStore = create<VisualizerState>((set, get) => ({
  // Initial state
  filters: {},
  searchQuery: '',
  currentVariantIndex: -1,
  filteredVariants: [],

  // Actions
  setSelectedVariant: (variant) => {
    const { filteredVariants } = get();
    const index = variant
      ? filteredVariants.findIndex((v) => v.gene === variant.gene && v.hgvs === variant.hgvs)
      : -1;
    set({ selectedVariant: variant, currentVariantIndex: index });
  },

  setSelectedEvidence: (evidence) => set({ selectedEvidence: evidence }),
  setSelectedTherapy: (therapy) => set({ selectedTherapy: therapy }),
  
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  clearSelections: () =>
    set({
      selectedVariant: undefined,
      selectedEvidence: undefined,
      selectedTherapy: undefined,
      currentVariantIndex: -1,
    }),
  
  clearFilters: () =>
    set({
      filters: {},
      searchQuery: '',
    }),

  setFilteredVariants: (variants) =>
    set((state) => {
      const currentVariant = state.selectedVariant;
      const index = currentVariant
        ? variants.findIndex((v) => v.gene === currentVariant.gene && v.hgvs === currentVariant.hgvs)
        : -1;
      return {
        filteredVariants: variants,
        currentVariantIndex: index,
      };
    }),

  navigateVariants: (direction) =>
    set((state) => {
      const { filteredVariants, currentVariantIndex } = state;
      if (filteredVariants.length === 0) return {};

      let newIndex = currentVariantIndex;
      if (direction === 'next') {
        newIndex = currentVariantIndex === filteredVariants.length - 1 ? 0 : currentVariantIndex + 1;
      } else {
        newIndex = currentVariantIndex <= 0 ? filteredVariants.length - 1 : currentVariantIndex - 1;
      }

      return {
        selectedVariant: filteredVariants[newIndex],
        currentVariantIndex: newIndex,
      };
    }),
}));
