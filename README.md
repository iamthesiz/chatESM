# useMolstar: The Ultimate React Hook for Molecular Visualization

## Why useMolstar?

**useMolstar** transforms the complex Molstar library into a simple, declarative React hook that feels natural and intuitive. Instead of wrestling with imperative APIs and manual state management, you get a clean, reactive interface that "just works" with React.

### Key Benefits

1. **Zero State Management** - The hook reads directly from Molstar's internal state, eliminating sync issues
2. **Declarative API** - Control molecules like React components with familiar patterns
3. **TypeScript First** - Full type safety with intelligent autocomplete
4. **Performance Optimized** - Direct Molstar access means no React re-render overhead
5. **Native UI Control** - Automatically hides Molstar's built-in UI for seamless integration

## Installation & Setup

```tsx
import { useMolstar } from './hooks/useMolstar'

function MyMolecule() {
  const [molecule, { 
    setAppearance, 
    setCamera, 
    setSelection,
    setGranularity 
  }] = useMolstar('my-viewer')
  
  return <div ref={molecule.ref} style={{ width: '100%', height: '500px' }} />
}
```

## Core Concepts

### 1. Loading Structures

Load from multiple sources with a single, consistent API:

```tsx
// Load from PDB
await molecule.load({ 
  pdbId: '1TQN',
  preset: 'cartoon',
  hideNativeControls: true 
})

// Load from URL
await molecule.load({ 
  url: 'https://files.rcsb.org/download/7M1M.cif',
  quality: 'high',
  background: 'black'
})

// Load from file
await molecule.load({ 
  file: myFile,
  animate: 'rock',
  lighting: 'dramatic'
})
```

### 2. Visual Styling

Change appearance with simple, declarative configs:

```tsx
// Set background with optional brightness adjustments
setAppearance({ 
  background: 'black',
  postprocessing: { 
    lighten: 0.2,  // Brighten by 20%
    darken: 0     // No darkening
  }
})

// Apply cinematic lighting
setAppearance({ 
  lighting: 'dramatic',
  shadows: { enabled: true, quality: 'high' },
  fog: { enabled: true, intensity: 20 }
})

// Enable visual effects
setAppearance({
  postprocessing: {
    occlusion: { 
      on: true, 
      params: { samples: 64, radius: 5 } 
    },
    outline: { 
      on: true, 
      params: { scale: 1, threshold: 0.8 } 
    }
  }
})
```

### 3. Intelligent Selection System

Select molecular components with granular control:

```tsx
// Set selection granularity (what gets selected on click)
setGranularity('residue')  // Select entire residues
setGranularity('chain')    // Select entire chains
setGranularity('atom')     // Select individual atoms

// Programmatic selection
setSelection({ 
  set: 'protein',          // Select all protein
  highlight: { 
    color: '#00ff00',
    style: 'glow',
    intensity: 0.8 
  }
})

// Complex selections
setSelection({
  set: 'chain A and residue 50-100',
  add: 'ligand',
  remove: 'water',
  autoFocus: true
})
```

### 4. Camera Control

Cinematic camera movements and effects:

```tsx
// Position camera
setCamera({
  position: [50, 50, 50],
  target: [0, 0, 0],
  zoom: 0.8,
  projection: 'perspective'
})

// Animate the view
setCamera({
  animation: 'spin',  // or 'rock', 'off'
  fov: 60,           // Field of view
})

// Advanced clipping
setCamera({
  clipping: {
    radius: 70,      // Show 70% of structure
    far: true,       // Enable far plane
    minNear: 10      // Minimum near distance
  }
})

// Stereoscopic 3D
setCamera({
  stereo: {
    enabled: true,
    eyeSeparation: 0.064,
    focus: 10
  }
})
```

### 5. Quality & Performance

Fine-tune rendering for your needs:

