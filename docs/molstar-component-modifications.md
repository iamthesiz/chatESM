# Molstar Component Modification APIs

This document lists all the places in the Molstar library where components can be added, removed, or modified outside of our useComponents hook.

## 1. StructureComponentManager (`plugin.managers.structure.component`)

The main API for managing components. Methods that modify components:

### Component Creation/Deletion
- `add(params, structures?)` - Creates new components with selections
- `clear(structures)` / `clearComponents(structures)` - Removes all components from structures
- `applyPreset(structures, provider, params?)` - Applies representation presets (can add/remove components)
- `syncPreset(root, preset)` - Synchronizes components with preset (removes non-preset components)

### Component Modification
- `modifyByCurrentSelection(components, action)` - Modifies components by union/subtract/intersect with current selection
- `modifyComponent(builder, component, by, action)` - Core method for modifying component structure
- `updateLabel(component, label)` - Updates component label

### Representation Management
- `addRepresentation(components, type)` - Adds representations to components
- `removeRepresentations(components, pivot?)` - Removes representations from components
- `updateRepresentations(components, pivot, params)` - Updates representation parameters
- `updateRepresentationsTheme(components, params)` - Updates color/size themes

### Visibility Control
- `toggleVisibility(components, reprPivot?)` - Shows/hides components or specific representations

### Theme Application
- `applyTheme(params, structures?)` - Applies color/transparency/material themes

### Options Management
- `setOptions(options)` - Updates global component rendering options
- `updateReprParams(update, component)` - Updates representation parameters based on options

## 2. StructureHierarchyManager (`plugin.managers.structure.hierarchy`)

Manages the overall structure hierarchy and can affect components:

- `remove(refs, canUndo?)` - Can remove component references
- `toggleVisibility(refs, action?)` - Can toggle visibility of components
- `applyPreset(trajectories, provider, params?)` - Applies hierarchy presets
- `updateStructure(s, params)` - Updates structure parameters

## 3. State Tree Operations

Direct state tree modifications that can affect components:

### Via plugin.state.data
- `plugin.state.data.build()` - Creates a state builder
- `builder.delete(ref)` - Deletes nodes (including components)
- `builder.to(ref).update(params)` - Updates node parameters
- `plugin.state.data.updateTree(builder, options)` - Applies state changes

### Via plugin.dataTransaction
- `plugin.dataTransaction(async () => { ... })` - Wraps multiple state operations

## 4. Plugin Commands

Commands that can indirectly affect components:

- `PluginCommands.State.RemoveObject` - Can remove component nodes
- `PluginCommands.State.ToggleVisibility` - Can hide/show components
- `PluginCommands.State.Update` - Can update the entire state tree
- `PluginCommands.State.ApplyAction` - Can apply actions that modify components

## 5. Representation Presets

Presets can add/remove components when applied:

- `plugin.builders.structure.representation.applyPreset()` - Applies representation presets
- Preset providers in `mol-plugin-state/builder/structure/representation-preset`

## 6. Structure Builders

Builders that create components:

- `plugin.builders.structure.tryCreateComponentFromSelection()` - Creates components from selections
- `plugin.builders.structure.representation.addRepresentation()` - Adds representations

## 7. UI Components

UI elements that trigger component modifications:

- `StructureComponentControls` - Main UI for component management
- `AddComponentControls` - UI for adding new components
- `ComponentOptionsControls` - UI for component options
- `StructureComponentGroup` - UI for individual component management

## 8. Behaviors and Animations

Dynamic behaviors that might affect components:

- `StructureFocusRepresentation` behavior - Can modify focus representation
- Animation system via `plugin.managers.animation`
- State interpolation animations

## 9. Selection Operations

Selection changes that can trigger component updates:

- `plugin.managers.structure.selection` - Selection manager
- `selectThis(components)` - Selects specific components
- Selection-based modifications (union/subtract/intersect)

## 10. Helper Functions

Helper functions that modify component appearance:

- `setStructureOverpaint()` - Sets color overpaint
- `setStructureTransparency()` - Sets transparency
- `setStructureClipping()` - Sets clipping planes
- `setStructureSubstance()` - Sets material properties
- `setStructureEmissive()` - Sets emissive properties

## Key Observations

1. **Most modifications go through StructureComponentManager** - This is the primary API
2. **State tree operations are low-level** - Direct state modifications bypass manager APIs
3. **Presets can dramatically change components** - They can add/remove multiple components
4. **UI triggers most user-initiated changes** - Through button clicks and controls
5. **Behaviors can make autonomous changes** - Like focus representation updates

## Important Events for Tracking Component Changes

### State Events (`plugin.state.data.events`)
- `cell.stateUpdated` - Fired when cell state changes (visibility, etc.)
- `cell.created` - Fired when new cells are created (including components)
- `cell.removed` - Fired when cells are removed
- `object.updated` - Fired when objects are updated
- `object.created` - Fired when new objects are created
- `object.removed` - Fired when objects are removed
- `changed` - General state change event
- `historyUpdated` - When undo/redo history changes

### StructureComponentManager Events
- `optionsUpdated` - Fired when component rendering options change

### StructureHierarchyManager Behaviors
- `behaviors.selection` - BehaviorSubject that emits when selection changes

### StructureSelectionManager Events
- `events.changed` - When selection changes
- `events.additionsHistoryUpdated` - When selection history updates

## Recommendations for Hook Integration

To properly track component changes in our useComponents hook, we should:

1. **Subscribe to state events**:
   - `plugin.state.data.events.cell.created` - Track new components
   - `plugin.state.data.events.cell.removed` - Track removed components
   - `plugin.state.data.events.cell.stateUpdated` - Track visibility changes
   - `plugin.state.data.events.object.updated` - Track component updates

2. **Monitor hierarchy changes**:
   - `plugin.managers.structure.hierarchy.behaviors.selection` - Track structural changes

3. **Watch component manager**:
   - `plugin.managers.structure.component.events.optionsUpdated` - Track option changes

4. **Consider transaction boundaries**:
   - Many operations happen within `plugin.dataTransaction()` - changes may be batched

5. **Handle preset applications**:
   - Presets can completely rebuild component structure - may need full resync