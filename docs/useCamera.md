# useCamera

Hook for controlling the Molstar camera including position, animation, and viewport settings.

## Usage

```typescript
import { useCamera } from '../hooks/useCamera'

function CameraControls() {
  const [camera, setCamera] = useCamera('viewer-1')
  
  // Animate camera
  const handleSpin = () => {
    setCamera({
      animation: {
        type: 'spin',
        speed: 1
      }
    })
  }
  
  // Reset view
  const handleReset = () => {
    camera.reset({ durationMs: 500 })
  }
  
  return (
    <div>
      <button onClick={handleSpin}>Spin</button>
      <button onClick={handleReset}>Reset</button>
    </div>
  )
}
```

## API

### Return Value

Returns a tuple: `[camera, setCamera]`

#### camera object

- `position: Vec3` - Camera position
- `target: Vec3` - Camera target/focus point
- `up: Vec3` - Camera up vector
- `zoom: number` - Zoom level
- `fov: number` - Field of view
- `near: number` - Near clipping plane
- `far: number` - Far clipping plane
- `animation: AnimationState` - Current animation state
- `reset(options?)` - Reset camera to fit structure
- `orientAxes(options?)` - Orient to axes view
- `focus(center, radius, duration?)` - Focus on specific region
- `set(options)` - Set camera state directly

#### setCamera function

Updates camera configuration:

```typescript
setCamera({
  position?: Vec3
  target?: Vec3
  zoom?: number
  fov?: number
  animation?: {
    type: 'off' | 'spin' | 'rock'
    speed?: number
    angle?: number // for rock animation
  }
  fog?: {
    enabled: boolean
    intensity?: number
  }
  clip?: {
    near?: number
    far?: number
  }
  mode?: 'perspective' | 'orthographic'
})
```

## Examples

### Camera Animation

```typescript
const [camera, setCamera] = useCamera('mol-1')

// Start spinning
setCamera({
  animation: {
    type: 'spin',
    speed: 0.5
  }
})

// Rock back and forth
setCamera({
  animation: {
    type: 'rock',
    speed: 1,
    angle: 15
  }
})

// Stop animation
setCamera({ animation: { type: 'off' } })
```

### Camera Positioning

```typescript
// Set specific position
setCamera({
  position: [50, 50, 50],
  target: [0, 0, 0],
  zoom: 100
})

// Reset to fit structure
camera.reset({ durationMs: 1000 })

// Focus on region
camera.focus([10, 10, 10], 20, 500)
```

### Fog Effect

```typescript
// Enable fog
setCamera({
  fog: {
    enabled: true,
    intensity: 50
  }
})

// Disable fog
setCamera({ fog: { enabled: false } })
```

### Clipping Planes

```typescript
// Adjust clipping
setCamera({
  clip: {
    near: 0.1,
    far: 1000
  }
})
```

### Camera Modes

```typescript
// Switch to orthographic
setCamera({ mode: 'orthographic' })

// Back to perspective
setCamera({ mode: 'perspective' })
```

## Animation Types

- `off` - No animation
- `spin` - Continuous rotation around Y axis
- `rock` - Rock back and forth

## Notes

- Camera state is preserved across component re-renders
- Animation continues until explicitly stopped
- Reset automatically calculates optimal view for current structure
- Fog intensity ranges from 0-100

---

# Ideas

## Camera System Components

Based on exploration of the Molstar source code, here's what's included in the camera system:

### Important: Two Camera Properties in Molstar

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

### Camera System Components

1. **Core Camera Properties** (Camera State/Snapshot)
   - `mode`: 'perspective' | 'orthographic'
   - `fov`: Field of view (for perspective mode)
   - `position`: Camera position (Vec3)
   - `up`: Up vector (Vec3)
   - `target`: Look-at target (Vec3)
   - `radius`: Scene bounding sphere radius
   - `radiusMax`: Maximum radius
   - `zoom`: Zoom level

2. **Camera Clipping** (`cameraClipping`)
   - `radius`: Clipping radius (0-99, percentage of scene to show)
   - `far`: Enable far plane clipping (boolean)
   - `minNear`: Minimum near clipping distance

3. **Camera Fog** (`cameraFog`)
   - `intensity`: Fog intensity
   - `enabled`: On/off state

4. **Camera Helper** (Visual aids)
   - `axes`: The axes helper we just created `useAxes` for
   - Other potential helpers (grid, scale line, etc.)

5. **Stereo Settings** (`stereo`)
   - `enabled`: On/off
   - `eyeSeparation`: Distance between eyes
   - `focus`: Stereo focus distance

6. **Viewport**
   - Viewport dimensions and offsets
   - Canvas size vs actual render size
   - Multi-window support

7. **Camera Controls/Animation**
   - Spin animation
   - Rock animation
   - Transition management (smooth camera movements)
   - Reset behaviors

### Proposed Hook Architecture

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

### Alternative: Single `useCamera` Hook

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
    // ... all axes properties
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

### Molstar Source References

- Camera core: `mol-canvas3d/camera.d.ts`
- Camera helper: `mol-canvas3d/helper/camera-helper.d.ts`
- Canvas3D props: `mol-canvas3d/canvas3d.d.ts`
- Camera transitions: `mol-canvas3d/camera/transition.d.ts`