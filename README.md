# Molstar React Hooks 🧬

A comprehensive collection of React hooks for integrating and controlling [Molstar](https://molstar.org/) molecular visualization in your React applications.

## 🚀 Getting Started

```bash
yarn add molstar-react-hooks
```

```typescript
import { useMolstar, useMolecule } from 'molstar-react-hooks'

function MoleculeViewer() {
  const molstar = useMolstar('viewer-1')
  const [molecule, setMolecule] = useMolecule('viewer-1')
  
  return (
    <div ref={molstar.ref} style={{ width: '100%', height: '500px' }}>
      {molecule.loading && <div>Loading structure...</div>}
    </div>
  )
}
```

## 📚 Available Hooks

<details>
<summary><b>🎯 useMolstar</b> - Core hook for managing Molstar instances</summary>

The foundation hook that creates and manages Molstar viewer instances. Provides global state management allowing any component to access the same Molstar instance by ID.

```typescript
const molstar = useMolstar('viewer-1')
// Access from anywhere in your app with the same ID
```

**Key Features:**
- Global state management - access the same instance from any component
- Automatic initialization and cleanup
- Direct access to Molstar plugin API
- TypeScript support with full type safety

[📖 Full Documentation](docs/useMolstar.md)
</details>

<details>
<summary><b>🧬 useMolecule</b> - High-level molecular visualization</summary>

Simplified API for loading and controlling molecular structures. Handles PDB IDs, URLs, and direct data loading with automatic format detection.

```typescript
const [molecule, setMolecule] = useMolecule('viewer-1')
await molecule.load('1tqn') // Load from PDB
await molecule.zoomToFit()
await molecule.screenshot({ download: true })
```

**Key Features:**
- Load structures from PDB, URLs, or files
- Built-in loading states and error handling
- Screenshot and export functionality
- Simplified component management

[📖 Full Documentation](docs/useMolecule.md)
</details>

<details>
<summary><b>📷 useCamera</b> - Camera position and animation control</summary>

Control camera position, rotation, zoom, and create smooth camera animations. Perfect for creating cinematic molecular tours.

```typescript
const [camera, setCamera] = useCamera('viewer-1')
setCamera({ 
  position: [50, 50, 50],
  target: [0, 0, 0],
  zoom: 2
})
```

**Key Features:**
- Smooth camera transitions
- Built-in animations (spin, rock)
- Orthographic/perspective projection
- Camera state snapshots

[📖 Full Documentation](docs/useCamera.md)
</details>

<details>
<summary><b>📸 useScreenshot</b> - Capture and export visualizations</summary>

Take screenshots of your molecular visualizations with options for transparency, resolution, and format.

```typescript
const [screenshot, takeScreenshot] = useScreenshot('viewer-1')
const imageUrl = await takeScreenshot({
  transparent: true,
  pixelRatio: 2
})
```

**Key Features:**
- Multiple export formats (PNG, JPEG, WebP)
- Transparent backgrounds
- High-resolution capture
- Clipboard integration

[📖 Full Documentation](docs/useScreenshot.md)
</details>

<details>
<summary><b>🧩 useComponents</b> - Molecular component management</summary>

Control visibility and styling of molecular components like chains, ligands, water molecules, and more.

```typescript
const [components, setComponents] = useComponents('viewer-1')
// Hide all water molecules
setComponents({ water: { visible: false } })
```

**Key Features:**
- Toggle component visibility
- Apply custom colors and styles
- Manage multiple representations
- Component-based organization

[📖 Full Documentation](docs/useComponents.md)
</details>

<details>
<summary><b>📝 useSequence</b> - Sequence data and residue selection</summary>

Access sequence information and create selections based on sequence positions. Integrates with sequence viewer components.

```typescript
const [sequence, setSequence] = useSequence('viewer-1')
// Highlight residues 10-20
sequence.selectResidues(10, 20)
```

**Key Features:**
- Access full sequence data
- Residue-based selections
- Chain information
- Integration with structure

[📖 Full Documentation](docs/useSequence.md)
</details>

<details>
<summary><b>📐 useAxes</b> - 3D orientation helper</summary>

Display and control 3D axes helper for spatial orientation. Useful for educational and presentation purposes.

```typescript
const [axes, setAxes] = useAxes('viewer-1')
setAxes({ visible: true, size: 0.5 })
```

**Key Features:**
- Toggle axes visibility
- Adjustable size
- Customizable colors
- Corner positioning

[📖 Full Documentation](docs/useAxes.md)
</details>

<details>
<summary><b>🎨 useBackground</b> - Background color control</summary>

Simple hook for changing the viewer background color. Supports any CSS color value.

```typescript
const [background, setBackground] = useBackground('viewer-1')
setBackground('#1a1a1a') // Dark theme
```

**Key Features:**
- Any CSS color support
- Instant updates
- Theme integration
- Global state sync

[📖 Full Documentation](docs/useBackground.md)
</details>

<details>
<summary><b>🌫️ useFog</b> - Depth-based fog effects</summary>

Add atmospheric fog effects to enhance depth perception in complex molecular structures.

```typescript
const [fog, setFog] = useFog('viewer-1')
setFog({ enabled: true, intensity: 50 })
```

**Key Features:**
- Adjustable intensity
- Depth enhancement
- Atmospheric effects
- Performance optimized

[📖 Full Documentation](docs/useFog.md)
</details>

<details>
<summary><b>🥽 useStereo</b> - Stereoscopic 3D rendering</summary>

Enable stereoscopic rendering for 3D viewing with VR headsets, 3D monitors, or anaglyph glasses.

```typescript
const [stereo, setStereo] = useStereo('viewer-1')
setStereo({ on: true, eyeSeparation: 0.064 })
```

**Key Features:**
- Multiple viewing modes
- Adjustable eye separation
- VR/AR ready
- Cross-eye/parallel viewing

[📖 Full Documentation](docs/useStereo.md)
</details>

<details>
<summary><b>🖼️ useViewport</b> - Viewport dimensions and pixel ratio</summary>

Manage viewport dimensions, pixel ratio for HD rendering, and viewport modes.

```typescript
const [viewport, setViewport] = useViewport('viewer-1')
setViewport({ pixelRatio: 2 }) // Enable HD rendering
```

**Key Features:**
- HD/Retina display support
- Responsive sizing
- Performance optimization
- Multiple viewport modes

[📖 Full Documentation](docs/useViewport.md)
</details>

<details>
<summary><b>🔗 useEvent</b> - Cross-component DOM references</summary>

Share DOM element references across multiple components using an event-based system.

```typescript
const container = useEvent<HTMLDivElement>('viewer-1')
return <div ref={container.for} />
```

**Key Features:**
- Share refs across components
- Mount/unmount events
- TypeScript generics
- Zero prop drilling

[📖 Full Documentation](docs/useEvent.md)
</details>

## 🏗️ Architecture

### Global State Management

All hooks use a global state pattern via [Jotai](https://jotai.org/), allowing any component to access the same Molstar instance:

```typescript
// In Component A
const molstar = useMolstar('my-viewer')

// In Component B (anywhere in the app)
const [camera, setCamera] = useCamera('my-viewer')
// Automatically connects to the same instance
```

### TypeScript Support

Fully typed with TypeScript for excellent IDE support and type safety:

```typescript
interface MoleculeState {
  loading: boolean
  loaded: boolean
  error: Error | null
  load: (source: string | File) => Promise<void>
  zoomToFit: () => void
  // ... and more
}
```

## 📦 Installation

```bash
# With yarn
yarn add molstar-react-hooks molstar

# With npm
npm install molstar-react-hooks molstar
```

## 🔧 Basic Setup

```typescript
import { useMolstar, useMolecule } from 'molstar-react-hooks'

function App() {
  const molstar = useMolstar('main-viewer')
  const [molecule] = useMolecule('main-viewer')
  
  useEffect(() => {
    if (molstar.loaded) {
      molecule.load('1tqn') // Load a PDB structure
    }
  }, [molstar.loaded])
  
  return (
    <div 
      ref={molstar.ref} 
      style={{ width: '100%', height: '600px' }}
    />
  )
}
```

## 🎯 Use Cases

- **Scientific Visualization**: Display protein structures, DNA/RNA, small molecules
- **Educational Tools**: Interactive molecular viewers for teaching
- **Drug Discovery**: Visualize protein-ligand interactions
- **Research Publications**: Create publication-quality molecular graphics
- **Web Applications**: Embed molecular viewers in web apps

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines and submit PRs to our GitHub repository.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built on top of the amazing [Molstar](https://molstar.org/) project by the RCSB PDB team.