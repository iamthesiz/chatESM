import { useRef, useEffect, useState, useReducer } from 'react'
import { useMolstar } from './useMolstar'
import { determineComponentType, extractRepresentationType, repTypeMap, REPRESENTATION_PRESETS } from '../utils/molstar-selections'
import { PresetStructureRepresentations } from 'molstar/lib/mol-plugin-state/builder/structure/representation-preset'
import { sleep } from '../utils'
import { DEFAULT_MOLSTAR_ID } from './constants'

export interface Component {
  type: string          // 'protein', 'ligand', 'water', 'ion', 'nucleic', or 'custom'
  label: string         // Display name (e.g., "Polymer", "Ligand Component")
  representation: string // How it's displayed (e.g., "Cartoon", "Ball & Stick")
  isVisible: boolean    // Visibility state
  ref: string          // Unique reference ID in state tree (e.g., "i8mudm86t")
}

export interface CreateComponentOptions {
  selection: string
  representation?: string
  label?: string
  checkExisting?: boolean
}

export interface SetPresetOptions {
  preset: string
  quality?: 'auto' | 'lowest' | 'lower' | 'low' | 'medium' | 'high' | 'higher' | 'highest'
  ignoreHydrogens?: boolean
  ignoreHydrogensVariant?: 'all' | 'non-polar'
}

// Example of what a component looks like in Molstar:
// {
//   type: 'protein',
//   label: 'Polymer',
//   representation: 'Cartoon',
//   isHidden: true,
//   ref: 'i8mudm86t'
// }

interface ComponentsManager {
  loading: boolean
  add: (options: CreateComponentOptions) => Promise<void>
  toggle: (component: Component) => Promise<void>
  remove: (component: Component) => Promise<void>
  update: () => void
  setPreset: (options: SetPresetOptions) => Promise<void>
  show: (component: Component) => Promise<void>
  hide: (component: Component) => Promise<void>
  showAll: () => Promise<void>
  hideAll: () => Promise<void>
  clear: () => Promise<void>
}