```tsx
// Quick quality presets
molecule.setQuality({ level: 'high' })

// Detailed control
molecule.setQuality({
  antialiasing: true,
  shadows: {
    enabled: true,
    quality: 'high',
    steps: 3
  },
  occlusion: {
    enabled: true,
    samples: 32,
    multiScale: {
      enabled: true,
      levels: [
        { radius: 2, blur: 1 },
        { radius: 8, blur: 2 }
      ]
    }
  },
  performance: {
    maxFps: 60,
    adaptiveQuality: true,
    levelOfDetail: true
  }
})
```

### 6. Screenshots & Export

Capture high-quality images with ease:

```tsx
// Quick screenshot
await molecule.screenshot({ download: true })

// High-res with transparency
const dataUrl = await molecule.screenshot({
  resolution: 4,        // 4x resolution
  transparent: true,    // Transparent background
  axes: true,          // Show coordinate axes
  format: 'png'
})

// Copy to clipboard
await molecule.copyScreenshot({ 
  resolution: 2,
  autocrop: true      // Remove whitespace
})
```

### 7. Component Management

Dynamically create and manage visual components:

```tsx
// Create custom representation
await molecule.createComponent(
  'helix',                    // Selection
  'cartoon',                  // Style
  'Alpha Helices',           // Label
  true                       // Check if exists
)

// Toggle visibility
await molecule.toggleComponent('component-id')

// Apply representation presets
await molecule.setRepresentationPreset('spacefill')
await molecule.setStylePreset('illustrative')
```

### 8. Direct Molstar Access

When you need the full power of Molstar:

```tsx
// Access the plugin directly
const plugin = molecule.molstar
if (plugin) {
  // Use any Molstar API
  const structure = plugin.managers.structure.hierarchy.current.structures[0]
  
  // Custom behaviors
  plugin.behaviors.interaction.click.subscribe(event => {
    console.log('Clicked:', event)
  })
}
```

## Real-World Examples

### Example 1: Publication-Ready Figure

```tsx
function PublicationFigure() {
  const [molecule] = useMolstar('figure')
  
  const createFigure = async () => {
    // Load structure
    await molecule.load({ 
      pdbId: '6M0J',
      preset: 'empty'  // Start with blank canvas
    })
    
    // Set publication style
    await molecule.setStylePreset('publication')
    
    // White background
    setAppearance({ background: 'white' })
    
    // Create specific representations
    await molecule.createComponent('protein', 'cartoon', 'Protein')
    await molecule.createComponent('ligand', 'ball-and-stick', 'Drug')
    
    // Focus on binding site
    setSelection({ 
      set: 'ligand',
      autoFocus: true 
    })
    setCamera({ zoom: 0.6 })
    
    // High-quality screenshot
    await molecule.screenshot({
      download: true,
      filename: 'figure-1a.png',
      resolution: 4,
      transparent: false
    })
  }
  
  return (
    <div>
      <div ref={molecule.ref} style={{ width: 800, height: 600 }} />
      <button onClick={createFigure}>Generate Figure</button>
    </div>
  )
}
```

### Example 2: Interactive Tutorial

```tsx
function MoleculeTutorial() {
  const [molecule, { setSelection, setGranularity }] = useMolstar()
  const [step, setStep] = useState(0)
  
  const tutorialSteps = [
    {
      title: "Overview",
      action: () => {
        setCamera({ animation: 'spin' })
        setAppearance({ lighting: 'soft' })
      }
    },
    {
      title: "Active Site",
      action: () => {
        setCamera({ animation: 'off' })
        setSelection({ 
          set: 'residue 234-289',
          highlight: { color: '#ff0000', style: 'glow' }
        })
        molecule.focus('residue 234-289')
      }
    },
    {
      title: "Substrate Binding",
      action: () => {
        setSelection({ 
          set: 'ligand',
          highlight: { color: '#00ff00', style: 'outline' }
        })
        setGranularity('atom')
      }
    }
  ]
  
  useEffect(() => {
    molecule.load({ pdbId: '1AON', preset: 'cartoon' })
  }, [])
  
  useEffect(() => {
    tutorialSteps[step]?.action()
  }, [step])
  
  return (
    <div>
      <h2>{tutorialSteps[step]?.title}</h2>
      <div ref={molecule.ref} style={{ height: 500 }} />
      <button onClick={() => setStep(s => (s + 1) % tutorialSteps.length)}>
        Next Step
      </button>
    </div>
  )
}
```

