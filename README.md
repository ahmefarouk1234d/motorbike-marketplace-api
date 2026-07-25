# Motorbike Marketplace API

REST API for a motorcycle listings marketplace. Sellers publish bikes with photos,
admins approve them, buyers browse and save favourites.

Built with Express 5, MongoDB via Mongoose, JWT auth, Zod validation, and Firebase
Storage for images.

---

## Requirements

| | |
|---|---|
| Node.js | 20 or newer (developed on 24) |
| MongoDB | running locally, or any connection string |
| Firebase | a project with Storage enabled — needed only for image uploads |
| SMTP | any provider — needed only for verification and password-reset mail |

Firebase and SMTP are both optional. Without them the server starts normally and
everything except the relevant endpoints works.

## Getting started

```bash
npm install
cp .env.example .env      # then fill it in, see below
npm run seed              # optional: 8 brands, 1 seller, 5 listings
npm run dev
```

The API is then on `http://localhost:5000`, with interactive docs at
**`http://localhost:5000/api/docs`**.

| Script | What it does |
|---|---|
| `npm run dev` | Start with `node --watch`, reloading on change |
| `npm start` | Start once |
| `npm run seed` | Wipe and repopulate listings, brands and a demo seller |
| `npm test` | Run the Jest suite |

## Configuration

Every variable lives in `.env` — see `.env.example` for the full annotated list.

**Required**

| Variable | Notes |
|---|---|
| `MONGO_URI` | e.g. `mongodb://127.0.0.1/motorbike-marketplace` |
| `JWT_SECRET` | any long random string |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `CLIENT_URL` | frontend origin; also used to build email links |
| `PORT` | e.g. `5000` |

**Firebase Storage** — from *Project settings → Service accounts → Generate new private key*

`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`,
`FIREBASE_STORAGE_BUCKET`

> The private key must sit on **one line**, wrapped in double quotes, with its
> newlines written as literal `\n`. This is the single most common setup mistake.
> The bucket is the name only, no `gs://` prefix — modern projects look like
> `your-project.firebasestorage.app`, older ones like `your-project.appspot.com`.

**SMTP** — `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`

Port `465` uses implicit TLS; `587` uses STARTTLS.

> `.env` is gitignored. Never commit it, and never paste a service-account key
> into chat, a ticket, or a screenshot — if one leaks, rotate it in the Google
> Cloud console rather than hoping nobody noticed.

---

## API overview

Full request and response detail is at `/api/docs` (OpenAPI 3 — the raw document
is at `/api/docs.json`). Summary:

### Auth — `/api/auth`

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/register` | public | Create an account; sends a verification email |
| POST | `/login` | public | Exchange credentials for a JWT |
| GET | `/me` | token | Current user |
| PATCH | `/me/avatar` | token | Upload or replace avatar (multipart, field `avatar`) |
| GET | `/verify-email/:token` | public | Confirm an email address |
| POST | `/resend-verification` | public | Request a fresh verification link |
| POST | `/forgot-password` | public | Request a password-reset link |
| PATCH | `/reset-password/:token` | public | Set a new password, returns a token |

### Listings — `/api/listings`

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/` | public | Browse approved listings; filter, sort, paginate |
| GET | `/:id` | public | One listing; increments its view counter |
| POST | `/` | seller, admin | Publish (multipart, up to 5 images in field `images`) |
| PATCH | `/:id` | owner, admin | Update; uploading images replaces the whole set |
| DELETE | `/:id` | owner, admin | Delete, including the stored image files |
| PATCH | `/:id/status` | admin | Approve or reject |

**Filtering.** Only whitelisted fields are filterable — `brand`, `model`, `city`,
`condition`, `status`, `seller`, `year`, `price`, `engineCC`, `mileage`. Anything
else in the query string is ignored rather than passed to the database.

```
GET /api/listings?city=Cairo&condition=used&price[gte]=40000&price[lte]=90000
GET /api/listings?sort=-price&fields=title,price&page=2&limit=20
```

Range operators are `gte`, `gt`, `lte`, `lt`. Default sort is newest first;
default page size is 12.

### Brands — `/api/brands`

`GET /` and `GET /:id` are public. `POST /`, `PATCH /:id` and `DELETE /:id` are
admin-only and multipart, with the logo in field `logo` (required on create).

### Favourites — `/api/favorites`

`GET /` lists yours; `POST /:listingId` saves; `DELETE /:listingId` removes. All
require a token.

### Admin — `/api/stats`

Admin-only aggregate: totals with average/min/max price, plus breakdowns by city
and by brand.

### Conventions

Every response is enveloped:

```json
{ "success": true, "data": { }, "results": 12 }
```

Errors are `{ "success": false, "message": "..." }` with a meaningful status —
`400` validation, `401` unauthenticated, `403` forbidden, `404` missing,
`409` conflict, `429` rate limited. Stack traces are included only when
`NODE_ENV=development`.

Authenticate with `Authorization: Bearer <token>`.

---

## Image uploads

