import { useState, useRef, useMemo, useReducer } from 'react'
import { createPluginUI } from 'molstar/lib/mol-plugin-ui'
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18'
import { PluginCommands } from 'molstar/lib/mol-plugin/commands'
import { Color } from 'molstar/lib/mol-util/color'
import { PluginStateObject } from 'molstar/lib/mol-plugin-state/objects'
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms'
import { PresetStructureRepresentations } from 'molstar/lib/mol-plugin-state/builder/structure/representation-preset'
import useIdEffect from './useIdEffect'
import { useEvent } from './useEvent'
import 'molstar/lib/mol-plugin-ui/skin/light.scss'
import { StructureSelectionQueries } from 'molstar/lib/mol-plugin-state/helpers/structure-selection-query'

import type {
  MoleculeInstance,
  MoleculeState,
  LoadConfig,
  ScreenshotOptions,
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
  REPRESENTATION_PRESETS,
  DEFAULT_OCCLUSION_PARAMS,
  DEFAULT_MULTISCALE_LEVELS,
  DEFAULT_DOF_PARAMS,
  DEFAULT_SHADOW_PARAMS,
  DEFAULT_OUTLINE_PARAMS,
  DEFAULT_FOG_INTENSITY,
  BACKGROUND_COLOR_MAP,
  NAMED_COLORS,
  STYLE_PRESETS,
  representationMap,
  granularityMap,
  componentMap,
  repTypeMap,
  lightingPresets,
  extractRepresentationType,
  determineComponentType
} from '../utils/molstar-selections'
import { useIdp } from './useIdp'
import { adjustColorBrightness, copyImage, downloadImage, getStructureSource, hexToRgb, hideNativeControlsStyle, sleep } from '../utils'

