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
    },
    [
      {
        id: 'user-1',
        first_name: 'Артем',
        username: 'artem_auto',
      },
    ]
  ),
  'Артем (@artem_auto)'
);

assert.equal(
  getSupportTicketUserLabel(
    {
      user_id: 'user-2',
    },
    [
      {
        user_id: 'user-2',
        first_name: 'Ольга',
        last_name: 'Петрова',
        telegram_username: '@olga_auto',
      },
    ]
  ),
  'Ольга Петрова (@olga_auto)'
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

console.log('support ticket display helpers passed');
