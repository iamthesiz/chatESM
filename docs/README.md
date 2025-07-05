# 🧬 useMolstar Documentation

> A powerful React hook that makes molecular visualization as easy as using useState

## Quick Links

- [📖 Complete Guide](./useMolstar-guide.md) - Learn why useMolstar is amazing with real examples
- [🔧 API Reference](./useMolstar-api.md) - Detailed API documentation
- [🚀 Quick Start](#quick-start) - Get started in 2 minutes

## Quick Start

### 1. Basic Usage

```tsx
import { useMolstar } from '../hooks/useMolstar'

function MyFirstMolecule() {
  const [molecule] = useMolstar()
  
  useEffect(() => {
    molecule.load({ pdbId: '1AON' })
  }, [])
  
  return <div ref={molecule.ref} style={{ height: 500 }} />
}
```

### 2. Interactive Controls

```tsx
function InteractiveMolecule() {
  const [molecule, { setAppearance, setGranularity }] = useMolstar()
  
  return (
    <>
      <div ref={molecule.ref} style={{ height: 500 }} />
      
      <button onClick={() => setAppearance({ background: 'black' })}>
        Dark Mode
      </button>
      
      <button onClick={() => setGranularity('residue')}>
        Select Residues
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
  const [mol1] = useMolstar('molecule-1')
  const [mol2] = useMolstar('molecule-2')
  
  useEffect(() => {
    mol1.load({ pdbId: '1AON', background: 'white' })
    mol2.load({ pdbId: '1BTL', background: 'black' })
  }, [])
  
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <div ref={mol1.ref} style={{ flex: 1, height: 400 }} />
      <div ref={mol2.ref} style={{ flex: 1, height: 400 }} />
    </div>
  )
}
```

## Key Features

### 🎯 **Zero State Management**
No useState, no useEffect for syncing - the hook reads directly from Molstar's internal state.

### 🎨 **Beautiful by Default**
Sensible defaults with automatic UI hiding and optimized rendering settings.

### 📸 **Screenshot Ready**
High-resolution screenshots with one line of code.

### 🔍 **Smart Selection**
Granular selection control - atoms, residues, chains, or custom selections.

### 🎬 **Cinematic Camera**
Smooth animations, stereo 3D, and professional camera controls.

### ⚡ **Performance First**
Direct Molstar access means no React overhead - as fast as vanilla Molstar.

## Common Recipes

### Light/Dark Mode Toggle

```tsx
const [isDark, setIsDark] = useState(false)

<button onClick={() => {
  setIsDark(!isDark)
  setAppearance({ 
    background: isDark ? 'white' : 'black',
    postprocessing: { 
      lighten: isDark ? 0 : 0.1 
    }
  })
}}>
  Toggle Theme
</button>
```

### Focus on Ligand

```tsx
await molecule.load({ pdbId: '1AON' })
molecule.setSelection({ 
  set: 'ligand',
  highlight: { color: '#00ff00', style: 'glow' },
  autoFocus: true 
})
```

### Publication Figure

```tsx
await molecule.load({ pdbId: '1AON', preset: 'empty' })
await molecule.setStylePreset('publication')
await molecule.createComponent('protein', 'cartoon')
await molecule.createComponent('ligand', 'ball-and-stick')
await molecule.screenshot({ 
  resolution: 4,
  download: true,
  filename: 'figure.png' 
})
```

### Animate Between Views

```tsx
const views = [
  { selection: 'protein', label: 'Full Protein' },
  { selection: 'ligand', label: 'Binding Site' },
  { selection: 'chain A', label: 'Chain A' }
]

views.forEach((view, i) => {
  setTimeout(() => {
    molecule.focus(view.selection)
    setSelection({ set: view.selection })
  }, i * 2000)
})
```

## Architecture

useMolstar follows React best practices:

1. **Hooks-based** - Composable and reusable
2. **TypeScript-first** - Full type safety
3. **Ref-based** - No wrapper components needed
4. **ID-based** - Multiple instances with unique IDs
5. **Direct state access** - No prop drilling or context needed

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Requires WebGL 2.0

## Contributing

Found a bug or have a feature request? Please open an issue!

## License

MIT