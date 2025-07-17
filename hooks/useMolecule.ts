import { useState, useMemo, useReducer } from 'react'
import { Color } from 'molstar/lib/mol-util/color'
import { PluginStateObject } from 'molstar/lib/mol-plugin-state/objects'
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms'
import { useMolstar } from './useMolstar'
import { useCamera } from './useCamera'
import { useBackground } from './useBackground'
import { useScreenshot } from './useScreenshot'
import { DEFAULT_MOLSTAR_ID } from './constants'
import 'molstar/lib/mol-plugin-ui/skin/light.scss'

import type {
  MoleculeInstance,
  MoleculeState,
  LoadConfig,
  AppearanceConfig,
  CameraConfig,
  QualitySettings,
  SelectionConfig,
  UseMolstarReturn,
  OcclusionSettings,
  DofSettings
} from './types'

import {
  parseSelectionQuery,
  buildMolstarSelection,
  DEFAULT_OCCLUSION_PARAMS,
  DEFAULT_MULTISCALE_LEVELS,
  DEFAULT_DOF_PARAMS,
  DEFAULT_SHADOW_PARAMS,
  DEFAULT_OUTLINE_PARAMS,
  DEFAULT_FOG_INTENSITY,
  STYLE_PRESETS,
  representationMap,
  granularityMap,
  lightingPresets
} from '../utils/molstar-selections'
import { hideNativeControlsStyle } from '../utils'

