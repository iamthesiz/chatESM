# Camera Plugin Commands Integration

## Current State

The `useCamera` hook currently manages camera state (position, target, FOV, etc.) and composed features (fog, clipping, stereo, axes). However, it doesn't yet integrate Molstar's high-level camera commands from `PluginCommands.Camera`.

## Plugin Commands to Integrate

### Available Commands in useMolecule
These camera commands are currently implemented in `useMolecule` but could be moved to `useCamera`:

```typescript
// Reset camera to default view
PluginCommands.Camera.Reset(molstar, { durationMs: 250 })

// Orient camera to axes
PluginCommands.Camera.OrientAxes(molstar, { durationMs: 250 })

// Reset axes orientation
PluginCommands.Camera.ResetAxes(molstar, { durationMs: 250 })

// Focus on specific elements (requires selection/loci)
molstar.managers.camera.focusLoci(selected)
```

## Proposed API Design

### Option 1: Methods on State Object
```typescript
const [camera, setCamera] = useCamera(id)

// State properties
camera.position // [x, y, z]
camera.fov // 45

// Action methods
camera.reset()        // Animated reset
camera.orientAxes()   // Orient to axes
camera.resetAxes()    // Reset axes
camera.focus(loci)    // Focus on selection
```

### Option 2: Separate Actions Return
```typescript
const [camera, setCamera, cameraActions] = useCamera(id)

cameraActions.reset()
cameraActions.orientAxes()
cameraActions.resetAxes()
cameraActions.focus(loci)
```

### Option 3: Combined Setter
```typescript
const [camera, setCamera] = useCamera(id)

// State updates
setCamera({ position: [0, 0, 10] })

// Action triggers
setCamera({ action: 'reset', duration: 250 })
setCamera({ action: 'orientAxes' })
setCamera({ action: 'focus', target: loci })
```

## Implementation Considerations

1. **Animation Duration**: Plugin commands support animation duration - should this be configurable?
2. **Async Behavior**: Some commands are animated - should they return promises?
3. **Selection Integration**: Focus command needs selection/loci - how to integrate with useSelection?
4. **State Sync**: After plugin commands execute, camera state needs to be re-read

## Benefits of Integration

1. **Single Source of Truth**: All camera operations through one hook
2. **Consistent API**: State and actions in one place
3. **Better TypeScript**: Typed camera actions
4. **Reusability**: Camera actions available to any component using the hook

## Next Steps

1. Choose API design approach
2. Implement plugin command wrappers in useCamera
3. Update useMolecule to use camera actions from hook
4. Add tests for camera actions
5. Document usage patterns