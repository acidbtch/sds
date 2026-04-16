type ServiceCategory = {
  id: string;
  name: string;
  services?: Array<{ id?: string; name?: string } | string>;
};

export function getServicesForCategory(
  categories: ServiceCategory[],
  categoryId: string
) {
  const category = categories.find((cat) => cat.id === categoryId);
  if (!category) return [];

  return (category.services || [])
    .map((service) => {
      if (typeof service === 'string') {
        return { value: service, label: service };
      }

      const value = service.id || service.name || '';
      const label = service.name || service.id || '';
      return value && label ? { value, label } : null;
    })
    .filter((service): service is { value: string; label: string } =>
      Boolean(service)
    );
}

export function resetServicesForCategoryChange(
  previousCategoryId: string,
  nextCategoryId: string,
  selectedServices: string[]
) {
  return previousCategoryId === nextCategoryId ? selectedServices : [];
}
