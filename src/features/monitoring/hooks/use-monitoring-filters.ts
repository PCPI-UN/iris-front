'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { MonitoringTab, ProjectFilterState, SortOrder } from '../types';
import { readCategoryIdFromSearchParams } from '@/lib/compat/category-legacy';
import { isProjectState, parseOptionalId, parsePage } from '../utils/parsers';

type UseMonitoringFiltersParams = {
  initialEventId?: number;
};

type UseMonitoringFiltersResult = {
  selectedEventIdFromUrl: number;
  activeTab: MonitoringTab;
  currentPage: number;
  selectedCategoryId?: number;
  selectedState: ProjectFilterState;
  projectSearch: string;
  sortOrder: SortOrder;
  setSortOrder: React.Dispatch<React.SetStateAction<SortOrder>>;
  handleEventChange: (value: string) => void;
  handleTabChange: (tab: MonitoringTab) => void;
  handleStateChange: (state: ProjectFilterState) => void;
  handleCategoryChange: (keys: Set<string>) => void;
  handlePageChange: (page: number) => void;
  handleProjectSearchChange: (value: string) => void;
  isPastEventMode: boolean;
};

export const useMonitoringFilters = ({ initialEventId }: UseMonitoringFiltersParams = {}): UseMonitoringFiltersResult => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projectSearch, setProjectSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const selectedEventIdFromUrl = initialEventId ?? Number(searchParams?.get('event'));
  const activeTab = useMemo(() => {
    const viewParam = searchParams?.get('view');
    return (viewParam === 'projects' ? 'projects' : viewParam === 'ranking' ? 'ranking' : 'statistics') as MonitoringTab;
  }, [searchParams]);
  const currentPage = useMemo(() => parsePage(searchParams?.get('page')), [searchParams]);
  const selectedCategoryId = useMemo(
    () => parseOptionalId(readCategoryIdFromSearchParams(searchParams)),
    [searchParams],
  );
  const stateParam = searchParams?.get('state');
  const selectedState: ProjectFilterState = isProjectState(stateParam) ? stateParam : 'ALL';
  const isPastEventMode = initialEventId !== undefined;

  const updateParams = (
    changes: Record<string, string | number | null | undefined>,
    { resetPage = false }: { resetPage?: boolean } = {},
  ) => {
    const nextParams = new URLSearchParams(searchParams?.toString() ?? '');

    if (resetPage) {
      nextParams.set('page', '1');
    }

    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        nextParams.delete(key);
        return;
      }

      nextParams.set(key, String(value));
    });

    router.replace(`?${nextParams.toString()}`, { scroll: false });
  };

  const handleEventChange = (value: string) => {
    setProjectSearch('');
    updateParams({ event: value, categoryId: null }, { resetPage: true });
  };

  const handleTabChange = (tab: MonitoringTab) => {
    updateParams({ view: tab }, { resetPage: false });
  };

  const handleStateChange = (state: ProjectFilterState) => {
    updateParams({ state: state === 'ALL' ? null : state }, { resetPage: true });
  };

  const handleCategoryChange = (keys: Set<string>) => {
    const selected = Array.from(keys)[0];
    updateParams({ categoryId: selected ? Number(selected) : null }, { resetPage: true });
  };

  const handlePageChange = (page: number) => {
    updateParams({ page }, { resetPage: false });
  };

  const handleProjectSearchChange = (value: string) => {
    setProjectSearch(value);

    if (currentPage !== 1) {
      updateParams({ page: 1 }, { resetPage: false });
    }
  };

  return {
    selectedEventIdFromUrl,
    activeTab,
    currentPage,
    selectedCategoryId,
    selectedState,
    projectSearch,
    sortOrder,
    setSortOrder,
    handleEventChange,
    handleTabChange,
    handleStateChange,
    handleCategoryChange,
    handlePageChange,
    handleProjectSearchChange,
    isPastEventMode,
  };
};