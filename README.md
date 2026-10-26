# Travel Hub

A small website for planning trips abroad with friends. Built with Next.js, Firebase Auth and Firestore.

- **Login**: email + password accounts (Firebase Authentication)
- **Trips**: create a trip, get a 6-character code (e.g. `K7M-2QX`), friends enter it (or open the invite link) to join your team
- **Flights**: enter route + dates, get pre-filled comparison links (Google Flights, Skyscanner, Kayak, Expedia, Trip.com). Optionally pull live fares into the page. Save booked flights, then press **Track flight** for live status
- **Hotels**: pre-filled search links (Google Hotels, Booking.com, Agoda, Expedia, Airbnb), plus a place to save your booking details
- **Places**: discovery links (Google Maps, Tripadvisor, Klook, GetYourGuide), plus a shared "places we want to go" list
- **Checklist**: the full travel guide as a personal tick-list per trip, also readable at `/guide`

> **Status: not yet compiled or run.** The code was written in an environment that could not reach the npm registry, so `npm install` and `next build` have not been run, and the Firestore rules have not been tested. Expect to fix a typo or two on first build. See "First run" below.

## Setup (about 15 minutes)

### 1. Firebase (login + shared database), free Spark plan

1. Go to <https://console.firebase.google.com> and **Add project** (you can skip Google Analytics).
2. **Authentication → Get started → Sign-in method → Email/Password → Enable** (leave "Email link" off).
3. **Firestore Database → Create database**. Choose **Production mode** and a location near you (e.g. `asia-east1` for Taiwan).
4. **Firestore Database → Rules**: delete what's there, paste the whole contents of `firestore.rules`, press **Publish**. This step is what lets friends join trips and keeps strangers out, so don't skip it.
5. **Project settings (gear icon) → General → Your apps → `</>` Web**: register an app (no Firebase Hosting needed). Copy the `apiKey`, `authDomain`, `projectId` and `appId` values it shows.

### 2. Run locally

```bash
cp .env.example .env.local   # then fill in the four Firebase values
npm install
npm run dev                  # http://localhost:3000
```

### 3. Deploy: GitHub + Vercel

```bash
git init && git add -A && git commit -m "Travel Hub"
gh repo create travel-hub --private --source . --push     # or create the repo on github.com and git push
```

Then on <https://vercel.com>: **Add New → Project → import the repo**. Under **Environment Variables** add the same variables as `.env.local` and press Deploy.

Finally, tell Firebase about your site so login works there: **Authentication → Settings → Authorized domains → Add domain** and add your Vercel address (e.g. `travel-hub.vercel.app`). `localhost` is already allowed.

## Environment variables

| Variable | Required | What it does |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | yes | Firebase web API key. Public by design; the data is protected by `firestore.rules` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | yes | e.g. `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | yes | Your Firebase project id |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | yes | The web app id |
| `SERPAPI_KEY` | no | Turns on the **Show prices here too** button (live fares from Google Flights via SerpApi). Free plan: 250 searches/month |
| `AVIATIONSTACK_KEY` | no | Turns on live flight status. Free plan: 100 requests/month |
| `GEMINI_API_KEY` | no | Turns on the AI **Itinerary** tab (Google Gemini). Get a key at aistudio.google.com/apikey |
| `GEMINI_MODEL` | no | Override the Gemini model name (default `gemini-3.8-flash`) |

Without the optional keys everything still works: you get the comparison links and the tracking links (FlightAware, Flightradar24).

Note: don't add an HTTP-referrer restriction to the Firebase API key in Google Cloud. The server-side fare/tracking routes use it to check that the caller is signed in, and those calls don't carry a referrer.

## How the data is organised

```
trips/{tripId}                      name, destination, dates, join_code
trips/{tripId}/members/{uid}        who's on the trip (organizer or member)
trips/{tripId}/flights|hotels|places/{id}
trips/{tripId}/checklist/{uid}      each person's ticks
joinCodes/{CODE}                    lets a friend find a trip from its code
users/{uid}/memberships/{tripId}    the list behind "My trips"
```

How joining works without a backend: a friend reads `joinCodes/{CODE}` to find the trip, then writes their own member document including the code. `firestore.rules` only accepts that write if the code matches the trip's real code. Everything under a trip is readable and writable only by its members.

## How the "price comparison" works (and its limits)

- The comparison buttons open each site's own search page with your route, dates and city already filled in. The prices you see there are the real, live ones. The site does **not** scrape those pages itself, because the big sites block scrapers and it would break constantly.
- **Show prices here too** uses SerpApi's Google Flights data and caches each search for 6 hours to save quota. It shows flights and prices; booking still happens on the airline or agent site.
- Amadeus's free developer API (a common choice for this) was shut down in July 2026, which is why SerpApi is used instead.

## How flight tracking works (and its limits)

- Tracking uses **flight number + date** (e.g. `CI100` on 2026-11-20). A **ticket number** (13 digits) or **booking reference** cannot be used to look up a flight, so those are stored for your records only.
- The free aviationstack plan serves live data, so status usually appears around the departure day, and `Track flight` may say "no live data yet" for flights weeks away. Each press uses 1 of your 100 monthly requests.

## AI itinerary (Gemini)

The **Itinerary** tab sends the trip's dates, flights, hotels and the places your group saved to Gemini, which returns a day-by-day plan: places grouped by area, meals, estimated travel time and distance between stops (starting from the hotel), and a list of places that didn't fit. Everything is editable afterwards (times, order, move to another day, add or delete stops) and auto-saved for the whole team.

- Travel times and distances are the model's **estimates** from its own knowledge of the city, not live map data. Each leg has a Google Maps **Directions** link to double-check.
- The plan is stored in `trips/{id}/itinerary/main`, so after adding this feature **publish the updated `firestore.rules`** (Firebase console, Firestore Database, Rules).
- It needs a `GEMINI_API_KEY` set on Vercel (Settings, Environment Variables), then a redeploy. The key stays on the server and is never sent to the browser. Each person can generate up to 12 plans per hour.

## First run: if the build complains

Run `npm run build` and fix whatever TypeScript reports. Everything is plain Next.js 15 App Router + TypeScript + the modular Firebase SDK. If something says "Missing or insufficient permissions", the rules from step 1.4 aren't published yet.

## Languages (English / 繁體中文)

The whole site, including the travel guide and checklist, comes in English and Traditional Chinese (Taiwan). The EN / 中文 button in the header switches it. The first visit follows the browser language (zh-TW / zh-HK / zh-MO start in Chinese), and the choice is remembered per browser. Everything lives in `src/lib/i18n.ts` (interface text and server messages) and `src/lib/checklist.ts` (guide content); to change a phrase, edit it there. Data your group types in (hotel names, notes and so on) is stored exactly as typed.

## Project layout

```
firestore.rules              security rules (publish these in the Firebase console)
src/lib/firebase.ts          Firebase setup
src/lib/db.ts                all Firestore reads/writes: trips, join codes, bookings, checklist
src/lib/links.ts             builds the comparison links for flights / hotels / places
src/lib/checklist.ts         the travel guide content, English + 繁體中文 (used by /guide and the checklist tab)
src/lib/i18n.ts              all interface text in both languages
src/app/api/flights/search   live fare search (SerpApi)
src/app/api/flights/track    live flight status (aviationstack)
src/app/api/itinerary/generate  AI day-by-day plan (Gemini)
src/app/trips/[id]           the trip page with its tabs
src/components/trip/*        Flights, Hotels, Places, Itinerary, Checklist, Team tabs
```
