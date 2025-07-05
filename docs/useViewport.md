# useViewport

Hook for managing viewport dimensions, pixel ratio, and rendering mode in the Molstar viewer.

## Usage

```typescript
import { useViewport } from '../hooks/useViewport'

function ViewportInfo() {
  const [viewport, setViewport] = useViewport('viewer-1')
  
  // Change pixel ratio for HD rendering
  const toggleHD = () => {
    setViewport({ 
      pixelRatio: viewport.pixelRatio === 1 ? 2 : 1 
    })
  }
  
  return (
    <div>
      <p>Size: {viewport.width} x {viewport.height}</p>
      <p>Pixel Ratio: {viewport.pixelRatio}</p>
      <button onClick={toggleHD}>
        {viewport.pixelRatio > 1 ? 'Standard' : 'HD'} Resolution
      </button>
    </div>
  )
}
```

## API

### Return Value

Returns a tuple: `[viewport, setViewport]`

#### viewport object

```typescript
interface ViewportState {
  width: number      // Viewport width in pixels
  height: number     // Viewport height in pixels
  offsetX: number    // Horizontal offset (for relative-frame mode)
  offsetY: number    // Vertical offset (for relative-frame mode)
  pixelRatio: number // Device pixel ratio (1, 2, etc.)
  mode: 'canvas' | 'static-frame' | 'relative-frame'
}
```

#### setViewport function

Updates viewport configuration:

```typescript
setViewport({
  width?: number
  height?: number
  offsetX?: number
  offsetY?: number
  pixelRatio?: number
  mode?: 'canvas' | 'static-frame' | 'relative-frame'
})

// Also supports function updater
setViewport(prev => ({
  ...prev,
  pixelRatio: prev.pixelRatio * 2
}))
```

## Viewport Modes

- **canvas**: Default mode, viewport fills the entire canvas
- **static-frame**: Fixed size viewport
- **relative-frame**: Viewport with relative positioning

## Examples

### Pixel Ratio Control

```typescript
const [viewport, setViewport] = useViewport('mol-1')

// Standard resolution
setViewport({ pixelRatio: 1 })

// Retina/HD resolution
setViewport({ pixelRatio: 2 })

// Match device
setViewport({ pixelRatio: window.devicePixelRatio })

// High quality for screenshots
setViewport({ pixelRatio: 4 })
```

### Responsive Pixel Ratio

```typescript
function ResponsivePixelRatio() {
  const [viewport, setViewport] = useViewport('viewer-1')
  
  useEffect(() => {
    // Adjust pixel ratio based on viewport size
    const pixels = viewport.width * viewport.height
    
    if (pixels < 500000) {
      // Small viewport - use higher pixel ratio
      setViewport({ pixelRatio: 2 })
    } else if (pixels > 2000000) {
      // Large viewport - reduce pixel ratio for performance
      setViewport({ pixelRatio: 1 })
    }
  }, [viewport.width, viewport.height])
  
  return null
}
```

### Viewport Information Display

```typescript
function ViewportStats() {
  const [viewport] = useViewport('viewer-1')
  
  return (
    <div style={{ 
      position: 'absolute', 
      top: 10, 
      left: 10,
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '5px 10px',
      fontSize: '12px'
    }}>
      <div>Resolution: {viewport.width} × {viewport.height}</div>
      <div>Pixel Ratio: {viewport.pixelRatio}x</div>
      <div>Mode: {viewport.mode}</div>
      <div>Total Pixels: {(viewport.width * viewport.height / 1000000).toFixed(1)}M</div>
    </div>
  )
}
```

### HD Toggle Button

```typescript
function HDToggle() {
  const [viewport, setViewport] = useViewport('viewer-1')
  const isHD = viewport.pixelRatio > 1
  
  return (
    <button
      onClick={() => setViewport({ 
        pixelRatio: isHD ? 1 : window.devicePixelRatio 
      })}
      style={{
        background: isHD ? '#4CAF50' : '#f44336',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '4px'
      }}
    >
      {isHD ? 'HD Enabled' : 'Enable HD'}
    </button>
  )
}
```

### Performance Optimization

```typescript
function PerformanceOptimizer() {
  const [viewport, setViewport] = useViewport('viewer-1')
  const [targetFPS] = useState(60)
  const [currentFPS, setCurrentFPS] = useState(60)
  
  useEffect(() => {
    let frames = 0
    let lastTime = performance.now()
    
    const measureFPS = () => {
      frames++
      const now = performance.now()
      
      if (now - lastTime >= 1000) {
        setCurrentFPS(frames)
        
        // Auto-adjust pixel ratio based on performance
        if (frames < targetFPS * 0.8) {
          // Performance is poor, reduce pixel ratio
          setViewport(prev => ({
            pixelRatio: Math.max(0.5, prev.pixelRatio * 0.8)
          }))
        } else if (frames > targetFPS * 0.95 && viewport.pixelRatio < window.devicePixelRatio) {
          // Performance is good, can increase quality
          setViewport(prev => ({
            pixelRatio: Math.min(window.devicePixelRatio, prev.pixelRatio * 1.1)
          }))
        }
        
        frames = 0
        lastTime = now
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    const raf = requestAnimationFrame(measureFPS)
    return () => cancelAnimationFrame(raf)
  }, [targetFPS, viewport.pixelRatio])
  
  return (
    <div>
      FPS: {currentFPS} | Pixel Ratio: {viewport.pixelRatio.toFixed(2)}
    </div>
  )
}
```

### Screenshot with Custom Resolution

```typescript
async function takeHDScreenshot() {
  const [viewport, setViewport] = useViewport('viewer-1')
  const originalPixelRatio = viewport.pixelRatio
  
  // Set high pixel ratio for screenshot
  setViewport({ pixelRatio: 4 })
  
  // Wait for render
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Take screenshot
  const screenshot = await takeScreenshot()
  
  // Restore original pixel ratio
  setViewport({ pixelRatio: originalPixelRatio })
  
  return screenshot
}
```

## Notes

- Width and height are read-only and reflect the actual canvas dimensions
- The viewport automatically updates when the canvas is resized
- Pixel ratio changes trigger a canvas resize and redraw
- Higher pixel ratios improve visual quality but increase memory usage and reduce performance
- The viewport mode feature is primarily for advanced use cases
- Static-frame mode dimensions are not yet fully implemented