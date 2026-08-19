# CFO Innovation Partners

This repository holds two things, deployed independently:

- **`/`** — the public marketing site (static HTML/CSS/JS), deployed to
  **GitHub Pages** via `.github/workflows/pages.yml`.
- **`/os`** — **CFOIP OS**, the practice operating system (Next.js +
  Supabase + Prisma), deployed to **Vercel** with the project's Root
  Directory set to `os/`. Reached from the marketing site's "Access your
  OS" nav link.

Both deploy straight from GitHub on every push — nothing is built or
deployed from a local machine.

## Start here

- **Full documentation**: [`/docs`](./docs) — product spec, architecture,
  data model, security, QA plan, setup guide, implementation plan and
  decision log.
- **Set up a Supabase project and connect Vercel**: [`/docs/setup.md`](./docs/setup.md)
- **What's built vs. planned, by phase**: [`/docs/implementation-plan.md`](./docs/implementation-plan.md)
- **CFOIP OS app README** (local commands): [`/os/README.md`](./os/README.md)

## Marketing site

Plain HTML/CSS/JS, no build step. Edit `index.html` / `styles.css` /
`script.js` directly; pushing to `main` redeploys via
`.github/workflows/pages.yml`.

## CFOIP OS

See [`/os/README.md`](./os/README.md) and [`/docs/architecture.md`](./docs/architecture.md).
