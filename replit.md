# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Aura Player (`artifacts/aura-player/`)
- **Type**: React + Vite (frontend-only)
- **Preview path**: `/`
- **Description**: A fully-featured music player with:
  - File upload via drag-and-drop or file picker
  - IndexedDB persistence of audio blobs across sessions
  - ID3 metadata extraction (title, artist, album art via jsmediatags)
  - Waveform rendering (OfflineAudioContext, drawn on canvas)
  - Circular frequency visualizer (Web Audio API analyser)
  - Ambient animated background canvas with orbs
  - Mood engine that auto-detects mood from audio (calm/energetic/melancholic/euphoric)
  - Mood-themed CSS variables (accent colors shift with mood)
  - Album art color extraction for theme fallback
  - Playback controls: play/pause, prev/next, shuffle, repeat
  - Volume slider and playback speed cycle
  - Queue management with search, drag-to-reorder, remove
  - Playlist save/load (localStorage)
  - Immersive fullscreen overlay
  - Toast notification on track change
  - Mini mode (collapses to bottom bar only)
  - Full keyboard shortcut support (Space, Arrow keys, I/S/R/L/M)
  - MediaSession API integration
  - Settings persistence (volume, shuffle, repeat, last track/time)

## Architecture

- **Components**: `src/components/` — one file per UI component
- **Hooks**: `src/hooks/` — `usePlayerStore` (main state), `useAmbientCanvas`, `useVisCanvas`, `useMoodEngine`, `useWaveform`
- **Lib**: `src/lib/` — `audio.ts` (utilities), `db.ts` (IndexedDB wrappers)
- **Types**: `src/types.ts` — shared types and constants

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
