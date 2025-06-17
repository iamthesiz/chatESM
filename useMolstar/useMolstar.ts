import { useState, useRef, useMemo, useReducer } from 'react'
import { createPluginUI } from 'molstar/lib/mol-plugin-ui'
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18'
import { PluginCommands } from 'molstar/lib/mol-plugin/commands'
import { Color } from 'molstar/lib/mol-util/color'
import { PluginStateObject } from 'molstar/lib/mol-plugin-state/objects'
import { StateTransforms } from 'molstar/lib/mol-plugin-state/transforms'
import { PresetStructureRepresentations } from 'molstar/lib/mol-plugin-state/builder/structure/representation-preset'
import useIdEffect from './useIdEffect'
import cuid from 'cuid'
import 'molstar/lib/mol-plugin-ui/skin/light.scss'
import { UUID } from 'molstar/lib/mol-util'
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
  StructureConfig,
  UseMolstarReturn
} from './types'

import { parseSelectionQuery, buildMolstarSelection } from './selections'

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

export function useMolstar(providedId?: string): [MoleculeInstance, UseMolstarReturn['setters']] {
  const id = useMemo(() => providedId || cuid(), [providedId])
  const containerRef = useRef<HTMLDivElement>(null)
  const pluginRef = useRef<any>(null)

  const [state, setState] = useState<MoleculeState>({
    background: 'white',
    lighting: 'soft',
    selected: [],
    selectionMode: 'residue',
    postprocessing: {}
  })

  const [selections, setSelections] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Force re-render when components change
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)

  // Initialize Molstar
  useIdEffect(id, async (isFirstMount: boolean) => {
    if (!containerRef.current || isInitialized) return

    if (isFirstMount) {
      try {
        const plugin = await createPluginUI({
          target: containerRef.current,
          render: renderReact18,
          spec: {
            behaviors: [],
            layout: {
              initial: {
                isExpanded: false,
                showControls: false,
                controlsDisplay: 'reactive' as const,
              }
            },
            components: {
              remoteState: 'none' as const
            },
            config: []
          }
        })

        pluginRef.current = plugin
        setIsInitialized(true)

        // Debug: Check if screenshot helper is available
        console.log('Screenshot helper available:', !!plugin.helpers?.viewportScreenshot)

        // Apply initial state
        applyState(plugin, state)
      } catch (error) {
        console.error('Failed to initialize Molstar:', error)
      }
    }

    return (isLastUnmount: boolean) => {
      if (isLastUnmount && pluginRef.current) {
        pluginRef.current.dispose()
        pluginRef.current = null
        setIsInitialized(false)
      }
    }
  }, [containerRef.current, isInitialized])

  // Apply state to plugin
  const applyState = (plugin: any, newState: MoleculeState) => {
    if (!plugin) return

    // Apply background
    if (newState.background && plugin.canvas3d) {
      let bgColor: number
      if (newState.background === 'transparent') {
        // Transparent black
        bgColor = 0x00000000
      } else if (newState.background === 'black') {
        bgColor = 0x000000
      } else if (newState.background === 'white') {
        bgColor = 0xffffff
      } else {
        // Parse hex color
        const hex = newState.background.replace('#', '')
        bgColor = parseInt(hex, 16)
      }

      // Set background color
      plugin.canvas3d.setProps({
        renderer: {
          ...plugin.canvas3d.props.renderer,
          backgroundColor: bgColor
        }
      })

      // Force canvas update
      plugin.canvas3d.requestDraw()
    }

    // Apply lighting
    if (newState.lighting && plugin.canvas3d && !newState.postprocessing?.lighten && !newState.postprocessing?.darken) {
      const lightingPresets = {
        bright: { lightIntensity: 1.0, ambientIntensity: 0.4 },
        soft: { lightIntensity: 0.6, ambientIntensity: 0.6 },
        dramatic: { lightIntensity: 0.8, ambientIntensity: 0.2 },
        off: { lightIntensity: 0, ambientIntensity: 1.0 }
      }
      const preset = lightingPresets[newState.lighting]
      if (preset) {
        plugin.canvas3d.setProps({
          illumination: {
            ...plugin.canvas3d.props.illumination,
            ...preset
          }
        })
      }
    }

    // Apply fog
    if (plugin.canvas3d && newState.fog !== undefined) {
      const fogEnabled = typeof newState.fog === 'object' ? newState.fog.enabled : newState.fog
      const fogIntensity = typeof newState.fog === 'object' ? newState.fog.intensity : 15  // Default: 15, range 1-100

      console.log('Applying fog:', fogEnabled, 'intensity:', fogIntensity)
      plugin.canvas3d.setProps({
        cameraFog: fogEnabled ? {
          name: 'on',
          params: {
            intensity: fogIntensity
          }
        } : {
          name: 'off',
          params: {}
        }
      })
    }

    // Apply shadows (Molstar native shadow setting if available)
    if (newState.shadows !== undefined && plugin.canvas3d) {
      const shadowsEnabled = typeof newState.shadows === 'object' ? newState.shadows.enabled : newState.shadows

      // Check if native shadow support exists
      const currentProps = plugin.canvas3d.props
      console.log('Shadow enabled:', shadowsEnabled, 'Current postprocessing:', currentProps.postprocessing)

      // Try to apply shadows through postprocessing
      const postprocessing = { ...(currentProps.postprocessing || {}) }

      if (shadowsEnabled) {
        postprocessing.shadow = {
          name: 'on',
          params: {
            steps: 1,      // Default: 1, range 1-64
            maxDistance: 3, // Default: 3, range 0-256
            tolerance: 1.0  // Default: 1.0, range 0-10
          }
        }
      } else {
        postprocessing.shadow = {
          name: 'off',
          params: {}
        }
      }

      console.log('Setting shadow postprocessing:', postprocessing.shadow)

      plugin.canvas3d.setProps({
        postprocessing
      })

      // Force redraw
      plugin.canvas3d.requestDraw(true)
    }

    // Apply postprocessing effects
    if (plugin.canvas3d) {
      const { lighten, darken, outline, occlusion, shadow } = newState.postprocessing || {}

      // Apply visual effects
      const postprocessing: any = {}

      if (outline !== undefined) {
        postprocessing.outline = outline.on ? {
          name: 'on',
          params: outline.params || { scale: 1, threshold: 0.33 }
        } : { name: 'off' }
      }

      if (occlusion !== undefined) {
        postprocessing.occlusion = occlusion.on ? {
          name: 'on',
          params: occlusion.params || { samples: 32, radius: 5, bias: 0.8, blurKernelSize: 15 }
        } : { name: 'off' }
      }

      if (shadow !== undefined) {
        postprocessing.shadow = shadow.on ? {
          name: 'on',
          params: shadow.params || { bias: 0.5, maxDistance: 256 }
        } : { name: 'off' }
      }

      if (Object.keys(postprocessing).length > 0) {
        plugin.canvas3d.setProps({ postprocessing })
      }

      // Get current lighting values or defaults
      const baseLighting = newState.lighting ? {
        bright: { lightIntensity: 1.0, ambientIntensity: 0.4 },
        soft: { lightIntensity: 0.6, ambientIntensity: 0.6 },
        dramatic: { lightIntensity: 0.8, ambientIntensity: 0.2 },
        off: { lightIntensity: 0, ambientIntensity: 1.0 }
      }[newState.lighting] : { lightIntensity: 0.6, ambientIntensity: 0.6 }

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

      plugin.canvas3d.setProps({
        illumination: {
          ...plugin.canvas3d.props.illumination,
          lightIntensity: adjustedIntensity,
          ambientIntensity: adjustedAmbient
        }
      })

      // Adjust the background color brightness
      if ((lighten || darken) && newState.background) {
        let bgColor: number = plugin.canvas3d.props.renderer.backgroundColor

        // Extract RGB components
        let r = (bgColor >> 16) & 0xFF
        let g = (bgColor >> 8) & 0xFF
        let b = bgColor & 0xFF

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

        const adjustedBgColor = (r << 16) | (g << 8) | b

        plugin.canvas3d.setProps({
          renderer: {
            ...plugin.canvas3d.props.renderer,
            backgroundColor: adjustedBgColor
          }
        })
      }

      // Force a re-render
      plugin.canvas3d.requestDraw(true)
    }

    // Apply quality settings
    if (newState.quality) {
      applyQualitySettings(plugin, newState.quality)
    }
  }

  // Apply quality settings
  const applyQualitySettings = (plugin: any, quality: QualitySettings) => {
    if (!plugin?.canvas3d) return

    const props: any = {}

    // Apply quality preset
    if (quality.level) {
      const qualityPresets = {
        high: {
          multiSample: { mode: 'on' as const, sampleLevel: 4 }
        },
        medium: {
          multiSample: { mode: 'on' as const, sampleLevel: 2 }
        },
        low: {
          multiSample: { mode: 'off' as const }
        }
      }

      if (qualityPresets[quality.level]) {
        Object.assign(props, qualityPresets[quality.level])
      }
    }

    // Prepare postprocessing object - ensure it has a valid structure
    const currentPostprocessing = plugin.canvas3d.props.postprocessing || {}
    const postprocessing = { ...currentPostprocessing }

    // Apply occlusion (SSAO)
    if (quality.occlusion !== undefined) {
      console.log('Setting occlusion:', quality.occlusion)

      if (typeof quality.occlusion === 'boolean') {
        // Simple boolean toggle
        if (quality.occlusion) {
          postprocessing.occlusion = {
            name: 'on',
            params: {
              samples: 32,
              multiScale: { name: 'off', params: {} },
              radius: 5,
              bias: 0.8,
              blurKernelSize: 15,
              blurDepthBias: 0.5,
              resolutionScale: 1,
              color: Color(0x000000),
              transparentThreshold: 0.8
            }
          }
        } else {
          postprocessing.occlusion = {
            name: 'off',
            params: {}
          }
        }
      } else {
        // Detailed occlusion settings
        const occ = quality.occlusion
        if (occ.enabled) {
          const multiScale = occ.multiScale?.enabled ? {
            name: 'on' as const,
            params: {
              levels: occ.multiScale.levels || [
                { radius: 2, blur: 1 },
                { radius: 4, blur: 1 },
                { radius: 8, blur: 1 },
                { radius: 16, blur: 1 }
              ],
              nearThreshold: occ.multiScale.nearThreshold || 10,
              farThreshold: occ.multiScale.farThreshold || 1500
            }
          } : { name: 'off' as const, params: {} }

          postprocessing.occlusion = {
            name: 'on',
            params: {
              samples: occ.samples || 32,
              multiScale,
              radius: occ.radius || 5,
              bias: occ.bias || 0.8,
              blurKernelSize: occ.blurKernelSize || 15,
              blurDepthBias: occ.blurDepthBias || 0.5,
              resolutionScale: occ.resolutionScale || 1,
              color: occ.color ? Color(parseInt(occ.color.replace('#', '0x'))) : Color(0x000000),
              transparentThreshold: occ.transparentThreshold || 0.8
            }
          }
        } else {
          postprocessing.occlusion = {
            name: 'off',
            params: {}
          }
        }
      }
    }

    // Apply outline
    if (quality.postprocessing?.outline) {
      postprocessing.outline = {
        name: quality.postprocessing.outline.enabled ? 'on' : 'off',
        params: quality.postprocessing.outline.enabled ? {
          scale: quality.postprocessing.outline.scale || 1,
          color: 0x000000,
          threshold: 0.33,
          includeTransparent: true
        } : {}
      }
    }

    // Apply Depth of Field (DOF)
    if (quality.postprocessing?.blur !== undefined) {
      console.log('Setting DOF blur:', quality.postprocessing.blur)

      if (typeof quality.postprocessing.blur === 'boolean') {
        // Simple boolean toggle
        postprocessing.dof = {
          name: quality.postprocessing.blur ? 'on' : 'off',
          params: quality.postprocessing.blur ? {
            blurSize: 9,           // Default
            blurSpread: 1.0,       // Default
            inFocus: 0.0,          // Default
            PPM: 20.0,             // Default
            center: 'camera-target', // Default
            mode: 'plane'          // Default
          } : {}
        }
      } else {
        // Detailed DOF settings
        const dof = quality.postprocessing.blur
        postprocessing.dof = {
          name: dof.enabled ? 'on' : 'off',
          params: dof.enabled ? {
            blurSize: dof.blurSize || 9,
            blurSpread: dof.blurSpread || 1.0,
            inFocus: dof.inFocus || 0.0,
            PPM: dof.ppm || 20.0,
            center: dof.center || 'camera-target',
            mode: dof.mode || 'plane'
          } : {}
        }
      }
    }

    // Apply all postprocessing settings at once
    props.postprocessing = postprocessing

    if (Object.keys(props).length > 0) {
      console.log('Applying quality props:', props)
      try {
        plugin.canvas3d.setProps(props)
        plugin.canvas3d.requestDraw(true)
        console.log('Canvas3d props after:', plugin.canvas3d.props)
      } catch (error) {
        console.error('Error applying quality settings:', error)
      }
    }
  }

  // Apply representation changes
  const applyRepresentation = async (plugin: any, style: string, color?: string) => {
    if (!plugin) return

    try {
      // Map style names
      const representationType = style === 'cartoon' ? 'cartoon' :
        style === 'ball-stick' ? 'ball-and-stick' :
          style === 'surface' ? 'molecular-surface' :
            style === 'ribbon' ? 'backbone' :
              style === 'spacefill' ? 'spacefill' :
                'cartoon'

      const colorTheme = color || 'chain-id'

      // Get all structure representations
      const structureReprs = plugin.state.data.selectQ((q: any) =>
        q.ofType(PluginStateObject.Molecule.Structure.Representation3D)
      )

      // Check if we have component-specific representations
      const hasComponentReps = structureReprs.some((repr: any) => {
        const label = repr.obj?.label?.toLowerCase() || ''
        return label === 'protein' || label === 'ligand' ||
          label === 'water' || label === 'ion'
      })

      if (hasComponentReps) {
        // Update only protein representations
        const update = plugin.state.data.build()

        for (const repr of structureReprs) {
          const label = repr.obj?.label?.toLowerCase() || ''

          if (label === 'protein') {
            // Update protein representation with new style
            update.to(repr).update({
              type: { name: representationType, params: {} },
              colorTheme: { name: colorTheme, params: {} }
            })
          }
          // Keep other component representations as they are
        }

        await update.commit()
      } else {
        // No component representations, create a general one
        const update = plugin.state.data.build()

        // Remove all existing representations
        for (const repr of structureReprs) {
          update.delete(repr)
        }

        await update.commit()

        // Get all structures
        const structures = plugin.state.data.selectQ((q: any) =>
          q.ofType(PluginStateObject.Molecule.Structure)
        )

        if (structures.length === 0) {
          console.error('No structures found')
          return
        }

        // Add new representations
        const update2 = plugin.state.data.build()

        for (const s of structures) {
          update2.to(s)
            .apply(StateTransforms.Representation.StructureRepresentation3D, {
              type: { name: representationType, params: {} },
              colorTheme: { name: colorTheme, params: {} }
            })
        }

        await update2.commit()
      }
    } catch (error) {
      console.error('Failed to apply representation:', error)
    }
  }

  // Load structure
  const load = async (config: LoadConfig) => {
    if (!pluginRef.current) throw new Error('Molstar not initialized')

    const plugin = pluginRef.current
    await plugin.clear()

    let url: string
    let format = config.format || 'mmcif'

    if (config.pdbId) {
      url = `https://files.rcsb.org/download/${config.pdbId}.cif`
      format = 'mmcif'
    } else if (config.url) {
      url = config.url
      // Auto-detect format from URL if not specified
      if (!config.format) {
        const ext = url.split('.').pop()?.toLowerCase()
        if (ext === 'pdb') format = 'pdb'
        else if (ext === 'cif' || ext === 'mmcif') format = 'mmcif'
        else if (ext === 'sdf') format = 'sdf'
        else if (ext === 'mol' || ext === 'mol2') format = 'mol'
      }
    } else if (config.file) {
      url = URL.createObjectURL(config.file)
      // Auto-detect format from file extension if not specified
      if (!config.format) {
        const ext = config.file.name.split('.').pop()?.toLowerCase()
        if (ext === 'pdb') format = 'pdb'
        else if (ext === 'cif' || ext === 'mmcif') format = 'mmcif'
        else if (ext === 'sdf') format = 'sdf'
        else if (ext === 'mol' || ext === 'mol2') format = 'mol'
      }
    } else {
      throw new Error('No structure source provided')
    }

    try {
      // Clear any existing structures
      await PluginCommands.State.RemoveObject(plugin, { state: plugin.state.data, ref: plugin.state.data.tree.root.ref })

      // Load the structure
      let data
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // Load from URL
        data = await plugin.builders.data.download(
          { url, isBinary: false },
          { state: { isGhost: true } }
        )
      } else {
        // Load from local file URL
        data = await plugin.builders.data.download(
          { url, isBinary: false },
          { state: { isGhost: true } }
        )
      }

      // Parse the structure - Molstar will auto-detect the format
      const trajectory = await plugin.builders.structure.parseTrajectory(data, format)
      const model = await plugin.builders.structure.createModel(trajectory)
      const structure = await plugin.builders.structure.createStructure(model, { name: 'model' })

      // Apply preset representation
      const preset = config.preset || 'auto'
      const components = {
        polymer: await plugin.builders.structure.tryCreateComponentStatic(structure, 'polymer'),
        ligand: await plugin.builders.structure.tryCreateComponentStatic(structure, 'ligand'),
        water: await plugin.builders.structure.tryCreateComponentStatic(structure, 'water')
      }

      // Add representations to components
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
      if (components.water && config.water?.visible !== false) {
        await plugin.builders.structure.representation.addRepresentation(components.water, {
          type: 'ball-and-stick',
          color: 'element-symbol'
        })
      }
    } catch (error) {
      console.error('Failed to load structure:', error)
      throw error
    }

    // Wait for the structure to be ready
    await new Promise(resolve => setTimeout(resolve, 500))

    // Detect which components are present in the structure
    const detectedComponents = new Set<string>()
    for (const [_ref, cell] of plugin.state.data.cells) {
      if (cell.obj?.type?.name === 'Structure' && cell.obj?.label) {
        const label = cell.obj.label.toLowerCase()
        if (label.includes('polymer') || label.includes('protein')) {
          detectedComponents.add('protein')
        } else if (label.includes('ligand')) {
          detectedComponents.add('ligand')
        } else if (label.includes('water')) {
          detectedComponents.add('water')
        } else if (label.includes('ion')) {
          detectedComponents.add('ion')
        } else if (label.includes('nucleic') || label.includes('rna') || label.includes('dna')) {
          detectedComponents.add('nucleic')
        }
      }
    }
    
    console.log('Detected components in structure:', Array.from(detectedComponents))
    
    // Update available components
    setAvailableComponents(detectedComponents)
    
    // Update component visibility to match native Molstar defaults
    setComponentVisibility({
      protein: false, // Hidden by default in native
      ligand: false,  // Hidden by default in native
      water: detectedComponents.has('water'), // Visible by default in native
      ion: detectedComponents.has('ion'),
      nucleic: detectedComponents.has('nucleic')
    })

    // Apply initial styling from config
    const initialState: Partial<MoleculeState> = {
      background: config.background || 'white',
      lighting: config.lighting || 'soft'
    }

    if (config.quality) initialState.quality = { level: config.quality }
    if (config.protein) initialState.protein = config.protein
    if (config.ligand) initialState.ligand = config.ligand
    if (config.nucleic) initialState.nucleic = config.nucleic
    if (config.water) initialState.water = config.water
    if (config.ion) initialState.ion = config.ion

    // Update state and apply styling
    setState(prevState => {
      const newState = { ...prevState, ...initialState }

      // Apply the state after setState completes
      setTimeout(() => {
        applyState(plugin, newState)

        // Apply representation for molecular styling
        if (config.protein) {
          applyRepresentation(
            plugin,
            config.protein.style || 'cartoon',
            config.protein.color
          )
        } else {
          // Apply default styling if none specified
          applyRepresentation(plugin, 'cartoon', 'by-chain')
        }
      }, 0)

      return newState
    })

    // Apply display options
    if (config.animate && plugin.canvas3d) {
      // Set up camera animation
      const animationType = config.animate
      if (animationType === 'spin') {
        plugin.canvas3d.setProps({
          trackball: {
            ...plugin.canvas3d.props.trackball,
            animate: {
              name: 'spin',
              params: {
                speed: 1
              }
            }
          }
        })
      } else if (animationType === 'rock') {
        plugin.canvas3d.setProps({
          trackball: {
            ...plugin.canvas3d.props.trackball,
            animate: {
              name: 'rock',
              params: {
                speed: 1,
                angle: 15
              }
            }
          }
        })
      }
    }

    if (config.autoZoom !== false) {
      await PluginCommands.Camera.Reset(plugin, {})
    }
  }

  // Screenshot
  const screenshot = async (options?: ScreenshotOptions): Promise<string | void> => {
    if (!pluginRef.current) return

    const plugin = pluginRef.current
    const screenshotHelper = plugin.helpers?.viewportScreenshot

    // Fallback to canvas3d method if helper is not available
    if (!screenshotHelper) {
      console.warn('ViewportScreenshot helper not available, using fallback method')

      if (!plugin.canvas3d) return

      const canvas3d = plugin.canvas3d

      // Apply screenshot options
      if (options?.transparent) {
        canvas3d.setProps({
          renderer: {
            ...canvas3d.props.renderer,
            backgroundColor: 0x00000000
          }
        })
      }

      try {
        // Try the direct canvas approach
        const canvas = canvas3d.webgl.gl.canvas as HTMLCanvasElement

        let dataUrl: string
        if (options?.format === 'jpeg') {
          dataUrl = canvas.toDataURL('image/jpeg', options.quality ? options.quality / 100 : 0.9)
        } else {
          dataUrl = canvas.toDataURL('image/png')
        }

        // Restore background
        if (options?.transparent) {
          applyState(plugin, state)
        }

        // Handle copy/download
        if (options?.copy) {
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

        if (options?.download !== false) {
          const link = document.createElement('a')
          link.download = options?.filename || `molecule-${Date.now()}.${options?.format || 'png'}`
          link.href = dataUrl
          link.click()
        }

        return dataUrl
      } catch (error) {
        console.error('Failed to capture screenshot:', error)
        return
      }
    }

    // Use the ViewportScreenshot helper
    const currentParams = screenshotHelper.values

    // Configure screenshot parameters based on options
    const screenshotParams: any = {
      ...currentParams,
      transparent: options?.transparent ?? false,
      axes: options?.axes ? { name: 'on', params: {} } : { name: 'off', params: {} }
    }

    // Set resolution
    if (options?.resolution) {
      if (options.resolution === 1) {
        screenshotParams.resolution = { name: 'viewport', params: {} }
      } else if (options.resolution === 2) {
        screenshotParams.resolution = { name: 'hd', params: {} }
      } else if (options.resolution === 4) {
        screenshotParams.resolution = { name: 'ultra-hd', params: {} }
      } else {
        // Custom resolution based on current viewport size
        const viewport = plugin.canvas3d?.webgl.gl.canvas as HTMLCanvasElement
        if (viewport) {
          screenshotParams.resolution = {
            name: 'custom',
            params: {
              width: viewport.width * options.resolution,
              height: viewport.height * options.resolution
            }
          }
        }
      }
    }

    // Set format
    if (options?.format === 'jpeg') {
      screenshotParams.format = {
        name: 'jpeg',
        params: { quality: options.quality ?? 90 }
      }
    } else if (options?.format === 'png') {
      screenshotParams.format = { name: 'png', params: {} }
    }

    // Apply the screenshot parameters
    screenshotHelper.behaviors.values.next(screenshotParams)

    // Handle autocrop
    if (options?.autocrop) {
      screenshotHelper.autocrop()
    }

    try {
      // Get the image data URI
      const dataUrl = await screenshotHelper.getImageDataUri()

      // Handle copy to clipboard
      if (options?.copy) {
        await screenshotHelper.copyToClipboard()
      }

      // Handle download
      if (options?.download !== false) {
        const filename = options?.filename || screenshotHelper.getFilename()
        await screenshotHelper.download(filename)
      }

      return dataUrl
    } catch (error) {
      console.error('Failed to capture screenshot:', error)
      return
    }
  }

  // Fullscreen
  const fullscreen = () => {
    if (!containerRef.current) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }

  // Camera controls
  const resetZoom = () => {
    if (!pluginRef.current) return
    PluginCommands.Camera.Reset(pluginRef.current, { durationMs: 250 })
  }

  const resetCamera = () => {
    if (!pluginRef.current) return
    PluginCommands.Camera.Reset(pluginRef.current, { durationMs: 250 })
  }

  const orientAxes = () => {
    if (!pluginRef.current) return
    // Use the built-in OrientAxes command
    PluginCommands.Camera.OrientAxes(pluginRef.current, { durationMs: 250 })
  }

  const resetAxes = () => {
    if (!pluginRef.current) return
    // Use the built-in ResetAxes command
    PluginCommands.Camera.ResetAxes(pluginRef.current, { durationMs: 250 })
  }

  const center = () => {
    if (!pluginRef.current) return
    PluginCommands.Camera.Reset(pluginRef.current, { durationMs: 250 })
  }

  const focus = (selection: string) => {
    if (!pluginRef.current) return

    const parsed = parseSelectionQuery(selection)
    const script = buildMolstarSelection(pluginRef.current, parsed)

    // Focus camera on selection
    pluginRef.current.managers.camera.focusLoci(
      pluginRef.current.managers.structure.selection.fromScript(script)
    )
  }

  // Setters
  const setMolecule = (newState: MoleculeState) => {
    setState(newState)
    if (pluginRef.current) {
      applyState(pluginRef.current, newState)
    }
  }

  const setAppearance = async (config: AppearanceConfig) => {
    setState(prevState => {
      const newState = { ...prevState, ...config }

      // Update protein state if protein config is provided
      if (config.protein) {
        newState.protein = { ...prevState.protein, ...config.protein }
      }

      // Merge postprocessing settings
      if (config.postprocessing) {
        newState.postprocessing = { ...prevState.postprocessing, ...config.postprocessing }
      }

      if (pluginRef.current) {
        // Apply state changes immediately
        setTimeout(() => {
          applyState(pluginRef.current, newState)

          // Apply representation changes
          if (config.protein) {
            applyRepresentation(
              pluginRef.current,
              config.protein.style || newState.protein?.style || 'cartoon',
              config.protein.color || newState.protein?.color || 'by-chain'
            )
          }
        }, 0)
      }

      return newState
    })
  }

  const setCamera = (config: CameraConfig) => {
    if (!pluginRef.current?.canvas3d) return

    const plugin = pluginRef.current
    const camera = plugin.canvas3d.camera


    if (config.position) {
      camera.setSnapshot({
        position: { x: config.position[0], y: config.position[1], z: config.position[2] }
      })
    }

    if (config.zoom !== undefined) {
      camera.zoom(config.zoom)
    }

    // Apply clipping planes
    if (config.clipping !== undefined) {
      console.log('Setting camera clipping:', config.clipping)

      // Molstar expects: radius (0-100), far (boolean), minNear (0.1-100)
      plugin.canvas3d.setProps({
        cameraClipping: {
          radius: 100 - (config.clipping.radius || 0), // Convert UI radius to Molstar radius
          far: config.clipping.far !== undefined ? config.clipping.far : true,
          minNear: config.clipping.minNear || 5
        }
      })

      // Force update
      plugin.canvas3d.requestDraw(true)
    }

    // Apply animation
    if (config.animation !== undefined) {
      if (config.animation === 'off') {
        // Stop any animation
        plugin.canvas3d.setProps({
          trackball: {
            ...plugin.canvas3d.props.trackball,
            animate: {
              name: 'off',
              params: {}
            }
          }
        })
      } else if (config.animation === 'spin') {
        plugin.canvas3d.setProps({
          trackball: {
            ...plugin.canvas3d.props.trackball,
            animate: {
              name: 'spin',
              params: {
                speed: 1
              }
            }
          }
        })
      } else if (config.animation === 'rock') {
        plugin.canvas3d.setProps({
          trackball: {
            ...plugin.canvas3d.props.trackball,
            animate: {
              name: 'rock',
              params: {
                speed: 1,
                angle: 15
              }
            }
          }
        })
      }
    }

    // Apply projection mode
    if (config.projection) {
      plugin.canvas3d.setProps({
        camera: {
          ...plugin.canvas3d.props.camera,
          mode: config.projection
        }
      })
    }

    // Apply field of view
    if (config.fov !== undefined) {
      console.log('Setting FOV to:', config.fov, 'degrees')

      // Debug: Let's see what's available
      console.log('plugin.canvas3d.camera:', plugin.canvas3d.camera)
      console.log('plugin.managers.camera:', plugin.managers.camera)

      // Try using the canvas3d viewport controls
      const viewport = plugin.canvas3d.camera

      // Get current state
      const state = viewport.state
      console.log('Current camera state:', state)

      // The FOV might need to be applied differently
      // Let's try using the viewport's perspective camera settings
      const fovRadians = (config.fov * Math.PI) / 180

      // Try to find the right method to update FOV
      if (viewport.state) {
        // Create a new state with updated FOV
        const newState = {
          ...viewport.state,
          fov: fovRadians
        }

        // Try different ways to apply the state
        if (viewport.setState) {
          viewport.setState(newState)
        } else if (viewport.update) {
          viewport.update(newState)
        } else {
          // Fallback: try using zoom to simulate FOV changes
          // FOV of 45° is typically zoom level 1
          // Smaller FOV = more zoom, larger FOV = less zoom
          const zoomLevel = Math.tan((45 * Math.PI / 180) / 2) / Math.tan(fovRadians / 2)
          console.log('Calculated zoom level:', zoomLevel)

          if (viewport.zoom) {
            viewport.zoom(zoomLevel)
          }
        }
      }

      // Force update
      plugin.canvas3d.requestDraw(true)
    }

    // Apply axes settings
    if (config.axes) {
      console.log('Applying axes settings:', config.axes)

      // Get current camera props
      const currentCameraProps = plugin.canvas3d.props.camera || {}
      const currentHelperProps = currentCameraProps.helper || {}
      const currentAxesProps = currentHelperProps.axes || { name: 'on', params: {} }
      const currentParams = currentAxesProps.params || {}

      // Build new axes params - preserve all existing params
      const newParams: any = { ...currentParams }

      // Only update properties that are explicitly provided
      if (config.axes.opacity !== undefined) {
        // The alpha property controls opacity
        newParams.alpha = config.axes.opacity
      }

      if (config.axes.scale !== undefined) {
        // The scale property controls size
        newParams.scale = config.axes.scale
      }

      if (config.axes.colors) {
        // Only update colors that are explicitly provided
        if (config.axes.colors.x !== undefined) {
          const rgb = hexToRgb(config.axes.colors.x)
          if (rgb) {
            newParams.colorX = (rgb.r << 16) | (rgb.g << 8) | rgb.b
          }
        }
        if (config.axes.colors.y !== undefined) {
          const rgb = hexToRgb(config.axes.colors.y)
          if (rgb) {
            newParams.colorY = (rgb.r << 16) | (rgb.g << 8) | rgb.b
          }
        }
        if (config.axes.colors.z !== undefined) {
          const rgb = hexToRgb(config.axes.colors.z)
          if (rgb) {
            newParams.colorZ = (rgb.r << 16) | (rgb.g << 8) | rgb.b
          }
        }
      }

      // Apply the new camera props with updated axes
      plugin.canvas3d.setProps({
        camera: {
          ...currentCameraProps,
          helper: {
            ...currentHelperProps,
            axes: {
              name: 'on',
              params: newParams
            }
          }
        }
      })

      // Force update
      plugin.canvas3d.requestDraw(true)
    }

    // Apply stereo settings
    if (config.stereo !== undefined) {
      console.log('Applying stereo settings:', config.stereo)

      // Build stereo configuration
      const stereoConfig: any = {
        name: config.stereo.enabled ? 'on' : 'off',
        params: config.stereo.enabled ? {
          eyeSeparation: config.stereo.eyeSeparation || 0.064,
          focus: config.stereo.focus || 10
        } : {}
      }

      // Apply stereo to camera props
      const currentProps = plugin.canvas3d.props
      plugin.canvas3d.setProps({
        camera: {
          ...currentProps.camera,
          stereo: stereoConfig
        }
      })

      // Force canvas to update for stereo viewport
      if (config.stereo.enabled) {
        // Commit changes and force redraw
        plugin.canvas3d.commit(true)

        // Trigger viewport resize to ensure stereo viewports are properly configured
        setTimeout(() => {
          plugin.canvas3d.handleResize()
          plugin.canvas3d.requestDraw(true)
        }, 50)

        // Debug: Check if stereo camera is active
        console.log('Stereo enabled:', {
          cameraProps: plugin.canvas3d.props.camera,
          stereoConfig,
          viewport: plugin.canvas3d.viewport
        })
      } else {
        // When disabling stereo, also trigger resize to restore single viewport
        plugin.canvas3d.commit(true)
        setTimeout(() => {
          plugin.canvas3d.handleResize()
          plugin.canvas3d.requestDraw(true)
        }, 50)
      }
    }

    setState(prev => ({ ...prev, camera: config }))
  }

  const setQuality = (config: QualitySettings) => {
    setState(prev => ({ ...prev, quality: config }))
    if (pluginRef.current) {
      applyQualitySettings(pluginRef.current, config)
    }
  }

  const setSelection = (config: SelectionConfig) => {
    let newSelections = [...selections]
    let newState: Partial<MoleculeState> = {}

    // Handle selection mode change
    if (config.mode) {
      newState.selectionMode = config.mode

      // Apply the selection mode to Molstar
      if (pluginRef.current?.managers?.interactivity?.lociSelects) {
        const granularity = config.mode === 'atom' ? 'element' :
          config.mode === 'residue' ? 'residue' :
            config.mode === 'chain' ? 'chain' :
              config.mode === 'entity' ? 'entity' :
                config.mode === 'model' ? 'model' :
                  config.mode === 'operator' ? 'operator' :
                    config.mode === 'structure' ? 'structure' :
                      config.mode === 'atom-instance' ? 'element-instance' :
                        config.mode === 'residue-instance' ? 'residue-instance' :
                          config.mode === 'chain-instance' ? 'chain-instance' :
                            'residue'

        pluginRef.current.managers.interactivity.lociSelects.granularity = granularity
      }
    }

    if (config.clear) {
      newSelections = []
    }
    if (config.set) {
      newSelections = [config.set]
    }
    if (config.add) {
      newSelections.push(config.add)
    }
    if (config.remove) {
      newSelections = newSelections.filter(s => s !== config.remove)
    }

    setSelections(newSelections)
    setState(prev => ({ ...prev, ...newState, selected: newSelections }))

    if (pluginRef.current) {
      // Apply selections
      pluginRef.current.managers.structure.selection.clear()

      newSelections.forEach(sel => {
        const parsed = parseSelectionQuery(sel)
        const script = buildMolstarSelection(pluginRef.current, parsed)
        pluginRef.current.managers.structure.selection.fromScript(script, 'add')
      })

      if (config.autoFocus && newSelections.length > 0) {
        focus(newSelections[newSelections.length - 1])
      }
    }
  }

  const setStructure = (config: StructureConfig) => {
    setState(prev => ({ ...prev, structure: config }))
    // TODO: Implement structure visibility controls
  }

  const setStylePreset = async (preset: 'default' | 'illustrative' | 'publication' | 'performance') => {
    if (!pluginRef.current) return

    const plugin = pluginRef.current

    if (preset === 'default') {
      // Apply default style (normal lighting, no postprocessing)

      if (plugin.canvas3d) {
        plugin.canvas3d.setProps({
          renderer: {
            ...plugin.canvas3d.props.renderer,
            style: { name: 'auto' }
          },
          postprocessing: {
            outline: { name: 'off', params: {} },
            occlusion: { name: 'off', params: {} },
            shadow: { name: 'off', params: {} }
          }
        })
      }

      setAppearance({
        lighting: 'soft',
        postprocessing: {
          outline: { on: false },
          occlusion: { on: false },
          shadow: { on: false }
        }
      })
    } else if (preset === 'illustrative') {
      // Apply illustrative style (flat shading + outline, no occlusion for simplicity)

      if (plugin.canvas3d) {
        plugin.canvas3d.setProps({
          renderer: {
            ...plugin.canvas3d.props.renderer,
            style: { name: 'illustrative' }
          },
          postprocessing: {
            outline: { name: 'on', params: { scale: 1, threshold: 0.33 } },
            occlusion: { name: 'off' },
            shadow: { name: 'off' }
          }
        })
      }

      setAppearance({
        lighting: 'off',
        postprocessing: {
          outline: { on: true, params: { scale: 1, threshold: 0.33 } },
          occlusion: { on: false },
          shadow: { on: false }
        }
      })
    } else if (preset === 'publication') {
      // High quality style with subtle effects

      if (plugin.canvas3d) {
        plugin.canvas3d.setProps({
          renderer: {
            ...plugin.canvas3d.props.renderer,
            style: { name: 'auto' }
          },
          postprocessing: {
            outline: {
              name: 'on',
              params: {
                scale: 0.6,
                threshold: 0.8,
                includeTransparent: true
              }
            },
            occlusion: { name: 'off' },
            shadow: { name: 'off' }
          }
        })
      }

      setAppearance({
        lighting: 'soft',
        postprocessing: {
          outline: { on: true, params: { scale: 0.6, threshold: 0.8 } },
          occlusion: { on: false },
          shadow: { on: false }
        }
      })
    } else if (preset === 'performance') {
      // Minimal effects for best performance

      if (plugin.canvas3d) {
        plugin.canvas3d.setProps({
          renderer: {
            ...plugin.canvas3d.props.renderer,
            style: { name: 'auto' }
          },
          postprocessing: {
            outline: { name: 'off' },
            occlusion: { name: 'off' },
            shadow: { name: 'off' }
          }
        })
      }

      setAppearance({
        postprocessing: {
          outline: { on: false },
          occlusion: { on: false },
          shadow: { on: false }
        }
      })
    }
  }


  // Native Molstar features
  const [savedStates, setSavedStates] = useState<string[]>([])
  const [selectionSets] = useState<Map<string, string>>(new Map())

  // State management
  const saveState = async (name: string) => {
    if (!pluginRef.current) return

    try {
      const state = await pluginRef.current.state.getSnapshot()
      // In a real app, you'd save this to localStorage or a database
      localStorage.setItem(`molstar_state_${name}`, JSON.stringify(state))
      setSavedStates(prev => [...prev.filter(s => s !== name), name])
    } catch (error) {
      console.error('Failed to save state:', error)
    }
  }

  const loadState = async (name: string) => {
    if (!pluginRef.current) return

    try {
      const stateStr = localStorage.getItem(`molstar_state_${name}`)
      if (stateStr) {
        const state = JSON.parse(stateStr)
        await pluginRef.current.state.setSnapshot(state)
      }
    } catch (error) {
      console.error('Failed to load state:', error)
    }
  }

  const clearState = () => {
    if (!pluginRef.current) return
    pluginRef.current.clear()
  }

  // Measurements
  const measureDistance = (atom1: string, atom2: string) => {
    if (!pluginRef.current) return
    console.log('Measuring distance between:', atom1, atom2)
    // TODO: Implement distance measurement
  }

  const measureAngle = (atom1: string, atom2: string, atom3: string) => {
    if (!pluginRef.current) return
    console.log('Measuring angle between:', atom1, atom2, atom3)
    // TODO: Implement angle measurement
  }

  const measureDihedral = (atom1: string, atom2: string, atom3: string, atom4: string) => {
    if (!pluginRef.current) return
    console.log('Measuring dihedral angle between:', atom1, atom2, atom3, atom4)
    // TODO: Implement dihedral measurement
  }

  const clearMeasurements = () => {
    if (!pluginRef.current) return
    // TODO: Clear all measurements
  }

  // Track available components
  const [availableComponents, setAvailableComponents] = useState<Set<string>>(new Set())
  
  // Structure tools - track component visibility state
  const [componentVisibility, setComponentVisibility] = useState<{
    protein: boolean
    ligand: boolean
    nucleic: boolean
    water: boolean
    ion: boolean
  }>({
    protein: true,
    ligand: true,
    nucleic: true,
    water: false,
    ion: true
  })
  
  // Get actual visibility state from Molstar
  const getComponentVisibilityFromMolstar = () => {
    if (!pluginRef.current) return componentVisibility
    
    const plugin = pluginRef.current
    const visibility: typeof componentVisibility = { ...componentVisibility }
    
    // Map component types to their labels in the state tree
    const componentMap = {
      protein: ['Polymer', 'Protein'],
      ligand: ['Ligand'],
      water: ['Water'],
      ion: ['Ion'],
      nucleic: ['Nucleic', 'RNA', 'DNA']
    }
    
    // Check each component's actual visibility
    for (const [type, labels] of Object.entries(componentMap)) {
      for (const [_ref, cell] of plugin.state.data.cells) {
        const label = cell.obj?.label || ''
        if (labels.some(l => label.includes(l))) {
          // Found the component, check if it's hidden
          visibility[type as keyof typeof visibility] = !cell.state.isHidden
          break
        }
      }
    }
    
    return visibility
  }

  const toggleComponent = async (typeOrRef: 'protein' | 'ligand' | 'nucleic' | 'water' | 'ion' | string) => {
    if (!pluginRef.current) return

    const plugin = pluginRef.current

    try {
      // Check if this is a specific component ref or a generic type
      const isRef = typeOrRef.includes('-') || typeOrRef.length > 10 // refs are usually longer UIDs
      
      if (isRef) {
        // Toggle specific component by reference
        console.log(`Toggling specific component: ${typeOrRef}`)
        
        // Find the component in the hierarchy by ref
        const hierarchy = plugin.managers.structure.hierarchy.current
        let targetComponent: any = null
        
        for (const structure of hierarchy.structures) {
          for (const component of structure.components) {
            if (component.cell.transform.ref === typeOrRef) {
              targetComponent = component
              break
            }
          }
          if (targetComponent) break
        }
        
        if (targetComponent) {
          // Toggle this specific component
          plugin.managers.structure.component.toggleVisibility([targetComponent])
        }
      } else {
        // Legacy behavior for generic types
        const type = typeOrRef as 'protein' | 'ligand' | 'nucleic' | 'water' | 'ion'
        const newVisibility = !componentVisibility[type]

        console.log(`Toggling ${type} visibility to:`, newVisibility)

        // Update local state immediately for responsive UI
        setComponentVisibility(prev => ({
          ...prev,
          [type]: newVisibility
        }))

        // Use Molstar's hierarchy manager to get components
        const hierarchy = plugin.managers.structure.hierarchy.current
        const componentRefs: any[] = []
        
        // Map our component types to possible labels
        const typeToLabels: Record<string, string[]> = {
          'protein': ['Polymer', 'Protein', 'protein', 'helix', 'beta-strand', 'beta-sheet', 'backbone', 'sidechain'],
          'ligand': ['Ligand', 'ligand', 'Non-standard', 'Modified Residues'],
          'water': ['Water', 'water'],
          'ion': ['Ion', 'ion'],
          'nucleic': ['Nucleic', 'nucleic', 'RNA', 'DNA']
        }
        
        const targetLabels = typeToLabels[type] || []
        
        // Find matching components from hierarchy
        for (const structure of hierarchy.structures) {
          for (const component of structure.components) {
            const label = component.cell.obj?.label || ''
            
            // Check if this component matches our type
            if (targetLabels.some(target => label.toLowerCase().includes(target.toLowerCase()))) {
              componentRefs.push(component)
            }
          }
        }
        
        if (componentRefs.length > 0) {
          // Use Molstar's component manager to toggle visibility
          console.log(`Found ${componentRefs.length} ${type} components, toggling visibility...`)
          
          // Determine action based on desired visibility
          const action = newVisibility ? 'show' : 'hide'
          
          // Use the component manager's toggleVisibility method
          plugin.managers.structure.component.toggleVisibility(componentRefs)
          
          // Alternatively, we can use the hierarchy manager
          // plugin.managers.structure.hierarchy.toggleVisibility(componentRefs, action)
        } else {
          console.log(`No ${type} components found in hierarchy`)
          
          // Revert state since we couldn't find components
          setComponentVisibility(prev => ({
            ...prev,
            [type]: !newVisibility
          }))
        }
      }

      // After toggling, sync our state with Molstar's actual state
      setTimeout(() => {
        const actualVisibility = getComponentVisibilityFromMolstar()
        setComponentVisibility(actualVisibility)
        console.log('Synced visibility state:', actualVisibility)
      }, 100)

      console.log('Component visibility toggle completed')
    } catch (error) {
      console.error('Failed to toggle component:', error)
    }
  }

  const hideComponent = async (type: 'protein' | 'ligand' | 'nucleic' | 'water' | 'ion') => {
    if (!pluginRef.current) return

    const plugin = pluginRef.current

    // Update local state
    setComponentVisibility(prev => ({
      ...prev,
      [type]: false
    }))

    try {
      const allReps = plugin.state.data.selectQ((q: any) =>
        q.ofType(PluginStateObject.Molecule.Structure.Representation3D)
      )

      const update = plugin.state.data.build()

      for (const repr of allReps) {
        const label = repr.obj?.label?.toLowerCase() || ''
        let shouldHide = false

        if (type === 'protein') {
          shouldHide = label.includes('polymer') || label.includes('protein')
        } else if (type === 'ligand') {
          shouldHide = label.includes('ligand') || label.includes('het') ||
            (label.includes('component') && !label.includes('polymer') &&
              !label.includes('water') && !label.includes('ion'))
        } else if (type === 'water') {
          shouldHide = label.includes('water') || label.includes('solvent')
        } else if (type === 'ion') {
          shouldHide = label.includes('ion')
        } else if (type === 'nucleic') {
          shouldHide = label.includes('nucleic') || label.includes('rna') || label.includes('dna')
        }

        if (shouldHide) {
          update.to(repr).update({ isHidden: true })
        }
      }

      await update.commit()
    } catch (error) {
      console.error('Failed to hide component:', error)
    }
  }

  const removeComponent = async (typeOrRef: 'protein' | 'ligand' | 'nucleic' | 'water' | 'ion' | string) => {
    if (!pluginRef.current) return

    const plugin = pluginRef.current
    
    // Check if this is a component reference (contains hyphen or is long)
    const isRef = typeOrRef.includes('-') || typeOrRef.length > 10
    
    if (isRef) {
      // Remove specific component by reference
      console.log(`Removing component by ref: ${typeOrRef}`)
      
      try {
        // Find the component in the hierarchy
        let targetComponent = null
        for (const s of plugin.managers.structure.hierarchy.current.structures) {
          for (const c of s.components) {
            if (c.cell.transform.ref === typeOrRef) {
              targetComponent = c
              break
            }
          }
          if (targetComponent) break
        }
        
        if (targetComponent) {
          // Remove the component using hierarchy manager
          await plugin.managers.structure.hierarchy.remove([targetComponent], true)
          console.log(`Component ${typeOrRef} removed successfully`)
          
          // Force UI update
          forceUpdate()
        } else {
          console.log(`Component ${typeOrRef} not found`)
        }
      } catch (error) {
        console.error(`Failed to remove component ${typeOrRef}:`, error)
      }
    } else {
      // Original logic for removing by type
      const type = typeOrRef as 'protein' | 'ligand' | 'nucleic' | 'water' | 'ion'
      console.log(`Removing ${type} component...`)

      try {
        // Find components in the state tree
        const cells = plugin.state.data.cells
        const componentRefs: string[] = []
        
        // Map our component types to Molstar's labels
        const typeToLabels: Record<string, string[]> = {
          'protein': ['Polymer', 'Protein'],
          'ligand': ['Ligand', 'Non-standard', 'Modified Residues'],
          'water': ['Water'],
          'ion': ['Ion'],
          'nucleic': ['Nucleic', 'RNA', 'DNA']
        }
        
        const targetLabels = typeToLabels[type] || []
        
        // Search through all cells to find matching components
        for (const [ref, cell] of cells) {
          const label = cell.obj?.label || ''
          
          // Check if this cell is a component we want to remove
          if (targetLabels.some(target => label.includes(target))) {
            componentRefs.push(ref)
          }
        }
        
        if (componentRefs.length > 0) {
          // Remove the components from the state tree
          const update = plugin.state.data.build()
          
          for (const ref of componentRefs) {
            console.log(`Removing component: ${ref}`)
            update.delete(ref)
          }
          
          await update.commit()
          
          // Update available components
          const newAvailable = new Set(availableComponents)
          newAvailable.delete(type)
          setAvailableComponents(newAvailable)
          
          // Update component visibility state
          setComponentVisibility(prev => ({
            ...prev,
            [type]: false
          }))
          
          console.log(`${type} component removed successfully`)
        } else {
          console.log(`No ${type} component found to remove`)
        }
      } catch (error) {
        console.error(`Failed to remove ${type} component:`, error)
      }
    }
  }

  const showComponent = async (type: 'protein' | 'ligand' | 'nucleic' | 'water' | 'ion') => {
    if (!pluginRef.current) return

    const plugin = pluginRef.current

    // Update local state
    setComponentVisibility(prev => ({
      ...prev,
      [type]: true
    }))

    try {
      const allReps = plugin.state.data.selectQ((q: any) =>
        q.ofType(PluginStateObject.Molecule.Structure.Representation3D)
      )

      const update = plugin.state.data.build()

      for (const repr of allReps) {
        const label = repr.obj?.label?.toLowerCase() || ''
        let shouldShow = false

        if (type === 'protein') {
          shouldShow = label.includes('polymer') || label.includes('protein')
        } else if (type === 'ligand') {
          shouldShow = label.includes('ligand') || label.includes('het') ||
            (label.includes('component') && !label.includes('polymer') &&
              !label.includes('water') && !label.includes('ion'))
        } else if (type === 'water') {
          shouldShow = label.includes('water') || label.includes('solvent')
        } else if (type === 'ion') {
          shouldShow = label.includes('ion')
        } else if (type === 'nucleic') {
          shouldShow = label.includes('nucleic') || label.includes('rna') || label.includes('dna')
        }

        if (shouldShow) {
          update.to(repr).update({ isHidden: false })
        }
      }

      await update.commit()
    } catch (error) {
      console.error('Failed to show component:', error)
    }
  }

  // Hierarchy
  const getHierarchy = () => {
    if (!pluginRef.current) return null
    // TODO: Return structure hierarchy
    return pluginRef.current.state.data
  }

  const toggleChain = (chainId: string) => {
    if (!pluginRef.current) return
    console.log('Toggling chain:', chainId)
    // TODO: Implement chain toggle
  }

  // Apply component preset
  const applyComponentPreset = async (preset: string) => {
    if (!pluginRef.current) return

    const plugin = pluginRef.current
    console.log(`Applying component preset: ${preset}`)

    try {
      const structures = plugin.managers.structure.hierarchy.current.structures
      if (structures.length === 0) {
        console.warn('No structures loaded to apply preset')
        return
      }

      // Map our preset names to Molstar's preset keys
      const presetMap: Record<string, string> = {
        'empty': 'empty',
        'auto': 'auto',
        'atomic-detail': 'atomic-detail',
        'polymer-cartoon': 'polymer-cartoon',
        'polymer-and-ligand': 'polymer-and-ligand',
        'protein-and-nucleic': 'protein-and-nucleic',
        'coarse-surface': 'coarse-surface',
        'illustrative': 'illustrative',
        'molecular-surface': 'molecular-surface',
        'automatic-detail': 'auto-lod'
      }

      const molstarPreset = presetMap[preset] || 'auto'
      
      // Apply the preset to all structures
      await plugin.managers.structure.component.applyPreset(
        structures,
        PresetStructureRepresentations[molstarPreset],
        {
          quality: 'auto',
          ignoreHydrogens: true
        }
      )

      // After applying preset, update available components
      setTimeout(() => {
        // Re-detect components
        const detectedComponents = new Set<string>()
        for (const [, cell] of plugin.state.data.cells) {
          if (cell.obj?.type?.name === 'Structure' && cell.obj?.label) {
            const label = cell.obj.label.toLowerCase()
            if (label.includes('polymer') || label.includes('protein')) {
              detectedComponents.add('protein')
            } else if (label.includes('ligand')) {
              detectedComponents.add('ligand')
            } else if (label.includes('water')) {
              detectedComponents.add('water')
            } else if (label.includes('ion')) {
              detectedComponents.add('ion')
            } else if (label.includes('nucleic') || label.includes('rna') || label.includes('dna')) {
              detectedComponents.add('nucleic')
            }
          }
        }
        
        setAvailableComponents(detectedComponents)
        
        // Update visibility state
        const actualVisibility = getComponentVisibilityFromMolstar()
        setComponentVisibility(actualVisibility)
      }, 500)

      console.log(`Component preset '${preset}' applied successfully`)
    } catch (error) {
      console.error(`Failed to apply component preset '${preset}':`, error)
    }
  }

  const setRepresentationPreset = async (preset: 'default' | 'cartoon' | 'spacefill' | 'surface') => {
    if (!pluginRef.current) return

    const plugin = pluginRef.current

    try {
      if (preset === 'default') {
        // Use Molstar's automatic preset
        await applyComponentPreset('auto')
      } else if (preset === 'cartoon') {
        // Use polymer-cartoon preset
        await applyComponentPreset('polymer-cartoon')
      } else if (preset === 'spacefill') {
        console.log('Applying spacefill preset...')
        // For spacefill, we need to use a different approach
        // First apply the atomic-detail preset to get all atoms
        await applyComponentPreset('atomic-detail')
        
        // Then change all representations to spacefill
        const update = plugin.state.data.build()
        const structureReprs = plugin.state.data.selectQ((q: any) =>
          q.ofType(PluginStateObject.Molecule.Structure.Representation3D)
        )
        
        console.log(`Found ${structureReprs.length} representations to update`)
        
        for (const repr of structureReprs) {
          // Update each representation to spacefill
          update.to(repr).update(StateTransforms.Representation.StructureRepresentation3D, (old: any) => ({
            ...old,
            type: { name: 'spacefill', params: {} }
          }))
        }
        
        await update.commit()
        console.log('Spacefill preset applied')
      } else if (preset === 'surface') {
        // Use molecular-surface preset
        console.log('Applying surface preset...')
        await applyComponentPreset('molecular-surface')
      }
    } catch (error) {
      console.error(`Failed to apply representation preset '${preset}':`, error)
    }
  }

  // Advanced selection
  const selectByExpression = (expression: string) => {
    if (!pluginRef.current) return
    console.log('Selecting by expression:', expression)
    // TODO: Implement expression-based selection
  }

  const createSelectionSet = (name: string, selection: string) => {
    selectionSets.set(name, selection)
    console.log('Created selection set:', name, selection)
  }

  const applySelectionSet = (name: string) => {
    const selection = selectionSets.get(name)
    if (selection) {
      selectByExpression(selection)
    }
  }

  const deleteSelectionSet = (name: string) => {
    selectionSets.delete(name)
    console.log('Deleted selection set:', name)
  }

  // Get active components with their details
  const getComponents = () => {
    if (!pluginRef.current) return []
    
    const plugin = pluginRef.current
    const components: Array<{
      type: string
      label: string
      representation: string
      isVisible: boolean
      ref: string
    }> = []
    
    // Component type mapping
    const labelToType: Record<string, string> = {
      'Polymer': 'protein',
      'Protein': 'protein',
      'Ligand': 'ligand',
      'Water': 'water',
      'Ion': 'ion',
      'Nucleic': 'nucleic',
      'RNA': 'nucleic',
      'DNA': 'nucleic'
    }
    
    // Debug: Log all state data cells
    console.log('Getting components from Molstar state...')
    
    // Try getting components from the hierarchy
    try {
      const hierarchy = plugin.managers.structure.hierarchy.current
      console.log('Current hierarchy:', hierarchy)
      
      // Check if we have structures with components
      if (hierarchy.structures && hierarchy.structures.length > 0) {
        for (const structure of hierarchy.structures) {
          console.log('Structure components:', structure.components)
          
          if (structure.components) {
            for (const component of structure.components) {
              console.log('Component:', component)
              
              const cell = component.cell
              if (cell && cell.obj) {
                const label = cell.obj.label || ''
                const ref = cell.transform.ref
                console.log(`Found component from hierarchy: ${label} (ref: ${ref})`)
                
                // Find representations for this component
                let representationType = 'unknown'
                let isVisible = true
                
                // Look for representations
                const representations = plugin.state.data.selectQ((q: any) =>
                  q.ofType(PluginStateObject.Molecule.Structure.Representation3D)
                )
                
                for (const repr of representations) {
                  if (repr.transform.parent === ref) {
                    const reprData = repr.transform.params
                    const reprTypeName = reprData?.type?.name || repr.obj?.data?.repr?.props?.type?.name || ''
                    
                    if (reprTypeName) {
                      representationType = reprTypeName === 'cartoon' ? 'Cartoon' :
                                         reprTypeName === 'ball-and-stick' ? 'Ball & Stick' :
                                         reprTypeName === 'molecular-surface' ? 'Surface' :
                                         reprTypeName === 'spacefill' ? 'Spacefill' :
                                         reprTypeName === 'backbone' ? 'Backbone' :
                                         reprTypeName === 'line' ? 'Line' :
                                         reprTypeName === 'gaussian-surface' ? 'Gaussian Surface' :
                                         reprTypeName.charAt(0).toUpperCase() + reprTypeName.slice(1).replace(/-/g, ' ')
                    }
                    
                    isVisible = !repr.state.isHidden
                    break
                  }
                }
                
                // Determine component type
                let componentType = 'custom'
                for (const [labelKey, typeValue] of Object.entries(labelToType)) {
                  if (label.includes(labelKey)) {
                    componentType = typeValue
                    break
                  }
                }
                
                components.push({
                  type: componentType,
                  label: label,
                  representation: representationType,
                  isVisible: isVisible,
                  ref: ref
                })
              }
            }
          }
        }
        
        console.log('Components from hierarchy:', components.length)
        if (components.length > 0) {
          return components
        }
      }
    } catch (error) {
      console.error('Error getting components from hierarchy:', error)
    }
    
    // Get all structure selections and structures
    for (const [ref, cell] of plugin.state.data.cells) {
      // Look for both Structure and StructureSelection types
      const isStructure = cell.obj?.type?.name === 'Structure'
      const isSelection = cell.obj?.type?.name === 'StructureSelection' || 
                         cell.transform?.transformer?.id === 'ms-plugin.structure-selection-from-expression'
      
      // Also check if this is a structure component that was just created
      const isComponent = cell.transform?.transformer?.id === 'ms-plugin.structure-component'
      
      if (isStructure || isSelection || isComponent) {
        const label = cell.obj?.label || cell.transform?.params?.label || ''
        const transformerId = cell.transform?.transformer?.id || ''
        
        console.log(`Found component: ${label} (type: ${cell.obj?.type?.name}, transformer: ${transformerId}, ref: ${ref})`)
        
        // Skip certain system components but allow empty labels for new components
        if (label === 'Model' || label === 'Trajectory' || label.startsWith('Assembly')) {
          continue
        }
        
        // For selections without labels, check if they have representations
        if (!label && isSelection) {
          // Check if this selection has any representations
          const hasRepresentation = Array.from(plugin.state.data.cells.values()).some(
            (repCell: any) => repCell.transform?.parent === ref && 
                            repCell.obj?.type?.name === 'Representation3D'
          )
          if (!hasRepresentation) {
            continue // Skip selections without representations
          }
        }
        
        // Determine component type
        let componentType = 'custom'
        
        // Check if this is a component type we recognize
        for (const [labelKey, typeValue] of Object.entries(labelToType)) {
          if (label.includes(labelKey)) {
            componentType = typeValue
            break
          }
        }
        
        // Also check for custom component labels (e.g., "protein Component", "helix Component")
        if (componentType === 'custom' && label.includes(' Component')) {
          const selectionName = label.replace(' Component', '').toLowerCase()
          // Map selection names to types if possible
          if (selectionName === 'protein') componentType = 'protein'
          else if (selectionName === 'ligand') componentType = 'ligand'
          else if (selectionName === 'water') componentType = 'water'
          else if (selectionName === 'ion') componentType = 'ion'
          else if (selectionName === 'nucleic') componentType = 'nucleic'
          else componentType = selectionName // Use the selection name as the type
        }
        
        // Find the representation type for this component
        let representationType = 'unknown'
        let isVisible = true
        
        // Look for child representations
        const representations = plugin.state.data.selectQ((q: any) =>
          q.ofType(PluginStateObject.Molecule.Structure.Representation3D)
        )
        
        console.log(`Looking for representations for component ${label} (ref: ${ref})`)
        
        for (const repr of representations) {
          // Check if this representation belongs to this component
          console.log(`  Checking repr: parent=${repr.transform.parent}, label=${repr.obj?.label}`)
          if (repr.transform.parent === ref) {
            // Found a representation for this component
            const reprData = repr.transform.params
            
            // Try multiple ways to get the representation type
            let reprTypeName = ''
            
            // Method 1: From transform params
            if (reprData?.type?.name) {
              reprTypeName = reprData.type.name
            }
            // Method 2: From the representation object itself
            else if (repr.obj?.data?.repr?.props?.type?.name) {
              reprTypeName = repr.obj.data.repr.props.type.name
            }
            // Method 3: From state definition
            else if (repr.state?.type?.name) {
              reprTypeName = repr.state.type.name
            }
            // Method 4: From the representation data directly
            else if (repr.obj?.data?.props?.type?.name) {
              reprTypeName = repr.obj.data.props.type.name
            }
            // Method 5: Check transformer params
            else if (repr.transform?.transformer?.definition?.params?.type?.defaultValue?.name) {
              // Sometimes the type is stored in the transformer definition
              reprTypeName = repr.transform.params?.type?.name || repr.transform.transformer.definition.params.type.defaultValue.name
            }
            
            console.log(`  Found representation for ${label}: type=${reprTypeName}, params=`, reprData)
            console.log(`  Full repr object:`, repr)
            console.log(`  repr.obj?.data?.repr?.props:`, repr.obj?.data?.repr?.props)
            
            // Get visibility from representation state
            isVisible = !repr.state.isHidden
            
            if (reprTypeName === 'cartoon') {
              representationType = 'Cartoon'
            } else if (reprTypeName === 'ball-and-stick') {
              representationType = 'Ball & Stick'
            } else if (reprTypeName === 'molecular-surface') {
              representationType = 'Surface'
            } else if (reprTypeName === 'spacefill') {
              representationType = 'Spacefill'
            } else if (reprTypeName === 'backbone') {
              representationType = 'Backbone'
            } else if (reprTypeName === 'line') {
              representationType = 'Line'
            } else if (reprTypeName === 'gaussian-surface') {
              representationType = 'Gaussian Surface'
            } else if (reprTypeName) {
              // Handle any other representation types
              representationType = reprTypeName.charAt(0).toUpperCase() + reprTypeName.slice(1).replace(/-/g, ' ')
            } else {
              // If no type name, check the representation label
              const reprLabel = repr.obj?.label || ''
              if (reprLabel) {
                representationType = reprLabel
              }
            }
            break
          }
        }
        
        // If no representation found, check if the component itself has visibility state
        if (representationType === 'unknown' && cell.state?.isHidden !== undefined) {
          isVisible = !cell.state.isHidden
        }
        
        components.push({
          type: componentType,
          label: label,
          representation: representationType,
          isVisible: isVisible,
          ref: ref
        })
      }
    }
    
    console.log('Total components found:', components.length)
    return components
  }
  
  // Create a new component with selection and representation
  const createComponent = async (
    selection: string,
    representation: string,
    label?: string,
    checkExisting?: boolean
  ) => {
    if (!pluginRef.current) {
      console.error('Plugin not initialized')
      return
    }
    
    const plugin = pluginRef.current
    console.log('Creating component:', { selection, representation, label, checkExisting })
    
    try {
      // Use the plugin's component manager directly - this is what works!
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
        console.log('Component created successfully using manager')
        
        // Force update components list after a delay
        setTimeout(() => {
          const updatedComponents = getComponents()
          console.log('Components after creation:', updatedComponents)
          forceUpdate() // Force re-render
        }, 500)
      }
    } catch (error) {
      console.error('Failed to create component:', error)
    }
  }
  
  // Create molecule instance
  const molecule: MoleculeInstance = useMemo(() => ({
    isInitialized,
    selections,
    selectionMode: state.selectionMode,
    // Component visibility
    componentVisibility: getComponentVisibilityFromMolstar(),
    availableComponents: Array.from(availableComponents),
    // Active components getter
    get components() { return getComponents() },
    // Expose current state
    background: state.background,
    lighting: state.lighting,
    protein: state.protein,
    ligand: state.ligand,
    nucleic: state.nucleic,
    water: state.water,
    ion: state.ion,
    quality: state.quality,
    // Methods
    load,
    screenshot,
    fullscreen,
    resetZoom,
    resetCamera,
    orientAxes,
    resetAxes,
    center,
    focus,
    // Native Molstar features
    plugin: pluginRef.current,
    // State management
    saveState,
    loadState,
    clearState,
    states: savedStates,
    // Measurements
    measureDistance,
    measureAngle,
    measureDihedral,
    clearMeasurements,
    // Structure tools
    toggleComponent,
    hideComponent,
    showComponent,
    removeComponent,
    // Hierarchy
    getHierarchy,
    toggleChain,
    // Presets
    applyComponentPreset,
    // Advanced selection
    selectByExpression,
    createSelectionSet,
    applySelectionSet,
    deleteSelectionSet,
    selectionSets,
    // Component creation
    createComponent,
    // Style presets
    setStylePreset,
    setRepresentationPreset,
    // Add containerRef as a non-enumerable property
    get containerRef() { return containerRef }
  }), [isInitialized, selections, state, availableComponents, savedStates, selectionSets, forceUpdate])

  const setters = useMemo(() => ({
    setMolecule,
    setAppearance,
    setCamera,
    setQuality,
    setSelection,
    setStructure,
    setStylePreset,
    setRepresentationPreset
  }), [])

  return [molecule, setters]
}
