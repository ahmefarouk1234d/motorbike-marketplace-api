# API notes for the frontend

Everything here was read off `backend/src` — routes, controllers, validators and
models — rather than assumed. Base URL in development is
`http://localhost:5000/api`.

---

## The envelope

Every success response is wrapped:

```json
{ "success": true, "data": {  } }
```

Three variations to be aware of:

| Variation | Which endpoints | Shape |
|---|---|---|
| Collections add `results` | `GET /listings`, `GET /brands`, `GET /favorites` | `{ success, results, data: [] }` |
| `token` sits **beside** `data` | `POST /auth/register`, `POST /auth/login` | `{ success, token, data: {} }` |
| `message` instead of `data` | verify-email, resend-verification, forgot-password, `DELETE /favorites/:id`, `/health` | `{ success, message }` |
| `token` and **no** `data` | `PATCH /auth/reset-password/:token` | `{ success, token }` |

Errors are always `{ success: false, message: "..." }`. Validation failures
arrive **pre-joined into one string**:

```
"title: Title must be at least 3 characters, price: Price cannot be negative"
```

There is no per-field error object, so forms need a single error banner rather
than messages under each input.

Status codes: `400` validation, `401` unauthenticated, `403` forbidden,
`404` missing, `409` conflict, `429` rate limited.

Authenticate with `Authorization: Bearer <token>`.

---

## Endpoint inventory

### Auth — `/api/auth`

| Method | Path | Access | Returns |
|---|---|---|---|
| POST | `/register` | public | `{ token, data: { id, fullName, email, role } }` |
| POST | `/login` | public | same as register |
| GET | `/me` | token | `{ id, fullName, email, role, isVerified, avatar? }` |
| PATCH | `/me/avatar` | token | `{ id, fullName, email, avatar }` — multipart, field `avatar` |
| GET | `/verify-email/:token` | public | `{ message }` |
| POST | `/resend-verification` | public | `{ message }` |
| POST | `/forgot-password` | public | `{ message }` |
| PATCH | `/reset-password/:token` | public | `{ token }` |

### Listings — `/api/listings`

| Method | Path | Access | Refs populated? |
|---|---|---|---|
| GET | `/` | public | **yes** |
| GET | `/:id` | public | **yes** |
| POST | `/` | seller/admin + verified | **no** |
| PATCH | `/:id` | owner/admin | **yes** |
| DELETE | `/:id` | owner/admin | **no** |
| PATCH | `/:id/status` | admin | **no** |

### Brands — `/api/brands`

`GET /` and `GET /:id` public. `POST /`, `PATCH /:id`, `DELETE /:id` admin only.
`POST`/`PATCH` are multipart with the logo in field `logo` — required on create,
optional on update.

### Favourites — `/api/favorites`

`GET /` yours, `POST /:listingId` saves, `DELETE /:listingId` removes. All need a
token.

### Stats — `/api/stats`

Admin only. `{ overview, byCity, byBrand }`, covering every listing whatever its
status.

### Health — `/api/health`

Public. `{ success: true, message: "Server is running!" }`.

---

## Gotchas

Ordered roughly by how much damage each one does if discovered late.

### 1. `results` is the page size, not a total

`GET /listings` sets `results = data.length` — the number of documents in the
page you just received. There is no total count anywhere in the API.

**Consequence:** page-number pagination ("Page 3 of 12") cannot be built. Use
prev/next, and disable *next* when `results < limit`.

### 2. Populated vs raw references

`brand` and `seller` come back as **full objects** from `GET /`, `GET /:id` and
`PATCH /:id`, but as **plain id strings** from `POST /`, `DELETE /:id` and
`PATCH /:id/status`.

**Consequence:** after creating a listing you cannot read `result.brand.name` —
re-fetch the listing if you need it.

Populated shapes are **partial**, because the controllers select specific
fields (`.populate('seller', 'fullName email')`):

- brand → `{ _id, name, logo }` — no description, no timestamps
- seller → `{ _id, fullName, email }` — no role, no isVerified, no avatar

