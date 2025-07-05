# Multi-Molecule API Design

## Overview
This document outlines the API design for loading and managing multiple molecules in a single Molstar canvas.

## Core API

```typescript
const [molecules, setMolecules] = useMolecules(canvasId)
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

### Accessing Molecules
```typescript
// By index
molecules[0].setRepresentation('cartoon')
molecules[1].hide()

// Find by ID
const target = molecules.find(m => m.id === 'target')
target?.setColor('red')

// Iterate
molecules.forEach(mol => mol.setOpacity(0.8))

// Check count
if (molecules.length > 0) {
  // Has molecules
}
```

## Molecule Object Interface

```typescript
interface Molecule {
  // Identification
  id: string              // Unique identifier ('1AON' or 'custom-id')
  label?: string          // Display name
  
  // Source information
  source: {
    pdb?: string         // PDB ID
    url?: string         // Remote URL
    file?: File          // Uploaded file
    smiles?: string      // SMILES string
    data?: string        // Raw PDB/mmCIF data
    emdb?: string        // EMDB ID
    alphafold?: string   // AlphaFold ID
  }
  
  // State
  status: 'loading' | 'loaded' | 'error'
  error?: Error
  
  // Methods
  setRepresentation(type: 'cartoon' | 'surface' | 'ball-and-stick' | ...): void
  setColor(color: string | ColorTheme): void
  setOpacity(value: number): void
  show(): void
  hide(): void
  focus(): void
  remove(): void
  
  // Selection
  select(selection: Selection): void
  clearSelection(): void
  
  // Properties
  readonly boundingBox: Box3D
  readonly residueCount: number
  readonly chainCount: number
}
```

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