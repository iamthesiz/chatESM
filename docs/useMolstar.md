# useMolstar

The core hook for managing Molstar viewer instances. This hook handles the lifecycle of a Molstar plugin instance including initialization, loading structures, and cleanup.

## Usage

```typescript
import { useMolstar } from '../hooks/useMolstar'

function MyComponent() {
  const molstar = useMolstar('viewer-1')
  
  // Load a structure
  useEffect(() => {
    if (molstar.initialized && !molstar.loaded) {
      molstar.load({ pdbId: '1CRN' })
    }
  }, [molstar.initialized, molstar.loaded])
  
  return <div ref={molstar.for} />
}
```

## API

### Parameters

- `id: string` - Unique identifier for the Molstar instance
- `typeId?: string` - Optional type identifier for debugging

### Return Value

The hook returns an object with the following properties:

#### State Properties
- `loading: boolean` - Whether the viewer is currently loading
- `loaded: boolean` - Whether a structure has been loaded
- `mounted: boolean` - Whether the DOM element is mounted
- `initialized: boolean` - Whether Molstar plugin is initialized

#### Methods
- `load(options: LoadOptions)` - Load a molecular structure
- `draw()` - Force a redraw of the canvas

#### References
- `ref: HTMLDivElement | null` - Direct reference to the container element
- `for: RefCallback` - Ref callback to attach to the container element

#### Molstar Properties
- `canvas` - Canvas3D instance
- `camera` - Camera controller
- `hierarchy` - Structure hierarchy manager
- `selection` - Selection manager
- `axes` - Axes helper configuration
- `busy` - Whether Molstar is busy processing

### LoadOptions

```typescript
interface LoadOptions {
  pdbId?: string    // 4-character PDB ID (e.g., '1CRN')
  url?: string      // URL to structure file
  format?: 'pdb' | 'cif' | 'mmcif' | 'sdf' | 'mol' | 'mol2'
}
```

## Global State Management

The `useMolstar` hook uses a global state system, which means **any component in your app can access the same Molstar instance by using the same ID**. This enables powerful patterns for controlling the viewer from different parts of your application.

### Example: Shared Instance Across Components

```typescript
// MoleculeViewer.tsx - The main viewer component
function MoleculeViewer() {
  const molstar = useMolstar('main-viewer')
  
  useEffect(() => {
    if (molstar.initialized && !molstar.loaded) {
      molstar.load({ pdbId: '7D3T' })
    }
  }, [molstar.initialized, molstar.loaded])
  
  return <div ref={molstar.for} style={{ width: '100%', height: '600px' }} />
}

// BackgroundControls.tsx - Background controls in sidebar
import { useBackground } from '../hooks/useBackground'

function BackgroundControls() {
  const [background, setBackground] = useBackground('main-viewer') // Same ID
  
  return (
    <div>
      <button onClick={() => setBackground('white')}>White</button>
      <button onClick={() => setBackground('black')}>Black</button>
      <button onClick={() => setBackground('#f0f0f0')}>Gray</button>
      <button onClick={() => setBackground('transparent')}>Transparent</button>
    </div>
  )
}

// CameraControls.tsx - Camera controls in toolbar
import { useCamera } from '../hooks/useCamera'

function CameraControls() {
  const [camera, setCamera] = useCamera('main-viewer') // Same ID
  
  return (
    <div>
      <button onClick={() => camera.reset()}>Reset View</button>
      <button onClick={() => setCamera({ animation: { type: 'spin' } })}>
        Start Spin
      </button>
    </div>
  )
}

// StatusBar.tsx - Status display in header
function StatusBar() {
  const molstar = useMolstar('main-viewer') // Same ID = same instance
  
  return (
    <div>
      Status: {molstar.loading ? 'Loading...' : molstar.loaded ? 'Ready' : 'Empty'}
    </div>
  )
}

// App.tsx - All components share the same Molstar instance
function App() {
  return (
    <div>
      <StatusBar />
      <div style={{ display: 'flex' }}>
        <BackgroundControls />
        <MoleculeViewer />
        <CameraControls />
      </div>
    </div>
  )
}
```

### Benefits of Global State

1. **Separation of Concerns**: UI controls can be placed anywhere in your app
2. **No Prop Drilling**: No need to pass Molstar instance through component trees
3. **Multiple Views**: Can create inspector panels, toolbars, etc. that all control the same viewer
4. **Consistent State**: All components see the same loading/loaded state

### Multiple Independent Viewers

You can also create multiple independent viewers by using different IDs:

```typescript
function ComparisonView() {
  const viewer1 = useMolstar('protein-1')
  const viewer2 = useMolstar('protein-2')
  
  useEffect(() => {
    viewer1.load({ pdbId: '1CRN' })
    viewer2.load({ pdbId: '1UBQ' })
  }, [])
  
  return (
    <div style={{ display: 'flex' }}>
      <div ref={viewer1.for} style={{ flex: 1 }} />
      <div ref={viewer2.for} style={{ flex: 1 }} />
    </div>
  )
}
```

## Examples

### Basic Usage

```typescript
const molstar = useMolstar('my-viewer')

// Attach to DOM
<div ref={molstar.for} style={{ width: '100%', height: '500px' }} />
```

### Loading from PDB

```typescript
molstar.load({ pdbId: '7D3T' })
```

### Loading from URL

```typescript
molstar.load({ 
  url: 'https://files.rcsb.org/download/1CRN.cif',
  format: 'mmcif'
})
```

### Auto-loading

If the ID parameter is a valid PDB ID or URL, the structure will be auto-loaded:

```typescript
// This will auto-load PDB structure 1CRN
const molstar = useMolstar('1CRN')

// This will auto-load from URL
const molstar = useMolstar('https://example.com/structure.pdb')
```

## Notes

- The hook manages the full lifecycle including cleanup on unmount
- State is preserved across component unmounts/remounts with the same ID
- The viewer is initialized with hidden native controls by default
- Uses Molstar's light theme
- The last component to unmount with a given ID will clean up the Molstar instance