import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import useHook from './useHook'
import { DEFAULT_MOLSTAR_ID } from './constants'
import {
  getOneLetterCode,
  buildSelectionSummary,
  getChainType,
  calculateBounds,
  extractAtomData,
  createSelectionMatchers,
  enrichChainsWithData,
  sortChains,
  sortResidues,
  getProteinSequence,
  createEmptySelectionData,
  extractHoverInfo,
  SELECTION_PRESETS,
  SelectionQuery,
  SelectedAtom,
  SelectedResidue,
  SelectedChain,
  Selection,
  SelectionChangeEvent,
  ModeChangeEvent,
  HoverEvent,
  SelectionEventMap,
  SelectionManager
} from '../utils'


export function useSelection(id: string = DEFAULT_MOLSTAR_ID): [Selection, SelectionManager] {
  const hook = useHook(id, 'useSelection')
  const [loading, setLoading] = useState(true)

  const molstar = hook.context?.molstar
  const eventCallbacks = useRef({
    'selection-change': new Set<(data: SelectionChangeEvent) => void>(),
    'mode-change': new Set<(data: ModeChangeEvent) => void>(),
    'hover': new Set<(data: HoverEvent) => void>()
  })

  const emit = <K extends keyof SelectionEventMap>(event: K, data: SelectionEventMap[K]) =>
    eventCallbacks.current[event].forEach(cb => (cb as any)(data))

  // Single effect for all subscriptions
  useEffect(() => {
    setLoading(!molstar)
    if (!molstar) return

    const subscriptions: any[] = []

    const checkMode = () => {
      if (molstar?.managers?.interactivity?.selectionMode) {
        emit('mode-change', {
          enabled: molstar.managers.interactivity.selectionMode.value !== 'click'
        })
      }
    }
    checkMode()
    
    if (molstar?.managers?.interactivity?.selectionMode) {
      subscriptions.push(molstar.managers.interactivity.selectionMode.subscribe(checkMode))
    }

    // Selection changes - components will re-render and get fresh data
    if (molstar?.selection?.events?.changed) {
      subscriptions.push(molstar.selection.events.changed.subscribe(() => {
        eventCallbacks.current['selection-change'].forEach(cb => cb({} as any))
      }))
    }

    if (molstar?.behaviors?.interaction?.hover) {
      subscriptions.push(molstar.behaviors.interaction.hover.subscribe(({ current }) =>
        emit('hover', extractHoverInfo(current, extractAtomData, getOneLetterCode))
      ))
    }

    return () => subscriptions.forEach(sub => sub?.unsubscribe())
  }, [molstar])

  const selection = useMemo((): Selection => {
    const enabled = molstar?.managers?.interactivity?.selectionMode?.value !== 'click' || false
    const empty = { loading, ...createEmptySelectionData(enabled) }

    if (!molstar || loading) return empty

    const loci = molstar.selection.loci
    if (!loci || loci.kind !== 'element-loci') return empty

    const atoms: SelectedAtom[] = []
    const residuesMap = new Map<string, SelectedResidue>()
    const chainsMap = new Map<string, SelectedChain>()

    for (const e of loci.elements) {
      const { unit, indices } = e

      for (let i = 0; i < indices.length; i++) {
        const idx = indices[i]

        if (unit.model.atomicHierarchy.atoms) {
          const atomData = extractAtomData(unit, idx)

          atoms.push({
            id: atomData.atomId,
            element: atomData.element,
            name: atomData.name,
            chainId: atomData.chainId,
            residueId: atomData.residueId,
            residueName: atomData.residueName,
            coords: atomData.coords
          })

          // Update residue map
          const residueKey = `${atomData.chainId}-${atomData.residueId}`
          if (!residuesMap.has(residueKey)) {
            residuesMap.set(residueKey, {
              chainId: atomData.chainId,
              residueId: atomData.residueId,
              residueName: atomData.residueName,
              atomCount: 0,
              sequence: getOneLetterCode(atomData.residueName)
            })
          }
          residuesMap.get(residueKey)!.atomCount++

          // Update chain map
          if (!chainsMap.has(atomData.chainId)) {
            const entityId = unit.model.atomicHierarchy.chains.label_entity_id.value(atomData.chainIndex)
            chainsMap.set(atomData.chainId, {
              chainId: atomData.chainId,
              residueCount: 0,
              atomCount: 0,
              type: getChainType(unit.model.entities, entityId),
              sequence: ''
            })
          }
          chainsMap.get(atomData.chainId)!.atomCount++
        }
      }
    }

    const residues = Array.from(residuesMap.values())
    const rawChains = Array.from(chainsMap.values())
    const chains = enrichChainsWithData(rawChains, residues)
    const { bounds, center } = calculateBounds(atoms)
    const sequence = getProteinSequence(chains)
    const summary = buildSelectionSummary(atoms, chains, residues)

    return {
      loading,
      enabled,
      atoms,
      chains: sortChains(chains),
      residues: sortResidues(residues),
      isEmpty: atoms.length === 0,
      summary,
      bounds,
      center,
      sequence
    }
  }, [molstar, molstar?.managers.structure.selection.loci, loading])

  const buildSelection = useCallback((query: SelectionQuery): any => {
    const structure = molstar?.managers.structure.hierarchy.current.structures?.[0]
    if (!molstar || !structure) return null

    try {
      if (query.type === 'expression' && query.expression) {
        return molstar.managers.structure.selection.fromCompiledQuery(
          molstar.query.compiler.compile(query.expression)
        )(structure)
      }

      const singletons = molstar.managers.structure.selection.singletons
      const matchers = createSelectionMatchers(query)
      const selectorType = query.type === 'element' ? 'atom' : query.type

      return singletons[selectorType](structure).withCondition(matchers[query.type])
    } catch (e) {
      console.error('Error building selection:', e)
      return null
    }
  }, [molstar])

  const manager: SelectionManager = {
    // Mode controls
    enable: () => molstar?.managers.interactivity.setSelectionMode('element'),
    disable: () => molstar?.managers.interactivity.setSelectionMode('click'),
    toggle: () => molstar && molstar.managers.interactivity.setSelectionMode(
      molstar.managers.interactivity.selectionMode.value === 'click' ? 'element' : 'click'
    ),

    // Selection operations
    select: (query) => {
      const loci = molstar && buildSelection(query)
      loci && molstar.selection.fromLoci(loci, 'set')
    },
    add: (query) => {
      const loci = molstar && buildSelection(query)
      loci && molstar.selection.fromLoci(loci, 'add')
    },
    remove: (query) => {
      const loci = molstar && buildSelection(query)
      loci && molstar.selection.fromLoci(loci, 'remove')
    },
    clear: () => molstar?.selection.clear(),

    // Convenience methods
    selectChain: (chainId) => manager.select({ type: 'chain', chainId }),
    selectChains: (chainIds) => manager.select({ type: 'chain', chainIds }),
    selectResidue: (chainId, residueId) => manager.select({ type: 'residue', chainId, residueIds: [residueId] }),
    selectResidues: (chainId, residueIds) => manager.select({ type: 'residue', chainId, residueIds }),

    // Presets
    selectAll: () => molstar?.selection.selectAll(),
    selectProtein: () => manager.select({ type: 'expression', expression: SELECTION_PRESETS.protein }),
    selectLigand: () => manager.select({ type: 'expression', expression: SELECTION_PRESETS.ligand }),
    selectWater: () => manager.select({ type: 'expression', expression: SELECTION_PRESETS.water }),
    selectNucleic: () => manager.select({ type: 'expression', expression: SELECTION_PRESETS.nucleic }),

    // View operations
    focus: () => molstar && molstar.selection.loci?.kind === 'element-loci' &&
      molstar.managers.camera.focusLoci(molstar.selection.loci),
    isolate: () => console.warn('isolate not implemented yet'),
    highlight: (query) => {
      const loci = molstar && buildSelection(query)
      loci && molstar.managers.interactivity.lociHighlights.highlight({ loci })
    },
    clearHighlight: () => molstar?.managers.interactivity.lociHighlights.clearHighlights(),

    // Events
    on: <K extends keyof SelectionEventMap>(event: K, callback: (data: SelectionEventMap[K]) => void) => (
      eventCallbacks.current[event].add(callback as any),
      () => eventCallbacks.current[event].delete(callback as any)
    )
  }

  return [selection, manager]
}
