import assert from 'node:assert/strict';
import {
  removeUploadedRegistrationFile,
  validateContractorRegistrationForm,
} from './contractorRegistration';

const validForm = {
  selectedProfile: 'partner' as const,
  legalStatus: 'ООО',
  legalName: 'ООО Тест',
  unp: '123456789',
  shortName: 'Тест',
  description: 'Ремонт автомобилей',
  bannerText: '',
  selectedServices: ['Диагностика'],
  selectedRegions: ['Беларусь'],
  phone: '+375 29 123 45 67',
  documentFilesCount: 1,
};

assert.deepEqual(
  validateContractorRegistrationForm({
    ...validForm,
    legalStatus: '',
    documentFilesCount: 0,
    selectedServices: [],
    phone: '+375 29',
  }),
  {
    isValid: false,
    message: 'Заполните обязательные поля: статус юридического лица, документы юридического лица, услуги, контактный телефон.',
    fields: {
      legalStatus: 'Выберите статус юридического лица',
      documents: 'Загрузите документы юридического лица',
      services: 'Выберите хотя бы одну услугу',
      phone: 'Укажите телефон в формате +375 XX XXX XX XX',
    },
  },
  'invalid contractor registration should explain why submit did not continue',
);

assert.equal(
  validateContractorRegistrationForm(validForm).isValid,
  true,
  'valid partner registration should be accepted by frontend validation',
);

assert.deepEqual(
  validateContractorRegistrationForm({
    ...validForm,
    selectedProfile: 'leader',
    bannerText: '',
  }).fields.bannerText,
  'Укажите текст для рекламного баннера',
  'leader registration should require banner text before submit',
);

assert.deepEqual(
  removeUploadedRegistrationFile(
    [
      { name: 'first.pdf', key: 'file-1' },
      { name: 'second.pdf', key: 'file-2' },
    ],
    'file-1',
  ),
  [{ name: 'second.pdf', key: 'file-2' }],
  'uploaded file remove action should remove only the clicked file',
);

console.log('contractor registration validation passed');
