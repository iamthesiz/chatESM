# useComponents

Hook for managing molecular structure components (proteins, ligands, water, ions) within the Molstar viewer. This allows you to add, remove, show/hide, and modify representations of different parts of the structure.

## Usage

```typescript
import { useComponents } from '../hooks/useComponents'

function ComponentsPanel() {
  const [components, manager] = useComponents('viewer-1')
  
  // Toggle visibility of a component
  const handleToggle = async (component) => {
    await manager.toggle(component)
  }
  
  // Add a new component
  const addLigands = async () => {
    await manager.add({
      selection: 'ligand',
      representation: 'ball-and-stick',
      label: 'Ligands'
    })
  }
  
  return (
    <div>
      {components.map(component => (
        <div key={component.ref}>
          <input
            type="checkbox"
            checked={component.isVisible}
            onChange={() => handleToggle(component)}
          />
          <span>{component.label} ({component.representation})</span>
        </div>
      ))}
      <button onClick={addLigands}>Add Ligands</button>
    </div>
  )
}
```

## API

### Return Value

Returns a tuple: `[components, manager]`

#### components array

Array of Component objects:

```typescript
interface Component {
  type: string          // 'protein', 'ligand', 'water', 'ion', 'nucleic', or 'custom'
  label: string         // Display name (e.g., "Polymer", "Ligand Component")
  representation: string // How it's displayed (e.g., "Cartoon", "Ball & Stick")
  isVisible: boolean    // Visibility state
  ref: string          // Unique reference ID in state tree
}
```

#### manager object

```typescript
interface ComponentsManager {
  loading: boolean
  add: (options: CreateComponentOptions) => Promise<void>
  toggle: (component: Component) => Promise<void>
  remove: (component: Component) => Promise<void>
  update: () => void
  setPreset: (options: SetPresetOptions) => Promise<void>
  show: (component: Component) => Promise<void>
  hide: (component: Component) => Promise<void>
  showAll: () => Promise<void>
  hideAll: () => Promise<void>
  clear: () => Promise<void>
}
```

### CreateComponentOptions

```typescript
interface CreateComponentOptions {
  selection: string       // Selection query (e.g., 'protein', 'ligand', 'water')
  representation?: string // Visual style (default: 'cartoon')
  label?: string         // Custom label
  checkExisting?: boolean // Check if component already exists
}
```

### SetPresetOptions

```typescript
interface SetPresetOptions {
  preset: string
  quality?: 'auto' | 'lowest' | 'lower' | 'low' | 'medium' | 'high' | 'higher' | 'highest'
  ignoreHydrogens?: boolean
  ignoreHydrogensVariant?: 'all' | 'non-polar'
}
```

## Examples

### Basic Component Management

```typescript
const [components, manager] = useComponents('mol-1')

// Add protein with cartoon representation
await manager.add({
  selection: 'protein',
  representation: 'cartoon',
  label: 'Protein'
})

// Add ligands with ball-and-stick
await manager.add({
  selection: 'ligand',
  representation: 'ball-and-stick',
  label: 'Ligands'
})

// Add water molecules
await manager.add({
  selection: 'water',
  representation: 'ball-and-stick',
  label: 'Water'
})
```

### Toggle Visibility

```typescript
// Toggle individual component
const proteinComponent = components.find(c => c.type === 'protein')
if (proteinComponent) {
  await manager.toggle(proteinComponent)
}

// Show/hide specific component
await manager.hide(proteinComponent)
await manager.show(proteinComponent)

// Show/hide all
await manager.hideAll()
await manager.showAll()
```

### Apply Representation Presets

```typescript
// Apply different visual presets
await manager.setPreset({ 
  preset: 'auto',
  quality: 'high'
})

await manager.setPreset({ 
  preset: 'illustrative',
  ignoreHydrogens: true
})
```

### Component List UI

```typescript
function ComponentsList() {
  const [components, manager] = useComponents('viewer-1')
  
  return (
    <div>
      <h3>Structure Components</h3>
      {components.map(comp => (
        <div key={comp.ref} style={{ padding: '5px' }}>
          <button onClick={() => manager.toggle(comp)}>
            {comp.isVisible ? '👁️' : '👁️‍🗨️'}
          </button>
          <span>{comp.label} - {comp.representation}</span>
          <button onClick={() => manager.remove(comp)}>❌</button>
        </div>
      ))}
      
      <div style={{ marginTop: '10px' }}>
        <button onClick={() => manager.showAll()}>Show All</button>
        <button onClick={() => manager.hideAll()}>Hide All</button>
        <button onClick={() => manager.clear()}>Clear All</button>
      </div>
    </div>
  )
}
```

### Selective Display

```typescript
// Show only protein and ligands
const showProteinAndLigands = async () => {
  for (const comp of components) {
    if (comp.type === 'protein' || comp.type === 'ligand') {
      await manager.show(comp)
    } else {
      await manager.hide(comp)
    }
  }
}

// Show only water within 5Å of ligands
await manager.add({
  selection: 'water and within 5 of ligand',
  representation: 'ball-and-stick',
  label: 'Water (near ligand)'
})
```

## Selection Queries

Common selection queries for adding components:

- `protein` - All protein chains
- `nucleic` - DNA/RNA chains
- `ligand` - Small molecules
- `water` - Water molecules
- `ion` - Ions (Na+, Cl-, etc.)
- `carbohydrate` - Sugar molecules
- `chain A` - Specific chain
- `resi 1-100` - Residue range
- `within 5 of ligand` - Within distance

## Representation Types

- `cartoon` - Ribbon/cartoon for proteins
- `ball-and-stick` - Balls for atoms, sticks for bonds
- `spacefill` - Space-filling spheres
- `surface` - Molecular surface
- `point` - Point cloud
- `putty` - Tube with variable radius
- `backbone` - Backbone trace

## Notes

- Components are automatically detected from loaded structures
- Multiple components can show the same selection with different representations
- Changes are applied immediately
- Component state is preserved when toggling visibility
- The manager handles both hierarchy-based and state-based components