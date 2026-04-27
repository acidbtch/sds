export const SUPPORT_SUBJECT_MIN_LENGTH = 3;
export const SUPPORT_MESSAGE_MIN_LENGTH = 10;

export type SupportFieldErrors = Partial<Record<'subject' | 'message' | 'form', string>>;

const SUBJECT_ERROR = `Тема должна содержать минимум ${SUPPORT_SUBJECT_MIN_LENGTH} символа`;
const MESSAGE_ERROR = `Сообщение должно содержать минимум ${SUPPORT_MESSAGE_MIN_LENGTH} символов`;

function getFieldValidationMessage(field: 'subject' | 'message') {
  return field === 'subject' ? SUBJECT_ERROR : MESSAGE_ERROR;
}

export function validateSupportTicketForm(subject: string, message: string): SupportFieldErrors {
  const errors: SupportFieldErrors = {};

  if (subject.trim().length < SUPPORT_SUBJECT_MIN_LENGTH) {
    errors.subject = SUBJECT_ERROR;
  }

  if (message.trim().length < SUPPORT_MESSAGE_MIN_LENGTH) {
    errors.message = MESSAGE_ERROR;
  }

  return errors;
}

export function parseSupportTicketApiError(errorMessage: string): SupportFieldErrors {
  const normalizedMessage = errorMessage.trim();
  if (!normalizedMessage) {
    return {};
  }

  const errors: SupportFieldErrors = {};
  const formMessages: string[] = [];

  for (const part of normalizedMessage.split(';')) {
    const chunk = part.trim();
    if (!chunk) continue;

    const match = chunk.match(/^([a-zA-Z_.]+):\s*(.+)$/);
    const field = match?.[1]?.split('.').pop();

    if (field === 'subject' || field === 'message') {
      errors[field] = getFieldValidationMessage(field);
      continue;
    }

    formMessages.push(chunk);
  }

  if (formMessages.length > 0) {
    errors.form = formMessages.join('; ');
  }

  return errors;
}
