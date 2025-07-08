import { useMolstar } from './useMolstar'
import { useEffect, useState } from 'react'
import { hexToColor, colorToHex } from '../utils'
import { DEFAULT_MOLSTAR_ID } from './constants'

export interface AxesState {
  visible: boolean
  opacity: number  // alpha in Molstar
  scale: number
  location: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  locationOffsetX: number
  locationOffsetY: number
  radiusScale: number
  showLabels: boolean
  showPlanes: boolean
  // Axis colors
  x: string
  y: string
  z: string
  origin: string
  // Plane colors
  planeXY: string
  planeXZ: string
  planeYZ: string
  // Label settings
  labelX: string
  labelY: string
  labelZ: string
  labelColorX: string
  labelColorY: string
  labelColorZ: string
  labelOpacity: number
  labelScale: number
}

export interface AxesConfig {
  visible?: boolean
  opacity?: number  // alpha in Molstar
  scale?: number
  location?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  locationOffsetX?: number
  locationOffsetY?: number
  radiusScale?: number
  showLabels?: boolean
  showPlanes?: boolean
  // Axis colors
  x?: string
  y?: string
  z?: string
  origin?: string
  // Plane colors
  planeXY?: string
  planeXZ?: string
  planeYZ?: string
  // Label settings
  labelX?: string
  labelY?: string
  labelZ?: string
  labelColorX?: string
  labelColorY?: string
  labelColorZ?: string
  labelOpacity?: number
  labelScale?: number
}

type SetAxes = (config: AxesConfig | ((prev: AxesState) => AxesConfig)) => void

export function useAxes(id: string = DEFAULT_MOLSTAR_ID): [AxesState, SetAxes] {
  const molstar = useMolstar(id)

  // Default axes state - values from Molstar's AxesParams
  const defaultState: AxesState = {
    visible: false,
    opacity: 0.51,  // alpha default
    scale: 0.33,
    location: 'bottom-left',
    locationOffsetX: 0,
    locationOffsetY: 0,
    radiusScale: 0.075,
    showLabels: false,
    showPlanes: true,
    // Axis colors
    x: '#ff0000',  // red
    y: '#008000',  // green (0x008000)
    z: '#0000ff',  // blue
    origin: '#808080',  // grey
    // Plane colors (all grey by default)
    planeXY: '#808080',
    planeXZ: '#808080',
    planeYZ: '#808080',
    // Label settings
    labelX: 'X',
    labelY: 'Y',
    labelZ: 'Z',
    labelColorX: '#808080',  // grey
    labelColorY: '#808080',  // grey
    labelColorZ: '#808080',  // grey
    labelOpacity: 1,
    labelScale: 0.25
  }

  const [state, setState] = useState<AxesState>(defaultState)

  // Sync state with Molstar on mount and when Molstar loads
  useEffect(() => {
    if (!molstar?.loaded || !molstar?.canvas) return

    const canvas = molstar.canvas
    const currentCamera = canvas.props.camera || {}
    const currentHelper = currentCamera.helper || {}
    const axes = currentHelper.axes

    // Check if axes are configured
    if (!axes || axes.name === 'off') {
      setState(prev => ({ ...prev, visible: false }))
    } else {
      const params = axes.params || {}
      setState({
        visible: true,
        opacity: params.alpha ?? defaultState.opacity,
        scale: params.scale ?? defaultState.scale,
        location: params.location ?? defaultState.location,
        locationOffsetX: params.locationOffsetX ?? defaultState.locationOffsetX,
        locationOffsetY: params.locationOffsetY ?? defaultState.locationOffsetY,
        radiusScale: params.radiusScale ?? defaultState.radiusScale,
        showLabels: params.showLabels ?? defaultState.showLabels,
        showPlanes: params.showPlanes ?? defaultState.showPlanes,
        x: params.colorX ? colorToHex(params.colorX) : defaultState.x,
        y: params.colorY ? colorToHex(params.colorY) : defaultState.y,
        z: params.colorZ ? colorToHex(params.colorZ) : defaultState.z,
        origin: params.originColor ? colorToHex(params.originColor) : defaultState.origin,
        planeXY: params.planeColorXY ? colorToHex(params.planeColorXY) : defaultState.planeXY,
        planeXZ: params.planeColorXZ ? colorToHex(params.planeColorXZ) : defaultState.planeXZ,
        planeYZ: params.planeColorYZ ? colorToHex(params.planeColorYZ) : defaultState.planeYZ,
        labelX: params.labelX ?? defaultState.labelX,
        labelY: params.labelY ?? defaultState.labelY,
        labelZ: params.labelZ ?? defaultState.labelZ,
        labelColorX: params.labelColorX ? colorToHex(params.labelColorX) : defaultState.labelColorX,
        labelColorY: params.labelColorY ? colorToHex(params.labelColorY) : defaultState.labelColorY,
        labelColorZ: params.labelColorZ ? colorToHex(params.labelColorZ) : defaultState.labelColorZ,
        labelOpacity: params.labelOpacity ?? defaultState.labelOpacity,
        labelScale: params.labelScale ?? defaultState.labelScale
      })
    }
  }, [molstar?.loaded, molstar?.axes])

  const setAxes: SetAxes = (configOrUpdater) => {
    if (!molstar?.loaded || !molstar?.canvas) return

    const canvas = molstar.canvas
    const currentCamera = canvas.props.camera || {}
    const currentHelper = currentCamera.helper || {}

    // Handle function updater
    const config = typeof configOrUpdater === 'function'
      ? configOrUpdater(state)
      : configOrUpdater

    // Update local state
    const newState = { ...state, ...config }
    setState(newState)

    // Update Molstar
    if (newState.visible === false) {
      canvas.setProps({
        camera: {
          ...currentCamera,
          helper: {
            ...currentHelper,
            axes: { name: 'off', params: {} }
          }
        }
      })
    } else {
      const params: any = {
        alpha: newState.opacity,
        scale: newState.scale,
        location: newState.location,
        locationOffsetX: newState.locationOffsetX,
        locationOffsetY: newState.locationOffsetY,
        radiusScale: newState.radiusScale,
        showLabels: newState.showLabels,
        showPlanes: newState.showPlanes,
        colorX: hexToColor(newState.x),
        colorY: hexToColor(newState.y),
        colorZ: hexToColor(newState.z),
        originColor: hexToColor(newState.origin),
        planeColorXY: hexToColor(newState.planeXY),
        planeColorXZ: hexToColor(newState.planeXZ),
        planeColorYZ: hexToColor(newState.planeYZ),
        labelX: newState.labelX,
        labelY: newState.labelY,
        labelZ: newState.labelZ,
        labelColorX: hexToColor(newState.labelColorX),
        labelColorY: hexToColor(newState.labelColorY),
        labelColorZ: hexToColor(newState.labelColorZ),
        labelOpacity: newState.labelOpacity,
        labelScale: newState.labelScale
      }

      canvas.setProps({
        camera: {
          ...currentCamera,
          helper: {
            ...currentHelper,
            axes: { name: 'on', params }
          }
        }
      })
    }
    
    // Request redraw after updates
    molstar.draw()
  }

  return [state, setAxes]
}
