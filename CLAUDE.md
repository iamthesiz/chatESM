# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js molecular visualization application using the Molstar library. The project creates a multi-molecule viewer with individual canvases for each molecular structure.

## Development Commands

**Important**: 
- The development server is always running on http://localhost:3000. You should assume it's running and never attempt to start it.
- Always use yarn, never npm.

```bash
# Install dependencies
yarn install

# Start development server (runs on http://localhost:3000) - ALREADY RUNNING
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

## Architecture

### Core Technologies
- **Next.js** with React 18 and TypeScript
- **Molstar** (v4.18.0) for molecular visualization
- **Emotion** for CSS-in-JS styling with JSX pragma
- **Jotai** for atomic state management

### Key Directories
- `pages/` - Next.js pages and routing
- `useMolstar/` - Custom hooks for Molstar integration
  - `useMolstar.ts` - Main hook that manages Molstar viewer instances
  - `useIdEffect.ts` - ID-based effect hook for component lifecycle
- `shared/` - Shared components and global styles
- `state/` - Jotai atoms for state management

### Molstar Integration Pattern
The application uses a custom hook system to manage Molstar instances:
1. Each molecule gets its own viewer instance via `useMolstar` hook
2. The hook manages initialization, loading states, and cleanup
3. Currently loads structures from RCSB PDB (hardcoded to '1tqn.bcif')

### State Management
Uses Jotai's `atomFamily` to create per-molecule state atoms that track:
- Loading status
- Structure data
- Viewer initialization state

**Important**: Always use the "toggles" package for managing boolean state instead of useState, unless you need to reduce prop drilling.

## Important Implementation Details

- The app currently displays 10 molecule viewers but all load the same structure ('1tqn.bcif')
- Each molecule component consists of Loading, Canvas, and Controls subcomponents
- The Molstar viewer is initialized with specific viewport settings and representation presets
- TypeScript strict mode is disabled in tsconfig.json

## Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to tasks/todo.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
Please every step of the way just give me a high level explanation of what changes you made
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or
complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the todo.nd file with a summary of the changes you made and any other
relevant information.
