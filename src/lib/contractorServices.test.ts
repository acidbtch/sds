import { strict as assert } from 'node:assert';
import {
  getContractorServiceGroups,
  getContractorServiceCategoryLabels,
} from './contractorServices';

const serviceCategories = [
  {
    id: 'engine',
    name: 'Двигатель',
    services: ['Диагностика двигателя', 'Ремонт двигателя'],
  },
  {
    id: 'suspension',
    name: 'Подвеска',
    services: ['Диагностика подвески'],
  },
];

const contractorServices = [
  'Ремонт двигателя',
  'Диагностика подвески',
  'Редкая услуга без категории',
];

assert.deepEqual(
  getContractorServiceCategoryLabels(contractorServices, serviceCategories),
  ['Двигатель', 'Подвеска', 'Другие услуги']
);

assert.deepEqual(
  getContractorServiceGroups(contractorServices, serviceCategories),
  [
    { category: 'Двигатель', services: ['Ремонт двигателя'] },
    { category: 'Подвеска', services: ['Диагностика подвески'] },
    { category: 'Другие услуги', services: ['Редкая услуга без категории'] },
  ]
);

console.log('contractor service grouping passed');
