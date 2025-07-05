# useStereo

Hook for controlling stereoscopic (3D) rendering in the Molstar viewer. This enables viewing molecular structures in 3D using various stereo modes.

## Usage

```typescript
import { useStereo } from '../hooks/useStereo'

function StereoControls() {
  const [stereo, setStereo] = useStereo('viewer-1')
  
  // Toggle stereo
  const toggleStereo = () => {
    setStereo({ on: !stereo.on })
  }
  
  // Adjust eye separation
  const handleSeparationChange = (e) => {
    setStereo({ eyeSeparation: Number(e.target.value) })
  }
  
  return (
    <div>
      <button onClick={toggleStereo}>
        {stereo.on ? 'Disable' : 'Enable'} 3D
      </button>
      {stereo.on && (
        <input
          type="range"
          min="0.01"
          max="0.1"
          step="0.001"
          value={stereo.eyeSeparation}
          onChange={handleSeparationChange}
        />
      )}
    </div>
  )
}
```

## API

### Return Value

Returns a tuple: `[stereo, setStereo]`

#### stereo object

```typescript
interface StereoState {
  on: boolean           // Stereo on/off
  eyeSeparation: number // Distance between eyes (0.01-0.1)
  focus: number         // Focal distance
}
```

#### setStereo function

Updates stereo configuration:

```typescript
setStereo({
  on?: boolean
  eyeSeparation?: number
  focus?: number
})
```

## Examples

### Basic Toggle

```typescript
const [stereo, setStereo] = useStereo('mol-1')

// Enable stereo with defaults
setStereo({ on: true })

// Disable stereo
setStereo({ on: false })
```

### Eye Separation

```typescript
// Subtle 3D effect
setStereo({
  on: true,
  eyeSeparation: 0.03
})

// Strong 3D effect
setStereo({
  on: true,
  eyeSeparation: 0.08
})

// Custom separation for user comfort
const customSeparation = 0.064 // Average human IPD in meters
setStereo({
  on: true,
  eyeSeparation: customSeparation
})
```

### Focus Distance

```typescript
// Near focus
setStereo({
  on: true,
  focus: 5
})

// Far focus
setStereo({
  on: true,
  focus: 50
})

// Auto-focus on structure
const autoFocus = () => {
  const [camera] = useCamera('mol-1')
  setStereo({
    on: true,
    focus: camera.zoom || 10
  })
}
```

### Stereo Presets

```typescript
function StereoPresets() {
  const [stereo, setStereo] = useStereo('viewer-1')
  
  const presets = {
    off: { on: false },
    subtle: { on: true, eyeSeparation: 0.03, focus: 10 },
    normal: { on: true, eyeSeparation: 0.064, focus: 10 },
    strong: { on: true, eyeSeparation: 0.08, focus: 10 },
    custom: { on: true, eyeSeparation: 0.05, focus: 15 }
  }
  
  return (
    <div>
      {Object.entries(presets).map(([name, config]) => (
        <button
          key={name}
          onClick={() => setStereo(config)}
          style={{
            fontWeight: stereo.on && 
              stereo.eyeSeparation === config.eyeSeparation ? 
              'bold' : 'normal'
          }}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
```

### VR/AR Integration

```typescript
// Adjust for VR headset
function VRMode() {
  const [stereo, setStereo] = useStereo('viewer-1')
  
  const enableVR = () => {
    setStereo({
      on: true,
      eyeSeparation: 0.064, // Standard VR IPD
      focus: 20
    })
  }
  
  const disableVR = () => {
    setStereo({ on: false })
  }
  
  return (
    <div>
      <button onClick={enableVR}>Enter VR</button>
      <button onClick={disableVR}>Exit VR</button>
    </div>
  )
}
```

### User Preferences

```typescript
// Save and restore user's stereo preferences
function StereoPreferences() {
  const [stereo, setStereo] = useStereo('viewer-1')
  
  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem('stereo-preferences')
    if (saved) {
      setStereo(JSON.parse(saved))
    }
  }, [])
  
  // Save preferences when changed
  useEffect(() => {
    localStorage.setItem('stereo-preferences', JSON.stringify(stereo))
  }, [stereo])
  
  return (
    <div>
      <h3>3D Settings</h3>
      <label>
        <input
          type="checkbox"
          checked={stereo.on}
          onChange={e => setStereo({ on: e.target.checked })}
        />
        Enable 3D
      </label>
      
      {stereo.on && (
        <>
          <label>
            Eye Separation: {(stereo.eyeSeparation * 1000).toFixed(0)}mm
            <input
              type="range"
              min="30"
              max="80"
              value={stereo.eyeSeparation * 1000}
              onChange={e => setStereo({ 
                eyeSeparation: Number(e.target.value) / 1000 
              })}
            />
          </label>
          
          <label>
            Focus: {stereo.focus.toFixed(0)}
            <input
              type="range"
              min="1"
              max="100"
              value={stereo.focus}
              onChange={e => setStereo({ 
                focus: Number(e.target.value) 
              })}
            />
          </label>
        </>
      )}
    </div>
  )
}
```

### Anaglyph Mode

```typescript
// Red-blue glasses support
function AnaglyphMode() {
  const [stereo, setStereo] = useStereo('viewer-1')
  const [background, setBackground] = useBackground('viewer-1')
  
  const enableAnaglyph = () => {
    // White background works best for anaglyph
    setBackground('white')
    setStereo({
      on: true,
      eyeSeparation: 0.045, // Slightly less for anaglyph
      focus: 10
    })
  }
  
  return (
    <button onClick={enableAnaglyph}>
      Enable Red-Blue 3D
    </button>
  )
}
```

## Viewing Methods

The stereo output can be viewed using:

1. **Cross-eye viewing**: Cross your eyes to merge the images
2. **Parallel viewing**: Relax eyes to merge the images
3. **Anaglyph glasses**: Red-blue or red-cyan glasses
4. **VR headsets**: When used in WebXR applications
5. **3D monitors**: Displays that support stereo content

## Tips

- Start with eyeSeparation around 0.064 (average human IPD)
- Reduce separation if viewing causes discomfort
- Adjust focus based on structure size and zoom level
- Disable for users who experience motion sickness
- Test with different viewing methods

## Notes

- Stereo rendering creates two slightly offset views
- Performance impact depends on scene complexity
- Not all users can perceive stereoscopic 3D
- Best experienced on larger displays
- May require browser support for full-screen stereo