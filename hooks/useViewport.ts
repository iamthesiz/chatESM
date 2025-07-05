import { useState, useEffect } from 'react'
import { useMolstar } from './useMolstar'

export interface ViewportState {
  width: number
  height: number
  offsetX: number
  offsetY: number
  pixelRatio: number
  mode: 'canvas' | 'static-frame' | 'relative-frame'
}

export interface ViewportConfig {
  width?: number
  height?: number
  offsetX?: number
  offsetY?: number
  pixelRatio?: number
  mode?: 'canvas' | 'static-frame' | 'relative-frame'
}

type SetViewport = (config: ViewportConfig | ((prev: ViewportState) => ViewportConfig)) => void

export function useViewport(id?: string): [ViewportState, SetViewport] {
  const molstar = useMolstar(id)
  
  // Default viewport state
  const defaultState: ViewportState = {
    width: 800,
    height: 600,
    offsetX: 0,
    offsetY: 0,
    pixelRatio: window.devicePixelRatio || 1,
    mode: 'canvas'
  }
  
  const [state, setState] = useState<ViewportState>(defaultState)
  
  // Sync state with Molstar on mount and when Molstar loads
  useEffect(() => {
    if (!molstar?.loaded || !molstar?.canvas) return
    
    const canvas = molstar.canvas
    const webgl = canvas.webgl
    const viewportMode = canvas.props.viewport || 'canvas'
    
    if (webgl) {
      setState({
        width: webgl.gl.drawingBufferWidth,
        height: webgl.gl.drawingBufferHeight,
        offsetX: 0,
        offsetY: 0,
        pixelRatio: webgl.pixelRatio,
        mode: viewportMode as ViewportState['mode']
      })
    }
    
    // Listen for resize events
    const handleResize = () => {
      if (webgl) {
        setState(prev => ({
          ...prev,
          width: webgl.gl.drawingBufferWidth,
          height: webgl.gl.drawingBufferHeight
        }))
      }
    }
    
    // Subscribe to canvas resize events if available
    const resizeObserver = new ResizeObserver(handleResize)
    const canvasElement = webgl?.gl.canvas as HTMLCanvasElement
    if (canvasElement) {
      resizeObserver.observe(canvasElement)
    }
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [molstar?.loaded])
  
  const setViewport: SetViewport = (configOrUpdater) => {
    if (!molstar?.loaded || !molstar?.canvas) return
    
    const canvas = molstar.canvas
    
    // Handle function updater
    const config = typeof configOrUpdater === 'function'
      ? configOrUpdater(state)
      : configOrUpdater
    
    // Update local state
    const newState = { ...state, ...config }
    setState(newState)
    
    // Update viewport mode if changed
    if (config.mode !== undefined) {
      canvas.setProps({ viewport: newState.mode })
    }
    
    // For static-frame mode, update the frame dimensions
    if (newState.mode === 'static-frame' && (config.width !== undefined || config.height !== undefined)) {
      // This would require additional Molstar configuration
      // The actual implementation depends on how Molstar handles static frames
      console.warn('Static frame dimensions update not yet implemented')
    }
    
    // Handle pixel ratio changes
    if (config.pixelRatio !== undefined && canvas.webgl) {
      canvas.webgl.setPixelRatio(newState.pixelRatio)
      canvas.handleResize()
    }
    
    // Request redraw
    molstar.draw()
  }
  
  return [state, setViewport]
}