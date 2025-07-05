# Multi-Molecule API Design

## Overview
This document outlines the API design for loading and managing multiple molecules in a single Molstar canvas.

## Core API - Composable Approach

```typescript
// Parent component manages the list
const [molecules, setMolecules] = useMolecules()

// Render each molecule with its own component
return (
  <div>
    <div ref={molstar.ref} style={{ height: 500 }} />
    {molecules.map(molecule => (
      <MoleculeControls key={molecule.id} id={molecule.id} />
    ))}
  </div>
)

// Each molecule component uses useMolecule
const MoleculeControls = ({ id }) => {
  const [molecule, setMolecule] = useMolecule(id)
  
  return (
    <div>
      <h3>{molecule.label || id}</h3>
      <button onClick={() => molecule.hide()}>Hide</button>
      <button onClick={() => molecule.focus()}>Focus</button>
    </div>
  )
}
```

### Key Features
- **Async `setMolecules`**: Returns a promise that resolves when molecules are loaded
- **Type-based auto-fetching**: Strings trigger automatic fetching, objects are treated as configured
- **Array-based state**: Familiar React pattern with array methods

## Usage Examples

### Basic Usage
```typescript
// Simple PDB IDs - auto-fetch from RCSB
await setMolecules(['1AON', '2HHB', '3PQR'])

// Wait for load completion before next action
await setMolecules(['1AON', '2HHB'])
canvas.centerAll() // Only works after molecules are loaded
```

### Mixed Input Types
```typescript
await setMolecules([
  '1AON',                                    // PDB ID → auto-fetch
  { id: 'target', pdb: '2HHB' },            // Custom ID with PDB
  { id: 'ligand', smiles: 'CCO' },          // Generate from SMILES
  { id: 'upload-1', file: uploadedFile },    // File upload
  { id: 'model', url: '/models/predicted.pdb' }, // URL fetch
  { id: 'alphafold', source: 'AF-P04637-F1' }  // AlphaFold structure
])
```

### Array Operations
```typescript
// Add a molecule
await setMolecules(prev => [...prev, '4XYZ'])

// Remove by ID
await setMolecules(prev => prev.filter(m => m.id !== 'target'))

// Update specific molecule
await setMolecules(prev => prev.map(m => 
  m.id === 'target' ? { ...m, color: 'blue' } : m
))

// Clear all
await setMolecules([])
```

### Composable Pattern - Preferred Approach

```typescript
// App component
function MoleculeViewer() {
  const [molecules, setMolecules] = useMolecules()
  const molstar = useMolstar('viewer-1')
  
  return (
    <div>
      <div ref={molstar.ref} style={{ height: 500 }} />
      
      <button onClick={() => setMolecules(['1AON', '2HHB', '3PQR'])}>
        Load Examples
      </button>
      
      <div className="molecule-list">
        {molecules.map(({ id }) => (
          <MoleculeCard key={id} id={id} />
        ))}
      </div>
    </div>
  )
}

// Individual molecule component
function MoleculeCard({ id }: { id: string }) {
  const [molecule] = useMolecule(id)
  
  if (molecule.loading) return <div>Loading {id}...</div>
  if (molecule.error) return <div>Error loading {id}</div>
  
  return (
    <div className="molecule-card">
      <h3>{molecule.label || id}</h3>
      <p>{molecule.residueCount} residues</p>
      
      <button onClick={() => molecule.hide()}>
        {molecule.visible ? 'Hide' : 'Show'}
      </button>
      <button onClick={() => molecule.focus()}>Focus</button>
      <button onClick={() => molecule.setRepresentation('cartoon')}>Cartoon</button>
      <button onClick={() => molecule.setRepresentation('surface')}>Surface</button>
    </div>
  )
}
```

## Molecule List Item Interface

The `useMolecules` hook returns a simplified array:

```typescript
interface MoleculeListItem {
  id: string              // Unique identifier
  label?: string          // Display name
  source: string | MoleculeSource  // What to load
}

type MoleculeSource = {
  pdb?: string
  url?: string
  file?: File
  smiles?: string
  data?: string
  emdb?: string
  alphafold?: string
}

## Advanced Patterns

### Sequential Loading with Dependencies
```typescript
// Load protein first
const proteins = await setMolecules(['1AON'])

// Extract ligand info from loaded protein
const ligandIds = proteins[0].getLigandIds()

// Load ligands
await setMolecules(prev => [
  ...prev,
  ...ligandIds.map(id => ({
    id: `ligand-${id}`,
    source: { pdb: id },
    representation: 'ball-and-stick'
  }))
])
```

### Error Handling
```typescript
try {
  await setMolecules(['1AON', 'INVALID_ID', '2HHB'])
} catch (errors) {
  // Partial failure - some molecules may have loaded
  console.error('Failed to load:', errors)
  
  // Check what loaded successfully
  molecules.forEach(mol => {
    if (mol.status === 'error') {
      console.log(`${mol.id} failed:`, mol.error)
    }
  })
}
```

### Loading UI Pattern
```typescript
const [isLoading, setIsLoading] = useState(false)

const loadMolecules = async (ids: string[]) => {
  setIsLoading(true)
  try {
    await setMolecules(ids)
    toast.success('All molecules loaded!')
  } catch (error) {
    toast.error('Some molecules failed to load')
  } finally {
    setIsLoading(false)
  }
}
```

## ID Generation Rules

1. **PDB strings**: Use the PDB ID as the molecule ID
   - `'1AON'` → `{ id: '1AON', source: { pdb: '1AON' } }`

2. **Objects with ID**: Use provided ID
   - `{ id: 'my-mol', pdb: '1AON' }` → `{ id: 'my-mol', ... }`

3. **Objects without ID**: Generate from source
   - `{ pdb: '1AON' }` → `{ id: '1AON', ... }`
   - `{ url: '/file.pdb' }` → `{ id: 'mol-1', ... }` (incremental)
   - `{ smiles: 'CCO' }` → `{ id: 'mol-2', ... }` (incremental)

## Implementation Notes

- The `setMolecules` function is synchronous but returns a Promise for load completion
- Molecules are loaded in parallel when possible
- State updates happen immediately (optimistic updates)
- Load failures don't prevent other molecules from loading (graceful degradation)
- Each molecule maintains its own Molstar structure object
- All molecules share the same canvas/viewport

## Future Considerations

- Molecule alignment tools (superposition)
- Batch operations (set all representations at once)
- Molecule groups/collections
- Animation between states
- Density map support
- Trajectory playback