import { useState, useEffect } from 'react'
import { useMolstar } from './useMolstar'

export interface ClippingState {
  enabled: boolean
  near: number
  far: number
  radius: number
  clipFar: boolean
  minNear: number
  minFar: number
}

export interface ClippingConfig {
  enabled?: boolean
  near?: number
  far?: number
  radius?: number
  clipFar?: boolean
  minNear?: number
  minFar?: number
}

type SetClipping = (config: ClippingConfig | ((prev: ClippingState) => ClippingConfig)) => void

export function useClipping(id?: string): [ClippingState, SetClipping] {
  const molstar = useMolstar(id)
  
  // Default clipping state
  const defaultState: ClippingState = {
    enabled: true,
    near: 0.1,
    far: 10000,
    radius: 100,
    clipFar: true,
    minNear: 0.1,
    minFar: 100
  }
  
  const [state, setState] = useState<ClippingState>(defaultState)
  
  // Sync state with Molstar on mount and when Molstar loads
  useEffect(() => {
    if (!molstar?.loaded || !molstar?.camera || !molstar?.canvas) return
    
    const camera = molstar.camera
    const canvas = molstar.canvas
    const cameraSnapshot = camera.state
    const cameraClipping = canvas.props.cameraClipping || {}
    
    setState({
      enabled: cameraClipping.far !== false,
      near: camera.near ?? defaultState.near,
      far: camera.far ?? defaultState.far,
      radius: cameraClipping.radius ?? defaultState.radius,
      clipFar: cameraSnapshot?.clipFar ?? defaultState.clipFar,
      minNear: cameraSnapshot?.minNear ?? defaultState.minNear,
      minFar: cameraSnapshot?.minFar ?? defaultState.minFar
    })
  }, [molstar?.loaded])
  
  const setClipping: SetClipping = (configOrUpdater) => {
    if (!molstar?.loaded || !molstar?.camera || !molstar?.canvas) return
    
    const camera = molstar.camera
    const canvas = molstar.canvas
    
    // Handle function updater
    const config = typeof configOrUpdater === 'function'
      ? configOrUpdater(state)
      : configOrUpdater
    
    // Update local state
    const newState = { ...state, ...config }
    setState(newState)
    
    // Update canvas props for clipping
    const clippingProps: any = {}
    if (config.radius !== undefined) clippingProps.radius = newState.radius
    if (config.clipFar !== undefined) clippingProps.far = newState.clipFar
    if (config.minNear !== undefined) clippingProps.minNear = newState.minNear
    
    if (Object.keys(clippingProps).length > 0) {
      canvas.setProps({ 
        cameraClipping: { 
          ...canvas.props.cameraClipping, 
          ...clippingProps 
        } 
      })
    }
    
    // Update camera state for clipping
    const stateUpdates: any = {}
    if (config.clipFar !== undefined) stateUpdates.clipFar = newState.clipFar
    if (config.minNear !== undefined) stateUpdates.minNear = newState.minNear
    if (config.minFar !== undefined) stateUpdates.minFar = newState.minFar
    
    if (Object.keys(stateUpdates).length > 0) {
      camera.setState(stateUpdates)
    }
    
    // Request redraw
    molstar.draw()
  }
  
  return [state, setClipping]
}