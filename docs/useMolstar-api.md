# useMolstar API Reference

## Hook Signature

```typescript
function useMolstar(providedId?: string): [MoleculeInstance, Setters]
```

## MoleculeInstance

The molecule instance provides direct access to state and actions:

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `isInitialized` | `boolean` | Whether Molstar plugin is ready |
| `selections` | `string[]` | Current selection queries |
| `granularity` | `string` | Current selection granularity mode |
| `background` | `string` | Current background color |
| `lighting` | `string` | Current lighting preset |
| `quality` | `{ level: string }` | Current quality settings |
| `components` | `Component[]` | Active visual components |
| `availableComponents` | `string[]` | Component types in structure |
| `molstar` | `PluginUIContext` | Direct Molstar plugin access |
| `ref` | `RefObject<HTMLDivElement>` | Container element ref |

### Methods

#### `load(config: LoadConfig): Promise<void>`

Load a molecular structure with options.

```typescript
interface LoadConfig {
  // Source (one required)
  pdbId?: string
  url?: string  
  file?: File
  
  // Display
  preset?: 'default' | 'cartoon' | 'ball-and-stick' | 'surface'
  animate?: 'spin' | 'rock' | 'none'
  background?: string
  lighting?: 'bright' | 'soft' | 'dramatic' | 'off'
  quality?: 'low' | 'medium' | 'high'
  
  // Options
  hideNativeControls?: boolean
  autoZoom?: boolean
  showAxes?: boolean
}
```

#### `screenshot(options?: ScreenshotOptions): Promise<string | void>`

Capture the current view.

```typescript
interface ScreenshotOptions {
  copy?: boolean          // Copy to clipboard
  download?: boolean      // Auto-download
  filename?: string       // Custom filename
  resolution?: number     // 1, 2, 4 (multiplier)
  format?: 'png' | 'jpeg' | 'webp'
  quality?: number        // JPEG quality 0-100
  transparent?: boolean   // Transparent background
  axes?: boolean         // Show coordinate axes
  autocrop?: boolean     // Trim whitespace
}
```

#### Component Management

- `createComponent(selection, representation, label?, checkExisting?): Promise<void>`
- `toggleComponent(ref: string): Promise<void>`
- `removeComponent(ref: string): Promise<void>`
- `applyComponentPreset(preset: string): Promise<void>`

#### Camera Controls

- `resetZoom(): void`
- `resetCamera(): void`
- `center(): void`
- `focus(selection: string): void`
- `orientAxes(): void`
- `resetAxes(): void`

#### Presets

- `setStylePreset(preset: 'default' | 'illustrative' | 'publication' | 'performance'): Promise<void>`
- `setRepresentationPreset(preset: 'default' | 'cartoon' | 'spacefill' | 'surface'): Promise<void>`

## Setter Functions

### `setAppearance(config: AppearanceConfig): void`

Control visual appearance of the scene.

```typescript
interface AppearanceConfig {
  // Canvas
  background?: string
  lighting?: 'bright' | 'soft' | 'dramatic' | 'off'
  shadows?: boolean | { enabled: boolean, quality: 'low' | 'medium' | 'high' }
  fog?: boolean | { enabled: boolean, intensity: number }
  
  // Postprocessing
  postprocessing?: {
    lighten?: number       // 0-1
    darken?: number        // 0-1
    outline?: { on: boolean, params?: OutlineParams }
    occlusion?: { on: boolean, params?: OcclusionParams }
    shadow?: { on: boolean, params?: ShadowParams }
  }
  
  // Molecular styling
  protein?: { style?: string, color?: string, transparency?: number }
  ligand?: { style?: string, color?: string, transparency?: number }
  nucleic?: { style?: string, color?: string, transparency?: number }
  water?: { style?: string, color?: string, transparency?: number }
  ion?: { style?: string, color?: string, transparency?: number }
}
```

### `setCamera(config: CameraConfig): void`

Control camera position and behavior.

```typescript
interface CameraConfig {
  // Position
  position?: [number, number, number]
  target?: [number, number, number]
  zoom?: number
  view?: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'
  
  // Projection
  projection?: 'perspective' | 'orthographic'
  fov?: number  // Field of view (perspective only)
  
  // Animation
  animation?: 'off' | 'spin' | 'rock'
  
  // Clipping
  clipping?: {
    radius: number      // 0-99 (percentage visible)
    far: boolean        // Enable far plane
    minNear: number     // Minimum near distance
  }
  
  // Axes
  axes?: {
    opacity?: number
    scale?: number
    colors?: { x?: string, y?: string, z?: string }
  }
  
  // Stereo
  stereo?: {
    enabled: boolean
    eyeSeparation?: number
    focus?: number
  }
}
```

