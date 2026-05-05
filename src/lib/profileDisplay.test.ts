import { strict as assert } from 'node:assert';
import { normalizeNamedList } from './profileDisplay';

assert.deepEqual(normalizeNamedList(null), []);
assert.deepEqual(normalizeNamedList(['Ремонт двигателя', { name: 'Минск' }, { id: 1 }]), [
  'Ремонт двигателя',
  'Минск',
]);
assert.deepEqual(normalizeNamedList([{ name: '  Брестская область  ' }, '  Пинск  ']), [
  'Брестская область',
  'Пинск',
]);

console.log('profile display helpers passed');
