import assert from 'node:assert/strict';
import { Contractor } from '../types';
import { getFilteredContractors, ContractorCatalogFilters } from './contractorCatalog';

const baseFilters: ContractorCatalogFilters = {
  serviceCategory: null,
  serviceType: null,
  regions: [],
  ratingSort: null,
  profileType: null,
  ordersSort: null,
};

function contractor(overrides: Partial<Contractor>): Contractor {
  return {
    id: overrides.id || '',
    name: overrides.name || '',
    shortName: overrides.shortName || overrides.name || '',
    description: overrides.description || '',
    services: overrides.services || [],
    regions: overrides.regions || [],
    rating: overrides.rating ?? 0,
    reviewsCount: overrides.reviewsCount ?? 0,
    completedOrders: overrides.completedOrders ?? 0,
    profileType: overrides.profileType || 'partner',
    registrationDate: overrides.registrationDate || '2026-01-01T00:00:00.000Z',
    phone: overrides.phone || '',
  };
}

const categories = [
  { id: 'engine', services: ['Ремонт двигателя', 'Ремонт турбин'] },
  { id: 'wheels', services: ['Шиномонтаж'] },
];

const contractors = [
  contractor({
    id: 'leader-engine',
    services: ['Ремонт двигателя'],
    regions: ['Минск'],
    rating: 4.9,
    completedOrders: 10,
    profileType: 'leader',
    registrationDate: '2026-01-03T00:00:00.000Z',
  }),
  contractor({
    id: 'pro-turbine',
    services: ['Ремонт турбин'],
    regions: ['Гомельская область'],
    rating: 4.5,
    completedOrders: 30,
    profileType: 'pro',
    registrationDate: '2026-01-02T00:00:00.000Z',
  }),
  contractor({
    id: 'partner-wheels',
    services: ['Шиномонтаж'],
    regions: ['Минск'],
    rating: 5,
    completedOrders: 3,
    profileType: 'Партнёр',
    registrationDate: '2026-01-01T00:00:00.000Z',
  }),
];

assert.deepEqual(
  getFilteredContractors(contractors, { ...baseFilters, serviceCategory: 'engine' }, categories).map((item) => item.id),
  ['leader-engine', 'pro-turbine'],
  'category filter should include every contractor with services from the selected category',
);

assert.deepEqual(
  getFilteredContractors(contractors, { ...baseFilters, serviceCategory: 'engine', serviceType: 'Ремонт турбин' }, categories).map((item) => item.id),
  ['pro-turbine'],
  'service type should narrow the selected category',
);

assert.deepEqual(
  getFilteredContractors(contractors, { ...baseFilters, regions: ['Минск'] }, categories).map((item) => item.id),
  ['leader-engine', 'partner-wheels'],
  'region filter should compare selected region names exactly after normalization',
);

assert.deepEqual(
  getFilteredContractors(contractors, { ...baseFilters, profileType: 'partner' }, categories).map((item) => item.id),
  ['partner-wheels'],
  'profile filter should support Russian profile labels from backend data',
);

assert.deepEqual(
  getFilteredContractors(contractors, { ...baseFilters, ordersSort: 'more' }, categories).map((item) => item.id),
  ['pro-turbine', 'leader-engine', 'partner-wheels'],
  'orders sort should sort by completed orders without being hidden by default profile priority',
);

assert.deepEqual(
  getFilteredContractors(contractors, { ...baseFilters, ratingSort: 'low' }, categories).map((item) => item.id),
  ['pro-turbine', 'leader-engine', 'partner-wheels'],
  'rating sort should sort by rating in the requested direction',
);

console.log('contractor catalog filters passed');
