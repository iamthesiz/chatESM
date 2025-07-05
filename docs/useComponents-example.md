# useComponents Hook Example

The `useComponents` hook provides a clean API for managing molecular components separately from the main useMolstar hook.

## Basic Usage

```tsx
import { useMolstar } from '../hooks/useMolstar'
import useComponents from '../hooks/useComponents'

function MyMolecule() {
  const [molecule] = useMolstar('my-viewer')
  const components = useComponents('my-viewer') // Same ID as useMolstar
  
  useEffect(() => {
    molecule.load({ pdbId: '1AON' })
  }, [])
  
  if (components.loading) {
    return <div>Loading components...</div>
  }
  
  return (
    <>
      <div ref={molecule.ref} style={{ height: 500 }} />
      
      {/* List current components */}
      <div>
        {components.list.map(comp => (
          <div key={comp.ref}>
            {comp.label} ({comp.type}) - {comp.representation}
            <button onClick={() => components.toggle(comp)}>
              {comp.isVisible ? 'Hide' : 'Show'}
            </button>
            <button onClick={() => components.remove(comp)}>
              Remove
            </button>
          </div>
        ))}
      </div>
      
      {/* Add new component */}
      <button onClick={() => components.create('ligand', 'ball-and-stick', 'Ligands')}>
        Add Ligand Component
      </button>
    </>
  )
}
```

## API Reference

### Component Object Structure

```typescript
interface Component {
  type: string          // 'protein', 'ligand', 'water', 'ion', 'nucleic', or 'custom'
  label: string         // Display name (e.g., "Polymer", "Ligand Component")
  representation: string // How it's displayed (e.g., "Cartoon", "Ball & Stick")
  isVisible: boolean    // Visibility state
  ref: string          // Unique reference ID (e.g., "i8mudm86t")
}
```

Example component object:
```json
{
  "type": "protein",
  "label": "Polymer",
  "representation": "Cartoon",
  "isVisible": true,
  "ref": "i8mudm86t"
}
```

### Properties

- **`components.list`** - Array of current components
- **`components.loading`** - Boolean indicating if Molstar instance is ready

### Methods

- **`components.create(selection, representation?, label?, checkExisting?)`** - Create new component
- **`components.toggle(component)`** - Toggle visibility
- **`components.remove(component)`** - Remove component
- **`components.find(predicate)`** - Find single component
- **`components.findAll(predicate)`** - Find all matching components
- **`components.show(component)`** - Show component
- **`components.hide(component)`** - Hide component
- **`components.showAll()`** - Show all components
- **`components.hideAll()`** - Hide all components
- **`components.clear()`** - Remove all components
- **`components.applyPreset(preset)`** - Apply representation preset
- **`components.update()`** - Manually update component list

## Advanced Examples

### Loading State Management

```tsx
function ComponentControls() {
  const components = useComponents('viewer')
  
  // Guard against operations when loading
  const handleHideAllWater = async () => {
    if (components.loading) return
    
    const waters = components.findAll(c => c.type === 'water')
    for (const water of waters) {
      await components.hide(water)
    }
  }
  
  return (
    <div>
      <button 
        onClick={handleHideAllWater}
        disabled={components.loading}
      >
        Hide Water {components.loading && '(Loading...)'}
      </button>
      
      {!components.loading && (
        <div>Total components: {components.list.length}</div>
      )}
    </div>
  )
}
```

### Component Filtering

```tsx
// Find all protein components
const proteins = components.findAll(c => c.type === 'protein')

// Find invisible components
const hidden = components.findAll(c => !c.isVisible)

// Find by representation
const cartoons = components.findAll(c => c.representation === 'Cartoon')
```

### Batch Operations

```tsx
// Hide all water molecules
const waters = components.findAll(c => c.type === 'water')
for (const water of waters) {
  await components.hide(water)
}

// Change all ligands to spacefill
const ligands = components.findAll(c => c.type === 'ligand')
for (const ligand of ligands) {
  await components.remove(ligand)
  await components.create('ligand', 'spacefill', ligand.label)
}
```

### Dynamic Component Management

```tsx
function ComponentManager() {
  const components = useComponents('viewer')
  const [selectedType, setSelectedType] = useState('all')
  
  const filteredComponents = selectedType === 'all' 
    ? components.list 
    : components.list.filter(c => c.type === selectedType)
  
  return (
    <div>
      <select onChange={e => setSelectedType(e.target.value)}>
        <option value="all">All</option>
        <option value="protein">Protein</option>
        <option value="ligand">Ligand</option>
        <option value="water">Water</option>
      </select>
      
      {filteredComponents.map(comp => (
        <ComponentRow key={comp.ref} component={comp} />
      ))}
    </div>
  )
}
```

## Why Separate Hooks?

1. **Separation of Concerns** - Components logic is separate from core Molstar functionality
2. **Reusability** - Can use components in different parts of your app without the full molecule instance
3. **Performance** - Component updates don't trigger re-renders of the entire molecule instance
4. **Extensibility** - Easy to add new component-specific features without bloating useMolstar