# useFog

Hook for controlling fog effects in the Molstar viewer. Fog adds depth perception by gradually fading distant objects.

## Usage

```typescript
import { useFog } from '../hooks/useFog'

function FogControls() {
  const [fog, setFog] = useFog('viewer-1')
  
  // Toggle fog
  const toggleFog = () => {
    setFog({ enabled: !fog.enabled })
  }
  
  // Adjust intensity
  const handleIntensityChange = (e) => {
    setFog({ intensity: Number(e.target.value) })
  }
  
  return (
    <div>
      <button onClick={toggleFog}>
        {fog.enabled ? 'Disable' : 'Enable'} Fog
      </button>
      {fog.enabled && (
        <input
          type="range"
          min="0"
          max="100"
          value={fog.intensity}
          onChange={handleIntensityChange}
        />
      )}
    </div>
  )
}
```

## API

### Return Value

Returns a tuple: `[fog, setFog]`

#### fog object

```typescript
interface FogState {
  enabled: boolean    // Fog on/off
  intensity: number   // Fog intensity (0-100)
}
```

#### setFog function

Updates fog configuration:

```typescript
setFog({
  enabled?: boolean
  intensity?: number
})
```

## Examples

### Basic Toggle

```typescript
const [fog, setFog] = useFog('mol-1')

// Enable fog with default intensity
setFog({ enabled: true })

// Disable fog
setFog({ enabled: false })
```

### Intensity Control

```typescript
// Light fog for subtle depth
setFog({
  enabled: true,
  intensity: 20
})

// Heavy fog for dramatic effect
setFog({
  enabled: true,
  intensity: 80
})

// Maximum fog
setFog({
  enabled: true,
  intensity: 100
})
```

### Fog Presets

```typescript
function FogPresets() {
  const [fog, setFog] = useFog('viewer-1')
  
  const presets = {
    none: { enabled: false },
    subtle: { enabled: true, intensity: 15 },
    medium: { enabled: true, intensity: 40 },
    heavy: { enabled: true, intensity: 70 },
    maximum: { enabled: true, intensity: 100 }
  }
  
  return (
    <div>
      {Object.entries(presets).map(([name, config]) => (
        <button key={name} onClick={() => setFog(config)}>
          {name}
        </button>
      ))}
    </div>
  )
}
```

### Dynamic Fog

```typescript
// Animate fog intensity
function AnimatedFog() {
  const [fog, setFog] = useFog('viewer-1')
  const [animating, setAnimating] = useState(false)
  
  useEffect(() => {
    if (!animating || !fog.enabled) return
    
    let intensity = fog.intensity
    let direction = 1
    
    const interval = setInterval(() => {
      intensity += direction * 2
      
      if (intensity >= 80) direction = -1
      if (intensity <= 20) direction = 1
      
      setFog({ intensity })
    }, 100)
    
    return () => clearInterval(interval)
  }, [animating, fog.enabled])
  
  return (
    <button onClick={() => setAnimating(!animating)}>
      {animating ? 'Stop' : 'Start'} Animation
    </button>
  )
}
```

### Fog with Background

```typescript
import { useBackground } from '../hooks/useBackground'

function AtmosphericView() {
  const [fog, setFog] = useFog('viewer-1')
  const [background, setBackground] = useBackground('viewer-1')
  
  const atmosphericPreset = () => {
    // Dark background with fog for atmospheric effect
    setBackground('#1a1a1a')
    setFog({
      enabled: true,
      intensity: 60
    })
  }
  
  const clearPreset = () => {
    // White background, no fog
    setBackground('white')
    setFog({ enabled: false })
  }
  
  return (
    <div>
      <button onClick={atmosphericPreset}>Atmospheric</button>
      <button onClick={clearPreset}>Clear</button>
    </div>
  )
}
```

### Responsive Fog

```typescript
// Adjust fog based on zoom level
function ResponsiveFog() {
  const [fog, setFog] = useFog('viewer-1')
  const [camera] = useCamera('viewer-1')
  
  useEffect(() => {
    // More fog when zoomed out, less when zoomed in
    const zoomFactor = camera.zoom || 100
    const intensity = Math.max(10, Math.min(80, 100 - zoomFactor))
    
    if (fog.enabled) {
      setFog({ intensity })
    }
  }, [camera.zoom, fog.enabled])
  
  return null
}
```

## Use Cases

1. **Depth Perception**: Help users understand spatial relationships
2. **Focus Attention**: Fade distant objects to highlight foreground
3. **Atmospheric Effects**: Create mood and visual interest
4. **Large Structures**: Improve visibility in complex molecules
5. **Presentations**: Add visual polish for talks and publications

## Tips

- Start with low intensity (10-30) for subtle depth cues
- Higher intensity (50-80) works well with dark backgrounds
- Combine with camera animations for dynamic effects
- Disable fog for technical analysis requiring full visibility
- Fog color matches the background color automatically

## Notes

- Fog is rendered using distance-based opacity
- Intensity 0 = no fog, 100 = maximum fog
- Changes are applied immediately
- Fog affects all objects in the scene equally
- Performance impact is minimal