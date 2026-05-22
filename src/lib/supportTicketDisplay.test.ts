import { strict as assert } from 'node:assert';
import { getSupportTicketUserLabel } from './supportTicketDisplay';

assert.equal(
  getSupportTicketUserLabel({
    user_id: 'be462bec-a4cc-4d60-b39c-9679aefe4a96',
  }),
  'Пользователь'
);

assert.equal(
  getSupportTicketUserLabel(
    {
      user_id: 'user-1',
      user_name: 'Telegram Profile',
    },
    [
      {
        id: 'user-1',
        name: 'Имя из заказа',
        username: 'order_customer',
      },
    ]
  ),
  'Имя из заказа (@order_customer)'
);

assert.equal(
  getSupportTicketUserLabel(
    {
      user_id: '700820625',
      user_name: 'string.vl 🐄',
    },
    [
      {
        telegramId: '700820625',
        name: 'Влад',
        username: '700820625',
        telegramNickname: 'string.vl 🐄',
      },
    ]
  ),
  'Влад (string.vl 🐄)'
);

assert.equal(
  getSupportTicketUserLabel(
    {
      user_id: 'telegram-display-user',
      user_name: 'Telegram Dmitry',
    },
    [
      {
        id: 'telegram-display-user',
        name: 'Дмитрий из заказа',
      },
    ]
  ),
  'Дмитрий из заказа (Telegram Dmitry)'
);

assert.equal(
  getSupportTicketUserLabel({
    user_name: 'Александр',
    telegram_username: 'alex_auto',
  }),
  'Александр (@alex_auto)'
);

assert.equal(
  getSupportTicketUserLabel({
    first_name: 'Александр',
    last_name: 'Иванов',
    username: '@alex_auto',
  }),
  'Александр Иванов (@alex_auto)'
);

assert.equal(
  getSupportTicketUserLabel({
    user: {
      first_name: 'Мария',
      username: 'maria_sds',
    },
  }),
  'Мария (@maria_sds)'
);

assert.equal(
  getSupportTicketUserLabel({
    username: 'only_username',
  }),
  '@only_username'
);

assert.equal(
  getSupportTicketUserLabel(
    {
      user_id: 'user-1',
      user: {
        name: 'Nested Backend User',
        telegram_username: 'nested_backend',
      },
    },
    [
      {
        id: 'user-1',
        name: 'Old Matched User',
        username: 'old_user',
      },
    ],
  ),
  'Nested Backend User (@nested_backend)',
  'ticket.user from backend should be preferred over legacy user lookup',
);

console.log('support ticket display helpers passed');
