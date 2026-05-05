import { strict as assert } from 'node:assert';
import {
  ALL_BELARUS_LABEL,
  expandSelectedRegionsForApi,
  finalizeRegionSelection,
  getAllBelarusSelectionHint,
  formatRegionValue,
  stripFormattedRegionValue,
} from './regionSelection';

const regionsData = {
  'Брестская область': ['Брест', 'Барановичи'],
  Минск: ['Октябрьский', 'Центральный'],
  Беларусь: [],
};

assert.deepEqual(
  finalizeRegionSelection({
    localSelected: [],
    multiSelect: false,
    regionsData,
  }),
  []
);

assert.equal(formatRegionValue('Октябрьский', regionsData), 'Минск / Октябрьский');
assert.equal(stripFormattedRegionValue('Минск / Октябрьский'), 'Октябрьский');
assert.equal(stripFormattedRegionValue('Вся Беларусь'), ALL_BELARUS_LABEL);
assert.equal(
  getAllBelarusSelectionHint(false),
  'Выбрана Беларусь. Вы будете получать заказы из всех регионов.'
);
assert.equal(
  getAllBelarusSelectionHint(true),
  'Выбрана Беларусь. Заказы будут видны исполнителям из всех регионов.'
);

assert.deepEqual(
  finalizeRegionSelection({
    localSelected: ['Брест', 'Барановичи'],
    multiSelect: true,
    regionsData,
  }),
  ['Брестская область']
);

assert.deepEqual(
  expandSelectedRegionsForApi({
    selectedRegions: [ALL_BELARUS_LABEL],
    topLevelRegionNames: ['Брестская область', 'Минск', ALL_BELARUS_LABEL],
  }),
  ['Брестская область', 'Минск']
);

console.log('region selection helpers passed');
