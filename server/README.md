# Yunahliam store backend

Node + Express + SQLite (Node's built-in `node:sqlite`, so no native packages). It serves the storefront pages and a JSON API under `/api`.

## Run it

```sh
cd server
npm install
cp .env.example .env              # then fill in the values
npm run create-admin -- owner     # prints a generated password once
npm start                         # http://localhost:3000
npm test
```

On first start, the catalogue is filled from `data/products.seed.json`, which lists 90 products covering every photo in `images/`. After that, the database is the source of truth: manage products in the admin panel at `/admin.html`. `npm run seed` only adds seed products that are missing; it never overwrites your edits. The database lives in `data/store.db`. Back it up regularly, because it holds every order.

## Selling online

A product can be bought online only when it is **active, in stock, has a confirmed price and is not a "From" price**. Every other product shows a guide price with a "Call to order" button. Seeded prices start unconfirmed except the two Samsung A-series phones whose prices the store provided. Confirm prices in the admin panel (**Products** tab, tick **Confirmed**), or through the API:

```http
PATCH /api/admin/products/:id
{ "price": 148000, "priceConfirmed": true }
```

## Payments (Pesapal API 3.0)

Customers pay on Pesapal's hosted page with M-Pesa, Airtel Money or card.

1. Put your Pesapal consumer key and secret in `.env`. Sandbox keys are on https://developer.pesapal.com; live keys come from your merchant dashboard.
2. Set `PUBLIC_URL` to the store's public **https** address. Pesapal must be able to reach `PUBLIC_URL/api/payments/pesapal/ipn`. For local testing, expose port 3000 with a tunnel (e.g. ngrok or cloudflared).
3. On the first payment the server registers that IPN URL with Pesapal, or reuses it if already registered, and logs the `ipn_id`. You can paste it into `PESAPAL_IPN_ID`.
4. Go live with `PESAPAL_ENV=production` and your live keys. The IPN is registered again automatically on the live account.

Payment flow:

1. `POST /api/orders` creates the order.
2. `POST /api/orders/:number/pay` returns a `redirectUrl`, and the storefront sends the customer there to pay.
3. Pesapal calls the IPN and sends the customer back to `order.html?order=…&key=…`.
4. The server checks the transaction status with Pesapal, and the order becomes `paid`.

The contents of an IPN are never trusted: the status always comes from Pesapal's `GetTransactionStatus`. When the customer returns, the order page should call `POST /api/orders/:number/pay/verify` in case the IPN has not arrived yet. A payment whose amount or currency is wrong is recorded as `amount_mismatch` and does not mark the order paid. If Pesapal later reverses a payment, the order's `paymentStatus` becomes `reversed`.

## API

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | |
| GET | `/api/categories` | with product counts |
| GET | `/api/products` | `category`, `q`, `min`, `max`, `sort` (featured, price-asc, price-desc, az), `limit`, `offset` |
| GET | `/api/products/:slug` | |
| GET | `/api/delivery-options` | |
| POST | `/api/orders` | `{ customerName, phone, email?, deliveryMethod: pickup\|nairobi\|countrywide, deliveryAddress?, notes?, items: [{ slug, quantity }] }` → `{ orderNumber, accessKey, order }` |
| GET | `/api/orders/:number?key=` | the customer's view of the order |
| POST | `/api/orders/:number/pay` | `{ key }` → `{ redirectUrl, order }`; reuses a payment link from the last 30 minutes |
| POST | `/api/orders/:number/pay/verify` | `{ key }` checks the latest payment with Pesapal |
| GET/POST | `/api/payments/pesapal/ipn` | Pesapal only |
| POST | `/api/admin/login` | `{ username, password }` → `{ token }`, sent as `Authorization: Bearer <token>` |
| POST | `/api/admin/logout` | |
| GET/POST | `/api/admin/products` | lists all products including hidden ones; creates a product |
| GET/PATCH/DELETE | `/api/admin/products/:id` | DELETE hides the product |
| GET | `/api/admin/orders?status=` | |
| GET/PATCH | `/api/admin/orders/:number` | `{ status?, paymentStatus? }`; statuses: pending_payment, paid, processing, dispatched, delivered, cancelled |
| POST | `/api/enquiries` | `{ name, phone, email?, message, productSlug? }` from the contact form |
| GET | `/api/admin/enquiries?status=new\|handled` | |
| PATCH | `/api/admin/enquiries/:id` | `{ status: "new" \| "handled" }` |
| GET | `/api/admin/summary` | dashboard counts |
| GET | `/sitemap.xml`, `/robots.txt` | generated from the live catalogue |

Order totals are always calculated on the server from database prices. Any price sent by the browser is ignored.
