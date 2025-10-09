import { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useVisualizerStore } from '@/lib/store/visualizer';

export function useVisualizerNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    selectedVariant,
    setSelectedVariant,
    filters,
    setFilters,
    setSearchQuery,
  } = useVisualizerStore();

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Update variant selection in URL
    if (selectedVariant) {
      params.set('variant', `${selectedVariant.gene}-${selectedVariant.hgvs}`);
    } else {
      params.delete('variant');
    }

    // Update filters in URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, Array.isArray(value) ? value.join(',') : String(value));
      } else {
        params.delete(key);
      }
    });

    // Update the URL without reloading the page
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl);
  }, [selectedVariant, filters, router, searchParams]);

  // Restore state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Restore variant selection
    const variantParam = params.get('variant');
    if (variantParam) {
      const [gene, hgvs] = variantParam.split('-');
      if (gene && hgvs) {
        setSelectedVariant({ gene, hgvs } as any);
      }
    }

    // Restore filters
    const newFilters: Record<string, any> = {};
    params.forEach((value, key) => {
      if (key !== 'variant' && key !== 'tab') {
        if (value.includes(',')) {
          newFilters[key] = value.split(',');
        } else if (value === 'true') {
          newFilters[key] = true;
        } else if (value === 'false') {
          newFilters[key] = false;
        } else if (!isNaN(Number(value))) {
          newFilters[key] = Number(value);
        } else {
          newFilters[key] = value;
        }
      }
    });
    setFilters(newFilters);
  }, [searchParams, setSelectedVariant, setFilters]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd + F: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector(
          '[data-search-input="true"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Esc: Clear selection
      if (e.key === 'Escape') {
        setSelectedVariant(undefined);
        setSearchQuery('');
      }

      // Left/Right arrows: Navigate variants
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // This will be implemented when we have the variants list
        // For now, it's a placeholder
        console.log('Navigate variants:', e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSelectedVariant, setSearchQuery]);

  // Return any navigation-related utilities
  return {
    setTab: useCallback(
      (tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.replace(`${window.location.pathname}?${params.toString()}`);
      },
      [router, searchParams]
    ),
    currentTab: searchParams.get('tab') || 'summary',
  };
}
