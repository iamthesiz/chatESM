# Plugin.state vs Canvas3d.props - Understanding the Difference

## Overview

The Molstar plugin has two distinct concepts that might seem similar but serve very different purposes:

1. **plugin.state** - Application state management (data, structures, representations)
2. **canvas3d.props** - Canvas rendering properties (visual settings, camera, effects)

## plugin.state - Application State

The `plugin.state` manages the entire application's data and structural state using a state tree pattern.

### What it contains:
```typescript
plugin.state = {
  // State tree management
  data: StateTree,           // The actual state tree with all loaded data
  behavior: BehaviorSubject, // Observable state behaviors
  current: State,            // Current state snapshot
  
  // State operations
  update()                   // Update state tree
  apply()                    // Apply state changes
  undo()                     // Undo last operation
  redo()                     // Redo operation
  
  // Data in the state tree includes:
  // - Downloaded files
  // - Parsed structures
  // - Created models
  // - Visual representations
  // - Measurements
  // - Selections
}
```

### Example usage:
```typescript
// Load a structure into the state
const data = await plugin.builders.data.download({ url: '1tqn.cif' })
const trajectory = await plugin.builders.structure.parseTrajectory(data, 'mmcif')
const model = await plugin.builders.structure.createModel(trajectory)
const structure = await plugin.builders.structure.createStructure(model)

// All of these operations modify plugin.state
```

## canvas3d.props - Canvas Rendering Properties

The `canvas3d.props` contains all visual rendering settings for the 3D canvas.

### What it contains:
```typescript
canvas3d.props = {
  // Renderer settings
  renderer: {
    backgroundColor: Color,
    colorMarker: boolean,
    highPrecisionShaders: boolean,
    preferWebGL1: boolean,
    pickScale: number,
    transparency: 'blended' | 'wboit',
    ambientIntensity: number,
    lightIntensity: number
  },
  
  // Camera settings
  camera: {
    mode: 'perspective' | 'orthographic',
    helper: CameraHelperParams,
    fov: number,
    position: Vec3,
    target: Vec3
  },
  
  // Post-processing effects
  postprocessing: {
    occlusion: { name: 'on' | 'off', params: {...} },
    outline: { name: 'on' | 'off', params: {...} },
    shadow: { name: 'on' | 'off', params: {...} },
    dof: { name: 'on' | 'off', params: {...} }    // Depth of field
  },
  
  // Interaction settings
  trackball: {
    animate: 'off' | 'spin' | 'rock',
    animateSpeed: number,
    rotateSpeed: number,
    zoomSpeed: number,
    panSpeed: number
  },
  
  // Other visual settings
  cameraFog: { name: 'on' | 'off', params: { intensity: number } },
  multiSample: { mode: 'on' | 'off' | 'temporal', sampleLevel: number },
  marking: { enabled: boolean },
  renderer3d: {...}  // WebGL specific settings
}
```

### Example usage:
```typescript
// Change background color
plugin.canvas3d.setProps({ 
  renderer: { backgroundColor: Color(0xffffff) } 
})

// Enable fog effect
plugin.canvas3d.setProps({ 
  cameraFog: { name: 'on', params: { intensity: 30 } } 
})

// Enable outline effect
plugin.canvas3d.setProps({ 
  postprocessing: {
    outline: { name: 'on', params: { scale: 1, color: Color(0x000000) } }
  }
})
```

## Key Differences

| Aspect | plugin.state | canvas3d.props |
|--------|--------------|----------------|
| **Purpose** | Manages data and structures | Controls visual appearance |
| **Persistence** | Saved in sessions/snapshots | Visual settings only |
| **Scope** | Entire application state | Canvas rendering only |
| **Updates** | Through state transactions | Direct property updates |
| **Undo/Redo** | Full undo/redo support | No undo (immediate) |
| **Performance** | Can be expensive (rebuilds) | Usually fast (GPU settings) |

## Common Confusion Points

1. **Representation styles** are stored in `plugin.state` (as state objects), but their **rendering quality** is in `canvas3d.props`

2. **Camera position** can be set through both:
   - `plugin.state` via camera state snapshots (persistent)
   - `canvas3d.props.camera` (temporary, immediate)

3. **Background color** is a canvas property, not a state property

4. **Structure visibility** is state (which structures to show), but **visual effects** (shadows, fog) are canvas props

## Best Practices

1. Use `plugin.state` for:
   - Loading structures
   - Creating representations
   - Managing selections
   - Anything that should be saved/restored

2. Use `canvas3d.props` for:
   - Visual quality settings
   - Rendering effects
   - Camera animations
   - Temporary visual changes

3. When building UI controls:
   - Structure controls modify `plugin.state`
   - Visual/quality controls modify `canvas3d.props`