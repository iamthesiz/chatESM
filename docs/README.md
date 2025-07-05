# 🧬 Molstar React Hooks Documentation

> A comprehensive collection of React hooks that makes molecular visualization as easy as using useState

## Quick Links

- [🎯 useMolstar](./useMolstar.md) - Core hook for managing Molstar instances
- [🧬 useMolecule](./useMolecule.md) - High-level molecular visualization
- [📷 useCamera](./useCamera.md) - Camera control and animations
- [📸 useScreenshot](./useScreenshot.md) - Capture and export
- [🧩 useComponents](./useComponents.md) - Molecular component management
- [📝 useSequence](./useSequence.md) - Sequence data and selections
- [📐 useAxes](./useAxes.md) - 3D orientation helper
- [🎨 useBackground](./useBackground.md) - Background color control
- [🌫️ useFog](./useFog.md) - Depth-based fog effects
- [🥽 useStereo](./useStereo.md) - Stereoscopic 3D rendering
- [🖼️ useViewport](./useViewport.md) - Viewport and resolution control
- [🔗 useEvent](./useEvent.md) - Cross-component DOM references

## Quick Start

### 1. Basic Usage

```tsx
import { useMolecule } from 'molstar-react-hooks'

function MyFirstMolecule() {
  const [molecule] = useMolecule('viewer-1')
  
  useEffect(() => {
    molecule.load('1tqn')
  }, [])
  
  return <div ref={molecule.for} style={{ height: 500 }} />
}
```

### 2. Interactive Controls

```tsx
function InteractiveMolecule() {
  const [molecule] = useMolecule('viewer-1')
  const [background, setBackground] = useBackground('viewer-1')
  const [camera, setCamera] = useCamera('viewer-1')
  
  return (
    <>
      <div ref={molecule.for} style={{ height: 500 }} />
      
      <button onClick={() => setBackground('#1a1a1a')}>
        Dark Mode
      </button>
      
      <button onClick={() => setCamera({ zoom: 2 })}>
        Zoom In
      </button>
      
      <button onClick={() => molecule.screenshot({ download: true })}>
        Download Image
      </button>
    </>
  )
}
```

### 3. Multiple Molecules

```tsx
function CompareStructures() {
  const [molecule1] = useMolecule('molecule-1')
  const [molecule2] = useMolecule('molecule-2')
  
  useEffect(() => {
    molecule1.load('1tqn')
    molecule2.load('1btl')
  }, [])
  
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div ref={molecule1.for} style={{ flex: 1, height: 400 }} />
      <div ref={molecule2.for} style={{ flex: 1, height: 400 }} />
    </div>
  )
}
```

## Key Features

### 🎯 **Global State Management**
Access the same Molstar instance from any component using the same ID.

### 🎨 **Modular Hook System**
Each aspect of visualization has its own specialized hook.

### 📸 **Screenshot Ready**
High-resolution screenshots with transparency and format options.

### 🔍 **Advanced Selection**
Powerful selection system with visual highlights and focus controls.

### 🎬 **Cinematic Camera**
Smooth animations, stereo 3D, and professional camera controls.

### ⚡ **Performance First**
Direct Molstar access with minimal React overhead.

## Common Recipes

### Light/Dark Mode Toggle

```tsx
const [theme, setTheme] = useState<'light' | 'dark'>('light')
const [background, setBackground] = useBackground('viewer-1')

useEffect(() => {
  setBackground(theme === 'light' ? '#ffffff' : '#1a1a1a')
}, [theme])
```

### Focus on Ligand

```tsx
const [molecule] = useMolecule('viewer-1')
const [camera, setCamera] = useCamera('viewer-1')

const focusLigand = async () => {
  await molecule.focus('ligand')
  setCamera({ zoom: 1.5 })
}
```

### Publication Figure

```tsx
const [molecule] = useMolecule('viewer-1')
const [background, setBackground] = useBackground('viewer-1')
const [axes, setAxes] = useAxes('viewer-1')

const createFigure = async () => {
  await molecule.load('1tqn')
  setBackground('white')
  setAxes({ visible: false })
  
  await molecule.screenshot({ 
    pixelRatio: 4,
    download: true,
    filename: 'figure.png' 
  })
}
```

### Animate Between Views

```tsx
const [camera, setCamera] = useCamera('viewer-1')
const views = [
  { position: [50, 50, 50], target: [0, 0, 0] },
  { position: [0, 50, 50], target: [0, 0, 0] },
  { position: [-50, 50, 50], target: [0, 0, 0] }
]

const animateViews = () => {
  views.forEach((view, i) => {
    setTimeout(() => setCamera(view), i * 2000)
  })
}
```

## Architecture

The hook system follows React best practices:

1. **Hooks-based** - Composable and reusable
2. **TypeScript-first** - Full type safety
3. **Global state** - Access from any component
4. **ID-based** - Multiple independent instances
5. **Modular** - Use only what you need

## Hook Categories

### Core
- `useMolstar` - Foundation hook for Molstar instances
- `useMolecule` - High-level structure loading and control

### Visual
- `useCamera` - Camera positioning and animation
- `useBackground` - Background color control
- `useFog` - Atmospheric fog effects
- `useStereo` - 3D stereoscopic rendering
- `useAxes` - 3D orientation axes

### Interaction
- `useComponents` - Component visibility and styling
- `useSequence` - Sequence data and residue selection
- `useScreenshot` - Image capture and export
- `useViewport` - Resolution and viewport control

### Utility
- `useEvent` - Cross-component DOM reference sharing

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Requires WebGL 2.0

## Performance Tips

1. Use IDs consistently across components
2. Check `molstar.loaded` before operations
3. Batch multiple state updates when possible
4. Use `pixelRatio: 1` for better performance on large displays
5. Disable unused visual effects (fog, stereo) for speed

## Contributing

Found a bug or have a feature request? Please open an issue!

## License

MIT