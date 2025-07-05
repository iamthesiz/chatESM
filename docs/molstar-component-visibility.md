# Molstar Component Visibility Implementation

## Overview
Molstar handles component visibility through a combination of state management and UI controls. Here's how it works internally:

## Key Components

### 1. Component Types
Molstar defines static structure component types in `/mol-plugin-state/helpers/structure-component.js`:

```javascript
export const StaticStructureComponentTypes = [
    'all',
    'polymer',
    'protein',
    'nucleic',
    'water',
    'ion',
    'lipid',
    'branched',
    'ligand',
    'non-standard',
    'coarse'
];
```

### 2. Core Visibility Function
The main function for controlling visibility is `setSubtreeVisibility` in `/mol-plugin/behavior/static/state.js`:

```javascript
export function setSubtreeVisibility(state, root, value) {
    StateTree.doPreOrder(state.tree, state.transforms.get(root), { state, value }, setVisibilityVisitor);
}

function setVisibilityVisitor(t, tree, ctx) {
    ctx.state.updateCellState(t.ref, { isHidden: ctx.value });
}
```

This function:
- Takes a state tree node reference and a boolean value
- Traverses the subtree and sets `isHidden` property on all nodes
- `true` means hidden, `false` means visible

### 3. UI Implementation
In the structure components UI (`/mol-plugin-ui/structure/components.js`), each component has:

```javascript
toggleVisible = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSubtreeVisibility(this.plugin.state.data, this.ref, !cell.state.isHidden);
}
```

The UI shows a visibility icon that toggles between:
- `VisibilityOutlinedSvg` (eye icon) when visible
- `VisibilityOffOutlinedSvg` (crossed eye icon) when hidden

### 4. Creating Components
Components are created using presets in `/mol-plugin-state/builder/structure/representation-preset.js`:

```javascript
const components = {
    polymer: await presetStaticComponent(plugin, structureCell, 'polymer'),
    ligand: await presetStaticComponent(plugin, structureCell, 'ligand'),
    water: await presetStaticComponent(plugin, structureCell, 'water'),
    ion: await presetStaticComponent(plugin, structureCell, 'ion'),
    // ... etc
};
```

### 5. State Tree Structure
Molstar uses a hierarchical state tree where:
- Each structure has child components (polymer, ligand, water, etc.)
- Each component has child representations (cartoon, ball-and-stick, etc.)
- Visibility is controlled at any level and propagates to children

## Usage Example

To programmatically hide/show components:

```javascript
import { setSubtreeVisibility } from 'molstar/lib/mol-plugin/behavior/static/state';

// Hide a component
setSubtreeVisibility(plugin.state.data, componentRef, true);

// Show a component
setSubtreeVisibility(plugin.state.data, componentRef, false);
```

To find component references:
```javascript
// Get all state tree nodes
const cells = plugin.state.data.cells;

// Find components by traversing the tree
for (const [ref, cell] of cells) {
    if (cell.obj?.label === 'Water' || cell.obj?.label === 'Ligand') {
        // This is a water or ligand component
        const componentRef = ref;
    }
}
```

## Implementation Notes

1. **isHidden Property**: The visibility state is stored in `cell.state.isHidden`
2. **Subtree Behavior**: Hiding a parent hides all children
3. **Performance**: The state update triggers re-renders only for affected components
4. **Persistence**: Visibility state can be saved/restored with snapshots

## Related Files
- `/mol-plugin/behavior/static/state.js` - Core visibility functions
- `/mol-plugin-ui/structure/components.js` - UI implementation
- `/mol-plugin-state/helpers/structure-component.js` - Component type definitions
- `/mol-plugin-state/builder/structure/representation-preset.js` - Component creation