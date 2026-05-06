import { Contractor } from '../types';

export type ContractorCatalogFilters = {
  serviceCategory: string | null;
  serviceType: string | null;
  regions: string[];
  ratingSort: 'high' | 'low' | null;
  profileType: 'leader' | 'pro' | 'partner' | null;
  ordersSort: 'more' | 'less' | null;
};

type ServiceCategory = {
  id: string;
  services: string[];
};

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normalizeProfileType(value: unknown) {
  const normalized = normalize(value);
  if (normalized === 'лидер') return 'leader';
  if (normalized === 'профи') return 'pro';
  if (normalized === 'партнер' || normalized === 'партнёр') return 'partner';
  return normalized;
}

function numericValue(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

function dateValue(value: unknown) {
  const timestamp = Date.parse(String(value || ''));
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function contractorHasService(contractor: Contractor, service: string) {
  const normalizedService = normalize(service);
  return contractor.services.some((contractorService) => normalize(contractorService) === normalizedService);
}

function contractorMatchesCategory(contractor: Contractor, category: ServiceCategory | undefined) {
  if (!category) return true;
  return category.services.some((service) => contractorHasService(contractor, service));
}

export function getFilteredContractors(
  contractors: Contractor[],
  filters: ContractorCatalogFilters,
  serviceCategories: ServiceCategory[],
  searchQuery = ''
) {
  const query = normalize(searchQuery);
  const selectedCategory = filters.serviceCategory
    ? serviceCategories.find((category) => category.id === filters.serviceCategory)
    : undefined;

  return [...contractors]
    .filter((contractor) => {
      if (!query) return true;
      return [contractor.name, contractor.shortName, contractor.description]
        .some((value) => normalize(value).includes(query));
    })
    .filter((contractor) => !filters.serviceCategory || contractorMatchesCategory(contractor, selectedCategory))
    .filter((contractor) => !filters.serviceType || contractorHasService(contractor, filters.serviceType))
    .filter((contractor) => (
      filters.regions.length === 0 ||
      filters.regions.includes('Беларусь') ||
      contractor.regions.some((region) => filters.regions.some((selectedRegion) => normalize(region) === normalize(selectedRegion)))
    ))
    .filter((contractor) => (
      !filters.profileType ||
      normalizeProfileType(contractor.profileType) === filters.profileType
    ))
    .sort((left, right) => {
      if (filters.ordersSort) {
        const orderDiff = numericValue(right.completedOrders) - numericValue(left.completedOrders);
        if (orderDiff !== 0) {
          return filters.ordersSort === 'more' ? orderDiff : -orderDiff;
        }
      }

      if (filters.ratingSort) {
        const ratingDiff = numericValue(right.rating) - numericValue(left.rating);
        if (ratingDiff !== 0) {
          return filters.ratingSort === 'high' ? ratingDiff : -ratingDiff;
        }
      }

      if (!filters.profileType && !filters.ratingSort && !filters.ordersSort) {
        const profileWeight: Record<string, number> = { leader: 3, pro: 2, partner: 1 };
        const weightDiff =
          (profileWeight[normalizeProfileType(right.profileType)] || 0) -
          (profileWeight[normalizeProfileType(left.profileType)] || 0);
        if (weightDiff !== 0) return weightDiff;
      }

      return dateValue(left.registrationDate) - dateValue(right.registrationDate);
    });
}
