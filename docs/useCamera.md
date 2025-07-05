# Camera System Components

Based on exploration of the Molstar source code, here's what's included in the camera system:

## Important: Two Camera Properties in Molstar

There are two distinct camera-related properties in Molstar:

1. **`canvas3d.camera`** (Camera instance):
   - Direct camera control object
   - Methods: `focus()`, `zoom()`, `setState()`, `setSnapshot()`
   - Properties: `state`, `fogNear`, `fogFar`, `near`, `far`
   - Used for direct camera manipulation

2. **`canvas3d.props.camera`** (Camera configuration):
   - Configuration/settings object
   - Properties: `mode` (perspective/orthographic), `stereo`, `helper`
   - Used with `canvas3d.setProps()` to update camera settings
   - Part of the canvas3d props system

## Camera System Components

### 1. **Core Camera Properties** (Camera State/Snapshot)
- `mode`: 'perspective' | 'orthographic'
- `fov`: Field of view (for perspective mode)
- `position`: Camera position (Vec3)
- `up`: Up vector (Vec3)
- `target`: Look-at target (Vec3)
- `radius`: Scene bounding sphere radius
- `radiusMax`: Maximum radius
- `zoom`: Zoom level

### 2. **Camera Clipping** (`cameraClipping`)
- `radius`: Clipping radius (0-99, percentage of scene to show)
- `far`: Enable far plane clipping (boolean)
- `minNear`: Minimum near clipping distance

### 3. **Camera Fog** (`cameraFog`)
- `intensity`: Fog intensity
- `enabled`: On/off state

### 4. **Camera Helper** (Visual aids)
- `axes`: The axes helper we just created `useAxes` for
- Other potential helpers (grid, scale line, etc.)

### 5. **Stereo Settings** (`stereo`)
- `enabled`: On/off
- `eyeSeparation`: Distance between eyes
- `focus`: Stereo focus distance

### 6. **Viewport**
- Viewport dimensions and offsets
- Canvas size vs actual render size
- Multi-window support

### 7. **Camera Controls/Animation**
- Spin animation
- Rock animation
- Transition management (smooth camera movements)
- Reset behaviors

## Proposed Hook Architecture

Here's how we could break these into separate hooks:

```typescript
// Core camera position/orientation
useCamera(id) // position, target, up, mode, fov, zoom

// Visual helpers
useAxes(id) // ✅ Already created
useCameraGrid(id) // Future: grid helper
useCameraScale(id) // Future: scale line

// Effects
useCameraFog(id) // fog on/off, intensity
useCameraClipping(id) // near/far clipping planes
useStereo(id) // stereoscopic rendering

// Animation
useCameraAnimation(id) // spin, rock, transitions

// Viewport
useViewport(id) // viewport dimensions, offsets
```

## Implementation Priority

The most useful hooks to implement after axes might be:
1. `useCamera` - Core position/orientation control
2. `useCameraClipping` - Control clipping planes for cross-sections
3. `useCameraFog` - Fog effects for depth perception
4. `useCameraAnimation` - Built-in animations (spin, rock)

## Example Usage

```typescript
// Core camera control
const [camera, setCamera] = useCamera(id)
// camera = { position, target, up, mode, fov, zoom }
setCamera({ mode: 'orthographic' })
setCamera({ position: [10, 10, 10] })

// Clipping planes
const [clipping, setClipping] = useCameraClipping(id)
// clipping = { radius, far, minNear }
setClipping({ radius: 50 }) // Show only 50% of scene

// Fog
const [fog, setFog] = useCameraFog(id)
// fog = { enabled, intensity }
setFog({ enabled: true, intensity: 30 })

// Animation
const [animation, setAnimation] = useCameraAnimation(id)
// animation = { type: 'off' | 'spin' | 'rock', speed }
setAnimation({ type: 'spin', speed: 1 })
```

## Alternative: Single `useCamera` Hook

Instead of multiple hooks, all camera functionality could be consolidated into a single `useCamera` hook:

```typescript
const [camera, setCamera] = useCamera(id)

// camera state would include everything:
camera = {
  // Core properties
  mode: 'perspective' | 'orthographic',
  position: [x, y, z],
  target: [x, y, z],
  up: [x, y, z],
  fov: 45,
  zoom: 1,
  
  // Clipping
  clipping: {
    radius: 100,
    far: true,
    minNear: 0.1
  },
  
  // Fog
  fog: {
    enabled: false,
    intensity: 50
  },
  
  // Axes (visual helper)
  axes: {
    visible: false,
    opacity: 0.51,
    scale: 0.33,
    location: 'bottom-left',
    locationOffsetX: 0,
    locationOffsetY: 0,
    radiusScale: 0.075,
    showLabels: false,
    showPlanes: true,
    x: '#ff0000',
    y: '#008000',
    z: '#0000ff',
    origin: '#808080',
    planeXY: '#808080',
    planeXZ: '#808080',
    planeYZ: '#808080',
    labelX: 'X',
    labelY: 'Y',
    labelZ: 'Z',
    labelColorX: '#808080',
    labelColorY: '#808080',
    labelColorZ: '#808080',
    labelOpacity: 1,
    labelScale: 0.25
  },
  
  // Stereo
  stereo: {
    enabled: false,
    eyeSeparation: 0.064,
    focus: 10
  },
  
  // Animation
  animation: {
    type: 'off' | 'spin' | 'rock',
    speed: 1
  },
  
  // Viewport
  viewport: {
    width: 800,
    height: 600,
    offsetX: 0,
    offsetY: 0
  }
}

// Usage examples:

// Update single property
setCamera({ mode: 'orthographic' })
setCamera({ position: [10, 10, 10] })
setCamera({ fov: 60 })

// Update nested properties
setCamera({ 
  clipping: { radius: 50 } 
})

setCamera({ 
  fog: { enabled: true, intensity: 30 } 
})

setCamera({ 
  axes: { visible: true, scale: 0.5 } 
})

setCamera({
  animation: { type: 'spin', speed: 2 }
})

// Update multiple properties at once
setCamera({
  mode: 'perspective',
  position: [20, 20, 20],
  target: [0, 0, 0],
  clipping: { radius: 75 },
  fog: { enabled: true },
  axes: { visible: true }
})

// Function updater form
setCamera(prev => ({
  ...prev,
  axes: { ...prev.axes, visible: !prev.axes.visible }
}))
```

### Pros of Single Hook:
- Single source of truth for all camera state
- Easier to save/restore complete camera state
- Less imports needed
- Can update multiple properties atomically

### Cons of Single Hook:
- Larger API surface area
- More complex state object
- Might re-render more components than necessary
- Harder to tree-shake unused features

## Molstar Source References

- Camera core: `mol-canvas3d/camera.d.ts`
- Camera helper: `mol-canvas3d/helper/camera-helper.d.ts`
- Canvas3D props: `mol-canvas3d/canvas3d.d.ts`
- Camera transitions: `mol-canvas3d/camera/transition.d.ts`