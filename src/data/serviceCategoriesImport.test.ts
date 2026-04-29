import assert from 'node:assert/strict';
import {
  CLIENT_SERVICE_CATEGORY_IMPORT,
  getClientServiceCategoryImportSummary,
} from './serviceCategoriesImport';

const summary = getClientServiceCategoryImportSummary();
const categoryNames = CLIENT_SERVICE_CATEGORY_IMPORT.map(category => category.name);

assert.equal(summary.categoriesCount, 20, 'client import should contain all 20 categories from the document');
assert.equal(summary.servicesCount, 166, 'client import should contain all 166 services from the document');
assert.equal(CLIENT_SERVICE_CATEGORY_IMPORT[0].name, 'Двигатель', 'first category should match the source document');
assert.equal(CLIENT_SERVICE_CATEGORY_IMPORT.at(-1)?.name, 'Гостехосмотр', 'last category should match the source document');
assert.equal(new Set(categoryNames).size, categoryNames.length, 'category names should be unique');

for (const category of CLIENT_SERVICE_CATEGORY_IMPORT) {
  assert.ok(category.name.trim(), 'category name should not be empty');
  assert.ok(category.services.length > 0, `${category.name} should have at least one service`);
  assert.equal(new Set(category.services).size, category.services.length, `${category.name} services should be unique`);

  for (const service of category.services) {
    assert.ok(service.trim(), `${category.name} should not contain an empty service`);
  }
}

console.log('service categories import data passed');
