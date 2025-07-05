# useScreenshot

Hook for taking screenshots of the molecular viewer with various options including format, resolution, and transparency.

## Usage

```typescript
import { useScreenshot } from '../hooks/useScreenshot'

function ScreenshotControls() {
  const { screenshot, copyScreenshot, downloadScreenshot } = useScreenshot('viewer-1')
  
  const handleScreenshot = async () => {
    // Take screenshot and get data URL
    const dataUrl = await screenshot({
      transparent: true,
      format: 'png'
    })
    console.log('Screenshot taken:', dataUrl)
  }
  
  const handleCopy = async () => {
    // Copy to clipboard
    await copyScreenshot({
      transparent: false,
      format: 'png'
    })
  }
  
  const handleDownload = async () => {
    // Download as file
    await downloadScreenshot({
      filename: 'molecule.png',
      format: 'png',
      resolution: 2
    })
  }
  
  return (
    <div>
      <button onClick={handleScreenshot}>Take Screenshot</button>
      <button onClick={handleCopy}>Copy to Clipboard</button>
      <button onClick={handleDownload}>Download</button>
    </div>
  )
}
```

## API

### Return Value

Returns an object with three methods:

- `screenshot(options?)` - Take a screenshot and return data URL
- `copyScreenshot(options?)` - Copy screenshot to clipboard
- `downloadScreenshot(options?)` - Download screenshot as file

### ScreenshotOptions

```typescript
interface ScreenshotOptions {
  format?: 'png' | 'jpeg' | 'webp'
  quality?: number         // JPEG quality (0-100)
  transparent?: boolean    // Transparent background
  resolution?: number      // Resolution multiplier (1, 2, 4)
  axes?: boolean          // Include axes in screenshot
  autocrop?: boolean      // Auto-crop to content
  filename?: string       // Filename for download
}
```

## Examples

### Basic Screenshot

```typescript
const { screenshot } = useScreenshot('mol-1')

// Simple PNG screenshot
const dataUrl = await screenshot()
```

### High Resolution Export

```typescript
// 4x resolution for print
await downloadScreenshot({
  format: 'png',
  resolution: 4,
  filename: 'high-res-molecule.png'
})
```

### Transparent Background

```typescript
// For presentations/papers
await screenshot({
  transparent: true,
  format: 'png'
})
```

### JPEG with Quality

```typescript
// Smaller file size
await downloadScreenshot({
  format: 'jpeg',
  quality: 85,
  filename: 'molecule.jpg'
})
```

### Copy to Clipboard

```typescript
// Quick sharing
await copyScreenshot({
  format: 'png',
  transparent: true
})
```

### With Axes

```typescript
// Include orientation reference
await screenshot({
  axes: true,
  transparent: false
})
```

## Preset Resolutions

- `1` - Viewport resolution (1:1)
- `2` - HD resolution (2x)
- `4` - Ultra HD resolution (4x)

## Notes

- Screenshots capture the current view exactly as displayed
- Transparent backgrounds only work with PNG format
- JPEG format doesn't support transparency
- Higher resolutions may take longer to process
- Clipboard operations require secure context (HTTPS)