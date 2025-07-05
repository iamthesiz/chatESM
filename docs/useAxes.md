# useAxes

Hook for controlling the 3D axes helper in the Molstar viewer. The axes helper displays orientation indicators (X, Y, Z axes) to help users understand the current view orientation.

## Usage

```typescript
import { useAxes } from '../hooks/useAxes'

function AxesControls() {
  const [axes, setAxes] = useAxes('viewer-1')
  
  // Toggle axes visibility
  const toggleAxes = () => {
    setAxes({ visible: !axes.visible })
  }
  
  // Change axes position
  const moveToTopRight = () => {
    setAxes({ 
      location: 'top-right',
      locationOffsetX: -10,
      locationOffsetY: 10
    })
  }
  
  return (
    <div>
      <button onClick={toggleAxes}>
        {axes.visible ? 'Hide' : 'Show'} Axes
      </button>
      <button onClick={moveToTopRight}>
        Move to Top Right
      </button>
    </div>
  )
}
```

## API

### Return Value

Returns a tuple: `[axes, setAxes]`

#### axes object

Current axes configuration with all properties:

```typescript
interface AxesState {
  visible: boolean
  opacity: number          // 0-1
  scale: number           // Size multiplier
  location: AxesLocation  // Position on screen
  locationOffsetX: number // Horizontal offset in pixels
  locationOffsetY: number // Vertical offset in pixels
  radiusScale: number     // Axes radius scale
  showLabels: boolean     // Show X, Y, Z labels
  showPlanes: boolean     // Show plane indicators
  // Colors (hex strings)
  x: string              // X axis color
  y: string              // Y axis color
  z: string              // Z axis color
  origin: string         // Origin color
  planeXY: string        // XY plane color
  planeXZ: string        // XZ plane color
  planeYZ: string        // YZ plane color
  // Label properties
  labelX: string         // X axis label text
  labelY: string         // Y axis label text
  labelZ: string         // Z axis label text
  labelColorX: string    // X label color
  labelColorY: string    // Y label color
  labelColorZ: string    // Z label color
  labelOpacity: number   // Label opacity (0-1)
  labelScale: number     // Label size
}
```

#### setAxes function

Updates axes configuration. Accepts partial updates:

```typescript
setAxes({
  visible?: boolean
  opacity?: number
  scale?: number
  location?: AxesLocation
  // ... any other property
})
```

### AxesLocation Type

```typescript
type AxesLocation = 
  | 'bottom-left'   // Default
  | 'bottom-right'
  | 'top-left'
  | 'top-right'
  | 'center'
```

## Examples

### Basic Toggle

```typescript
const [axes, setAxes] = useAxes('mol-1')

// Simple on/off
setAxes({ visible: !axes.visible })
```

### Customize Appearance

```typescript
// Make axes larger and semi-transparent
setAxes({
  visible: true,
  scale: 0.5,      // 50% larger
  opacity: 0.7     // 70% opacity
})

// Change colors
setAxes({
  x: '#ff0000',    // Red for X
  y: '#00ff00',    // Green for Y
  z: '#0000ff'     // Blue for Z
})
```

### Position and Offset

```typescript
// Move to top-right corner with padding
setAxes({
  location: 'top-right',
  locationOffsetX: -20,  // 20px from right
  locationOffsetY: 20    // 20px from top
})

// Center with custom offset
setAxes({
  location: 'center',
  locationOffsetX: 100,  // Shift right
  locationOffsetY: -50   // Shift up
})
```

### Labels

```typescript
// Show labels with custom text
setAxes({
  showLabels: true,
  labelX: 'Width',
  labelY: 'Height',
  labelZ: 'Depth',
  labelScale: 0.3
})

// Customize label colors
setAxes({
  labelColorX: '#ff0000',
  labelColorY: '#00ff00',
  labelColorZ: '#0000ff',
  labelOpacity: 0.8
})
```

### Planes

```typescript
// Show reference planes
setAxes({
  showPlanes: true,
  planeXY: '#ffff00',  // Yellow XY plane
  planeXZ: '#ff00ff',  // Magenta XZ plane
  planeYZ: '#00ffff'   // Cyan YZ plane
})
```

### Presets

```typescript
// Minimal axes
const minimalAxes = () => {
  setAxes({
    visible: true,
    scale: 0.2,
    opacity: 0.5,
    showLabels: false,
    showPlanes: false
  })
}

// Scientific view
const scientificAxes = () => {
  setAxes({
    visible: true,
    scale: 0.4,
    opacity: 1,
    showLabels: true,
    showPlanes: true,
    location: 'bottom-right'
  })
}

// Hidden but ready
const hiddenAxes = () => {
  setAxes({ visible: false })
}
```

### Integration with Screenshots

```typescript
// Temporarily show axes for screenshot
const screenshotWithAxes = async () => {
  const [axes, setAxes] = useAxes('mol-1')
  const originalVisible = axes.visible
  
  // Show axes
  setAxes({ visible: true })
  
  // Take screenshot
  await takeScreenshot()
  
  // Restore original state
  setAxes({ visible: originalVisible })
}
```

## Default Values

```typescript
{
  visible: false,
  opacity: 0.51,
  scale: 0.33,
  location: 'bottom-left',
  locationOffsetX: 0,
  locationOffsetY: 0,
  radiusScale: 0.075,
  showLabels: false,
  showPlanes: true,
  x: '#ff0000',
  y: '#008000',
  z: '#0000ff',
  origin: '#808080',
  planeXY: '#808080',
  planeXZ: '#808080',
  planeYZ: '#808080',
  labelX: 'X',
  labelY: 'Y',
  labelZ: 'Z',
  labelColorX: '#808080',
  labelColorY: '#808080',
  labelColorZ: '#808080',
  labelOpacity: 1,
  labelScale: 0.25
}
```

## Notes

- Axes helper is rendered on top of the molecular structure
- Changes are applied immediately
- Useful for orientation reference in publications
- Can be included in screenshots
- Location offsets are in pixels from the edge