# Yunahliam Enterprise online store

The online store for Yunahliam Enterprise, Westlands Business Park, Nairobi.

| Part | Files |
| --- | --- |
| Storefront | `index.html`, `shop.html`, `product.html`, `cart.html`, `checkout.html`, `order.html`, `about.html`, `contact.html`, `app.js`, `styles.css`, `images/` |
| Admin panel | `admin.html`, `admin.js`: orders, products and prices, enquiries |
| Backend | `server/`: Node + Express + SQLite API, Pesapal payments. See [server/README.md](server/README.md) |

## How a sale works

1. A customer adds products to the cart. The cart is saved in their browser.
2. At checkout they enter their name, phone and delivery choice. The server prices the order from the database.
3. They pay on Pesapal's secure page with M-Pesa, Airtel Money or card.
4. Pesapal sends them back to `order.html`, and the server confirms the payment directly with Pesapal.
5. The order appears in the admin panel as **Paid**. Staff call the customer, then move the order to *Processing → Dispatched → Delivered*.

Products with unconfirmed or "From" prices show a guide price and a **Call to order** button instead of **Add to cart**.

## Run it locally

Requires Node.js 22.13 or newer.

```sh
cd server
npm install
cp .env.example .env              # fill in Pesapal keys etc.
npm run create-admin -- owner     # prints the admin password once
npm start                         # store: http://localhost:3000, admin: http://localhost:3000/admin.html
npm test
```

The site must be opened through the server, not by double-clicking the HTML files, because products and orders come from the API.

## Deploy

Use the `Dockerfile` with any host that runs containers, such as Render, Railway, Fly.io or a VPS:

- Mount a **persistent volume at `/data`**. The SQLite database, with all orders, lives there.
- Set the environment variables from `server/.env.example`. At minimum set `PUBLIC_URL` (the https address), `PESAPAL_ENV`, `PESAPAL_CONSUMER_KEY` and `PESAPAL_CONSUMER_SECRET`.
- Create the admin user once inside the container: `node server/scripts/create-admin.js owner`.
- Back up `/data/store.db` regularly.

## Launch checklist

- [ ] Pesapal merchant account approved; live consumer key and secret set; `PESAPAL_ENV=production`
- [ ] `PUBLIC_URL` set to the real https domain, so payment returns and notifications reach the store
- [ ] One full test purchase made in Pesapal sandbox, then one small live purchase
- [ ] Admin user created; password stored safely
- [ ] Every product checked in **Admin → Products**: name, price and photos correct, then **Confirmed** ticked
- [ ] Delivery fees confirmed (`DELIVERY_FEE_NAIROBI`, `DELIVERY_FEE_COUNTRYWIDE`)
- [ ] Database backups scheduled