**Consequence:** do not type a populated seller as a full user. It compiles,
then `listing.seller.isVerified` is silently `undefined` forever.

### 3. `id` vs `_id`, and three different user shapes

`GET /auth/me` and the auth responses return `id`, because those objects are
hand-built rather than returned as Mongoose documents. Everything else is a real
document and uses `_id`.

The API never returns one consistent user. There are three:

| Source | Key | Fields |
|---|---|---|
| `GET /auth/me` | `id` | fullName, email, role, **isVerified**, avatar |
| register / login | `id` | fullName, email, role |
| seller on a listing | `_id` | fullName, email |

**`isVerified` appears in the first row only.** Reading it off a login response
yields `undefined`, which is falsy — so a verification check run straight after
login will block a seller who *is* verified. Call `GET /auth/me` after
authenticating and check it there.

None of these carry `phone`, `city`, `createdAt` or `updatedAt`, even though the
User schema stores them. No endpoint exposes them.

### 4. Filtering is exact-match only

Filterable fields: `brand`, `model`, `city`, `condition`, `status`, `seller`,
`year`, `price`, `engineCC`, `mileage`. Anything else in the query string is
**ignored**, not rejected.

There is no regex and no text index, so a free-text search box would silently
return nothing. `brand` and `seller` filter by **ObjectId**, not by name.

### 5. Range filter syntax

Range operators are `gte`, `gt`, `lte`, `lt`, sent as literal flat keys:

```
GET /api/listings?city=Cairo&price[gte]=40000&price[lte]=90000
```

The backend reads the string key `price[gte]` directly, so the brackets must
survive into the query string.

### 6. `status` is admin-only in practice

It is on the whitelist, but stripped from the query for anyone who is not an
admin — who then only ever sees `approved` listings.

### 7. Unapproved listings return 404, not 403

Deliberate: the response must not confirm the listing exists. A seller viewing
their own pending listing sees it; everyone else gets 404.

### 8. `brand` cannot be changed after creation

`updateListingSchema` has no `brand` field, so an edit form must show it locked.

### 9. `PATCH /:id/status` accepts only `approved` and `rejected`

Even though `sold` exists in the model enum, the controller rejects it.

### 10. Uploads

- Fields: `images` (listings, max 5), `avatar`, `logo`
- Max **5 MB** per file; JPEG, PNG, WebP only
- On listing update, sending images **replaces the entire set**
- Never set `Content-Type` by hand — the browser must add the `boundary=`
- Every multipart text field arrives as a string, which is why the backend uses
  `z.coerce.number()` for price, year, mileage and engineCC
- Image fields are never read from the body; a client cannot point a listing at
  an arbitrary URL

### 11. Favourites

- `GET /favorites` populates `listing`, but that listing's own `brand` and
  `seller` stay as ids
- The API does not check the listing exists before saving, so a populated
  `listing` can be **`null`** if it was deleted afterwards
- Saving a duplicate returns **409**
- `DELETE` returns a message, not the removed document

### 12. View counting

`GET /listings/:id` increments `viewsCount` — except when the seller views their
own listing.

---

## Rate limits

- 300 requests / 15 min across `/api`
- 10 / 15 min on login, register, forgot-password, resend-verification

Only **failed** attempts count toward the credential limit, so ordinary use is
never throttled. Both return `429` with a message.

---

## Verification gate

`requireVerified` sits on `POST /api/listings` **only**. An unverified account
gets `403 Please verify your email before publishing a listing`.

Registering, logging in, browsing, favouriting, uploading an avatar and
**editing a listing you already own** are all unaffected. A frontend guard
should therefore cover the create route and nothing else.

`isVerified` is exposed on `GET /auth/me` and **nowhere else** — not on the
login or register response, and not in the JWT, whose payload carries only
`{ id, role }`. See gotcha 3.

---

## CORS

`backend/.env` sets `CLIENT_URL=http://localhost:4200`, which matches the
Angular dev server default. Allowed methods are GET, POST, PUT, PATCH, DELETE.
Leaving `CLIENT_URL` unset opens CORS to any origin.
