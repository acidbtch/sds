export const ALL_BELARUS_LABEL = 'Беларусь';
export const LEGACY_ALL_BELARUS_LABEL = 'Вся Беларусь';
export const MINSK_LABEL = 'Минск';
export const MINSK_REGION_PREFIX = 'Минск / ';

export function isAllBelarusValue(value: string) {
  return value === ALL_BELARUS_LABEL || value === LEGACY_ALL_BELARUS_LABEL;
}

export function stripFormattedRegionValue(value: string) {
  if (isAllBelarusValue(value)) {
    return ALL_BELARUS_LABEL;
  }

  return value.startsWith(MINSK_REGION_PREFIX) ? value.slice(MINSK_REGION_PREFIX.length) : value;
}

export function formatRegionValue(value: string, regionsData: Record<string, string[]>) {
  if (isAllBelarusValue(value)) {
    return ALL_BELARUS_LABEL;
  }

  const minskDistricts = regionsData[MINSK_LABEL] || [];
  return minskDistricts.includes(value) ? `${MINSK_REGION_PREFIX}${value}` : value;
}

export function finalizeRegionSelection({
  localSelected,
  multiSelect,
  regionsData,
}: {
  localSelected: string[];
  multiSelect: boolean;
  regionsData: Record<string, string[]>;
}) {
  let finalSelected = [...localSelected];

  if (multiSelect && finalSelected.length > 0 && !finalSelected.some(isAllBelarusValue)) {
    Object.entries(regionsData).forEach(([region, cities]) => {
      if (region === ALL_BELARUS_LABEL || region === LEGACY_ALL_BELARUS_LABEL) {
        return;
      }

      if (cities.length > 0 && cities.every(city => finalSelected.includes(city))) {
        finalSelected = finalSelected.filter(city => !cities.includes(city));
        if (!finalSelected.includes(region)) {
          finalSelected.push(region);
        }
      }
    });

    const allRegions = Object.keys(regionsData).filter(region => !isAllBelarusValue(region));
    if (allRegions.length > 0 && allRegions.every(region => finalSelected.includes(region))) {
      finalSelected = [ALL_BELARUS_LABEL];
    }
  }

  return finalSelected.map(value => formatRegionValue(value, regionsData));
}

export function expandSelectedRegionsForApi({
  selectedRegions,
  topLevelRegionNames,
}: {
  selectedRegions: string[];
  topLevelRegionNames: string[];
}) {
  const rawSelected = selectedRegions.map(stripFormattedRegionValue);

  if (rawSelected.some(isAllBelarusValue)) {
    return topLevelRegionNames.filter(region => !isAllBelarusValue(region));
  }

  return rawSelected;
}
