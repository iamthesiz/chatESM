import { useMolstar } from './useMolstar'
import { useBackground } from './useBackground'
import { copyImage, downloadImage } from '../utils'
import type { ScreenshotOptions } from './types'

export interface ScreenshotActions {
  screenshot: (options?: ScreenshotOptions) => Promise<string | void>
  copyScreenshot: (options?: ScreenshotOptions) => Promise<void>
  downloadScreenshot: (options?: ScreenshotOptions) => Promise<void>
}

export function useScreenshot(id?: string): ScreenshotActions {
  const molstar = useMolstar(id)
  const [background, setBackground] = useBackground(id)

  // Helper to capture screenshot using canvas directly
  const captureFromCanvas = async (options?: ScreenshotOptions): Promise<string | void> => {
    const plugin = molstar
    if (!plugin?.canvas) return

    // Store current background to restore later
    const originalBackground = background.color

    if (options?.transparent) {
      setBackground('transparent')
    }

    try {
      const canvas = plugin.canvas.webgl.gl.canvas as HTMLCanvasElement
      const dataUrl = options?.format === 'jpeg'
        ? canvas.toDataURL('image/jpeg', options.quality ? options.quality / 100 : 0.9)
        : canvas.toDataURL('image/png')

      if (options?.transparent && originalBackground) {
        setBackground(originalBackground)
      }

      return dataUrl
    } catch (error) {
      console.error('Failed to capture from canvas:', error)
      if (options?.transparent && originalBackground) {
        setBackground(originalBackground)
      }
    }
  }

  // Helper to capture using viewport screenshot helper
  const captureWithHelper = async (options?: ScreenshotOptions): Promise<string | void> => {
    const helper = molstar?.helpers?.viewportScreenshot
    if (!helper) return

    const currentAxes = molstar?.axes
    const params: any = {
      ...helper.values,
      transparent: options?.transparent ?? false
    }

    if (options?.axes !== undefined) {
      if (options.axes) {
        params.axes = currentAxes || { name: 'on', params: { alpha: 1, scale: 2 } }
      } else {
        params.axes = { name: 'off', params: {} }
      }
    }

    if (options?.resolution) {
      const presets: Record<number, string> = { 1: 'viewport', 2: 'hd', 4: 'ultra-hd' }
      const presetName = presets[options.resolution]

      if (presetName) {
        params.resolution = { name: presetName, params: {} }
      } else {
        const canvas = molstar?.canvas?.webgl.gl.canvas as HTMLCanvasElement
        if (canvas) {
          params.resolution = {
            name: 'custom',
            params: {
              width: canvas.width * options.resolution,
              height: canvas.height * options.resolution
            }
          }
        }
      }
    }

    params.format = options?.format === 'jpeg'
      ? { name: 'jpeg', params: { quality: options?.quality ?? 90 } }
      : { name: 'png', params: {} }

    helper.behaviors.values.next(params)

    if (options?.autocrop) {
      helper.autocrop()
    }

    try {
      return await helper.getImageDataUri()
    } catch (error) {
      console.error('Failed to capture with helper:', error)
    }
  }

  const screenshot = async (options?: ScreenshotOptions): Promise<string | void> => {
    if (!molstar?.loaded) return

    const helper = molstar.helpers?.viewportScreenshot

    if (helper) {
      return captureWithHelper(options)
    } else {
      return captureFromCanvas(options)
    }
  }

  // Copy screenshot to clipboard
  const copyScreenshot = async (options?: ScreenshotOptions): Promise<void> => {
    const dataUrl = await screenshot(options)
    if (!dataUrl) return

    const helper = molstar?.helpers?.viewportScreenshot
    helper ? await helper.copyToClipboard() : copyImage(dataUrl)
  }

  // Download screenshot
  const downloadScreenshot = async (options?: ScreenshotOptions): Promise<void> => {
    const dataUrl = await screenshot(options)
    if (!dataUrl) return

    const helper = molstar?.helpers?.viewportScreenshot
    if (helper) {
      await helper.download(options?.filename || helper.getFilename())
    } else {
      const filename = options?.filename || `molecule-${Date.now()}.${options?.format || 'png'}`
      await downloadImage(dataUrl, filename)
    }
  }

  return {
    screenshot,
    copyScreenshot,
    downloadScreenshot
  }
}