# SDS Mini App

Frontend for the SDS Telegram mini app: customer orders, executor catalog, support, and admin workflows.

## Local Run

Prerequisites:
- Node.js
- accessible SDS backend API

1. Install dependencies:
   `npm install`
2. Create `.env.local` or `.env` from `.env.example`
3. Set `VITE_API_URL` to the backend API base URL
4. Start the app:
   `npm run dev`

## Notes

- Telegram WebApp auth and BackButton behavior are fully available only inside Telegram WebView.
- In a regular browser you can still test layout, forms, and most API-driven flows if the backend is reachable.

## Verification

- `npm run lint`
- `npm run build`
- `npm run test:api-config`
- `npm run test:api-errors`
- `npm run test:contractor-services`
- `npm run test:customer-orders`
- `npm run test:order-services`
- `npm run test:support-validation`
