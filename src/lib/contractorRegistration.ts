import { isBelarusPhoneComplete } from './phoneInput';

export type ContractorRegistrationProfile = 'partner' | 'pro' | 'leader' | null;

export type ContractorRegistrationFieldErrors = Partial<Record<
  | 'legalStatus'
  | 'legalName'
  | 'unp'
  | 'shortName'
  | 'description'
  | 'bannerText'
  | 'documents'
  | 'services'
  | 'regions'
  | 'phone',
  string
>>;

export interface ContractorRegistrationFormForValidation {
  selectedProfile: ContractorRegistrationProfile;
  legalStatus: string;
  legalName: string;
  unp: string;
  shortName: string;
  description: string;
  bannerText: string;
  selectedServices: string[];
  selectedRegions: string[];
  phone: string;
  documentFilesCount: number;
}

export interface UploadedRegistrationFile {
  name: string;
  key: string;
  kind?: 'image' | 'video' | 'file';
  previewUrl?: string;
}

export function removeUploadedRegistrationFile(files: UploadedRegistrationFile[], key: string) {
  return files.filter(file => file.key !== key);
}

export function validateContractorRegistrationForm(form: ContractorRegistrationFormForValidation) {
  const fields: ContractorRegistrationFieldErrors = {};
  const missingLabels: string[] = [];

  const addError = (field: keyof ContractorRegistrationFieldErrors, label: string, message: string) => {
    fields[field] = message;
    missingLabels.push(label);
  };

  if (!form.legalStatus.trim()) {
    addError('legalStatus', 'статус юридического лица', 'Выберите статус юридического лица');
  }

  if (!form.legalName.trim()) {
    addError('legalName', 'юридическое наименование', 'Укажите полное юридическое наименование');
  }

  if (!/^\d{9}$/.test(form.unp.trim())) {
    addError('unp', 'УНП', 'Укажите УНП из 9 цифр');
  }

  if (form.documentFilesCount === 0) {
    addError('documents', 'документы юридического лица', 'Загрузите документы юридического лица');
  }

  if (!form.shortName.trim()) {
    addError('shortName', 'краткое название', 'Укажите краткое название');
  }

  if (!form.description.trim()) {
    addError('description', 'описание деятельности', 'Опишите деятельность исполнителя');
  }

  if (form.selectedProfile === 'leader' && !form.bannerText.trim()) {
    addError('bannerText', 'текст рекламного баннера', 'Укажите текст для рекламного баннера');
  }

  if (form.selectedServices.length === 0) {
    addError('services', 'услуги', 'Выберите хотя бы одну услугу');
  }

  if (form.selectedRegions.length === 0) {
    addError('regions', 'регион оказания услуг', 'Выберите регион оказания услуг');
  }

  if (!isBelarusPhoneComplete(form.phone)) {
    addError('phone', 'контактный телефон', 'Укажите телефон в формате +375 XX XXX XX XX');
  }

  return {
    isValid: missingLabels.length === 0,
    message: missingLabels.length > 0
      ? `Заполните обязательные поля: ${missingLabels.join(', ')}.`
      : '',
    fields,
  };
}
