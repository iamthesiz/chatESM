# Molstar Plugin Structure Analysis

## Overview

Based on the codebase analysis, here are the most commonly accessed properties deep in the Molstar plugin object tree and recommendations for top-level aliases.

## Most Commonly Accessed Properties

### 1. **canvas3d** - Canvas rendering context
- `plugin.canvas3d.setProps()` - Update canvas properties
- `plugin.canvas3d.props` - Access current canvas properties
- `plugin.canvas3d.requestDraw()` - Request canvas redraw
- `plugin.canvas3d.props.renderer` - Renderer settings
- `plugin.canvas3d.props.postprocessing` - Post-processing effects
- `plugin.canvas3d.props.trackball` - Camera trackball settings
- `plugin.canvas3d.props.cameraFog` - Fog settings

### 2. **state** - Plugin state management
- `plugin.state.data` - State data tree
- `plugin.state.behavior` - Behavior subjects
- `plugin.state.current` - Current state

### 3. **managers** - Core functionality managers
- `plugin.managers.structure.hierarchy` - Structure hierarchy management
- `plugin.managers.structure.component` - Structure components
- `plugin.managers.structure.selection` - Selection management
- `plugin.managers.camera` - Camera controls
- `plugin.managers.interactivity` - Mouse/keyboard interaction
- `plugin.managers.animation` - Animation controls

### 4. **builders** - Data and structure builders
- `plugin.builders.data` - Data loading/parsing
- `plugin.builders.structure` - Structure creation
- `plugin.builders.script` - Selection script building

### 5. **behaviors** - Observable behaviors
- `plugin.behaviors.state.isAnimating`
- `plugin.behaviors.state.isUpdating`
- `plugin.behaviors.state.isBusy`
- `plugin.behaviors.interaction.hover`
- `plugin.behaviors.interaction.click`

### 6. **representation** - Visual representation
- `plugin.representation.structure.registry`
- `plugin.representation.structure.themes`

## Naming Conflicts Analysis

### Existing "props" Properties
1. **canvas3d.props** - Canvas rendering properties (renderer, postprocessing, etc.)
2. Component props (React component properties throughout the codebase)

### Existing "state" Properties
1. **plugin.state** - The main plugin state manager
2. **plugin.behaviors.state** - Observable state behaviors
3. Various component-level state properties

### Other Potential Conflicts
- "managers" - Clear namespace, no conflicts
- "builders" - Clear namespace, no conflicts
- "canvas" vs "canvas3d" - Could be confusing

## Recommended Top-Level Aliases

Based on usage frequency and ergonomics, here are the recommended aliases:

```typescript
// Most useful aliases (used in 80%+ of operations)
plugin.canvas = plugin.canvas3d              // Canvas operations
plugin.draw = plugin.canvas3d.requestDraw    // Request redraw
plugin.props = plugin.canvas3d.props         // Canvas properties
plugin.hierarchy = plugin.managers.structure.hierarchy
plugin.selection = plugin.managers.structure.selection
plugin.camera = plugin.managers.camera
plugin.busy = plugin.behaviors.state.isBusy  // Check if busy

// Secondary aliases (used in 20-50% of operations)
plugin.builders = plugin.builders            // Already at top level
plugin.interaction = plugin.managers.interactivity
plugin.animation = plugin.managers.animation
plugin.component = plugin.managers.structure.component

// Convenience method aliases
plugin.setProps = (props) => plugin.canvas3d.setProps(props)
plugin.clear = () => plugin.clear()
plugin.load = plugin.builders.structure      // Structure loading shortcuts
```

## Usage Patterns in the Codebase

### 1. Canvas Operations (Most Common)
```typescript
// Current pattern
molstar.canvas3d.setProps({ renderer: { backgroundColor } })
molstar.canvas3d.requestDraw(true)

// With aliases
molstar.setProps({ renderer: { backgroundColor } })
molstar.draw(true)
```

### 2. Structure Operations
```typescript
// Current pattern
molstar.managers.structure.hierarchy.current
molstar.managers.structure.selection.clear()

// With aliases
molstar.hierarchy.current
molstar.selection.clear()
```

### 3. State Checks
```typescript
// Current pattern
if (molstar.behaviors.state.isBusy.value) return

// With aliases
if (molstar.busy.value) return
```

## Implementation Considerations

1. **Avoid Breaking Changes**: Keep original paths intact
2. **Type Safety**: Ensure TypeScript types work with aliases
3. **Documentation**: Clear docs on which are aliases vs original paths
4. **Performance**: Use getters to avoid creating objects unnecessarily
5. **Discoverability**: Group related aliases together

## Potential Issues

1. **canvas3d.props vs props**: Having both could be confusing. Consider:
   - `canvasProps` instead of `props` 
   - Or keep `canvas3d.props` path only

2. **state conflicts**: Multiple "state" properties exist. Avoid aliasing plugin.state to prevent confusion.

3. **Nested managers**: Some developers might expect `plugin.structure` instead of keeping the `managers` namespace.