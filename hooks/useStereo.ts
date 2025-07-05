import { useState, useEffect } from 'react'
import { useMolstar } from './useMolstar'

export interface StereoState {
  enabled: boolean
  eyeSeparation: number
  focus: number
}

export interface StereoConfig {
  enabled?: boolean
  eyeSeparation?: number
  focus?: number
}

type SetStereo = (config: StereoConfig | ((prev: StereoState) => StereoConfig)) => void

export function useStereo(id?: string): [StereoState, SetStereo] {
  const molstar = useMolstar(id)
  
  // Default stereo state
  const defaultState: StereoState = {
    enabled: false,
    eyeSeparation: 0.064,
    focus: 10
  }
  
  const [state, setState] = useState<StereoState>(defaultState)
  
  // Sync state with Molstar on mount and when Molstar loads
  useEffect(() => {
    if (!molstar?.loaded || !molstar?.canvas) return
    
    const canvas = molstar.canvas
    const cameraProps = canvas.props.camera || {}
    const stereoConfig = cameraProps.stereo || { name: 'off', params: {} }
    
    setState({
      enabled: stereoConfig.name === 'on',
      eyeSeparation: stereoConfig.params?.eyeSeparation ?? defaultState.eyeSeparation,
      focus: stereoConfig.params?.focus ?? defaultState.focus
    })
  }, [molstar?.loaded])
  
  const setStereo: SetStereo = (configOrUpdater) => {
    if (!molstar?.loaded || !molstar?.canvas) return
    
    const canvas = molstar.canvas
    
    // Handle function updater
    const config = typeof configOrUpdater === 'function'
      ? configOrUpdater(state)
      : configOrUpdater
    
    // Update local state
    const newState = { ...state, ...config }
    setState(newState)
    
    // Update Molstar
    const params: any = {
      eyeSeparation: newState.eyeSeparation,
      focus: newState.focus
    }
    
    canvas.setProps({
      camera: {
        ...canvas.props.camera,
        stereo: { 
          name: newState.enabled ? 'on' : 'off', 
          params 
        }
      }
    })
    
    // Stereo mode changes require special handling
    if (config.enabled !== undefined) {
      canvas.commit(true)
      setTimeout(() => {
        canvas.handleResize()
        molstar.draw()
      }, 50)
    } else {
      molstar.draw()
    }
  }
  
  return [state, setStereo]
}