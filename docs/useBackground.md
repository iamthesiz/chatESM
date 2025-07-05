# useBackground

Hook for controlling the background color of the Molstar viewer. Provides a simple way to change the viewer's background to match your application's theme.

## Usage

```typescript
import { useBackground } from '../hooks/useBackground'

function BackgroundControls() {
  const [background, setBackground] = useBackground('viewer-1')
  
  return (
    <div>
      <button onClick={() => setBackground('white')}>Light</button>
      <button onClick={() => setBackground('#1a1a1a')}>Dark</button>
      <button onClick={() => setBackground('#282c34')}>Custom</button>
    </div>
  )
}
```

## API

### Parameters

- `id?: string` - Optional Molstar instance ID. Defaults to 'molstar-default'

### Return Value

Returns a tuple: `[background, setBackground]`

- `background: string` - Current background color
- `setBackground: (color: string) => void` - Function to update background color

## Examples

### Basic Usage

```typescript
const [background, setBackground] = useBackground('mol-1')

// Set to white
setBackground('white')

// Set to black
setBackground('black')

// Set to any CSS color
setBackground('#f0f0f0')
setBackground('rgb(26, 26, 26)')
setBackground('hsl(200, 50%, 20%)')
```

### Theme Integration

```typescript
function ThemedViewer() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [background, setBackground] = useBackground('viewer-1')
  
  useEffect(() => {
    setBackground(theme === 'light' ? '#ffffff' : '#1a1a1a')
  }, [theme])
  
  return (
    <div>
      <div ref={molstar.ref} style={{ height: 500 }} />
      <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
    </div>
  )
}
```

### Color Picker Integration

```typescript
function ColorPicker() {
  const [background, setBackground] = useBackground('viewer-1')
  
  return (
    <div>
      <input
        type="color"
        value={background}
        onChange={(e) => setBackground(e.target.value)}
      />
      <span>Current: {background}</span>
    </div>
  )
}
```

### Preset Backgrounds

```typescript
function BackgroundPresets() {
  const [background, setBackground] = useBackground('viewer-1')
  
  const presets = {
    white: '#ffffff',
    black: '#000000',
    gray: '#808080',
    darkGray: '#1a1a1a',
    lightGray: '#f5f5f5',
    blue: '#001f3f',
    navy: '#0a1929',
    purple: '#1a0033'
  }
  
  return (
    <div>
      {Object.entries(presets).map(([name, color]) => (
        <button
          key={name}
          onClick={() => setBackground(color)}
          style={{
            background: color,
            color: color === '#ffffff' || color === '#f5f5f5' ? 'black' : 'white',
            border: background === color ? '2px solid #0080ff' : 'none'
          }}
        >
          {name}
        </button>
      ))}
    </div>
  )
}
```

### Animated Background Transitions

```typescript
function AnimatedBackground() {
  const [background, setBackground] = useBackground('viewer-1')
  const [animating, setAnimating] = useState(false)
  
  const animateToColor = async (targetColor: string) => {
    setAnimating(true)
    // Note: Actual color interpolation would require more complex logic
    setBackground(targetColor)
    setTimeout(() => setAnimating(false), 300)
  }
  
  return (
    <div>
      <div 
        ref={molstar.ref} 
        style={{ 
          height: 500,
          transition: animating ? 'opacity 0.3s' : 'none'
        }} 
      />
      <button onClick={() => animateToColor('#1a1a1a')}>
        Fade to Dark
      </button>
    </div>
  )
}
```

### Responsive Background

```typescript
function ResponsiveBackground() {
  const [background, setBackground] = useBackground('viewer-1')
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  
  useEffect(() => {
    setBackground(prefersDark ? '#0d1117' : '#ffffff')
  }, [prefersDark])
  
  return <div ref={molstar.ref} style={{ height: '100%' }} />
}
```

### Background with Fog

```typescript
import { useFog } from '../hooks/useFog'

function AtmosphericView() {
  const [background, setBackground] = useBackground('viewer-1')
  const [fog, setFog] = useFog('viewer-1')
  
  const setAtmosphere = (mood: 'clear' | 'foggy' | 'dramatic') => {
    switch (mood) {
      case 'clear':
        setBackground('#ffffff')
        setFog({ enabled: false })
        break
      case 'foggy':
        setBackground('#e0e0e0')
        setFog({ enabled: true, intensity: 40 })
        break
      case 'dramatic':
        setBackground('#0a0a0a')
        setFog({ enabled: true, intensity: 80 })
        break
    }
  }
  
  return (
    <div>
      <button onClick={() => setAtmosphere('clear')}>Clear</button>
      <button onClick={() => setAtmosphere('foggy')}>Foggy</button>
      <button onClick={() => setAtmosphere('dramatic')}>Dramatic</button>
    </div>
  )
}
```

## Best Practices

1. **Contrast**: Ensure sufficient contrast between the background and molecular structures
2. **Theme Consistency**: Match the background to your application's theme
3. **User Preference**: Consider storing user's background preference in localStorage
4. **Accessibility**: Provide both light and dark options for user comfort

## Notes

- The background color is applied immediately
- Accepts any valid CSS color value
- The default background is typically white
- Background color affects fog color when fog is enabled
- Transparent backgrounds are not supported (use screenshot functionality for that)