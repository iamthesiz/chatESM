# useSequence

Hook for accessing and manipulating molecular sequence data, including residue selection and chain information.

## Usage

```typescript
import { useSequence } from '../hooks/useSequence'

function SequenceViewer() {
  const [sequence, setSequence] = useSequence('viewer-1')
  
  // Select specific residues
  const handleSelectRange = () => {
    setSequence({
      chain: 'A',
      residues: sequence.residues?.map((res, i) => ({
        ...res,
        selected: i >= 10 && i <= 20
      }))
    })
  }
  
  return (
    <div>
      <h3>Chain: {sequence.chain}</h3>
      <div>
        {sequence.residues?.map(res => (
          <span
            key={res.index}
            style={{ 
              color: res.selected ? 'red' : 'black',
              cursor: 'pointer'
            }}
            onClick={() => /* toggle selection */}
          >
            {res.code}
          </span>
        ))}
      </div>
    </div>
  )
}
```

## API

### Return Value

Returns a tuple: `[sequence, setSequence]`

#### sequence object

```typescript
interface SequenceState {
  loading: boolean
  mode: SelectionMode
  residues: Residue[] | null
  structure: string | null
  structures: Structure[]
  entity: string | null
  entities: Entity[]
  chain: string | null
  chains: Chain[]
  instance: any | null
  instances: any[]
}
```

#### Types

```typescript
interface Residue {
  index: number
  code: string      // One-letter code (A, C, G, T, etc.)
  name: string      // Three-letter code (ALA, CYS, etc.)
  seqId: number     // Sequence ID in the structure
  chainId: string
  selected: boolean
}

interface Chain {
  id: string
  label: string
  entityId: string
}

interface Entity {
  id: string
  label: string
  type?: string
}

interface Structure {
  id: string
  label: string
}

type SelectionMode = 'chain' | 'polymers' | 'everything'
```

## Examples

### Display Sequence

```typescript
const [sequence] = useSequence('mol-1')

return (
  <div>
    {sequence.residues?.map(res => (
      <span key={res.index} title={res.name}>
        {res.code}
      </span>
    ))}
  </div>
)
```

### Chain Selection

```typescript
const [sequence, setSequence] = useSequence('mol-1')

// Switch chains
const handleChainChange = (chainId: string) => {
  setSequence({ chain: chainId })
}

return (
  <select value={sequence.chain} onChange={e => handleChainChange(e.target.value)}>
    {sequence.chains.map(chain => (
      <option key={chain.id} value={chain.id}>
        Chain {chain.label}
      </option>
    ))}
  </select>
)
```

### Residue Selection

```typescript
// Select residues 50-100
const selectRange = (start: number, end: number) => {
  setSequence({
    residues: sequence.residues?.map(res => ({
      ...res,
      selected: res.seqId >= start && res.seqId <= end
    }))
  })
}

// Toggle single residue
const toggleResidue = (index: number) => {
  setSequence({
    residues: sequence.residues?.map((res, i) => ({
      ...res,
      selected: i === index ? !res.selected : res.selected
    }))
  })
}
```

### Selection Modes

```typescript
// Change what gets selected
setSequence({ mode: 'polymers' }) // Only proteins/nucleotides
setSequence({ mode: 'everything' }) // All atoms
setSequence({ mode: 'chain' }) // Current chain only
```

### Working with Structures

```typescript
// Multiple structures loaded
if (sequence.structures.length > 1) {
  return (
    <div>
      {sequence.structures.map(struct => (
        <button
          key={struct.id}
          onClick={() => setSequence({ structure: struct.id })}
        >
          {struct.label}
        </button>
      ))}
    </div>
  )
}
```

## Color Coding

The hook automatically maps three-letter codes to one-letter codes:

- Standard amino acids: A, R, N, D, C, Q, E, G, H, I, L, K, M, F, P, S, T, W, Y, V
- Non-standard: U (SEC), O (PYL)
- Nucleotides: A, C, G, T, U
- Ions: ● (metals)
- Water: ○
- Ligands: ◆ (ATP, GTP, etc.)
- Unknown: X

## Notes

- Sequence data is automatically extracted when a structure loads
- Selection state is synchronized with the 3D viewer
- Supports multiple chains and entities
- Handles both protein and nucleotide sequences
- Updates trigger visual selection in the viewer