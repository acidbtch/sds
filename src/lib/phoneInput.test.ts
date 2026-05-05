import { strict as assert } from 'node:assert';
import { formatBelarusPhoneInput, isBelarusPhoneComplete } from './phoneInput';

assert.equal(formatBelarusPhoneInput(''), '+375 ');
assert.equal(formatBelarusPhoneInput('+375'), '+375 ');
assert.equal(formatBelarusPhoneInput('+37529'), '+375 29');
assert.equal(formatBelarusPhoneInput('375291234567'), '+375 29 123 45 67');
assert.equal(formatBelarusPhoneInput('+375 29 123 45 67'), '+375 29 123 45 67');
assert.equal(formatBelarusPhoneInput('+375abc29123--45 67xx'), '+375 29 123 45 67');
assert.equal(formatBelarusPhoneInput('+375291234567999'), '+375 29 123 45 67');

assert.equal(isBelarusPhoneComplete('+375 29 123 45 67'), true);
assert.equal(isBelarusPhoneComplete('+375 29 123'), false);

console.log('phone input helpers passed');
