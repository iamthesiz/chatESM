import { useMemo, useRef, useReducer } from 'react'
import { useAtom } from 'jotai'
import { createPluginUI } from 'molstar/lib/mol-plugin-ui'
import { renderReact18 } from 'molstar/lib/mol-plugin-ui/react18'
import useIdEffect from './useIdEffect'
import { useEvent } from './useEvent'
import { getStructureSource, sleep, isPdbId, isUrl } from '../utils'
import { molstarStateAtomFamily } from './atoms'
import { DEFAULT_MOLSTAR_ID } from './constants'
import 'molstar/lib/mol-plugin-ui/skin/light.scss'

interface LoadOptions {
  pdbId?: string
  url?: string
  format?: 'pdb' | 'cif' | 'mmcif' | 'sdf' | 'mol' | 'mol2'
}

/**
 * Hook to access the shared Molstar instance
 * @param id - The ID of the Molstar instance, or a PDB ID/URL to auto-load (defaults to DEFAULT_MOLSTAR_ID)
 * @param typeId - Optional type identifier for debugging
 * @returns Object with molstar instance and loading state
 */
export function useMolstar(id: string = DEFAULT_MOLSTAR_ID, _typeId?: string) {
  const container = useEvent<HTMLDivElement>(id)
  const [state, setState] = useAtom(molstarStateAtomFamily(id))
  const hasAutoLoaded = useRef(false)
  const isInitializing = useRef(false)
  const rerender = useReducer((x: number) => x + 1, 0)[1]

  const initMolstar = async () => {
    if (!container.ref || isInitializing.current || state.molstar) {
      return
    }

    isInitializing.current = true
    try {
      const plugin = await createPluginUI({
        target: container.ref,
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

      setState(prev => ({ ...prev, molstar: plugin }))
      checkAutoLoad(plugin)
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }))
      isInitializing.current = false
    }
  }

  // Check if we should auto-load based on ID
  const checkAutoLoad = (molstar: any) => {
    if (!hasAutoLoaded.current) {
      // Check if there are already structures loaded
      const structures = molstar?.managers?.structure?.hierarchy?.current?.structures
      const hasStructures = structures?.length > 0

      if (!hasStructures) {
        if (isPdbId(id)) {
          hasAutoLoaded.current = true
          load({ pdbId: id }).catch((err: any) => {
          })
        } else if (isUrl(id)) {
          hasAutoLoaded.current = true
          load({ url: id }).catch((err: any) => {
          })
        } else {
          // Not a PDB ID or URL, keep loading as true so external code can trigger loading
          // Don't set loading to false here
        }
      } else {
        // Already has structures
        // Keep loading as true - let the component handle loading
      }
    }
  }

  const hook = useIdEffect(id, async (isFirstMount: boolean) => {

    if (isFirstMount) {

      if (!hook.context.rerender) {
        hook.context.rerender = rerender
      }

      if (container.ref) {
        await initMolstar()
      } else {
        container.on('mount', async () => {
          await initMolstar()
        })
      }
    }

    return (isLastUnmount: boolean) => {
      if (isLastUnmount && state.molstar) {
        state.molstar.dispose()
        setState(prev => ({ ...prev, molstar: null, loading: true }))
      }
    }
  }, [])

  const loadStructureData = async (config: LoadOptions) => {
    const molstar = state.molstar
    if (!molstar) {
      throw new Error('Molstar not initialized')
    }

    const { url, format } = getStructureSource(config)

    try {
      // Use the plugin's builders which handle state management properly
      const isBinary = url.endsWith('.bcif')
      const data = await molstar.builders.data.download({ url, isBinary })
      if (!data) {
        throw new Error('Failed to download structure data - invalid response')
      }

      const trajectory = await molstar.builders.structure.parseTrajectory(data, format)
      const model = await molstar.builders.structure.createModel(trajectory)
      const structure = await molstar.builders.structure.createStructure(model)

      // Apply default representation preset so the structure is visible
      await molstar.builders.structure.representation.applyPreset(structure, 'auto')

      return structure
    } catch (error) {
      throw error
    }
  }

  // Main load function
  const load = async (config: LoadOptions) => {
    const molstar = state.molstar
    if (!molstar) {
      throw new Error('[load] Molstar not initialized')
    }

    setState(prev => ({ ...prev, loading: true }))
    rerender()

    try {
      await molstar.clear()
      await sleep(100)

      await loadStructureData(config)

      setState(prev => ({ ...prev, loading: false }))
      rerender()

      return molstar
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }))
      rerender()
      throw error
    }
  }

  const molstarWithLoading = useMemo(() => {
    const molstar = state.molstar

    if (!molstar) {
      return {
        loading: state.loading,
        loaded: false,  // No molstar instance means not loaded
        mounted: !!container.ref,
        initialized: false,
        load,
        ref: container.ref,
        get for() { return container.for }
      }
    }

    const getter = (fn: () => any) => ({ get: fn, enumerable: true, configurable: true })
    const value = (val: any) => ({ value: val, enumerable: true, configurable: true })

    const result = Object.defineProperties(molstar, {
      // State properties
      loading: getter(() => state.loading),
      loaded: getter(() => !state.loading),  // loaded is the inverse of loading
      mounted: getter(() => !!container.ref),
      initialized: value(true),  // If we have molstar object, it's initialized

      // Functions
      load: value(load),
      draw: value(() => molstar.canvas3d?.requestDraw?.()),

      // Container ref (pass the whole container object which has .for)
      ref: value(container.ref),
      // Makes sure each useMolstar hook has the same ref
      for: getter(() => container.for),

      // Convenient aliases as getters
      canvas: getter(() => molstar.canvas3d),
      camera: getter(() => molstar.canvas3d?.camera),
      hierarchy: getter(() => molstar.managers?.structure?.hierarchy),
      selection: getter(() => molstar.managers?.structure?.selection),
      axes: getter(() => molstar.canvas3d?.props?.camera?.helper?.axes),
      busy: getter(() => molstar.behaviors?.state?.isBusy),

      // Canvas property aliases
      trackball: getter(() => molstar.canvas3d?.props?.trackball),
      renderer: getter(() => molstar.canvas3d?.props?.renderer),
      illumination: getter(() => molstar.canvas3d?.props?.illumination),
      postprocessing: getter(() => molstar.canvas3d?.props?.postprocessing),
      fog: getter(() => molstar.canvas3d?.props?.cameraFog)
    })

    return result
  }, [state.molstar, state.loading, container.ref])

  return molstarWithLoading
}

export default useMolstar
