/**
 * useCamera Hook
 * 
 * Provides comprehensive camera state management for Molstar viewers.
 * Composes multiple specialized hooks (fog, clipping, stereo, axes, viewport)
 * into a unified camera interface.
 * 
 * TODO: Integrate PluginCommands.Camera for high-level camera operations:
 * - PluginCommands.Camera.Reset - Reset camera to default view
 * - PluginCommands.Camera.OrientAxes - Orient camera to axes
 * - PluginCommands.Camera.ResetAxes - Reset axes orientation
 * - PluginCommands.Camera.Focus - Focus on specific elements
 * 
 * These could be exposed as methods on the returned state object:
 * const [camera, setCamera] = useCamera(id)
 * camera.reset() // Uses PluginCommands.Camera.Reset
 * camera.orientAxes() // Uses PluginCommands.Camera.OrientAxes
 * camera.focus(selection) // Uses PluginCommands.Camera.Focus
 */
import { useCallback, useMemo, useReducer } from 'react'
import { PluginCommands } from 'molstar/lib/mol-plugin/commands'
import { useMolstar } from './useMolstar'
import { useAxes, AxesState } from './useAxes'
import { useFog, FogState } from './useFog'
import { useClipping, ClippingState } from './useClipping'
import { useStereo, StereoState } from './useStereo'
import { useViewport, ViewportState } from './useViewport'
import { vec3ToArray, arrayToVec3 } from '../utils'
import { DEFAULT_MOLSTAR_ID } from './constants'

export interface CameraState {
  // Core camera state
  position: [number, number, number]
  target: [number, number, number]
  up: [number, number, number]
  mode: 'perspective' | 'orthographic'
  fov: number
  radius: number
  radiusMax: number
  zoom: number

  // Animation
  animation: {
    type: 'off' | 'spin' | 'rock'
    speed: number
    angle?: number  // for rock animation
  }

  // States from individual hooks
  clipping: ClippingState
  fog: FogState
  axes: AxesState
  stereo: StereoState
  viewport: Omit<ViewportState, 'pixelRatio' | 'mode'>  // Exclude properties not needed in camera
  
  // Camera action methods
  reset: (options?: { durationMs?: number }) => void
  orientAxes: (options?: { durationMs?: number }) => void
  resetAxes: (options?: { durationMs?: number }) => void
  focus: (selection?: any, options?: { durationMs?: number }) => void
  center: (options?: { durationMs?: number }) => void
}

// For SetCamera, allow partial animation updates
type SetCameraUpdates = Omit<CameraState, 'reset' | 'orientAxes' | 'resetAxes' | 'focus' | 'center' | 'animation'> & {
  animation?: {
    type?: 'off' | 'spin' | 'rock'
    speed?: number
    angle?: number
  } | 'off' | 'spin' | 'rock'  // Allow shorthand for just setting type
}

export type SetCamera = (updates: Partial<SetCameraUpdates>) => void

// Default state when molstar is not loaded
const defaultCameraCore = {
  position: [0, 0, 0] as [number, number, number],
  target: [0, 0, 0] as [number, number, number],
  up: [0, 1, 0] as [number, number, number],
  mode: 'perspective' as const,
  fov: 45,
  radius: 0,
  radiusMax: 0,
  zoom: 1,
  animation: {
    type: 'off' as const,
    speed: 1
  }
}

