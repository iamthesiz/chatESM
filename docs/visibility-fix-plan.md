# Molstar Visibility Toggle Fix Plan

## Issue
The `ToggleVisibility` command updates the state but doesn't visually update the canvas. This is because Molstar requires calling `canvas3d.syncVisibility()` after visibility changes to update the rendering.

## Root Cause
Based on investigation of Molstar's source code:

1. `PluginCommands.State.ToggleVisibility` updates the `isHidden` state on cells
2. The `UpdateRepresentationVisibility` behavior listens for state changes and updates the representation's visible state
3. However, the canvas needs to be explicitly told to sync visibility changes via `canvas3d.syncVisibility()`

## Solution
After calling `PluginCommands.State.ToggleVisibility`, we need to call:
```typescript
plugin.canvas3d?.syncVisibility()
```

## Implementation Steps

1. In the `toggleComponent` function in `useMolstar.ts`, after the visibility toggle commands, add:
   ```typescript
   // Sync visibility changes to canvas
   plugin.canvas3d?.syncVisibility()
   ```

2. This should be added after the loop that toggles visibility for each component reference.

## Code Location
File: `/Users/alex/code/evolutionary-scale/molstar-hook/useMolstar/useMolstar.ts`
Function: `toggleComponent`
Line: After the visibility toggle loop (around line 745)