export function useMolecule(id: string = DEFAULT_MOLSTAR_ID): [MoleculeInstance, UseMolstarReturn['setters']] {
  const molstar = useMolstar(id)
  const [selections, setSelections] = useState<string[]>([])
  const [camera, setCamera] = useCamera(id)
  const [background, setBackground] = useBackground(id)

  const rerender = useReducer((x: number) => x + 1, 0)[1]


  const setProps = (props: any, forceRedraw = false) => {
    if (!molstar?.loaded) return
    molstar.canvas.setProps(props)
    if (forceRedraw) {
      molstar.draw()
    }
  }

  const setRenderer = (renderer: any, redraw?: boolean) => {
    if (!molstar?.loaded) return
    const currentRenderer = molstar.canvas?.props?.renderer || {}
    const newRenderer = { ...currentRenderer, ...renderer }
    setProps({ renderer: newRenderer }, redraw)
  }

  const setPostprocessing = (config: any, redraw?: boolean) => {
    if (!molstar?.loaded) return
    const current = molstar.canvas.props.postprocessing || {}
    const updated = { ...current, ...config }
    setProps({ postprocessing: updated }, redraw)
  }

  const setOutline = (outline: { on: boolean, params?: any }) => {
    if (typeof outline === 'undefined') return
    if (outline.on) {
      setPostprocessing({
        outline: {
          name: 'on',
          params: outline.params || DEFAULT_OUTLINE_PARAMS
        }
      })
    } else {
      setPostprocessing({ outline: { name: 'off', params: {} } })
    }
  }

  const setOcclusion = (occlusion: boolean | OcclusionSettings) => {
    if (!molstar?.loaded || typeof occlusion === 'undefined') return

    if (typeof occlusion === 'boolean') {
      const occlusionSetting = occlusion ? {
        name: 'on',
        params: {
          ...DEFAULT_OCCLUSION_PARAMS,
          multiScale: { name: 'off', params: {} },
          color: Color(0x000000)
        }
      } : { name: 'off', params: {} }

      setPostprocessing({ occlusion: occlusionSetting })
    } else {
      // Detailed occlusion settings
      const occ = occlusion
      if (occ.enabled) {
        const multiScale = occ.multiScale?.enabled ? {
          name: 'on' as const,
          params: {
            levels: occ.multiScale.levels || DEFAULT_MULTISCALE_LEVELS,
            nearThreshold: occ.multiScale.nearThreshold || 10,
            farThreshold: occ.multiScale.farThreshold || 1500
          }
        } : { name: 'off' as const, params: {} }

        setPostprocessing({
          occlusion: {
            name: 'on',
            params: {
              samples: occ.samples || DEFAULT_OCCLUSION_PARAMS.samples,
              multiScale,
              radius: occ.radius || DEFAULT_OCCLUSION_PARAMS.radius,
              bias: occ.bias || DEFAULT_OCCLUSION_PARAMS.bias,
              blurKernelSize: occ.blurKernelSize || DEFAULT_OCCLUSION_PARAMS.blurKernelSize,
              blurDepthBias: occ.blurDepthBias || DEFAULT_OCCLUSION_PARAMS.blurDepthBias,
              resolutionScale: occ.resolutionScale || DEFAULT_OCCLUSION_PARAMS.resolutionScale,
              color: occ.color ? Color(parseInt(occ.color.replace('#', '0x'))) : Color(0x000000),
              transparentThreshold: occ.transparentThreshold || DEFAULT_OCCLUSION_PARAMS.transparentThreshold
            }
          }
        })
      } else {
        // When enabled is false, turn off occlusion completely (ignore any other params)
        setPostprocessing({ occlusion: { name: 'off', params: {} } })
      }
    }
  }

  const setDof = (blur: boolean | DofSettings) => {
    if (typeof blur === 'undefined') return
    if (typeof blur === 'boolean') {
      setPostprocessing({
        dof: {
          name: blur ? 'on' : 'off',
          params: blur ? DEFAULT_DOF_PARAMS : {}
        }
      })
    } else {
      // Detailed DOF settings
      const dof = blur
      setPostprocessing({
        dof: {
          name: dof.enabled ? 'on' : 'off',
          params: dof.enabled ? {
            blurSize: dof.blurSize || DEFAULT_DOF_PARAMS.blurSize,
            blurSpread: dof.blurSpread || DEFAULT_DOF_PARAMS.blurSpread,
            inFocus: dof.inFocus || DEFAULT_DOF_PARAMS.inFocus,
            PPM: dof.ppm || DEFAULT_DOF_PARAMS.PPM,
            center: dof.center || DEFAULT_DOF_PARAMS.center,
            mode: dof.mode || DEFAULT_DOF_PARAMS.mode
          } : {}
        }
      })
    }
  }

  const setShadow = (shadow: { on: boolean, params?: any }, redraw?: boolean) => {
    if (typeof shadow === 'undefined') return
    if (shadow.on) {
      setPostprocessing({
        shadow: {
          name: 'on',
          params: shadow.params || DEFAULT_SHADOW_PARAMS
        }
      }, redraw)
    } else {
      setPostprocessing({ shadow: { name: 'off', params: {} } }, redraw)
    }
  }

  // Fog is now handled by useCamera/useFog hooks

  // Get screenshot functions from useScreenshot hook
  const { screenshot, copyScreenshot, downloadScreenshot } = useScreenshot(id)

  const setIllumination = (lighting: string, lighten?: number, darken?: number) => {
    if (!molstar?.loaded || typeof lighting === 'undefined') return
    // Apply base lighting preset
    if (lighting && !lighten && !darken) {
      const preset = lightingPresets[lighting]
      if (preset) {
        const illumination = { ...molstar.illumination, ...preset }
        setProps({ illumination })
      }
    }

    // Apply lighten/darken adjustments
    if (lighten || darken) {
      const baseLighting = lighting ? {
        bright: { lightIntensity: 1.0, ambientIntensity: 0.4 },
        soft: { lightIntensity: 0.6, ambientIntensity: 0.6 },
        dramatic: { lightIntensity: 0.8, ambientIntensity: 0.2 },
        off: { lightIntensity: 0, ambientIntensity: 1.0 }
      }[lighting] : { lightIntensity: 0.6, ambientIntensity: 0.6 }

      let adjustedIntensity = baseLighting.lightIntensity
      let adjustedAmbient = baseLighting.ambientIntensity

      if (lighten) {
        // For lightening, we need to increase ambient light significantly
        // This will make dark areas more visible
        adjustedIntensity = Math.min(2.0, baseLighting.lightIntensity + lighten * 1.5)
        adjustedAmbient = Math.min(1.5, baseLighting.ambientIntensity + lighten)
      } else if (darken) {
        // For darkening, reduce both light sources
        adjustedIntensity = Math.max(0, baseLighting.lightIntensity * (1 - darken * 0.8))
        adjustedAmbient = Math.max(0, baseLighting.ambientIntensity * (1 - darken))
      }

      const illumination = {
        ...molstar.illumination,
        lightIntensity: adjustedIntensity,
        ambientIntensity: adjustedAmbient
      }
      setProps({ illumination })
    }
  }

  const setQualityLevel = (level: 'high' | 'medium' | 'low') => {
    const qualityPresets = {
      high: { multiSample: { mode: 'on' as const, sampleLevel: 4 } },
      medium: { multiSample: { mode: 'on' as const, sampleLevel: 2 } },
      low: { multiSample: { mode: 'off' as const } }
    }

    if (qualityPresets[level]) {
      setProps(qualityPresets[level], true)
    }
  }

  const setCameraAnimation = (animation: 'off' | 'spin' | 'rock') => {
    if (typeof animation === 'undefined') return
    setCamera({
      animation: {
        type: animation,
        speed: 1,
        angle: animation === 'rock' ? 15 : undefined
      }
    })
  }

  const applyQualitySettings = (quality: QualitySettings) => {
    if (!molstar?.loaded) return

    if (quality.level) {
      setQualityLevel(quality.level)
    }

    setOcclusion(quality.occlusion)

    if (quality.postprocessing?.outline) {
      setOutline({
        on: quality.postprocessing.outline.enabled,
        params: quality.postprocessing.outline.enabled ? {
          scale: quality.postprocessing.outline.scale || 1,
          color: 0x000000,
          threshold: 0.33,
          includeTransparent: true
        } : undefined
      })
    }
    setDof(quality.postprocessing?.blur)
  }

  const applyRepresentation = async (molstar: any, style: string, color?: string) => {
    if (!molstar?.loaded) return

    const representationType = representationMap[style] || 'cartoon'
    const colorTheme = color || 'chain-id'

    // Find protein representations
    const proteinReprs = molstar.state.data.selectQ((q: any) =>
      q.ofType(PluginStateObject.Molecule.Structure.Representation3D)
    ).filter((repr: any) => {
      const label = repr.obj?.label?.toLowerCase() || ''
      return label.includes('protein') || label.includes('polymer')
    })

    if (proteinReprs.length === 0) return

    // Update protein representations
    const update = molstar.state.data.build()
    proteinReprs.forEach((repr: any) => {
      update.to(repr).update(StateTransforms.Representation.StructureRepresentation3D, {
        type: { name: representationType, params: {} },
        colorTheme: { name: colorTheme, params: {} }
      })
    })

    await update.commit()
  }

  const load = async (config: LoadConfig) => {
    if (!molstar || !molstar.load) {
      throw new Error('Molstar not available')
    }

    try {
      await molstar.load(config)

      if (config.hideNativeControls) {
        await hideAllNativeControls()
      }

      if (config.background) setBackground(config.background)
      if (config.lighting) setIllumination(config.lighting)
      if (config.quality) setQualityLevel(config.quality)
      if (config.animate) setCameraAnimation(config.animate as any)
      if (config.protein) await applyRepresentation(molstar, config.protein.style || 'cartoon', config.protein.color || 'chain-id')
      if (config.autoZoom !== false) camera.reset?.({ durationMs: 250 })
    } catch (error) {
      throw error
    }
  }

  const fullscreen = () => {
    if (!molstar?.ref) return
    document.fullscreenElement ? document.exitFullscreen() : molstar.ref.requestFullscreen()
  }

  // Delegate camera actions to useCamera hook with default 250ms duration
  const resetZoom = () => camera.reset?.({ durationMs: 250 })
  const resetCamera = () => camera.reset?.({ durationMs: 250 })
  const orientAxes = () => camera.orientAxes?.({ durationMs: 250 })
  const resetAxes = () => camera.resetAxes?.({ durationMs: 250 })
  const center = () => camera.center?.({ durationMs: 250 })

  const focus = (selection: string) => {
    if (!molstar?.loaded) return

    const parsed = parseSelectionQuery(selection)
    const script = buildMolstarSelection(molstar, parsed)

    const selected = molstar.selection.fromScript(script)
    camera.focus?.(selected, { durationMs: 250 })
  }

  const hideAllNativeControls = async () => {
    const plugin = molstar
    if (!plugin) return

    // Hide layout controls
    if (plugin.layout) {
      plugin.layout.setProps({
        isExpanded: false,
        showControls: false,
        controlsDisplay: 'reactive'
      })
    }

    hideNativeControlsStyle()

    const pluginContainer = plugin.canvas?.webgl?.gl?.canvas?.parentElement?.parentElement
    if (pluginContainer) {
      const classes = ['.msp-viewport-controls, .msp-viewport-control-group, .msp-btn-link, .msp-control-group-header, .msp-highlight-info']
      const controlElements = pluginContainer.querySelectorAll(...classes)
      controlElements.forEach((el: HTMLElement) => el.style.display = 'none')
    }

    // Ensure all regions are hidden
    if (plugin.layout?.regions) {
      Object.keys(plugin.layout.regions).forEach((region: string) => {
        const regionElement = plugin.layout.regions[region]
        if (regionElement?.element) {
          regionElement.element.style.display = 'none'
        }
      })
    }

    // Force a layout update
    if (plugin.layout?.update) {
      plugin.layout.update()
    }
  }

  const setMolecule = (newState: MoleculeState) => {
    if (!molstar?.loaded) return

    const { lighten, darken } = newState.postprocessing || {}

    if (newState.background) {
      setBackground(newState.background, lighten, darken)
    }

    if (newState.lighting) {
      setIllumination(newState.lighting, lighten, darken)
    }

    if (newState.fog) {
      const fogEnabled = typeof newState.fog === 'object' ? newState.fog.enabled : newState.fog
      const fogIntensity = typeof newState.fog === 'object' ? (newState.fog.intensity ?? DEFAULT_FOG_INTENSITY) : DEFAULT_FOG_INTENSITY
      setCamera({ fog: { enabled: fogEnabled, intensity: fogIntensity } as any })
    }

    if (newState.shadows !== undefined) {
      const shadowsEnabled = typeof newState.shadows === 'object' ? newState.shadows.enabled : newState.shadows
      setShadow({ on: shadowsEnabled }, true)
    }

    if (molstar.canvas) {
      const { outline, occlusion, shadow } = newState.postprocessing || {}
      setOutline(outline)
      setOcclusion(occlusion as any)
      setShadow(shadow)
      molstar.draw()
    }

    if (newState.quality) {
      applyQualitySettings(newState.quality)
    }

    rerender()
  }

  const setAppearance = async (config: AppearanceConfig) => {
    if (!molstar?.loaded) return

    const { lighten, darken } = config.postprocessing || {}

    if (config.background !== undefined) {
      setBackground(config.background, lighten, darken)
    } else if (lighten !== undefined || darken !== undefined) {
      // Apply lighten/darken to current background
      setBackground(background.color, lighten, darken)
    }

    if (config.lighting !== undefined) setIllumination(config.lighting, lighten, darken)
    if (config.shadows !== undefined) {
      if (typeof config.shadows === 'boolean') {
        setShadow({ on: config.shadows })
      } else {
        setShadow({ on: config.shadows.enabled, params: { quality: config.shadows.quality } })
      }
    }
    if (config.fog !== undefined) {
      const fogEnabled = typeof config.fog === 'object' ? config.fog.enabled : config.fog
      const fogIntensity = typeof config.fog === 'object' ? (config.fog.intensity ?? DEFAULT_FOG_INTENSITY) : DEFAULT_FOG_INTENSITY
      setCamera({ fog: { enabled: fogEnabled, intensity: fogIntensity } as any })
    }

    if (config.postprocessing) {
      const { outline, occlusion, shadow } = config.postprocessing
      if (outline) setOutline(outline)
      if (occlusion) setOcclusion(occlusion as any)
      if (shadow) setShadow(shadow)
    }

    if (config.protein) {
      applyRepresentation(molstar, config.protein.style || 'cartoon', config.protein.color || 'by-chain')
    }

    rerender()
  }

  const setCameraConfig = (config: CameraConfig) => {
    if (!molstar?.canvas) return

    // Build update object for the camera hook
    const updates: any = {}

    if (config.position) updates.position = config.position
    if (config.target) updates.target = config.target
    if (config.up) updates.up = config.up
    if (config.zoom !== undefined) updates.zoom = config.zoom
    if (config.projection) updates.mode = config.projection
    if (config.fov !== undefined) updates.fov = config.fov

    if (config.clipping) {
      updates.clipping = {
        enabled: true,
        radius: config.clipping.radius || 100,
        far: config.clipping.far !== undefined ? config.clipping.far : true
      }
    }

    if (config.axes) {
      updates.axes = {
        visible: true,
        opacity: config.axes.opacity,
        scale: config.axes.scale,
        x: config.axes.colors?.x,
        y: config.axes.colors?.y,
        z: config.axes.colors?.z
      }
    }

    if (config.stereo) {
      updates.stereo = config.stereo
    }

    if (config.animation) {
      setCameraAnimation(config.animation)
    }

    setCamera(updates)
  }

  const setQuality = (config: QualitySettings) => {
    if (!molstar?.loaded) return
    applyQualitySettings(config)
    rerender()
  }

  const setGranularity = (mode: string) => {
    if (!molstar?.managers?.interactivity?.lociSelects) return
    const granularity = granularityMap[mode] || 'residue'
    molstar.managers.interactivity.lociSelects.granularity = granularity
    rerender()
  }

  const setSelection = (config: SelectionConfig) => {
    let newSelections = [...selections]

    if (config.clear) newSelections = []
    if (config.set) newSelections = [config.set]
    if (config.add) newSelections.push(config.add)
    if (config.remove) newSelections = newSelections.filter(s => s !== config.remove)

    setSelections(newSelections)

    if (molstar) {
      molstar.selection.clear()

      newSelections.forEach(sel => {
        const parsed = parseSelectionQuery(sel)
        const script = buildMolstarSelection(molstar, parsed)
        molstar.selection.fromScript(script, 'add')
      })

      if (config.autoFocus && newSelections.length > 0) {
        focus(newSelections[newSelections.length - 1])
      }
    }

    rerender()
  }

  const setStylePreset = async (preset: 'default' | 'illustrative' | 'publication' | 'performance') => {
    const presetConfig = STYLE_PRESETS?.[preset]
    if (!molstar || !presetConfig) return

    setRenderer(presetConfig.renderer)

    if (presetConfig.lighting) {
      setIllumination(presetConfig.lighting)
    }

    setOutline(presetConfig.outline)
    setOcclusion(presetConfig.occlusion)
    setShadow(presetConfig.shadow)
  }


  const setRepresentationPreset = async (preset: 'default' | 'cartoon' | 'spacefill' | 'surface') => {
    if (!molstar?.loaded) return

    const representationMap = {
      default: 'cartoon',
      cartoon: 'cartoon',
      spacefill: 'spacefill',
      surface: 'molecular-surface'
    }

    const representationType = representationMap[preset]

    // Update all existing representations
    const update = molstar.state.data.build()
    molstar.state.data.selectQ((q: any) =>
      q.ofType(PluginStateObject.Molecule.Structure.Representation3D)
    ).forEach((repr: any) =>
      update.to(repr).update(StateTransforms.Representation.StructureRepresentation3D,
        (old: any) => ({ ...old, type: { name: representationType, params: {} } }))
    )
    await update.commit()
  }

  const molecule: MoleculeInstance = useMemo(() => {
    return {
      mounted: molstar?.mounted || false,
      initialized: molstar?.initialized || false,
      loaded: molstar?.loaded || false,
      loading: molstar?.loading ?? true,
      selections,
      get granularity() { return molstar?.managers?.interactivity?.lociSelects?.granularity || 'residue' },
      get background() {
        return background.color || 'white'
      },
      get lighting(): string {
        if (!molstar?.canvas) return 'soft'
        const { lightIntensity = 0.6, ambientIntensity = 0.6 } = molstar.canvas.props.illumination || {}

        const presets = [
          { name: 'bright', light: 1.0, ambient: 0.4 },
          { name: 'soft', light: 0.6, ambient: 0.6 },
          { name: 'dramatic', light: 0.8, ambient: 0.2 },
          { name: 'off', light: 0, ambient: 1.0 }
        ]

        return presets.find(p =>
          Math.abs(lightIntensity - p.light) < 0.01 &&
          Math.abs(ambientIntensity - p.ambient) < 0.01
        )?.name || 'soft'
      },
      get quality() {
        if (!molstar?.canvas) return { level: 'medium' as 'medium' }
        const { mode = 'on', sampleLevel = 2 } = molstar.canvas.props.multiSample || {}

        const level: 'high' | 'medium' | 'low' = mode === 'off' ? 'low' : sampleLevel >= 4 ? 'high' : 'medium'
        return { level }
      },
      get representationPreset(): string {
        if (!molstar?.loaded) return 'default'
        
        // Try to find the first protein representation
        const representations = molstar.state?.data?.selectQ((q: any) =>
          q.ofType(PluginStateObject.Molecule.Structure.Representation3D)
        )
        
        if (representations?.length > 0) {
          const repr = representations[0]?.obj?.data?.repr?.props?.type?.name
          // Map Molstar representation names to our preset names
          const reprMap: Record<string, string> = {
            'cartoon': 'cartoon',
            'spacefill': 'spacefill',
            'molecular-surface': 'surface',
            'ball-and-stick': 'default'
          }
          return reprMap[repr] || 'default'
        }
        return 'default'
      },
      get stylePreset(): string {
        if (!molstar?.loaded) return 'default'
        
        const renderer = molstar.canvas?.props?.renderer
        if (!renderer) return 'default'
        
        // Check for illustrative style
        if (renderer.style?.name === 'illustrative') return 'illustrative'
        
        // Check for performance style (lower quality settings)
        const multiSample = molstar.canvas?.props?.multiSample
        if (multiSample?.mode === 'off') return 'performance'
        
        // Check for publication style (high quality + specific settings)
        if (multiSample?.sampleLevel >= 4 && renderer.style?.quality === 'high') return 'publication'
        
        return 'default'
      },
      load,
      screenshot,
      copyScreenshot,
      downloadScreenshot,
      fullscreen,
      resetZoom,
      resetCamera,
      orientAxes,
      resetAxes,
      center,
      focus,
      molstar: molstar,
      setStylePreset,
      setRepresentationPreset,
      get ref() { return molstar?.ref },
      get for() { return molstar?.for },
      camera
    }
  }, [molstar, selections, rerender, setStylePreset, setRepresentationPreset, camera, background, load, screenshot, copyScreenshot, downloadScreenshot])

  const setters = useMemo(() => ({
    setMolecule,
    setAppearance,
    setCamera: setCameraConfig,
    setQuality,
    setSelection,
    setGranularity,
    setStylePreset,
    setRepresentationPreset,
    setRenderer,
    setShadow,
    setFog: (fog: boolean | { enabled: boolean, intensity?: number }) => {
      if (typeof fog === 'undefined') return
      const fogEnabled = typeof fog === 'object' ? fog.enabled : fog
      const fogIntensity = typeof fog === 'object' ? (fog.intensity ?? DEFAULT_FOG_INTENSITY) : DEFAULT_FOG_INTENSITY
      setCamera({ fog: { enabled: fogEnabled, intensity: fogIntensity } as any })
    },
    setBackground, // From useBackground hook
    setIllumination,
    setOutline,
    setOcclusion,
  }), [molstar])

  return [molecule, setters]
}
