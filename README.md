# StayAhead

A focused notebook in your browser. Notes live on your device (localStorage). There is no account and no backend.

**Live app:** https://stayahead1.vercel.app/

## Features

- Rich editor with Markdown shortcuts (`##`, `-`, `1.`, `**bold**`, `` `code` ``), links, images, undo/redo
- Folders, tags and pins; sort and filter the list; search with `⌘K` / `Ctrl+K`
- Autosave with a live "Saved locally" status
- Storage meter with a warning when the browser limit is nearly full
- Back up to Markdown or JSON; import a JSON backup or Markdown files
- Splash and first-run welcome screens; responsive desktop and mobile layouts

## Stack

Vite · React 19 · TypeScript · TipTap (Markdown). Fonts (Sora, Instrument Sans, JetBrains Mono) are self-hosted via Fontsource, so nothing loads from a third party.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run lint
```

## Deployment

The app is a static Vite build hosted on [Vercel](https://vercel.com) at https://stayahead1.vercel.app/.

| Setting          | Value           |
| ---------------- | --------------- |
| Framework preset | Vite            |
| Install command  | `npm install`   |
| Build command    | `npm run build` |
| Output directory | `dist`          |

To deploy your own copy, import the GitHub repo into Vercel with the settings above, or run `npx vercel` from the project folder. No environment variables are needed.

Notes are stored in each visitor's own browser, per site address. They are not shared between devices, and a different address (for example a Vercel preview URL or `localhost`) starts empty. Use **Settings → Export** to move notes between them.

## Design assets

`Stay Ahead visual identity/` is the design source: logos, favicons, PWA icons, the 36-icon UI set and a reference page for tokens and screens. Re-sync the app after changing it:

```bash
npm run sync-brand
```

That copies favicons, PWA icons and the manifest to `public/`, logos to `src/assets/brand/`, and regenerates `src/components/icons.generated.ts` (C2PA metadata stripped).

Design tokens live in `src/index.css` as `--sa-*` custom properties.

## Project layout

```
src/
  App.tsx                 app shell, views, dialogs, shortcuts
  components/
    Sidebar.tsx           nav, folders, tags, storage meter
    NoteList.tsx          search, sort, filter, note cards
    Editor.tsx            title, tags, TipTap body, autosave, actions
    Toolbar.tsx           formatting toolbar, link/image input
    Splash.tsx            animated launch screen
    Welcome.tsx           first-run screen
    SettingsModal.tsx     backup and storage
    Icon.tsx              inline SVG icons (currentColor)
  hooks/useStore.ts       notes, folders, settings + persistence
  lib/                    storage, backup (export/import), text helpers
scripts/sync-brand-assets.mjs
```

## Notes

- localStorage is capped at about 5 MB per browser, which is what the storage meter measures.
- Clearing site data in the browser deletes your notes. Export a backup first.
- The web manifest and icons are in place; there is no service worker yet, so the app is not available offline.