### `setSelection(config: SelectionConfig): void`

Manage molecular selections.

```typescript
interface SelectionConfig {
  // Operations (applied in order)
  set?: string         // Replace selection
  add?: string         // Add to selection
  remove?: string      // Remove from selection
  intersect?: string   // Keep intersection only
  clear?: boolean      // Clear all
  
  // Highlighting
  highlight?: {
    color?: string
    style?: 'outline' | 'glow' | 'brighten'
    intensity?: number     // 0-1
    thickness?: number     // For outline
  }
  
  // Behavior
  preferAtoms?: boolean    // Prefer atoms over bonds
  autoFocus?: boolean      // Auto-focus on selection
  showLabels?: boolean     // Show residue labels
}
```

### `setGranularity(mode: string): void`

Set what gets selected on click.

Options:
- `'atom'` - Individual atoms
- `'residue'` - Entire residues
- `'chain'` - Entire chains
- `'entity'` - Entire entities
- `'model'` - Entire models
- `'structure'` - Entire structure

### `setQuality(config: QualitySettings): void`

Fine-tune rendering quality and performance.

```typescript
interface QualitySettings {
  level?: 'high' | 'medium' | 'low'
  antialiasing?: boolean
  
  shadows?: {
    enabled: boolean
    quality: 'low' | 'medium' | 'high'
    steps?: number
  }
  
  occlusion?: boolean | {
    enabled: boolean
    samples?: number
    radius?: number
    bias?: number
    multiScale?: {
      enabled: boolean
      levels?: Array<{ radius: number, blur: number }>
    }
  }
  
  postprocessing?: {
    blur?: boolean | DofSettings
    sharpening?: boolean
    outline?: { enabled: boolean, scale: number }
  }
  
  performance?: {
    maxFps?: number
    adaptiveQuality?: boolean
    levelOfDetail?: boolean
  }
}
```

## Selection Query Language

useMolstar supports various selection syntaxes:

### Built-in Selections
- `'protein'` - All protein residues
- `'ligand'` - Non-standard residues
- `'water'` - Water molecules
- `'ion'` - Ions
- `'nucleic'` - DNA/RNA

### Structure Properties
- `'helix'` - Alpha helices
- `'sheet'` - Beta sheets
- `'coil'` - Random coils
- `'backbone'` - Backbone atoms
- `'sidechain'` - Sidechain atoms

### Specific Selections
- `'chain A'` - Specific chain
- `'residue 50'` - Specific residue
- `'residue 50-100'` - Residue range
- `'chain A and residue 50-100'` - Combined

### Advanced Selections
- `'within 5 of ligand'` - Within distance
- `'aromatic'` - Aromatic residues
- `'charged'` - Charged residues
- `'polar'` - Polar residues

## Component Types

When creating components, use these representation types:

- `'cartoon'` - Ribbon/cartoon for proteins
- `'ball-and-stick'` - Balls and sticks
- `'spacefill'` - Space-filling spheres
- `'surface'` - Molecular surface
- `'line'` - Simple lines
- `'backbone'` - Backbone trace
- `'gaussian-surface'` - Gaussian surface

## Style Presets

### Default
Standard visualization with soft lighting and no effects.

### Illustrative
Non-photorealistic rendering with outlines, no shadows, flat lighting.

### Publication
High-quality rendering with subtle outlines, ideal for figures.

### Performance
Optimized for speed with minimal effects.

## Error Handling

All async methods throw errors that should be caught:

```typescript
try {
  await molecule.load({ pdbId: 'INVALID' })
} catch (error) {
  console.error('Failed to load structure:', error)
}
```

## Performance Tips

1. **Batch Updates**: Combine multiple appearance changes into one call
2. **Use Presets**: Start with presets and customize only what's needed
3. **Limit Components**: Too many components can slow rendering
4. **Quality Settings**: Use lower quality for interactive work
5. **Disable Effects**: Turn off shadows/occlusion for better performance

## TypeScript Support

Full TypeScript definitions are included. Import types as needed:

```typescript
import type { 
  LoadConfig,
  ScreenshotOptions,
  AppearanceConfig,
  CameraConfig,
  SelectionConfig,
  QualitySettings 
} from './hooks/types'
```