### Example 3: Multi-Structure Comparison

```tsx
function StructureComparison() {
  const [mol1] = useMolstar('structure-1')
  const [mol2] = useMolstar('structure-2')
  
  const loadComparison = async () => {
    // Load both structures
    await Promise.all([
      mol1.load({ pdbId: '1TQN', background: 'black' }),
      mol2.load({ pdbId: '1TQO', background: 'black' })
    ])
    
    // Apply same visual style
    const style = { 
      lighting: 'dramatic',
      postprocessing: { outline: { on: true } }
    }
    
    mol1.setAppearance(style)
    mol2.setAppearance(style)
    
    // Highlight differences
    mol1.setSelection({ 
      set: 'residue 45-67',
      highlight: { color: '#ff0000' }
    })
    mol2.setSelection({ 
      set: 'residue 45-67',
      highlight: { color: '#0000ff' }
    })
  }
  
  return (
    <div style={{ display: 'flex' }}>
      <div ref={mol1.ref} style={{ flex: 1, height: 400 }} />
      <div ref={mol2.ref} style={{ flex: 1, height: 400 }} />
    </div>
  )
}
```

## Advanced Features

### Dynamic Component Creation

```tsx
// Create components based on structure analysis
const analyzeAndVisualize = async () => {
  await molecule.load({ pdbId: '3PQR' })
  
  // Create different representations for different parts
  const components = [
    { selection: 'helix', style: 'cartoon', color: '#ff0000' },
    { selection: 'sheet', style: 'cartoon', color: '#0000ff' },
    { selection: 'coil', style: 'line', color: '#888888' },
    { selection: 'ligand', style: 'ball-and-stick', color: '#00ff00' }
  ]
  
  for (const comp of components) {
    await molecule.createComponent(
      comp.selection,
      comp.style,
      comp.selection.toUpperCase()
    )
  }
}
```

### Reactive Updates

```tsx
function ReactiveViewer() {
  const [molecule, { setAppearance }] = useMolstar()
  const [brightness, setBrightness] = useState(0)
  const [showShadows, setShowShadows] = useState(false)
  
  // React to state changes
  useEffect(() => {
    setAppearance({
      postprocessing: { 
        lighten: brightness > 0 ? brightness : 0,
        darken: brightness < 0 ? -brightness : 0
      },
      shadows: showShadows
    })
  }, [brightness, showShadows])
  
  return (
    <>
      <div ref={molecule.ref} style={{ height: 500 }} />
      <input 
        type="range" 
        min="-1" 
        max="1" 
        step="0.1"
        value={brightness}
        onChange={e => setBrightness(parseFloat(e.target.value))}
      />
      <label>
        <input 
          type="checkbox"
          checked={showShadows}
          onChange={e => setShowShadows(e.target.checked)}
        />
        Shadows
      </label>
    </>
  )
}
```

## Best Practices

1. **Always hide native controls** when loading structures for a clean UI
2. **Use TypeScript** to get full autocomplete and type safety
3. **Batch operations** when possible for better performance
4. **Set granularity** before enabling user interactions
5. **Use presets** as starting points, then customize as needed

## Conclusion

useMolstar brings the power of professional molecular visualization to React with an API that feels like it was designed for React from the ground up. No more imperative commands, manual state sync, or complex initialization - just declare what you want and let the hook handle the rest.

Whether you're building educational tools, research applications, or stunning visualizations, useMolstar provides the perfect balance of simplicity and power.
