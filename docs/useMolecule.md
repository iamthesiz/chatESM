# useMolecule

A high-level hook that wraps useMolstar and provides additional functionality for molecular visualization including appearance controls, camera management, and structure manipulation.

## Usage

```typescript
import { useMolecule } from '../hooks/useMolecule'

function MoleculeViewer() {
  const [molecule, setters] = useMolecule('viewer-1')
  
  // Load structure with configuration
  useEffect(() => {
    if (molecule?.initialized && !molecule.loaded) {
      molecule.load({
        pdbId: '7D3T',
        preset: 'default',
        quality: 'medium',
        background: 'white',
        lighting: 'soft',
        protein: {
          style: 'cartoon',
          color: 'chain-id'
        }
      })
    }
  }, [molecule?.initialized, molecule.loaded])
  
  return <div ref={molecule?.for} />
}
```

## API

### Return Value

Returns a tuple: `[molecule, setters]`

#### molecule object

Extends all properties from `useMolstar` plus:

- `screenshot(options?)` - Take a screenshot
- `copyScreenshot(options?)` - Copy screenshot to clipboard  
- `downloadScreenshot(options?)` - Download screenshot
- `fullscreen()` - Toggle fullscreen mode
- `resetZoom()` - Reset camera zoom
- `resetCamera()` - Reset camera position
- `orientAxes()` - Orient to axes view
- `focusSelection(selection)` - Focus camera on selection
- `clearSelection()` - Clear current selection
- `selectAll()` - Select all atoms
- `hideNativeControls()` - Hide native Molstar controls
- `showNativeControls()` - Show native Molstar controls
- `background` - Current background color

#### setters object

- `setAppearance(config)` - Set visual appearance
- `setCamera(config)` - Configure camera
- `setQuality(config)` - Set rendering quality
- `setSelection(config)` - Update selection
- `setGranularity(level)` - Set representation granularity
- `setStylePreset(preset)` - Apply style preset
- `setRepresentationPreset(preset)` - Apply representation preset
- `setRenderer(config)` - Configure renderer
- `setShadow(config)` - Configure shadows
- `setFog(config)` - Configure fog effect
- `setBackground(color)` - Set background color

### LoadConfig

```typescript
interface LoadConfig {
  pdbId?: string
  url?: string
  format?: string
  preset?: 'default' | 'illustrative' | 'stylized'
  quality?: 'auto' | 'high' | 'medium' | 'low'
  background?: string
  lighting?: 'flat' | 'matte' | 'glossy' | 'metallic' | 'plastic' | 'soft'
  animate?: 'off' | 'spin' | 'rock'
  protein?: {
    style?: 'cartoon' | 'ball-and-stick' | 'carbohydrate' | 'ellipsoid' | 'gaussian-surface' | 'molecular-surface' | 'point' | 'putty' | 'spacefill'
    color?: 'chain-id' | 'entity-id' | 'model-index' | 'structure-index' | 'sequence-id' | 'uniform'
  }
  hideNativeControls?: boolean
  autoZoom?: boolean
}
```

## Examples

### Basic Setup

```typescript
const [molecule, { setBackground, setQuality }] = useMolecule('mol-1')

// Change background
setBackground('#f0f0f0')

// Set quality
setQuality({ level: 'high' })
```

### Screenshots

```typescript
// Take screenshot with transparent background
await molecule.screenshot({ 
  transparent: true,
  format: 'png'
})

// Download screenshot
await molecule.downloadScreenshot({
  filename: 'molecule.png',
  format: 'png',
  resolution: 2 // 2x resolution
})
```

### Visual Presets

```typescript
// Apply illustrative style
setters.setStylePreset('illustrative')

// Change representation
setters.setRepresentationPreset('ball-and-stick')
```

### Camera Control

```typescript
// Animate camera
setters.setCamera({
  animation: 'spin',
  speed: 0.5
})

// Reset view
molecule.resetCamera()
```

### Selection

```typescript
// Select by chain
setters.setSelection({
  mode: 'chain',
  chains: ['A', 'B']
})

// Focus on selection
molecule.focusSelection()
```

## Style Presets

- `default` - Standard molecular visualization
- `illustrative` - Publication-quality rendering with outlines
- `stylized` - Artistic rendering with enhanced edges

## Representation Types

- `cartoon` - Ribbon/cartoon for proteins
- `ball-and-stick` - Balls for atoms, sticks for bonds
- `spacefill` - Space-filling spheres
- `molecular-surface` - Molecular surface
- `gaussian-surface` - Gaussian density surface
- `point` - Point cloud
- `putty` - Tube with variable radius