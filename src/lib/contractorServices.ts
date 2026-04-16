type ServiceCategory = {
  id?: string;
  name: string;
  services?: string[];
};

export type ContractorServiceGroup = {
  category: string;
  services: string[];
};

export function getContractorServiceGroups(
  contractorServices: string[],
  serviceCategories: ServiceCategory[]
): ContractorServiceGroup[] {
  const remaining = new Set(contractorServices.filter(Boolean));
  const groups: ContractorServiceGroup[] = [];

  for (const category of serviceCategories) {
    const services = (category.services || []).filter((service) =>
      remaining.has(service)
    );

    if (services.length > 0) {
      groups.push({ category: category.name, services });
      services.forEach((service) => remaining.delete(service));
    }
  }

  if (remaining.size > 0) {
    groups.push({
      category: 'Другие услуги',
      services: Array.from(remaining),
    });
  }

  return groups;
}

export function getContractorServiceCategoryLabels(
  contractorServices: string[],
  serviceCategories: ServiceCategory[]
) {
  return getContractorServiceGroups(contractorServices, serviceCategories).map(
    (group) => group.category
  );
}
