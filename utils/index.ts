import { LoadConfig } from "../hooks/types"

export const sleep = (ms = 0) => new Promise(r => setTimeout(r, ms))

export const copyImage = async (dataUrl: string) => {
  try {
    const blob = await (await fetch(dataUrl)).blob()

    // Convert to PNG for clipboard if not already PNG
    if (blob.type !== 'image/png') {
      const img = new Image()
      img.src = dataUrl
      await new Promise(resolve => img.onload = resolve)

      const pngCanvas = document.createElement('canvas')
      pngCanvas.width = img.width
      pngCanvas.height = img.height
      const ctx = pngCanvas.getContext('2d')
      ctx?.drawImage(img, 0, 0)

      const pngBlob = await new Promise<Blob>(resolve => {
        pngCanvas.toBlob(blob => resolve(blob!), 'image/png')
      })

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob })
      ])
    } else {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
  }
}

export const downloadImage = async (dataUrl: string, filename: string) => {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

export const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

// Helper to detect format from extension
export const detectFormatFromExtension = (extension: string | undefined): string => {
  const formatMap: Record<string, string> = {
    'pdb': 'pdb',
    'cif': 'mmcif',
    'mmcif': 'mmcif',
    'sdf': 'sdf',
    'mol': 'mol',
    'mol2': 'mol'
  }
  return formatMap[extension?.toLowerCase() || ''] || 'mmcif'
}

// Helper to get URL and format from config
export const getStructureSource = (config: LoadConfig): { url: string, format: string } => {
  if (config.pdbId) {
    const url = `https://files.rcsb.org/download/${config.pdbId}.cif`
    return { url, format: 'mmcif' }
  }

  if (config.url) {
    const format = config.format || detectFormatFromExtension(config.url.split('.').pop())
    return { url: config.url, format }
  }

  if (config.file) {
    const url = URL.createObjectURL(config.file)
    const format = config.format || detectFormatFromExtension(config.file.name.split('.').pop())
    return { url, format }
  }

  throw new Error('No structure source provided')
}

// Helper to adjust color brightness
export const adjustColorBrightness = (color: number, lighten?: number, darken?: number): number => {
  if (!lighten && !darken) return color

  let r = (color >> 16) & 0xFF
  let g = (color >> 8) & 0xFF
  let b = color & 0xFF

  if (lighten) {
    // Lighten by moving towards white
    r = Math.min(255, r + Math.floor(lighten * (255 - r)))
    g = Math.min(255, g + Math.floor(lighten * (255 - g)))
    b = Math.min(255, b + Math.floor(lighten * (255 - b)))
  } else if (darken) {
    // Darken by moving towards black
    r = Math.max(0, Math.floor(r * (1 - darken)))
    g = Math.max(0, Math.floor(g * (1 - darken)))
    b = Math.max(0, Math.floor(b * (1 - darken)))
  }

  return (r << 16) | (g << 8) | b
}

export const hideNativeControlsStyle = () => {
  const styleId = 'molstar-hide-controls-style'
  let styleElement = document.getElementById(styleId)

  if (!styleElement) {
    styleElement = document.createElement('style')
    styleElement.id = styleId
    styleElement.textContent = `
      .msp-plugin .msp-layout-controls,
      .msp-plugin .msp-layout-expanded,
      .msp-plugin .msp-layout-collapsed,
      .msp-plugin .msp-viewport-controls,
      .msp-plugin .msp-viewport-control-group,
      .msp-plugin .msp-btn-link,
      .msp-plugin .msp-control-group-header,
      .msp-plugin .msp-transform-wrapper,
      .msp-plugin .msp-overlay,
      .msp-plugin .msp-highlight-info,
      .msp-plugin .msp-selection-viewport-controls {
        display: none !important;
      }
      
      .msp-plugin .msp-layout-main {
        top: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        left: 0 !important;
      }
      
      .msp-plugin .msp-canvas-container {
        width: 100% !important;
        height: 100% !important;
      }
    `
    document.head.appendChild(styleElement)
  }
}
