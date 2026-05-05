import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, ChevronLeft } from 'lucide-react';
import { useData } from '../context/DataContext';
import { REGIONS_DATA as FALLBACK_REGIONS } from '../data/regions';
import {
  ALL_BELARUS_LABEL,
  finalizeRegionSelection,
  formatRegionValue,
  getAllBelarusSelectionHint,
  isAllBelarusValue,
  LEGACY_ALL_BELARUS_LABEL,
  MINSK_LABEL,
  stripFormattedRegionValue,
} from '../lib/regionSelection';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedRegions: string[];
  onSelect: (regions: string[]) => void;
  multiSelect?: boolean;
  isCustomer?: boolean;
}

export default function RegionSelector({
  isOpen,
  onClose,
  selectedRegions,
  onSelect,
  multiSelect = false,
  isCustomer = false,
}: Props) {
  const { regionsData } = useData();

  const activeRegionsData = useMemo(() => {
    const source = Object.keys(regionsData).length > 0 ? regionsData : FALLBACK_REGIONS;
    const normalizedData = { ...source };

    if (normalizedData[LEGACY_ALL_BELARUS_LABEL] !== undefined && normalizedData[ALL_BELARUS_LABEL] === undefined) {
      normalizedData[ALL_BELARUS_LABEL] = normalizedData[LEGACY_ALL_BELARUS_LABEL];
      delete normalizedData[LEGACY_ALL_BELARUS_LABEL];
    }

    return normalizedData;
  }, [regionsData]);

  const defaultTab = useMemo(
    () => Object.keys(activeRegionsData).find(region => !isAllBelarusValue(region)) || ALL_BELARUS_LABEL,
    [activeRegionsData]
  );

  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  const canMultiSelectActiveTab = multiSelect || (isCustomer && activeTab === MINSK_LABEL);

  useEffect(() => {
    if (!isOpen) return;

    const rawSelectedRegions = selectedRegions.map(stripFormattedRegionValue);

    if (selectedRegions.length === 0) {
      setLocalSelected([]);
      setActiveTab(defaultTab);
      setSearchQuery('');
      return;
    }

    setLocalSelected(rawSelectedRegions.map(value => (isAllBelarusValue(value) ? ALL_BELARUS_LABEL : value)));

    if (rawSelectedRegions.some(isAllBelarusValue)) {
      setActiveTab(ALL_BELARUS_LABEL);
      setSearchQuery('');
      return;
    }

    let foundRegion = defaultTab;
    for (const [region, cities] of Object.entries(activeRegionsData)) {
      if (cities.includes(rawSelectedRegions[0]) || region === rawSelectedRegions[0]) {
        foundRegion = region;
        break;
      }
    }

    setActiveTab(foundRegion);
    setSearchQuery('');
  }, [activeRegionsData, defaultTab, isOpen, selectedRegions]);

  const handleTabClick = (region: string) => {
    if (activeTab === region) return;

    setActiveTab(region);

    if (isAllBelarusValue(region)) {
      setLocalSelected([ALL_BELARUS_LABEL]);
      return;
    }

    if (localSelected.some(isAllBelarusValue)) {
      setLocalSelected([]);
      return;
    }

    if (!multiSelect) {
      setLocalSelected(isCustomer && region === MINSK_LABEL ? [] : [region]);
    }
  };

  const handleCityToggle = (city: string) => {
    if (!canMultiSelectActiveTab) {
      setLocalSelected(localSelected.includes(city) ? [] : [city]);
      return;
    }

    let nextSelected = [...localSelected];
    if (nextSelected.some(isAllBelarusValue)) {
      nextSelected = [];
    }

    if (nextSelected.includes(activeTab)) {
      nextSelected = nextSelected.filter(value => value !== activeTab);
      const citiesInRegion = activeRegionsData[activeTab] || [];
      citiesInRegion.forEach((regionCity) => {
        if (regionCity !== city && !nextSelected.includes(regionCity)) {
          nextSelected.push(regionCity);
        }
      });
    } else if (nextSelected.includes(city)) {
      nextSelected = nextSelected.filter(value => value !== city);
    } else {
      nextSelected.push(city);
    }

    setLocalSelected(nextSelected);
  };

  const handleRegionToggle = (region: string) => {
    if (!canMultiSelectActiveTab) {
      setLocalSelected([region]);
      return;
    }

    let nextSelected = [...localSelected];
    if (nextSelected.some(isAllBelarusValue)) {
      nextSelected = [];
    }

    if (nextSelected.includes(region)) {
      nextSelected = nextSelected.filter(value => value !== region);
    } else {
      nextSelected.push(region);
      const citiesInRegion = activeRegionsData[region] || [];
      nextSelected = nextSelected.filter(value => !citiesInRegion.includes(value));
    }

    setLocalSelected(nextSelected);
  };

  const handleApply = () => {
    onSelect(finalizeRegionSelection({
      localSelected,
      multiSelect,
      regionsData: activeRegionsData,
    }));
    onClose();
  };

  const filteredCities = useMemo(() => {
    if (!searchQuery) return activeRegionsData[activeTab] || [];

    return (activeRegionsData[activeTab] || []).filter(city =>
      city.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeRegionsData, activeTab, searchQuery]);

  if (!isOpen) return null;

  const availableRegions = isCustomer
    ? Object.keys(activeRegionsData).filter(region => !isAllBelarusValue(region))
    : Object.keys(activeRegionsData);

  const selectedSummary = localSelected.length > 0
    ? localSelected.map(region => formatRegionValue(region, activeRegionsData)).join(', ')
    : 'Ничего не выбрано';

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col w-full max-w-md mx-auto shadow-2xl">
      <div className="p-3 border-b border-gray-100 flex items-center justify-between gap-4 sticky top-0 bg-white z-10">
        {!isCustomer ? (
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Введите город"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2 text-sm focus:ring-orange-500 focus:border-orange-500 outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex-1 text-center font-bold text-gray-900">Выберите населенный пункт</div>
        )}
        <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:bg-[#E8EDF2] rounded-full flex-shrink-0 ml-auto">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="border-b border-gray-100 bg-white">
        <div className="grid grid-cols-2 gap-2 p-2">
          {availableRegions.map(region => (
            <button
              key={region}
              type="button"
              onClick={() => handleTabClick(region)}
              className={`w-full rounded-full border px-3 py-2 text-xs min-h-[40px] transition-colors ${
                activeTab === region
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 overflow-y-auto flex-1 pb-32">
        {activeTab !== ALL_BELARUS_LABEL ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-bold text-gray-900">Город / Район</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!searchQuery && multiSelect && (
                <label className="flex items-center gap-3 cursor-pointer group py-2 col-span-full border-b border-gray-100 pb-4 mb-2">
                  <div className="relative flex items-center justify-center flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={localSelected.includes(activeTab)}
                      onChange={() => handleRegionToggle(activeTab)}
                      className="peer appearance-none w-6 h-6 border border-gray-300 focus:ring-2 focus:ring-orange-500/20 checked:bg-orange-500 checked:border-orange-500 transition-colors cursor-pointer rounded"
                    />
                    <svg className="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-base font-bold text-gray-900 group-hover:text-orange-600 truncate">{activeTab}</span>
                </label>
              )}
              {filteredCities.map(city => (
                <label key={city} className="flex items-center gap-3 cursor-pointer group py-2">
                  <div className="relative flex items-center justify-center flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={canMultiSelectActiveTab ? (localSelected.includes(activeTab) || localSelected.includes(city)) : localSelected.includes(city)}
                      onChange={() => handleCityToggle(city)}
                      className={`peer appearance-none w-6 h-6 border border-gray-300 focus:ring-2 focus:ring-orange-500/20 checked:bg-orange-500 checked:border-orange-500 transition-colors cursor-pointer ${canMultiSelectActiveTab ? 'rounded' : 'rounded-full'}`}
                    />
                    <svg className="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-base text-gray-700 group-hover:text-gray-900 truncate" title={city}>{city}</span>
                </label>
              ))}
              {filteredCities.length === 0 && (
                <p className="text-sm text-gray-500 col-span-full">Ничего не найдено</p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center px-4">
            <p>{getAllBelarusSelectionHint(isCustomer)}</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 flex flex-col gap-4 z-20 w-full max-w-md mx-auto">
        <div className="flex justify-between items-center w-full px-2 gap-3">
          <div className="text-sm font-bold text-gray-900 break-words">{selectedSummary}</div>
          <button
            type="button"
            onClick={() => setLocalSelected([])}
            className="text-sm font-bold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1 shrink-0"
          >
            <X className="w-4 h-4 stroke-[2.5]" /> Сбросить значения
          </button>
        </div>
        <div className="flex gap-2 w-full">
          <button type="button" onClick={onClose} className="flex-1 bg-[#E8EDF2] text-[#0F2846] hover:bg-[#D8DFE8] font-bold py-4 rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" /> Назад
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={localSelected.length === 0}
            className={`flex-[2] font-bold py-4 rounded-xl shadow-lg transition-all ${
              localSelected.length > 0
                ? 'bg-orange-500 text-white active:scale-[0.98]'
                : 'bg-orange-300 text-orange-50 cursor-not-allowed'
            }`}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}
