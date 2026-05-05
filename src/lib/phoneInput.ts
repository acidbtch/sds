const BELARUS_COUNTRY_CODE = '375';
const BELARUS_PHONE_PREFIX = '+375 ';
const BELARUS_PHONE_GROUPS = [2, 3, 2, 2] as const;

export function formatBelarusPhoneInput(value: string) {
  const digitsOnly = value.replace(/\D/g, '');
  const localDigits = digitsOnly.startsWith(BELARUS_COUNTRY_CODE)
    ? digitsOnly.slice(BELARUS_COUNTRY_CODE.length)
    : digitsOnly;
  const trimmedDigits = localDigits.slice(0, BELARUS_PHONE_GROUPS.reduce((sum, group) => sum + group, 0));

  if (!trimmedDigits) {
    return BELARUS_PHONE_PREFIX;
  }

  const parts: string[] = [];
  let cursor = 0;

  for (const groupSize of BELARUS_PHONE_GROUPS) {
    if (cursor >= trimmedDigits.length) {
      break;
    }

    parts.push(trimmedDigits.slice(cursor, cursor + groupSize));
    cursor += groupSize;
  }

  return `${BELARUS_PHONE_PREFIX}${parts.join(' ')}`;
}

export function isBelarusPhoneComplete(value: string) {
  return formatBelarusPhoneInput(value).replace(/\D/g, '').length === 12;
}
