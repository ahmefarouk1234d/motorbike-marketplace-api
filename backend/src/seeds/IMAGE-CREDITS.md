# Demo listing image credits

The photos attached to the seeded listings come from Wikimedia Commons. They are
placeholders for development and demonstration, not photographs of the actual
bikes described in the seed data.

Four of the five are licensed CC BY-SA, which requires attribution and that any
redistribution keeps the same licence. If these images ever appear in something
published, this page must go with them.

| Listing | Source file | Licence | Author |
|---|---|---|---|
| Hojen 3 250cc Cruiser | `LIFAN-LYCAN-250CC-3__53488.jpg` — supplied by the project owner | not stated | not stated |
| Halawa 150 — Clean Condition | `images.jpg` — supplied by the project owner | not stated | not stated |
| Jieda R3 2024 Sport | `42938042-800x600.jpeg` — supplied by the project owner | not stated | not stated |
| SYM NHX 200 ABS 2024 | `images (1).jpg` — supplied by the project owner | not stated | not stated |
| Bajaj Boxer 150 — Reliable Commuter | [Bajaj Boxer BM 150.jpg](https://commons.wikimedia.org/wiki/File:Bajaj_Boxer_BM_150.jpg) | CC BY-SA 4.0 | Axxter99 |

The Halawa and SYM photographs were supplied by the project owner and show the
actual brands. The Bajaj photograph is of the correct model. None of the three
record their provenance here, so check the rights before this goes anywhere
public.

One is a stand-in of the right class rather than the right marque:

- **Hojen 3 250cc Cruiser** — a Lifan Lycan 250. "Hojen" is Haojiang, a Chinese
  marque long popular in Egypt as a daily commuter, and the stock **3** is a
  150cc single. A 250cc cruiser version only exists as an upgrade or a custom
  build, so a generic 250 cruiser is the honest stand-in.

## How these were attached

Downloaded at 1200 px width, then uploaded through the API itself rather than
written straight into the database:

```
PATCH /api/listings/:id   (multipart, field `images`)
```

So they went through multer and Firebase Storage exactly like a seller's upload,
and each one is a permanent Firebase download URL stored as `{ url, path }`.

## Removing them

`npm run seed` wipes and repopulates listings, which drops the image references
but leaves the files in the Firebase bucket. To remove the files too, delete each
listing through `DELETE /api/listings/:id` first — that cascade-deletes the
stored images.