export function useCamera(id: string = DEFAULT_MOLSTAR_ID): [CameraState, SetCamera] {
  const molstar = useMolstar(id)
  const [axes, setAxes] = useAxes(id)
  const [fog, setFog] = useFog(id)
  const [clipping, setClipping] = useClipping(id)
  const [stereo, setStereo] = useStereo(id)
  const [viewport, setViewport] = useViewport(id)
  const rerender = useReducer((x: number) => x + 1, 0)[1]

  // Camera action methods
  const reset = useCallback((options?: { durationMs?: number }) => {
    if (!molstar?.loaded) return
    PluginCommands.Camera.Reset(molstar, { durationMs: options?.durationMs ?? 250 })
  }, [molstar])
  
  const orientAxes = useCallback((options?: { durationMs?: number }) => {
    if (!molstar?.loaded) return
    PluginCommands.Camera.OrientAxes(molstar, { durationMs: options?.durationMs ?? 250 })
  }, [molstar])
  
  const resetAxes = useCallback((options?: { durationMs?: number }) => {
    if (!molstar?.loaded) return
    PluginCommands.Camera.ResetAxes(molstar, { durationMs: options?.durationMs ?? 250 })
  }, [molstar])
  
  const focus = useCallback((selection?: any, options?: { durationMs?: number }) => {
    if (!molstar?.loaded) return
    const durationMs = options?.durationMs ?? 250
    
    if (selection) {
      // If selection/loci provided, use focusLoci
      molstar.managers.camera.focusLoci(selection)
    } else {
      // Otherwise do a general reset/focus
      PluginCommands.Camera.Reset(molstar, { durationMs })
    }
  }, [molstar])
  
  const center = useCallback((options?: { durationMs?: number }) => {
    if (!molstar?.loaded) return
    PluginCommands.Camera.Reset(molstar, { durationMs: options?.durationMs ?? 250 })
  }, [molstar])

  // Build the current camera state
  const cameraState = useMemo((): CameraState => {
    const states = { clipping, fog, axes, stereo, viewport }

    if (!molstar?.camera || !molstar?.canvas) {
      return { 
        ...defaultCameraCore, 
        ...states,
        reset,
        orientAxes,
        resetAxes,
        focus,
        center
      }
    }

    // Get camera state
    const { camera, trackball, canvas } = molstar
    const cameraSnapshot = camera.state
    const cameraMode = canvas.props.camera?.mode || 'perspective'

    // Build animation state
    const animationConfig = trackball.animate || { name: 'off', params: {} }
    const animation = {
      type: animationConfig.name as 'off' | 'spin' | 'rock',
      speed: animationConfig.params?.speed ?? 1,
      angle: animationConfig.name === 'rock' ? (animationConfig.params?.angle ?? 15) : undefined
    }

    return {
      // Core camera state
      position: cameraSnapshot ? vec3ToArray(cameraSnapshot.position) : defaultCameraCore.position,
      target: cameraSnapshot ? vec3ToArray(cameraSnapshot.target) : defaultCameraCore.target,
      up: cameraSnapshot ? vec3ToArray(cameraSnapshot.up) : defaultCameraCore.up,
      mode: cameraMode,
      fov: cameraSnapshot?.fov ? (cameraSnapshot.fov * 180 / Math.PI) : defaultCameraCore.fov, // Convert from radians
      radius: cameraSnapshot?.radius || defaultCameraCore.radius,
      radiusMax: cameraSnapshot?.radiusMax || defaultCameraCore.radiusMax,
      zoom: 1, // TODO: Calculate zoom from camera state

      // Use states from individual hooks
      ...states,
      animation,
      
      // Camera actions
      reset,
      orientAxes,
      resetAxes,
      focus,
      center
    }
  }, [molstar?.camera, molstar?.canvas, molstar?.canvas?.props?.camera?.mode, molstar?.loaded, axes, fog, clipping, stereo, viewport, reset, orientAxes, resetAxes, focus, center])

  // Update camera state
  const setCamera = useCallback((updates: Partial<CameraState>) => {
    if (!molstar?.camera || !molstar?.canvas) return
    const { camera } = molstar

    if (updates.mode) {
      molstar.canvas.setProps({
        camera: {
          ...molstar.canvas.props.camera,
          mode: updates.mode
        }
      })
    }

    // Handle core camera state updates (position, target, up, fov)
    if (updates.position || updates.target || updates.up || updates.fov) {
      const snapshot: any = {}

      if (updates.position) snapshot.position = arrayToVec3(updates.position)
      if (updates.target) snapshot.target = arrayToVec3(updates.target)
      if (updates.up) snapshot.up = arrayToVec3(updates.up)
      if (updates.fov !== undefined) snapshot.fov = updates.fov * Math.PI / 180 // Convert to radians

      camera.setState(snapshot)
    }

    updates.zoom !== undefined && camera.zoom(updates.zoom)
    updates.clipping && setClipping(updates.clipping)
    updates.fog && setFog(updates.fog)
    updates.axes && setAxes(updates.axes)
    updates.stereo && setStereo(updates.stereo)
    updates.viewport && setViewport(updates.viewport)

    // Handle animation updates
    if (updates.animation !== undefined) {
      let animationType: string
      let animationSpeed: number | undefined
      let animationAngle: number | undefined

      // Handle both shorthand string and object forms
      if (typeof updates.animation === 'string') {
        animationType = updates.animation
      } else {
        animationType = updates.animation.type ?? molstar.trackball?.animate?.name ?? 'off'
        animationSpeed = updates.animation.speed
        animationAngle = updates.animation.angle
      }

      const animateConfig: any = { name: animationType }
      if (animationType !== 'off') {
        // Use provided speed, or keep current speed, or default to 1
        const currentSpeed = molstar.trackball?.animate?.params?.speed
        animateConfig.params = { speed: animationSpeed ?? currentSpeed ?? 1 }
        
        if (animationType === 'rock') {
          // Use provided angle, or keep current angle, or default to 15
          const currentAngle = molstar.trackball?.animate?.params?.angle
          animateConfig.params.angle = animationAngle ?? currentAngle ?? 15
        }
      }

      molstar.canvas.setProps({
        trackball: {
          ...molstar.trackball,
          animate: animateConfig
        }
      })
    }

    molstar.draw()
    rerender()
  }, [molstar, setAxes, setFog, setClipping, setStereo, setViewport, rerender])

  return [cameraState, setCamera]
}
