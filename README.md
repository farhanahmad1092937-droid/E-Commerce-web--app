# ShopHub E-Commerce Project

This project is a simple storefront and admin panel for an e-commerce site.
The product data is stored in `db.json` and is accessed through JSON Server only.

## Features

- User-facing storefront using Bootstrap 5 + custom styling
- Dynamic product loading from JSON Server
- Live search and add-to-cart interaction on the storefront
- User resource panel with GET and POST support
- Admin dashboard with GET, PUT, and DELETE resource management
- Search and filter by product/resource status in both panels
- JSON Server-backed data persistence via `db.json`

## Files

- `index.html` — user-facing storefront
- `admin.html` — admin dashboard interface
- `style.css` — site styling and layout
- `app.js` — storefront JavaScript (GET + POST)
- `admin.js` — admin dashboard JavaScript (GET + PUT + DELETE)
- `db.json` — JSON Server data file

## Prerequisites

- Node.js installed
- `json-server` installed globally or available via `npx`
- A local static server to serve the HTML files (for browser fetch support)

## Setup

1. Open a terminal in the project folder.
2. Start JSON Server:

```bash
npx json-server --watch db.json --port 3000
```

3. In another terminal, serve the project folder as static files.

<!-- Using Python:

```bash
python -m http.server 5500
```

Or using a simple npm server such as `http-server`:

```bash
npx http-server . -p 5500
``` -->

Or use VS Code Live Server.

## Run

- Open the storefront at `http://localhost:5500/index.html`
- Open the admin panel at `http://localhost:5500/admin.html`
- Make resource changes in the admin panel to update `db.json` via JSON Server
- The storefront reads product data from JSON Server at `http://localhost:3000/products`
- The user resource panel reads and submits resource entries at `http://localhost:3000/resources`

## Notes

- The main product data is not hardcoded in JavaScript arrays.
- All CRUD operations in the admin panel go through JSON Server.
- If the storefront cannot load products, make sure both the static server and JSON Server are running.

## Screenshots

![Storefront](screenshots/storefront.png)

![Admin Dashboard](screenshots/admin-dashboard.png)

> Replace the screenshot placeholders with real screenshots taken from the app.