export function useComponents(id: string = DEFAULT_MOLSTAR_ID): [components: Component[], manager: ComponentsManager] {
  const molstar = useMolstar(id)
  const componentList = useRef<Component[]>([])
  const [loading, setLoading] = useState(true)

  const rerender = useReducer((x: number) => x + 1, 0)[1]

  // Helper to create component object from a cell
  const createComponent = (cell: any): Component => {
    const ref = cell.transform?.ref || ''
    const label = cell.obj?.label || cell.transform?.params?.label || ''

    if (!molstar) return { type: 'custom', label, representation: 'unknown', isVisible: false, ref }

    // Find the representation for this component
    const repr = molstar.state.data.selectQ((q: any) =>
      q.ofType('Representation3D')
    ).find((r: any) => r.transform.parent === ref)

    const reprTypeName = repr ? extractRepresentationType(repr) : ''
    const representation = reprTypeName
      ? (repTypeMap[reprTypeName] ?? reprTypeName.charAt(0).toUpperCase() + reprTypeName.slice(1).replace(/-/g, ' '))
      : (repr?.obj?.label || 'unknown')

    const isVisible = repr ? !repr.state.isHidden : true
    const type = determineComponentType(label)

    return { type, label, representation, isVisible, ref }
  }

  // Get components from Molstar hierarchy
  const getComponentsFromHierarchy = (): Component[] => {
    if (!molstar) return []

    const hierarchy = molstar.hierarchy.current
    if (!hierarchy.structures) return []

    const components = hierarchy.structures.flatMap((structure: any) =>
      (structure.components || [])
        .filter((component: any) => component.cell?.obj)
        .map((component: any) => createComponent(component.cell)))

    return components
  }

  // Get components from state tree (fallback)
  const getComponentsFromState = (): Component[] => {
    if (!molstar) return []

    // First, look for actual representations in the state tree
    const representations: Component[] = []

    Array.from(molstar.state.data.cells).forEach(([ref, cell]: [string, any]) => {
      if (cell.obj?.type?.name === 'Representation3D') {
        const reprType = cell.transform?.params?.type?.name || 'unknown'
        const parentRef = cell.transform?.parent
        const parentCell = parentRef ? molstar.state.data.cells.get(parentRef) : null
        const label = parentCell?.obj?.label || 'Structure'

        representations.push({
          type: 'protein',
          label,
          representation: reprType.charAt(0).toUpperCase() + reprType.slice(1),
          isVisible: !cell.state?.isHidden,
          ref
        })
      }
    })

    if (representations.length > 0) {
      return representations
    }

    // Fallback to looking for structure selections
    const skipLabels = ['Model', 'Trajectory', 'Assembly']
    const validTypes = ['Structure', 'StructureSelection']
    const validTransformers = ['ms-molstar.structure-selection-from-expression', 'ms-molstar.structure-component']

    return Array.from(molstar.state.data.cells)
      .filter(([ref, cell]: [string, any]) => {
        const typeName = cell.obj?.type?.name
        const transformerId = cell.transform?.transformer?.id
        const label = cell.obj?.label || cell.transform?.params?.label || ''
        const isValid = validTypes.includes(typeName) && validTransformers.includes(transformerId)
        const isSystemComponent = skipLabels.some(skip => label === skip || label.startsWith(skip))
        if (!isValid || isSystemComponent) return false

        // Skip selections without representations
        if (!label && typeName === 'StructureSelection') {
          return Array.from(molstar.state.data.cells.values()).some(
            (r: any) => r.transform?.parent === ref && r.obj?.type?.name === 'Representation3D'
          )
        }

        return true
      })
      .map(([_, cell]: [string, any]) => createComponent(cell))
  }

  // Update components list
  const updateComponents = () => {
    let components = getComponentsFromState()
    if (components.length === 0) {
      components = getComponentsFromHierarchy()
    }
    componentList.current = components
    rerender()
  }

  // Find component by ref in hierarchy
  const findComponentByRef = (ref: string) => {
    if (!molstar) return null
    const structures = molstar.hierarchy.current.structures
    return structures.flatMap((s: any) => s.components).find((c: any) => c.cell.transform.ref === ref) || null
  }

  // Create and add a new component to the list
  const add = async (opts: CreateComponentOptions): Promise<void> => {
    if (!molstar) return

    const {
      selection,
      representation = 'cartoon',
      label,
      checkExisting = false
    } = opts

    try {
      const manager = molstar.managers.structure.component
      const hierarchy = molstar.hierarchy.current

      if (!hierarchy.structures.length) {
        console.warn('No structures loaded')
        return
      }

      // Apply to first structure (or could iterate all)
      const structure = hierarchy.structures[0]

      // Create the component
      const options = { label, checkExisting }
      await manager.add({ structure, representation, options }, { selection })
      updateComponents()
    } catch (error) {
      throw error
    }
  }

  // Toggle component visibility
  const toggle = async (component: Component): Promise<void> => {
    if (!molstar) return

    try {
      // First try to find it as a component
      const molstarComponent = findComponentByRef(component.ref)
      if (molstarComponent) {
        await molstar.managers.structure.component.toggleVisibility([molstarComponent])
        updateComponents()
        return
      }

      // If not found as component, try to toggle the representation directly
      const cell = molstar.state.data.cells.get(component.ref)
      if (cell && cell.obj?.type?.name === 'Representation3D') {
        await molstar.state.updateCellState(component.ref, { isHidden: !cell.state.isHidden })
        updateComponents()
        return
      }

    } catch (error) {
      throw error
    }
  }

  // Show component
  const show = async (component: Component): Promise<void> => {
    if (!component.isVisible) {
      await toggle(component)
    }
  }

  // Hide component
  const hide = async (component: Component): Promise<void> => {
    if (component.isVisible) {
      await toggle(component)
    }
  }

  // Remove component
  const remove = async (component: Component): Promise<void> => {
    if (!molstar) return

    try {
      const molstarComponent = findComponentByRef(component.ref)
      if (!molstarComponent) {
        return
      }

      await molstar.hierarchy.remove([molstarComponent], true)
      updateComponents()
    } catch (error) {
      throw error
    }
  }

  // Set representation preset
  const setPreset = async (options: SetPresetOptions): Promise<void> => {
    if (!molstar) return

    const {
      preset,
      quality = 'auto',
      ignoreHydrogens = true,
      ignoreHydrogensVariant = 'all'
    } = options

    try {
      const structure = molstar.managers.structure
      const structures = molstar.hierarchy.current.structures

      if (!structures?.length) return

      await structure.component.applyPreset(
        structures,
        PresetStructureRepresentations[REPRESENTATION_PRESETS[preset] || 'auto'],
        { quality, ignoreHydrogens, ignoreHydrogensVariant }
      )

      updateComponents()
    } catch (error) {
      throw error
    }
  }

  // Show all components
  const showAll = async (): Promise<void> => {
    const hiddenComponents = componentList.current.filter(c => !c.isVisible)

    for (const component of hiddenComponents) {
      await show(component)
    }
  }

  // Hide all components
  const hideAll = async (): Promise<void> => {
    const visibleComponents = componentList.current.filter(c => c.isVisible)

    for (const component of visibleComponents) {
      await hide(component)
    }
  }

  // Clear all components
  const clear = async (): Promise<void> => {
    if (!molstar) return

    try {
      for (const component of [...componentList.current]) {
        await remove(component)
      }
    } catch (error) {
      throw error
    }
  }

  // Initialize/update on mount and when molstar changes
  useEffect(() => {
    if (!molstar.loading) {
      setLoading(false)
      sleep(500).then(updateComponents)
    } else {
      setLoading(true)
    }
  }, [molstar.loading, molstar])

  // Build manager object
  const manager: ComponentsManager = {
    loading: loading || molstar.loading,
    add,
    toggle,
    remove,
    update: updateComponents,
    setPreset,
    show,
    hide,
    showAll,
    hideAll,
    clear
  }

  return [componentList.current, manager]
}

export default useComponents
