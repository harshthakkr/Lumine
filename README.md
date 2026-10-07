# Luminé - Makeup Artist Booking Platform

_Professional artist booking platform designed for the beauty industry_

## Overview

Luminé is a modern web application that streamlines the process of discovering and booking professional makeup artists. Built with Next.js 15 and TypeScript, it delivers a seamless user experience while maintaining the sophistication expected in the luxury beauty market.

The platform is deployed and fully functional for testing the booking workflow and user interface.
**[View Application](https://makeup-artist-booking-platform.vercel.app/)**

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components, Server Actions) + React 19
- **Language:** TypeScript
- **Database:** PostgreSQL ([Neon](https://neon.tech) in production) with **Drizzle ORM** and versioned migrations
- **Auth:** [Better Auth](https://better-auth.com) (email + password, sessions stored in Postgres)
- **Styling:** Tailwind CSS 4 with a custom design system
- **Validation:** Zod

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ running locally (or a Neon database)

### Setup

```bash
git clone https://github.com/harshthakkr/Lumine
cd Lumine
npm install

cp .env.example .env.local   # then fill in DATABASE_URL and BETTER_AUTH_SECRET
createdb lumine              # if using local Postgres

npm run db:migrate           # create tables
npm run db:seed              # 16 artists, 180 clients, ~1.5k bookings, ~800 reviews
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Explore the demo**.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run db:generate` | Generate a migration from schema changes in `db/schema` |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Wipe and reseed realistic data (refuses non-local DBs without `--yes`) |
| `npm run db:reset` | Drop everything, migrate and seed from scratch (local only) |
| `npm run db:studio` | Browse the database in Drizzle Studio |
| `npm run demo:cleanup` | Delete expired demo workspaces |
| `npm test` | Run unit tests (slot engine, search params, formatting, calendar files) |

## Site map

| Who | Pages |
| --- | --- |
| Everyone | Home (`/`) → Browse (`/artists`) → Artist profile (`/artists/[slug]`) |
| Clients | Book (`/book/[slug]`) · Bookings (`/bookings`, `/bookings/[ref]`) · Saved (`/saved`) |
| Artists | Dashboard (`/dashboard`) · Bookings (`/bookings`, accept/decline on `/bookings/[ref]`) · My profile (preview of their public page) |

Navigation changes with who is signed in, and every URL is defined once in `lib/routes.ts`.

## Features

- **Discovery** (`/artists`): search by name, look or neighborhood; filter by occasion, date, area, price, rating, instant booking and studio vs. at-home; five sort orders. All state lives in the URL, so every search is shareable. Mobile gets a bottom-sheet filter panel.
- **Live availability**: every card shows the artist's next opening, and filtering by date shows the first opening that day. Computed by a pure slot engine (`lib/availability.ts`) that respects working hours, split shifts, lead time, booking windows, existing bookings and DST.
- **Artist profiles** (`/artists/[slug]`): portfolio mosaic with a keyboard-navigable lightbox, services menu, a two-week slot picker that jumps to the first open week, reviews with a filterable rating histogram and artist replies, policies, and similar artists. Includes JSON-LD for search engines.
- **Booking requests**: pick a service and time, choose studio or at-home, add notes, and book. Instant-book artists confirm immediately; others receive a request on their dashboard. Confirmation pages include a progress timeline and an "Add to calendar" (.ics) download.
- **Saved artists**: heart any artist (optimistic UI) and find them again in your account.

## How the demo works

Every visitor who clicks **Explore the demo** gets a private sandbox: a client account (Maya) and an artist account (Selene) with months of generated history, upcoming appointments and booking requests to answer.

A three-step **guide** in the demo bar walks through the whole marketplace loop: save an artist as Maya, request a booking with Selene, then switch sides and accept it. Progress is derived from what the visitor actually did in their workspace (`lib/demo-guide.ts`), not from checkboxes.

- Workspaces are isolated: a visitor's demo artist is only visible to them, and deleting the workspace cascades to everything they created.
- Workspaces expire after 24 hours and are removed by a daily Vercel Cron job (`/api/cron/cleanup-demo`) and opportunistically whenever a new demo starts.
- Demo creation is rate-limited per (hashed) IP.

## Data model highlights

- **No double bookings, guaranteed by the database.** A Postgres exclusion constraint (`bookings_no_overlap`) rejects overlapping active bookings for the same artist, even under concurrent requests.
- **Bookings snapshot the service** (name, duration, price) so editing a service never rewrites history.
- **Ratings are real aggregates.** Every review belongs to a completed booking, and artist ratings are computed from those rows.
- **Availability is stored in the artist's local time** and converted with DST-safe helpers (`lib/time.ts`).
- **Search ranking uses a Bayesian average**, so a 5.0 from 3 reviews doesn't outrank a 4.9 from 80.
- **Portfolio photography** is from [Unsplash](https://unsplash.com) (free license) and is resized by Unsplash's own CDN rather than our image optimizer.

## Architecture & Design Decisions

### Design System Implementation

**Color Palette Strategy**

- Primary gold (`#d4a574`) establishes luxury positioning
- Neutral cream (`#f5e6d3`) provides sophisticated backdrop
- Accent rose (`#d4707a`) adds warmth without overwhelming
- High contrast text ensures accessibility compliance

**Typography Hierarchy**

- Playfair Display serif for brand elements and headings
- Inter sans-serif for interface text and readability

### Performance & Optimization

- **Responsive images** via `next/image`: the 3000px source photos are resized and served as WebP at the size each layout needs
- **Self-hosted fonts** via `next/font`, with no layout shift and no third-party font requests
- **Session cookie cache** avoids a database round-trip on most requests

## Live Demo
https://github.com/user-attachments/assets/bd30e50e-e512-4a6a-bb48-6f2d1c4000b8

