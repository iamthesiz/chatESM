import { LoadConfig } from "../hooks/types"
import { Vec3 } from 'molstar/lib/mol-math/linear-algebra'

export const sleep = (ms = 0) => new Promise(r => setTimeout(r, ms))

// Check if string is a PDB ID (4 characters, alphanumeric)
export const isPdbId = (str: string): boolean => {
  return /^[0-9A-Za-z]{4}$/.test(str)
}

// Check if string is a URL
export const isUrl = (str: string): boolean => {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

/**
 * Convert a Vec3 to a number array
 */
export function vec3ToArray(vec: Vec3): [number, number, number] {
  return [vec[0], vec[1], vec[2]]
}

/**
 * Convert a number array to a Vec3
 */
export function arrayToVec3(arr: [number, number, number]): Vec3 {
  return Vec3.create(arr[0], arr[1], arr[2])
}

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

// Convert hex color to Molstar color format (number)
export const hexToColor = (hex: string): number => {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  return (rgb.r << 16) | (rgb.g << 8) | rgb.b
}

// Convert Molstar color (number) to hex string
export const colorToHex = (color: number): string => {
  const r = (color >> 16) & 0xff
  const g = (color >> 8) & 0xff
  const b = color & 0xff
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
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
    // Use .bcif format which is more reliable and faster
    const url = `https://models.rcsb.org/${config.pdbId}.bcif`
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

/**
 * Set fog parameters for a Molstar instance
 * @param molstar - The Molstar plugin instance
 * @param options - Fog configuration options
 * @param options.intensity - Fog intensity (0-100, where 0 is no fog)
 * @param options.color - Fog color as hex string (optional, defaults to background color)
 * @param options.nearFactor - Factor to adjust fog near distance (optional)
 * @param options.farFactor - Factor to adjust fog far distance (optional)
 */
export const setFog = (molstar: any, options: {
  intensity?: number
  color?: string
  nearFactor?: number
  farFactor?: number
} = {}) => {
  if (!molstar?.canvas) {
    console.warn('Canvas3D not available in molstar instance')
    return
  }

  const canvas3d = molstar.canvas
  const camera = canvas3d.camera

  // Update fog intensity through Canvas3D props
  if (options.intensity !== undefined) {
    const intensity = Math.max(0, Math.min(100, options.intensity))
    
    canvas3d.setProps({
      cameraFog: intensity > 0 
        ? { name: 'on', params: { intensity } }
        : { name: 'off' }
    })
  }

  // Update fog distances directly on camera if custom factors provided
  if (options.nearFactor !== undefined || options.farFactor !== undefined) {
    const currentState = camera.state
    const cameraDistance = Math.sqrt(
      Math.pow(currentState.position[0] - currentState.target[0], 2) +
      Math.pow(currentState.position[1] - currentState.target[1], 2) +
      Math.pow(currentState.position[2] - currentState.target[2], 2)
    )

    if (options.nearFactor !== undefined) {
      camera.fogNear = cameraDistance * options.nearFactor
    }

    if (options.farFactor !== undefined) {
      camera.fogFar = cameraDistance * options.farFactor
    }

    // Trigger camera update
    camera.update()
  }

  // Update fog color through renderer background color
  if (options.color) {
    const color = hexToColor(options.color)
    canvas3d.setProps({
      renderer: {
        ...molstar.renderer,
        backgroundColor: color
      }
    })
  }
}

/**
 * Get current fog parameters from a Molstar instance
 * @param molstar - The Molstar plugin instance
 * @returns Current fog configuration
 */
export const getFog = (molstar: any): {
  intensity: number
  color: string
  fogNear: number
  fogFar: number
  enabled: boolean
} | null => {
  if (!molstar?.canvas) {
    console.warn('Canvas3D not available in molstar instance')
    return null
  }

  const canvas3d = molstar.canvas
  const camera = molstar.camera
  const props = canvas3d.props

  const fogEnabled = molstar.fog.name === 'on'
  const intensity = fogEnabled ? molstar.fog.params.intensity : 0
  const backgroundColor = molstar.renderer.backgroundColor
  const color = colorToHex(backgroundColor)

  return {
    intensity,
    color,
    fogNear: camera.fogNear,
    fogFar: camera.fogFar,
    enabled: fogEnabled
  }
}

// Re-export selection utilities
export * from './selection'
export * from './selection-types'
export * from './selection-builders'
export * from './selection-transforms'
