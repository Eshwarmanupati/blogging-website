# Inkwell — a full-stack MERN blogging platform

A complete blogging application: write posts in a rich block editor, publish or
save drafts, and read, like, comment and reply on other people's writing. Built
with React and Vite on the front end, Express and MongoDB on the back end.

```
client/   React + Vite + Tailwind single-page app
server/   Express REST API + Mongoose models
```

## Features

**Writing**
- Block-based editor (Editor.js) with headings, lists, quotes, code, images and embeds
- Publish or save as draft, and edit either afterwards
- Direct-to-Cloudinary image uploads using short-lived signed requests, so the
  API secret never reaches the browser and image bytes never pass through the API

**Reading**
- Paginated home feed, tag filtering and a trending list
- Full-text search across posts, plus user search
- Similar-posts suggestions driven by tags
- Read counts, likes, and a nested comment system with replies

**Accounts**
- Email/password auth with bcrypt hashing and JWTs
- Optional Google sign-in via Firebase
- Public profiles with bio, social links and post history
- Editable profile, avatar upload and password change

**Dashboard**
- Manage published posts and drafts, with search
- Per-post stats: likes, comments and reads
- Notifications for likes, comments and replies, with unread indicators and
  the ability to reply or delete inline

## Running it locally

**Requirements:** Node 18+, and a MongoDB database (a free
[Atlas](https://www.mongodb.com/atlas) cluster works fine).

```bash
git clone https://github.com/Eshwarmanupati/blogging-website
cd blogging-website
```

**Back end**

```bash
cd server
npm install
cp .env.example .env     # then fill in DB_LOCATION and SECRET_ACCESS_KEY
npm run dev              # http://localhost:3000
```

Generate a JWT secret with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Front end**

```bash
cd client
npm install
cp .env.example .env     # VITE_SERVER_DOMAIN=http://localhost:3000
npm run dev              # http://localhost:5173
```

**Demo content** — optional, but a fresh database is empty:

```bash
cd server
npm run seed             # adds 2 authors and 5 posts
```

The API starts even when Cloudinary and Firebase are unconfigured — image
uploads and Google sign-in are simply disabled, and the rest of the app works.

## Configuration

### `server/.env`

| Variable | Required | Purpose |
| --- | --- | --- |
| `DB_LOCATION` | yes | MongoDB connection string |
| `SECRET_ACCESS_KEY` | yes | Secret used to sign JWTs |
| `CLIENT_URL` | production | Comma-separated origins allowed by CORS. Empty allows all, which is fine locally |
| `PORT` | no | Defaults to 3000 |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | for uploads | From your Cloudinary dashboard |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | for Google sign-in | Service account JSON, base64 encoded |

### `client/.env`

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SERVER_DOMAIN` | yes | Base URL of the API |
| `VITE_FIREBASE_*` | for Google sign-in | Firebase web config. Public by design |

### Image uploads (Cloudinary)

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From the dashboard, copy the **Cloud name**, **API Key** and **API Secret**.
3. Put them in `server/.env`.

### Google sign-in (Firebase)

1. Create a project in the [Firebase console](https://console.firebase.google.com).
2. **Authentication → Sign-in method → Google → Enable.**
3. **Project settings → Your apps → Web app** — copy the config values into
   `client/.env` as the `VITE_FIREBASE_*` variables.
4. **Project settings → Service accounts → Generate new private key.** Encode
   the downloaded JSON and put the result in `server/.env`:

   ```bash
   base64 -i serviceAccountKey.json | tr -d '\n'
   ```

   Never commit that JSON file — `.gitignore` already excludes it.

## Deploying

The front end and API deploy separately. Free tiers are enough for both.

### API on Render

1. Push to GitHub, then on [Render](https://render.com) choose
   **New → Web Service** and pick the repository.
2. Settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
3. Add every variable from the table above under **Environment**. Leave
   `CLIENT_URL` empty for now.
4. Deploy, and note the URL — something like
   `https://blogging-website-api.onrender.com`.

A `render.yaml` blueprint is included if you prefer to import the service
instead of configuring it by hand.

> Render's free tier sleeps after inactivity, so the first request after an idle
> period takes a few seconds. `/health` exists so an uptime pinger can keep it
> warm.

### Front end on Vercel

1. On [Vercel](https://vercel.com), **Add New → Project** and pick the same repository.
2. Settings:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite (detected automatically)
3. Add the environment variables, with `VITE_SERVER_DOMAIN` set to the Render
   URL from the previous step.
4. Deploy, and note the URL — something like `https://inkwell.vercel.app`.

`client/vercel.json` handles the SPA rewrite, so refreshing a deep link such as
`/blog/some-post` serves the app rather than a 404.

### Final step

Go back to Render and set `CLIENT_URL` to your Vercel URL, then redeploy. Until
you do, the browser will block API calls with a CORS error.

Then seed the production database so the site is not empty:

```bash
cd server
DB_LOCATION="<your atlas connection string>" npm run seed
```

## Notes on the implementation

A few decisions worth calling out:

- **Signed uploads.** The browser asks the API for a signature, then uploads
  straight to Cloudinary. This keeps the API secret server-side and avoids
  proxying image data through a free-tier dyno.
- **Flat comment list.** Comments come back as a flat array where each item
  carries a `childrenLevel` rather than as a nested tree. Inserting a new reply
  or lazily loading a thread is then a splice, with no re-nesting.
- **Cascading deletes.** Removing a comment walks its subtree and cleans up the
  replies, the related notifications, and the parent post's counters.
- **Graceful degradation.** Cloudinary and Firebase are both optional. When they
  are unconfigured the server logs a warning, disables the relevant route, and
  the UI hides the Google button rather than rendering a broken one.
- **Code splitting.** Editor.js is around 330kB and only needed when writing, so
  the editor route is lazy-loaded and most visitors never download it.

## Tech stack

**Front end** — React 18, Vite, Tailwind CSS, React Router, Editor.js,
Framer Motion, Axios, React Hot Toast

**Back end** — Node, Express, MongoDB with Mongoose, JWT, bcrypt, Cloudinary,
Firebase Admin

## Scripts

| Location | Command | Does |
| --- | --- | --- |
| `client` | `npm run dev` | Start the Vite dev server |
| `client` | `npm run build` | Production build into `dist/` |
| `client` | `npm run lint` | ESLint |
| `server` | `npm run dev` | Start the API with nodemon |
| `server` | `npm start` | Start the API |
| `server` | `npm run seed` | Insert demo authors and posts |

## Credit

The project began from Rahul Vijay's MERN blogging tutorial and has since been
substantially rewritten: the API was restructured into routes, controllers and
middleware, uploads moved from S3 to signed Cloudinary requests, secrets moved
out of the repository into environment variables, and the remaining unfinished
features were completed.
