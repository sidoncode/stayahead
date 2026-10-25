# StayAhead

A fast, minimal note-taking app. Notes live in your browser (localStorage) — no account, no backend.

## Features

- Create, edit, delete notes with autosave
- Pin important notes to the top
- Tag notes and filter by tag
- Full-text search across title, body and tags
- Word count and last-edited time
- Light/dark theme following the OS setting

## Stack

Vite · React 19 · TypeScript

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run lint
```

## Project layout

```
src/
  App.tsx               layout, search, tag filter
  components/
    NoteList.tsx        sidebar list
    Editor.tsx          title / tags / body editor
  hooks/useNotes.ts     note state + localStorage persistence
  types.ts
```
