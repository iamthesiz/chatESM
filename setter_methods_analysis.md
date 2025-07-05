# Molstar Setter Methods Analysis

## Most Common Setter Methods

### 1. Canvas3D and Rendering
- `canvas3d.setProps()` - Update canvas rendering properties (camera, postprocessing, renderer settings)
- `canvas3d.camera.setState()` - Set camera position/orientation
- `canvas3dContext.setProps()` - Set context properties (resolution, transparency)
- `trackball.setProps()` - Update trackball controls

### 2. Plugin Layout & UI
- `plugin.layout.setProps()` - Update layout properties (panel visibility, expansion state)
- `plugin.state.setSnapshot()` - Set complete plugin state from snapshot
- `plugin.state.setSnapshotParams()` - Set snapshot parameters

### 3. Structure/Component Management
- `plugin.managers.structure.component.updateRepresentations()` - Update representation parameters
- `plugin.managers.structure.component.updateRepresentationsTheme()` - Update color/size themes
- `plugin.managers.structure.component.setOptions()` - Set component options
- `plugin.managers.structure.hierarchy.updateCurrent()` - Update current structure selection
- `plugin.managers.structure.hierarchy.updateStructure()` - Update structure parameters

### 4. Camera & Viewport
- `plugin.managers.camera.setSnapshot()` - Set camera state from snapshot
- `plugin.managers.camera.reset()` - Reset camera with optional snapshot

### 5. Selection & Focus
- `plugin.managers.structure.selection.setSnapshot()` - Set selection state
- `plugin.managers.structure.focus.setFromLoci()` - Set focus from loci
- `plugin.managers.structure.focus.setSnapshot()` - Set focus from snapshot

### 6. Animation
- `plugin.managers.animation.setSnapshot()` - Set animation state
- `plugin.managers.animation.updateParams()` - Update animation parameters
- `plugin.managers.animation.updateCurrentParams()` - Update current animation params

### 7. Interactivity
- `plugin.managers.interactivity.setProps()` - Set interactivity properties

### 8. Volume Management
- `plugin.managers.volume.hierarchy.setCurrent()` - Set current volume

### 9. State Management
- `plugin.managers.snapshot.setCurrent()` - Set current snapshot
- `plugin.managers.snapshot.setStateSnapshot()` - Set state snapshot

### 10. Component Updates
- `updateLabel()` - Update component labels
- `updateTransform()` - Update state transforms

## Parameters Commonly Used

1. **setProps** methods typically accept partial objects matching their respective params:
   - Camera properties (FOV, mode, stereo settings)
   - Renderer properties (background color, highlight colors, lighting)
   - Postprocessing (SSAO, outline, shadow, DOF)
   - Trackball controls (speed, bindings, animation)

2. **updateRepresentations** accepts:
   - Representation type parameters
   - Color theme parameters
   - Size theme parameters
   - Visual quality settings

3. **setSnapshot** methods accept snapshot objects containing complete state