Uploads go **through the API**, not straight from the browser: the client posts
`multipart/form-data`, multer buffers the file in memory, the server validates it
and streams it to Firebase Storage, then saves the result on the document.

- **Accepted:** JPEG, PNG, WebP — max **5 MB** per file, max **5 images** per listing
- **Stored as** `{ url, path }`. `path` is the object's location in the bucket, and
  keeping it is what makes deletion possible later
- **URLs are permanent** Firebase download-token links, so they cache well and work
  with uniform bucket-level access
- **Cleanup is automatic.** Files are removed when a listing is deleted and when an
  avatar or logo is replaced. If the database write fails after a successful upload,
  the orphaned files are deleted before the error is returned

Image fields are **never** read from the request body. They are derived entirely
from the uploaded files, so a client cannot point a listing at an arbitrary URL.

Because multipart delivers every text field as a string, the Zod schemas use
`z.coerce.number()` — `price` arrives as `"145000"`, not `145000`.

## Security

- **Passwords** hashed with bcrypt, cost 12, and never selected by default
- **Verification and reset tokens** stored as SHA-256 hashes; the raw value exists
  only in the email. Links are single-use and expire (24 h / 60 min)
- **No account enumeration** — `forgot-password` and `resend-verification` return
  an identical response whether or not the address exists
- **Rate limiting** — 300 requests per 15 min across `/api`; 10 per 15 min on login,
  register, forgot-password and resend-verification. Only *failed* attempts count
  toward the credential limit, so ordinary use is never throttled
- **Injection** — keys containing `$` or `.` are stripped from body, params and query
- **Unapproved listings are private**, visible only to their seller and to admins;
  they return `404` rather than `403` so the response does not confirm they exist
- **Ownership** is checked on every mutating listing route
- `helmet` for security headers, `cors` restricted to `CLIENT_URL`

> Note: `express-mongo-sanitize` is deliberately **not** used. It assigns to
> `req.query`, which is getter-only in Express 5, and throws on every request.
> `src/middleware/sanitize.js` replaces it.

## Tests

```bash
npm test
```

62 tests across 6 suites. They run against a real local MongoDB
(`MONGO_URI_TEST`, defaulting to `motorbike-marketplace-test`) with the Firebase
and email modules mocked, so **no test touches the network**. The database is
wiped between tests and dropped at the end.

| Suite | Covers |
|---|---|
| `listings.test.js` | Multipart uploads end to end, field coercion, file rejection, listing visibility, range filtering, cascade delete |
| `auth.test.js` | Registration, login, avatar upload and replacement |
| `accountFlows.test.js` | Email verification and password reset: token hashing, expiry, single use, enumeration resistance |
| `security.test.js` | Injection attempts, privilege escalation, token handling |
| `favorites.test.js` | Saving, duplicate conflict, per-user isolation, removal |
| `docs.test.js` | OpenAPI document integrity, view counter |

Jest runs single-threaded (`maxWorkers: 1`) because the suite shares one database,
and rate limits are skipped under `NODE_ENV=test`.

## Project structure

```
src/
├── app.js              Express app: middleware order, rate limits, route mounting
├── config/
│   ├── db.js           Mongo connection
│   ├── firebase.js     Firebase Admin init, lazy, returns the bucket
│   └── email.js        Nodemailer transport, lazy
├── docs/openapi.js     Hand-written OpenAPI 3 document served at /api/docs
├── models/             Mongoose schemas; file.schema.js is the shared { url, path }
├── routes/             Route tables only, no logic
├── controllers/        Request handling
├── middleware/
│   ├── auth.js         Requires a valid token
│   ├── optionalAuth.js Attaches req.user if present, never rejects
│   ├── authorize.js    Role check
│   ├── checkOwnership.js
│   ├── upload.js       Multer config: memory storage, type and size limits
│   ├── sanitize.js     Strips Mongo operator syntax
│   ├── validate.js     Runs a Zod schema over req.body
│   └── errorHandler.js Central error to HTTP mapping
├── validators/         Zod schemas
├── utils/
│   ├── storage.js      Firebase upload and delete; knows nothing about Express
│   ├── sendEmail.js    Thin wrapper over the transport
│   ├── emailTemplates.js
│   ├── APIFeatures.js  Whitelisted filter, sort, field limit, paginate
│   ├── AppError.js
│   └── asyncHandler.js
└── seeds/seed.js
```

Middleware order on upload routes matters: **multer runs before validation**,
because `express.json()` does not parse multipart bodies — multer is what
populates `req.body` for those requests.

## Not implemented

Honest list of what this does not do yet:

- No refresh tokens or logout; JWTs are valid until they expire
- No change-password or profile-update endpoint beyond the avatar
- Verification is recorded but **not enforced** — unverified users can still log in
  and publish. Gating on `isVerified` is a one-line change in `middleware/auth.js`
- No image resizing or thumbnails; files are stored exactly as uploaded
- Favourites do not verify that the listing id actually exists before saving it
- No CI configuration