export function useMolstar(providedId?: string): [MoleculeInstance, UseMolstarReturn['setters']] {
  const id = useIdp(providedId)
  const container = useEvent(id)
  const molstar = useRef<any>(null)
  const [selections, setSelections] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

  const rerender = useReducer((x: number) => x + 1, 0)[1]

  const initMolstar = async () => {
    if (!container.ref.current || isInitialized) return

    try {
      const plugin = await createPluginUI({
        target: container.ref.current,
        render: renderReact18,
        spec: {
          behaviors: [],
          layout: {
            initial: {
              isExpanded: false,
              showControls: false,
              controlsDisplay: 'reactive' as const,
              regionState: {
                left: 'hidden',
                right: 'hidden',
                top: 'hidden',
                bottom: 'hidden'
              }
            }
          },
          components: {
            remoteState: 'none' as const,
            controls: { top: 'none', bottom: 'none', left: 'none', right: 'none' }
          },
          config: []
        }
      })
      molstar.current = plugin

      // Hide all native controls immediately after initialization
      await hideAllNativeControls(plugin)

      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize Molstar:', error)
    }
  }

  // Initialize Molstar
  useIdEffect(id, async (isFirstMount: boolean) => {
    if (!container.ref.current || isInitialized) return

    if (isFirstMount) initMolstar()

    return (isLastUnmount: boolean) => {
      if (isLastUnmount && molstar.current) {
        molstar.current.dispose()
        molstar.current = null
        setIsInitialized(false)
      }
    }
  }, [])

  const setProps = (props: any, forceRedraw = false) => {
    if (!molstar.current?.canvas3d) return console.error('Molstar not initialized')
    molstar.current.canvas3d.setProps(props)
    if (forceRedraw) {
      molstar.current.canvas3d.requestDraw(true)
    }
  }

  const setRenderer = (renderer: any, redraw?: boolean) => {
    setProps({ renderer: { ...molstar.current.canvas3d.props.renderer, ...renderer } }, redraw)
  }

  const setTrackball = (config: any, redraw?: boolean) => {
    setProps({ trackball: { ...molstar.current?.canvas3d.props.trackball, ...config } }, redraw)
  }

  const setPostprocessing = (config: any, redraw?: boolean) => {
    const current = molstar.current?.canvas3d?.props?.postprocessing || {}
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
    const plugin = molstar.current
    if (!plugin?.canvas3d || typeof occlusion === 'undefined') return

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

  const setFog = (fog: boolean | { enabled: boolean, intensity?: number }) => {
    if (typeof fog === 'undefined') return
    const fogEnabled = typeof fog === 'object' ? fog.enabled : fog
    const fogIntensity = typeof fog === 'object' ? (fog.intensity ?? DEFAULT_FOG_INTENSITY) : DEFAULT_FOG_INTENSITY
    const params = fogEnabled ? { intensity: fogIntensity } : {}
    const cameraFog = { name: fogEnabled ? 'on' : 'off', params }
    setProps({ cameraFog })
  }

  const setBackground = (background: string, lighten?: number, darken?: number) => {
    const plugin = molstar.current
    if (!plugin?.canvas3d || !background) return

    const baseColor = NAMED_COLORS[background] || parseInt(background.replace('#', ''), 16)
    const backgroundColor = adjustColorBrightness(baseColor, lighten, darken)
    setRenderer({ backgroundColor }, true)
    rerender()
  }

  const setIllumination = (lighting: string, lighten?: number, darken?: number) => {
    const plugin = molstar.current
    if (!plugin?.canvas3d || typeof lighting === 'undefined') return

    // Apply base lighting preset
    if (lighting && !lighten && !darken) {
      const preset = lightingPresets[lighting]
      if (preset) {
        const illumination = { ...plugin.canvas3d.props.illumination, ...preset }
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
        ...plugin.canvas3d.props.illumination,
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

  const setCameraPosition = (position: [number, number, number]) => {
    const plugin = molstar.current
    if (!plugin?.canvas3d || typeof position === 'undefined') return
    plugin.canvas3d.camera.setSnapshot({
      position: { x: position[0], y: position[1], z: position[2] }
    })
  }

  const setCameraAnimation = (animation: 'off' | 'spin' | 'rock') => {
    if (typeof animation === 'undefined') return
    if (animation === 'off') {
      setTrackball({ animate: { name: 'off', params: {} } })
    } else if (animation === 'spin') {
      setTrackball({ animate: { name: 'spin', params: { speed: 1 } } })
    } else if (animation === 'rock') {
      setTrackball({ animate: { name: 'rock', params: { speed: 1, angle: 15 } } })
    }
  }

  const setCameraClipping = (clipping: { radius?: number, far?: boolean, minNear?: number }) => {
    if (typeof clipping === 'undefined') return
    setProps({
      cameraClipping: {
        radius: 100 - (clipping.radius || 0), // Convert UI radius to Molstar radius
        far: clipping.far !== undefined ? clipping.far : true,
        minNear: clipping.minNear || 5
      }
    }, true)
  }

  const setCameraProjection = (projection: 'perspective' | 'orthographic') => {
    const plugin = molstar.current
    if (!plugin?.canvas3d || typeof projection === 'undefined') return
    setProps({ camera: { ...plugin.canvas3d.props.camera, mode: projection } })
  }

  const setCameraFov = (fov: number) => {
    const plugin = molstar.current
    if (!plugin?.canvas3d || typeof fov === 'undefined') return

    const viewport = plugin.canvas3d.camera
    const fovRadians = (fov * Math.PI) / 180

    if (viewport.state) {
      const newState = {
        ...viewport.state,
        fov: fovRadians
      }

      if (viewport.setState) {
        viewport.setState(newState)
      } else if (viewport.update) {
        viewport.update(newState)
      } else {
        // Fallback: simulate FOV with zoom
        const zoomLevel = Math.tan((45 * Math.PI / 180) / 2) / Math.tan(fovRadians / 2)
        viewport.zoom?.(zoomLevel)
      }
    }

    plugin.canvas3d.requestDraw(true)
  }

  const setCameraAxes = (axes: { opacity?: number, scale?: number, colors?: { x?: string, y?: string, z?: string } }) => {
    const plugin = molstar.current
    if (!plugin?.canvas3d || typeof axes === 'undefined') return

    const currentCamera = plugin.canvas3d.props.camera || {}
    const currentHelper = currentCamera.helper || {}
    const currentAxes = currentHelper.axes || { name: 'on', params: {} }

    const convertColor = (hex: string) => {
      const rgb = hexToRgb(hex)
      return rgb ? (rgb.r << 16) | (rgb.g << 8) | rgb.b : undefined
    }

    const params = {
      ...currentAxes.params,
      ...(axes.opacity !== undefined && { alpha: axes.opacity }),
      ...(axes.scale !== undefined && { scale: axes.scale }),
      ...(axes.colors?.x && { colorX: convertColor(axes.colors.x) }),
      ...(axes.colors?.y && { colorY: convertColor(axes.colors.y) }),
      ...(axes.colors?.z && { colorZ: convertColor(axes.colors.z) })
    }

    setProps({
      camera: {
        ...currentCamera,
        helper: {
          ...currentHelper,
          axes: { name: 'on', params }
        }
      }
    }, true)
  }

  const setCameraStereo = async (stereo: { enabled: boolean, eyeSeparation?: number, focus?: number }) => {
    const plugin = molstar.current
    if (!plugin?.canvas3d || typeof stereo === 'undefined') return

    const stereoConfig = {
      name: stereo.enabled ? 'on' : 'off',
      params: stereo.enabled ? {
        eyeSeparation: stereo.eyeSeparation || 0.064,
        focus: stereo.focus || 10
      } : {}
    }

    setProps({ camera: { ...plugin.canvas3d.props.camera, stereo: stereoConfig } })
    plugin.canvas3d.commit(true)
    await sleep(50)
    plugin.canvas3d.handleResize()
    plugin.canvas3d.requestDraw(true)
  }


  const applyQualitySettings = (quality: QualitySettings) => {
    const plugin = molstar.current
    if (!plugin?.canvas3d) return

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

  const applyRepresentation = async (plugin: any, style: string, color?: string) => {
    if (!plugin) return

    const representationType = representationMap[style] || 'cartoon'
    const colorTheme = color || 'chain-id'

    // Find protein representations
    const proteinReprs = plugin.state.data.selectQ((q: any) =>
      q.ofType(PluginStateObject.Molecule.Structure.Representation3D)
    ).filter((repr: any) => {
      const label = repr.obj?.label?.toLowerCase() || ''
      return label.includes('protein') || label.includes('polymer')
    })

    if (proteinReprs.length === 0) return

    // Update protein representations
    const update = plugin.state.data.build()
    proteinReprs.forEach((repr: any) => {
      update.to(repr).update(StateTransforms.Representation.StructureRepresentation3D, {
        type: { name: representationType, params: {} },
        colorTheme: { name: colorTheme, params: {} }
      })
    })

    await update.commit()
  }


  // Helper to load structure data
  const loadStructureData = async (config: LoadConfig) => {
    const plugin = molstar.current

    const { url, format } = getStructureSource(config)
    await PluginCommands.State.RemoveObject(plugin, { state: plugin.state.data, ref: plugin.state.data.tree.root.ref })

    const data = await plugin.builders.data.download({ url, isBinary: false }, { state: { isGhost: true } })
    const trajectory = await plugin.builders.structure.parseTrajectory(data, format)
    const model = await plugin.builders.structure.createModel(trajectory)
    return await plugin.builders.structure.createStructure(model, { name: 'model' })
  }

  // Helper to create default components and representations
  const createDefaultComponents = async (structure: any, config: LoadConfig) => {
    // TODO: it's possible we might be able to remove this
    const plugin = molstar.current
    const components = {
      polymer: await plugin.builders.structure.tryCreateComponentStatic(structure, 'polymer'),
      ligand: await plugin.builders.structure.tryCreateComponentStatic(structure, 'ligand'),
      water: await plugin.builders.structure.tryCreateComponentStatic(structure, 'water')
    }

    if (components.polymer) {
      await plugin.builders.structure.representation.addRepresentation(components.polymer, {
        type: 'cartoon',
        color: 'chain-id'
      })
    }
    if (components.ligand) {
      await plugin.builders.structure.representation.addRepresentation(components.ligand, {
        type: 'ball-and-stick',
        color: 'element-symbol'
      })
    }
    if (components.water) {
      await plugin.builders.structure.representation.addRepresentation(components.water, {
        type: 'ball-and-stick',
        color: 'element-symbol'
      })
    }
  }

  // Helper to detect components in the structure
  const detectStructureComponents = (): Set<string> => {
    const plugin = molstar.current
    if (!plugin) return new Set<string>()

    const detectedComponents = new Set<string>()
    const componentPatterns: Record<string, string[]> = {
      'protein': ['polymer', 'protein'],
      'ligand': ['ligand'],
      'water': ['water'],
      'ion': ['ion'],
      'nucleic': ['nucleic', 'rna', 'dna']
    }

    for (const [_ref, cell] of plugin.state.data.cells) {
      if (cell.obj?.type?.name === 'Structure' && cell.obj?.label) {
        const label = cell.obj.label.toLowerCase()
        for (const [componentType, patterns] of Object.entries(componentPatterns)) {
          if (patterns.some(pattern => label.includes(pattern))) {
            detectedComponents.add(componentType)
          }
        }
      }
    }

    console.log('Detected components in structure:', Array.from(detectedComponents))
    return detectedComponents
  }

  // Load structure
  const load = async (config: LoadConfig) => {
    const plugin = molstar.current
    if (!plugin) throw new Error('Molstar not initialized')

    await plugin.clear()

    try {
      const structure = await loadStructureData(config)
      await createDefaultComponents(structure, config)
    } catch (error) {
      console.error('Failed to load structure:', error)
      throw error
    }


    setBackground(config.background)
    if (config.lighting) {
      setIllumination(config.lighting)
    }
    setQualityLevel(config.quality)
    setCameraAnimation(config.animate as any)

    if (config.autoZoom !== false) {
      await PluginCommands.Camera.Reset(plugin, {})
    }
  }

  // Helper to capture screenshot using canvas directly
  const captureFromCanvas = async (options?: ScreenshotOptions): Promise<string | void> => {
    const plugin = molstar.current
    if (!plugin?.canvas3d) return

    // Get current background from Molstar
    const originalBackground = BACKGROUND_COLOR_MAP[plugin.canvas3d.props.renderer?.backgroundColor ?? 0xffffff] ||
      '#' + (plugin.canvas3d.props.renderer?.backgroundColor ?? 0xffffff).toString(16).padStart(6, '0')

    if (options?.transparent) {
      setBackground('transparent')
    }

    try {
      const canvas = plugin.canvas3d.webgl.gl.canvas as HTMLCanvasElement
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
    const helper = molstar.current?.helpers?.viewportScreenshot
    if (!helper) return

    const currentAxes = molstar.current?.canvas3d?.props?.camera?.helper?.axes
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
        const canvas = molstar.current?.canvas3d?.webgl.gl.canvas as HTMLCanvasElement
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
    if (!molstar.current) return

    const helper = molstar.current.helpers?.viewportScreenshot

    if (helper) {
      return captureWithHelper(options)
    } else {
      console.warn('ViewportScreenshot helper not available, using canvas fallback')
      return captureFromCanvas(options)
    }
  }

  // Copy screenshot to clipboard
  const copyScreenshot = async (options?: ScreenshotOptions): Promise<void> => {
    const dataUrl = await screenshot(options)
    if (!dataUrl) return

    const helper = molstar.current?.helpers?.viewportScreenshot
    helper ? await helper.copyToClipboard() : copyImage(dataUrl)
  }

  // Download screenshot
  const downloadScreenshot = async (options?: ScreenshotOptions): Promise<void> => {
    const dataUrl = await screenshot(options)
    if (!dataUrl) return

    const helper = molstar.current?.helpers?.viewportScreenshot
    if (helper) {
      await helper.download(options?.filename || helper.getFilename())
    } else {
      const filename = options?.filename || `molecule-${Date.now()}.${options?.format || 'png'}`
      downloadImage(dataUrl, filename)
    }
  }

  // Toggle Fullscreen
  const fullscreen = () => {
    if (!container.ref.current) return
    document.fullscreenElement ? document.exitFullscreen() : container.ref.current.requestFullscreen()
  }

  const resetZoom = () => {
    if (!molstar.current) return
    PluginCommands.Camera.Reset(molstar.current, { durationMs: 250 })
  }

  const resetCamera = () => {
    if (!molstar.current) return
    PluginCommands.Camera.Reset(molstar.current, { durationMs: 250 })
  }

  const orientAxes = () => {
    if (!molstar.current) return
    PluginCommands.Camera.OrientAxes(molstar.current, { durationMs: 250 })
  }

  const resetAxes = () => {
    if (!molstar.current) return
    PluginCommands.Camera.ResetAxes(molstar.current, { durationMs: 250 })
  }

  const center = () => {
    if (!molstar.current) return
    PluginCommands.Camera.Reset(molstar.current, { durationMs: 250 })
  }

  const focus = (selection: string) => {
    if (!molstar.current) return

    const parsed = parseSelectionQuery(selection)
    const script = buildMolstarSelection(molstar.current, parsed)

    const selected = molstar.current.managers.structure.selection.fromScript(script)
    molstar.current.managers.camera.focusLoci(selected)
  }

  const hideAllNativeControls = async (plugin: any) => {
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

    const pluginContainer = plugin.canvas3d?.webgl?.gl?.canvas?.parentElement?.parentElement
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
    if (!molstar.current) return

    const { lighten, darken } = newState.postprocessing || {}

    if (newState.background) {
      setBackground(newState.background, lighten, darken)
    }

    if (newState.lighting) {
      setIllumination(newState.lighting, lighten, darken)
    }

    setFog(newState.fog)

    if (newState.shadows !== undefined) {
      const shadowsEnabled = typeof newState.shadows === 'object' ? newState.shadows.enabled : newState.shadows
      setShadow({ on: shadowsEnabled }, true)
    }

    if (molstar.current.canvas3d) {
      const { outline, occlusion, shadow } = newState.postprocessing || {}
      setOutline(outline)
      setOcclusion(occlusion as any)
      setShadow(shadow)
      molstar.current.canvas3d.requestDraw(true)
    }

    if (newState.quality) {
      applyQualitySettings(newState.quality)
    }

    rerender()
  }

  const setAppearance = async (config: AppearanceConfig) => {
    if (!molstar.current) return

    const { lighten, darken } = config.postprocessing || {}

    if (config.background !== undefined) {
      setBackground(config.background, lighten, darken)
    } else if (lighten !== undefined || darken !== undefined) {
      const bgColor = molstar.current.canvas3d.props.renderer?.backgroundColor ?? 0xffffff
      const currentBg = BACKGROUND_COLOR_MAP[bgColor] || '#' + bgColor.toString(16).padStart(6, '0')
      setBackground(currentBg, lighten, darken)
    }

    if (config.lighting !== undefined) setIllumination(config.lighting, lighten, darken)
    if (config.shadows !== undefined) {
      if (typeof config.shadows === 'boolean') {
        setShadow({ on: config.shadows })
      } else {
        setShadow({ on: config.shadows.enabled, params: { quality: config.shadows.quality } })
      }
    }
    if (config.fog !== undefined) setFog(config.fog)

    if (config.postprocessing) {
      const { outline, occlusion, shadow } = config.postprocessing
      if (outline) setOutline(outline)
      if (occlusion) setOcclusion(occlusion as any)
      if (shadow) setShadow(shadow)
    }

    if (config.protein) {
      applyRepresentation(molstar.current, config.protein.style || 'cartoon', config.protein.color || 'by-chain')
    }

    rerender()
  }

  const setCamera = (config: CameraConfig) => {
    if (!molstar.current?.canvas3d) return

    const plugin = molstar.current
    const camera = plugin.canvas3d.camera

    setCameraPosition(config.position)

    if (config.zoom !== undefined) {
      camera.zoom(config.zoom)
    }

    setCameraClipping(config.clipping)
    setCameraAnimation(config.animation)
    setCameraProjection(config.projection)
    setCameraFov(config.fov)
    setCameraAxes(config.axes)
    setCameraStereo(config.stereo)
    rerender()
  }

  const setQuality = (config: QualitySettings) => {
    if (!molstar.current) return
    applyQualitySettings(config)
    rerender()
  }

  const setGranularity = (mode: string) => {
    if (!molstar.current?.managers?.interactivity?.lociSelects) return
    const granularity = granularityMap[mode] || 'residue'
    molstar.current.managers.interactivity.lociSelects.granularity = granularity
    rerender()
  }

  const setSelection = (config: SelectionConfig) => {
    let newSelections = [...selections]

    if (config.clear) newSelections = []
    if (config.set) newSelections = [config.set]
    if (config.add) newSelections.push(config.add)
    if (config.remove) newSelections = newSelections.filter(s => s !== config.remove)

    setSelections(newSelections)

    if (molstar.current) {
      molstar.current.managers.structure.selection.clear()

      newSelections.forEach(sel => {
        const parsed = parseSelectionQuery(sel)
        const script = buildMolstarSelection(molstar.current, parsed)
        molstar.current.managers.structure.selection.fromScript(script, 'add')
      })

      if (config.autoFocus && newSelections.length > 0) {
        focus(newSelections[newSelections.length - 1])
      }
    }

    rerender()
  }

  const setStylePreset = async (preset: 'default' | 'illustrative' | 'publication' | 'performance') => {
    const presetConfig = STYLE_PRESETS?.[preset]
    if (!molstar.current || !presetConfig) return

    setRenderer(presetConfig.renderer)

    if (presetConfig.lighting) {
      setIllumination(presetConfig.lighting)
    }

    setOutline(presetConfig.outline)
    setOcclusion(presetConfig.occlusion)
    setShadow(presetConfig.shadow)
  }

  // Get actual visibility state from Molstar
  const getComponentVisibilityFromMolstar = () => {
    if (!molstar.current) {
      return { protein: false, ligand: false, water: false, ion: false, nucleic: false }
    }

    const cells = [...molstar.current.state.data.cells]

    const match = (labels: string[], cell: any) =>
      labels.some(label => cell.obj?.label?.includes(label)) && !cell.state.isHidden

    const entries = Object.entries(componentMap).map(
      ([type, labels]) => [type, cells.some(([, cell]) => match(labels, cell))]
    )

    return Object.fromEntries(entries)
  }

  const findComponentByRef = (ref: string) => {
    const plugin = molstar.current
    if (!plugin) return null
    const structures = plugin.managers.structure.hierarchy.current.structures
    return structures.flatMap(s => s.components).find(c => c.cell.transform.ref === ref) || null
  }

  const toggleComponent = async (ref: string) => {
    if (!molstar.current) return
    const plugin = molstar.current
    const component = findComponentByRef(ref)
    if (!component) return console.error(`Component not found: ${ref}`)
    plugin.managers.structure.component.toggleVisibility([component])
    await sleep(100)
    rerender()
  }

  const removeComponent = async (ref: string) => {
    if (!molstar.current) return
    const plugin = molstar.current
    const component = findComponentByRef(ref)
    if (!component) return console.error(`Component not found: ${ref}`)
    await plugin.managers.structure.hierarchy.remove([component], true)
    rerender()
  }

  const applyComponentPreset = async (preset: string) => {
    const structure = molstar?.current?.managers?.structure
    const structures = structure?.hierarchy?.current?.structures
    if (!structures?.length) return

    await structure.component.applyPreset(
      structures,
      PresetStructureRepresentations[REPRESENTATION_PRESETS[preset] || 'auto'],
      { quality: 'auto', ignoreHydrogens: true }
    )

    rerender()
  }

  const setRepresentationPreset = async (preset: 'default' | 'cartoon' | 'spacefill' | 'surface') => {
    if (!molstar.current) return

    const presetMap = { default: 'auto', cartoon: 'polymer-cartoon', surface: 'molecular-surface' }

    if (preset !== 'spacefill') return applyComponentPreset(presetMap[preset])

    await applyComponentPreset('atomic-detail')
    const update = molstar.current.state.data.build()
    molstar.current.state.data.selectQ((q: any) =>
      q.ofType(PluginStateObject.Molecule.Structure.Representation3D)
    ).forEach((repr: any) =>
      update.to(repr).update(StateTransforms.Representation.StructureRepresentation3D,
        old => ({ ...old, type: { name: 'spacefill', params: {} } }))
    )
    await update.commit()
  }

  // Helper to create component object
  const createComponentObject = (label: string, ref: string) => {
    const plugin = molstar.current
    const repr = plugin.state.data.selectQ((q: any) =>
      q.ofType(PluginStateObject.Molecule.Structure.Representation3D)
    ).find((r: any) => r.transform.parent === ref)

    const reprTypeName = repr ? extractRepresentationType(repr) : ''
    const representation = reprTypeName
      ? (repTypeMap[reprTypeName] ?? reprTypeName.charAt(0).toUpperCase() + reprTypeName.slice(1).replace(/-/g, ' '))
      : (repr?.obj?.label || 'unknown')
    const isVisible = repr ? !repr.state.isHidden : true
    return { type: determineComponentType(label), label, representation, isVisible, ref }
  }

  const getComponentsFromHierarchy = () => {
    const plugin = molstar.current
    if (!plugin) return []

    const hierarchy = plugin.managers.structure.hierarchy.current

    return hierarchy.structures?.flatMap((structure: any) =>
      structure.components?.filter((component: any) => component.cell?.obj)
        .map((component: any) => {
          const [label, ref] = [component.cell.obj.label || '', component.cell.transform.ref]
          return createComponentObject(label, ref)
        }) || []
    ) || []
  }

  const getComponentsFromState = () => {
    const plugin = molstar.current
    if (!plugin) return []

    const skipLabels = ['Model', 'Trajectory', 'Assembly']
    const validTypes = ['Structure', 'StructureSelection']
    const validTransformers = ['ms-plugin.structure-selection-from-expression', 'ms-plugin.structure-component']

    return Array.from(plugin.state.data.cells)
      .filter(([ref, cell]: [string, any]) => {
        const typeName = cell.obj?.type?.name
        const transformerId = cell.transform?.transformer?.id
        const label = cell.obj?.label || cell.transform?.params?.label || ''

        // Check if valid component
        if (!validTypes.includes(typeName) && !validTransformers.includes(transformerId)) return false

        // Skip system components
        if (skipLabels.some(skip => label === skip || label.startsWith(skip))) return false

        // Skip selections without representations
        if (!label && typeName === 'StructureSelection') {
          return Array.from(plugin.state.data.cells.values()).some(
            (r: any) => r.transform?.parent === ref && r.obj?.type?.name === 'Representation3D'
          )
        }

        return true
      })
      .map(([ref, cell]: [string, any]) => {
        const label = cell.obj?.label || cell.transform?.params?.label || ''
        console.log(`Found component: ${label} (ref: ${ref})`)
        return createComponentObject(label, ref)
      })
  }

  const getComponents = () => {
    const components = getComponentsFromHierarchy()
    return components.length > 0 ? components : getComponentsFromState()
  }

  // Create a new component with selection and representation
  const createComponent = async (selection: string, representation: string, label?: string, checkExisting?: boolean) => {
    const plugin = molstar.current
    if (!plugin) return console.error('Plugin not initialized')

    // Use the molstar's component manager directly
    const selectionQuery = StructureSelectionQueries[selection as keyof typeof StructureSelectionQueries] || StructureSelectionQueries.all
    const params = {
      selection: selectionQuery,
      representation: representation === 'create-later' ? 'none' : representation,
      options: {
        label: label || selection.charAt(0).toUpperCase() + selection.slice(1),
        checkExisting: checkExisting || false
      }
    }

    const structures = plugin.managers.structure.hierarchy.current.structures
    if (structures.length > 0) {
      await plugin.managers.structure.component.add(params, structures)
      await sleep(500)
      rerender()
    }
  }

  const molecule: MoleculeInstance = useMemo(() => ({
    isInitialized,
    selections,
    componentVisibility: getComponentVisibilityFromMolstar(),
    availableComponents: Array.from(detectStructureComponents()),
    get granularity() { return molstar.current?.managers?.interactivity?.lociSelects?.granularity || 'residue' },
    get components() { return getComponents() },
    get background() {
      if (!molstar.current?.canvas3d) return 'white'
      const bgColor = molstar.current.canvas3d.props.renderer?.backgroundColor ?? 0xffffff
      return BACKGROUND_COLOR_MAP[bgColor] || '#' + bgColor.toString(16).padStart(6, '0')
    },
    get lighting(): string {
      if (!molstar.current?.canvas3d) return 'soft'
      const { lightIntensity = 0.6, ambientIntensity = 0.6 } = molstar.current.canvas3d.props.illumination || {}

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
      if (!molstar.current?.canvas3d) return { level: 'medium' as 'medium' }
      const { mode = 'on', sampleLevel = 2 } = molstar.current.canvas3d.props.multiSample || {}

      const level: 'high' | 'medium' | 'low' = mode === 'off' ? 'low' : sampleLevel >= 4 ? 'high' : 'medium'
      return { level }
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
    molstar: molstar.current,
    toggleComponent,
    removeComponent,
    applyComponentPreset,
    createComponent,
    setStylePreset,
    setRepresentationPreset,
    get ref() { return container.ref }
  }), [isInitialized, selections, rerender])

  const setters = useMemo(() => ({
    setMolecule,
    setAppearance,
    setCamera,
    setQuality,
    setSelection,
    setGranularity,
    setStylePreset,
    setRepresentationPreset,
    setRenderer,
    setTrackball,
    setShadow,
    setFog,
    setBackground,
    setIllumination,
    setOutline,
    setOcclusion,
  }), [])

  return [molecule, setters]
}
