import { useState, useEffect } from 'react'
import { useMolstar } from './useMolstar'

export interface FogState {
  enabled: boolean
  intensity: number
  near: number
  far: number
}

export interface FogConfig {
  enabled?: boolean
  intensity?: number
  near?: number
  far?: number
}

type SetFog = (config: FogConfig | ((prev: FogState) => FogConfig)) => void

export function useFog(id?: string): [FogState, SetFog] {
  const molstar = useMolstar(id)
  
  // Default fog state
  const defaultState: FogState = {
    enabled: false,
    intensity: 50,
    near: 0,
    far: 100
  }
  
  const [state, setState] = useState<FogState>(defaultState)
  
  // Sync state with Molstar on mount and when Molstar loads
  useEffect(() => {
    if (!molstar?.loaded || !molstar?.camera || !molstar?.canvas) return
    
    const camera = molstar.camera
    const canvas = molstar.canvas
    const cameraFog = canvas.props.cameraFog || { name: 'off', params: {} }
    
    setState({
      enabled: cameraFog.name === 'on',
      intensity: cameraFog.params?.intensity ?? defaultState.intensity,
      near: camera.fogNear ?? defaultState.near,
      far: camera.fogFar ?? defaultState.far
    })
  }, [molstar?.loaded])
  
  const setFog: SetFog = (configOrUpdater) => {
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
    
    // Update Molstar - fog intensity through Canvas3D props
    if (config.enabled !== undefined || config.intensity !== undefined) {
      canvas.setProps({
        cameraFog: newState.enabled 
          ? { name: 'on', params: { intensity: newState.intensity } }
          : { name: 'off', params: {} }
      })
    }
    
    // Update fog distances on camera
    if (config.near !== undefined) {
      camera.fogNear = newState.near
    }
    if (config.far !== undefined) {
      camera.fogFar = newState.far
    }
    
    // Request redraw
    molstar.draw()
  }
  
  return [state, setFog]
}