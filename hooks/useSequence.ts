import { useState, useEffect } from 'react'
import { useMolstar } from './useMolstar'
import { StructureElement } from 'molstar/lib/mol-model/structure'
import { SortedArray } from 'molstar/lib/mol-data/int'
import { sleep } from '../utils'
import { DEFAULT_MOLSTAR_ID } from './constants'
export interface Residue {
  index: number
  code: string      // One-letter code (A, C, G, T, etc.)
  name: string      // Three-letter code (ALA, CYS, etc.)
  seqId: number     // Sequence ID in the structure
  chainId: string
  selected: boolean
}

export interface Structure {
  id: string
  label: string
}

export interface Entity {
  id: string
  label: string
  type?: string
}

export interface Chain {
  id: string
  label: string
  entityId: string
}

export type SelectionMode = 'chain' | 'polymers' | 'everything'

export interface SequenceState {
  loading: boolean
  mode: SelectionMode
  residues: Residue[] | null
  structure: string | null
  structures: Structure[]
  entity: string | null
  entities: Entity[]
  chain: string | null
  chains: Chain[]
  instance: any | null
  instances: any[]
}

export type SetSequence = (update: Partial<Omit<SequenceState, 'loading' | 'structures' | 'entities' | 'chains' | 'residues'>> & {
  residues?: Residue[]
}) => void

export function useSequence(id: string = DEFAULT_MOLSTAR_ID): [SequenceState, SetSequence] {
  const molstar = useMolstar(id)
  const [state, setState] = useState<SequenceState>({
    loading: true,
    mode: 'chain',
    residues: null,
    structure: null,
    structures: [],
    entity: null,
    entities: [],
    chain: null,
    chains: [],
    instance: null,
    instances: [],
  })


  // Extract all chains from loaded structure
  const extractAllChains = () => {
    if (!molstar?.hierarchy?.current?.structures?.[0]) {
      return []
    }

    const structure = molstar.hierarchy.current.structures[0]
    const modelObj = structure.model?.cell?.obj
    if (!modelObj?.data) return []

    const model = modelObj.data
    const { atomicHierarchy, sequence } = model

    if (!atomicHierarchy?.chains?._rowCount) return []

    // Build chain map with sequences
    const chainMap = new Map<string, InternalChain>()

    // First pass: create all chains
    for (let i = 0; i < atomicHierarchy.chains._rowCount; i++) {
      const chainId = atomicHierarchy.chains.label_asym_id?.value?.(i)
      const entityId = atomicHierarchy.chains.label_entity_id?.value?.(i)

      if (!chainId) continue

      if (!chainMap.has(chainId)) {
        chainMap.set(chainId, {
          id: chainId,
          name: chainId,
          type: 'protein',
          sequence: [],
          length: 0,
          entityId
        })
      }
    }

    // Second pass: add sequences from sequence data
    if (sequence?.byEntityKey) {
      Object.entries(sequence.byEntityKey).forEach(([entityKey, entitySeq]: [string, any]) => {
        if (!entitySeq?.sequence) return

        const entityId = (parseInt(entityKey) + 1).toString()
        const chainsForEntity = Array.from(chainMap.values()).filter(c => c.entityId === entityId)

        chainsForEntity.forEach(chain => {
          const residues: Residue[] = []
          for (let i = 0; i < entitySeq.sequence.length; i++) {
            const compId = entitySeq.sequence.compId?.value?.(i) || 'UNK'
            const seqId = entitySeq.sequence.seqId?.value?.(i) || i

            residues.push({
              index: i,
              code: getOneLetterCode(compId),
              name: compId,
              seqId,
              chainId: chain.id,
              selected: false
            })
          }
          chain.sequence = residues
          chain.length = residues.length
        })
      })
    }

    // Third pass: for chains without sequence, extract from residues
    if (atomicHierarchy.residues?._rowCount && atomicHierarchy.chainAtomSegments && atomicHierarchy.residueAtomSegments) {
      const residuesData = atomicHierarchy.residues
      const chainAtomSegments = atomicHierarchy.chainAtomSegments
      const residueAtomSegments = atomicHierarchy.residueAtomSegments

      // Build residue arrays for chains without sequences
      chainMap.forEach((chain, chainId) => {
        if (chain.sequence.length > 0) return

        const chainIndex = Array.from({ length: atomicHierarchy.chains._rowCount }, (_, i) => i)
          .find(i => atomicHierarchy.chains.label_asym_id.value(i) === chainId)

        if (chainIndex === undefined) return


        const residues: Residue[] = []

        // Get the residue range for this chain using segments
        const chainOffsets = chainAtomSegments.offsets

        // Get start and end atom indices for this chain
        const atomStart = chainOffsets[chainIndex]
        const atomEnd = chainOffsets[chainIndex + 1]

        if (atomEnd > atomStart) {
          // For each chain, we need to find which residues belong to it
          // We'll iterate through all residues and check if their atoms fall within this chain's atom range
          const residueSet = new Set<number>()

          // Check each residue to see if it belongs to this chain
          for (let resIdx = 0; resIdx < residueAtomSegments.offsets.length - 1; resIdx++) {
            const resAtomStart = residueAtomSegments.offsets[resIdx]
            const resAtomEnd = residueAtomSegments.offsets[resIdx + 1]

            // Check if any atoms from this residue are in our chain's atom range
            if (resAtomStart < atomEnd && resAtomEnd > atomStart) {
              // This residue has atoms in our chain
              residueSet.add(resIdx)
            }
          }

          // Extract residues that belong to this chain
          const sortedResidues = Array.from(residueSet).sort((a, b) => a - b)
          sortedResidues.forEach((resIdx) => {
            // Check if this residue index is valid
            if (resIdx >= residuesData._rowCount) {
              console.log(`WARNING: Residue ${resIdx} is out of bounds (max: ${residuesData._rowCount - 1})`)
              return  // Skip this iteration in forEach
            }

            let compId = residuesData.label_comp_id?.value?.(resIdx)
            const seqId = residuesData.label_seq_id?.value?.(resIdx)
            const authSeqId = residuesData.auth_seq_id?.value?.(resIdx)

            // If residue doesn't have comp_id, try to get it from its first atom
            if (!compId) {
              const resAtomStart = residueAtomSegments.offsets[resIdx]
              if (resAtomStart < atomicHierarchy.atoms._rowCount) {
                compId = atomicHierarchy.atoms.label_comp_id?.value?.(resAtomStart)
              }
            }

            compId = compId || 'UNK'


            // Use auth_seq_id if label_seq_id is not available (common for non-polymers)
            // For non-polymers, auth_seq_id is usually the correct ID to display
            const finalSeqId = authSeqId !== undefined ? authSeqId : (seqId !== undefined ? seqId : resIdx)

            residues.push({
              index: residues.length,
              code: getOneLetterCode(compId),
              name: compId,
              seqId: finalSeqId,
              chainId,
              selected: false
            })
          })
        }

        chain.sequence = residues
        chain.length = residues.length
      })
    }

    return Array.from(chainMap.values())
  }

  // Extract structures and entities from loaded data
  const extractStructuresAndEntities = () => {
    if (!molstar?.hierarchy?.current?.structures) {
      return { structures: [], entities: [], allChains: [] }
    }

    const structures: Structure[] = []
    const entities: Entity[] = []
    const allChains = extractAllChains()
    const hierarchy = molstar.hierarchy.current.structures

    // Extract structures
    hierarchy.forEach((struct: any, idx: number) => {
      const model = struct.model
      if (!model) return

      // The actual model data is in model.cell.obj.data
      const modelObj = model.cell?.obj
      if (!modelObj?.data) return

      // Get entry ID and label directly from model object data
      const entryId = modelObj.data.entryId || modelObj.data.entry || ''
      const fullLabel = modelObj.data.label || ''

      // Use the full label if available, otherwise construct it
      let label = fullLabel
      if (!label && entryId) {
        // Try to get title from struct data
        const modelData = modelObj.data
        const structData = modelData.struct || modelData.db?.struct
        const title = structData?.title?.value?.(0) || structData?.pdbx_descriptor?.value?.(0) || ''

        if (title) {
          label = `${entryId.toUpperCase()} | ${title}`
        } else {
          label = entryId.toUpperCase()
        }
      }

      if (!label) {
        label = `struct_${idx}`
      }

      structures.push({ id: `${entryId || 'struct'}_${idx}`, label })
    })

    // Extract entities
    if (hierarchy.length > 0) {
      const modelObj = hierarchy[0].model?.cell?.obj
      if (!modelObj?.data) return { structures, entities, allChains }

      const modelData = modelObj.data
      const entityData = modelData.entities?.data || modelData.entities

      if (entityData && entityData._rowCount > 0) {
        for (let i = 0; i < entityData._rowCount; i++) {
          const entityId = entityData.id?.value(i)
          const description = entityData.pdbx_description?.value(i)
          const entityType = entityData.type?.value(i) || 'polymer'

          let entityName = ''
          if (Array.isArray(description)) {
            entityName = description.join(', ')
          } else if (description) {
            entityName = String(description)
          }

          entities.push({
            id: entityId,
            label: entityName || `Entity ${entityId}`,
            type: entityType
          })
        }
      }
    }

    return { structures, entities, allChains }
  }

  // Get residues for selected chain
  const getResiduesForChain = (chainId: string | null): Residue[] | null => {
    if (!chainId || !molstar) return null

    // First try to get from our extracted chains
    const allChains = extractAllChains()
    const chain = allChains.find(c => c.id === chainId)
    if (chain?.sequence && chain.sequence.length > 0) {
      return chain.sequence
    }

    // For chains without sequence data (like ions), extract residues directly
    console.log(`Extracting residues directly for chain ${chainId} (no sequence in extractAllChains)`)
    const hierarchy = molstar.managers?.structure?.hierarchy?.current
    if (!hierarchy?.structures?.[0]) return null

    // Get the model data
    const structureRef = hierarchy.structures[0]
    const model = structureRef.model
    const modelData = model?.cell?.obj?.data

    if (!modelData?.atomicHierarchy?.chains) {
      console.log(`No atomic hierarchy data found for chain ${chainId}`)
      return null
    }

    const residues: Residue[] = []
    const { chains, residues: residuesData } = modelData.atomicHierarchy

    // Find which chain index corresponds to our chainId
    let targetChainIndex = -1
    for (let i = 0; i < chains._rowCount; i++) {
      if (chains.label_asym_id.value(i) === chainId) {
        targetChainIndex = i
        break
      }
    }

    if (targetChainIndex === -1) {
      return null
    }

    // Get all residues for this chain
    if (residuesData && residuesData._rowCount > 0) {
      const atomicHierarchy = modelData.atomicHierarchy

      // Get atom range for this chain
      const atomStart = atomicHierarchy.chainAtomSegments.offsets[targetChainIndex]
      const atomEnd = atomicHierarchy.chainAtomSegments.offsets[targetChainIndex + 1]

      // Find which residues belong to this chain by checking residue atom ranges
      const residueSet = new Set<number>()
      const resOffsets = atomicHierarchy.residueAtomSegments.offsets

      // Check each residue to see if it belongs to this chain
      for (let resIdx = 0; resIdx < resOffsets.length - 1; resIdx++) {
        const resAtomStart = resOffsets[resIdx]
        const resAtomEnd = resOffsets[resIdx + 1]

        // Check if any atoms from this residue are in our chain's atom range
        if (resAtomStart < atomEnd && resAtomEnd > atomStart) {
          // This residue has atoms in our chain
          residueSet.add(resIdx)
        }
      }

      // Extract residue data
      const sortedResidues = Array.from(residueSet).sort((a, b) => a - b)

      sortedResidues.forEach((resIdx) => {
        // Check if residue index is valid
        if (resIdx >= residuesData._rowCount) {
          console.log(`WARNING: Residue index ${resIdx} is out of bounds (max: ${residuesData._rowCount - 1})`)
          return
        }

        let compId = residuesData.label_comp_id?.value?.(resIdx)
        const seqId = residuesData.label_seq_id?.value?.(resIdx)
        const authSeqId = residuesData.auth_seq_id?.value?.(resIdx)

        // If residue doesn't have comp_id, try to get it from its first atom
        if (!compId) {
          const resAtomStart = atomicHierarchy.residueAtomSegments.offsets[resIdx]
          if (resAtomStart < atomicHierarchy.atoms._rowCount) {
            compId = atomicHierarchy.atoms.label_comp_id?.value?.(resAtomStart)
          }
        }

        compId = compId || 'UNK'


        // Use auth_seq_id if label_seq_id is not available (common for non-polymers)
        // For non-polymers, auth_seq_id is usually the correct ID to display
        const finalSeqId = authSeqId !== undefined ? authSeqId : (seqId !== undefined ? seqId : resIdx)

        residues.push({
          index: residues.length,
          code: getOneLetterCode(compId),
          name: compId,
          seqId: finalSeqId,
          chainId,
          selected: false
        })
      })

    }

    return residues.length > 0 ? residues : null
  }

  // Get chains for selected entity
  const getChainsForEntity = (entityId: string | null, allChains: InternalChain[]): Chain[] => {
    if (!entityId || !molstar) return []

    const chains: Chain[] = []
    const structureHierarchy = molstar.managers?.structure?.hierarchy?.current?.structures

    if (structureHierarchy && structureHierarchy.length > 0) {
      const modelData = structureHierarchy[0].model?.cell?.obj?.data

      // Check what type of entity this is
      let entityType = 'polymer'
      if (modelData?.entities?.data) {
        const entityData = modelData.entities.data
        for (let i = 0; i < entityData._rowCount; i++) {
          if (entityData.id?.value(i) === entityId) {
            entityType = entityData.type?.value(i) || 'polymer'
            break
          }
        }
      }

      if (modelData?.atomicHierarchy?.chains) {
        const chainData = modelData.atomicHierarchy.chains

        for (let i = 0; i < chainData._rowCount; i++) {
          const chainEntityId = chainData.label_entity_id.value(i)
          const chainId = chainData.label_asym_id.value(i)
          const authChainId = chainData.auth_asym_id?.value?.(i)

          // Check if this chain belongs to the selected entity
          if (chainEntityId === entityId) {
            // Find the matching internal chain
            const internalChain = allChains.find(c => c.id === chainId)

            // Format chain label with auth ID if available
            let chainLabel = chainId
            if (authChainId && authChainId !== chainId) {
              chainLabel = `${chainId} [auth ${authChainId}]`
            }
            // Format chain label with auth ID

            // For non-polymers (like ions), we should include the chain even if it has no traditional sequence
            if (entityType !== 'polymer') {
              // For non-polymers, always include the chain
              chains.push({
                id: chainId,
                label: chainLabel,
                entityId: entityId
              })
            } else if (internalChain && internalChain.sequence.length > 0) {
              // For polymers, only include if there's sequence data
              chains.push({
                id: chainId,
                label: chainLabel,
                entityId: entityId
              })
            } else if (!internalChain) {
              // Chain not found in allChains
            } else {
              // Chain has no sequence data
            }
          }
        }
      }
    }

    // Fallback if no chains found
    if (chains.length === 0) {
      // If entityId starts with 'entity_', it's our fallback entity
      if (entityId.startsWith('entity_')) {
        const chainId = entityId.replace('entity_', '')
        const chain = allChains.find(c => c.id === chainId)
        if (chain) {
          chains.push({
            id: chain.id,
            label: chain.id,
            entityId: entityId
          })
        }
      }
      // No chains found for entity
    }

    return chains
  }

  // Check if structure is loaded and update state accordingly
  useEffect(() => {

    if (molstar.loading) {
      setState(prev => ({ ...prev, loading: true }))
      return
    }

    const hierarchy = molstar?.managers?.structure?.hierarchy?.current

    if (!hierarchy?.structures || hierarchy.structures.length === 0) {
      // No structures loaded yet, stay in loading state
      setState(prev => ({ ...prev, loading: true }))
      return
    }

    // Structure is loaded, extract data
    const { structures, entities, allChains } = extractStructuresAndEntities()

    setState(prev => {
      // Only update if we're transitioning from loading to loaded
      if (!prev.loading && prev.structures.length > 0) {
        return prev // Already loaded, don't update
      }

      const newState = {
        ...prev,
        loading: false,
        structures,
        entities
      }

      if (structures.length > 0 && !prev.structure) {
        newState.structure = structures[0].id
      }

      if (entities.length > 0 && !prev.entity) {
        newState.entity = entities[0].id
        newState.chains = getChainsForEntity(entities[0].id, allChains)

        if (newState.chains.length > 0 && !prev.chain) {
          newState.chain = newState.chains[0].id
          newState.residues = getResiduesForChain(newState.chains[0].id)
        }
      }

      return newState
    })

  }, [molstar.loading, molstar?.managers?.structure?.hierarchy])

  // SetSequence function to update state
  const setSequence: SetSequence = (update) => {
    setState(prev => {
      const newState = { ...prev, ...update }

      // If structure changed, update entities and chains
      if (update.structure !== undefined && update.structure !== prev.structure) {
        const { entities, allChains } = extractStructuresAndEntities()
        newState.entities = entities
        newState.entity = entities.length > 0 ? entities[0].id : null
        newState.chains = newState.entity ? getChainsForEntity(newState.entity, allChains) : []
        newState.chain = newState.chains.length > 0 ? newState.chains[0].id : null
        newState.residues = newState.chain ? getResiduesForChain(newState.chain) : null
      }

      // If entity changed, update chains
      if (update.entity !== undefined && update.entity !== prev.entity && update.structure === undefined) {
        const { allChains } = extractStructuresAndEntities()
        newState.chains = getChainsForEntity(update.entity, allChains)
        // Entity changed, update chains
        newState.chain = newState.chains.length > 0 ? newState.chains[0].id : null
        newState.residues = newState.chain ? getResiduesForChain(newState.chain) : null
        // Update residues for new chain
      }

      // If chain changed, update residues
      if (update.chain !== undefined && update.chain !== prev.chain) {
        newState.residues = getResiduesForChain(update.chain)
      }

      // Handle residue selection
      if (update.residues !== undefined && prev.residues) {
        // Update selected state on existing residues
        const selectedSet = new Set(update.residues.map(r => `${r.chainId}-${r.seqId}`))
        newState.residues = prev.residues.map(r => ({
          ...r,
          selected: selectedSet.has(`${r.chainId}-${r.seqId}`)
        }))

        // Also update Molstar selection
        if (molstar?.managers?.structure?.selection) {
          // console.log('Updating Molstar selection:', update.residues.length, 'residues')
          molstar.managers.structure.selection.clear()

          // If no residues selected, just clear and return
          if (update.residues.length === 0) {
            // Also clear highlights
            if (molstar.managers?.interactivity?.lociHighlights) {
              molstar.managers.interactivity.lociHighlights.clearHighlights()
            }
            return newState
          }

          const residuesByChain = new Map<string, number[]>()
          update.residues.forEach(r => {
            if (!residuesByChain.has(r.chainId)) {
              residuesByChain.set(r.chainId, [])
            }
            residuesByChain.get(r.chainId)!.push(r.seqId)
          })

          const structures = molstar.managers.structure.hierarchy.current.structures
          if (structures && structures.length > 0) {
            // console.log('Found structure, creating selection for chains:', Array.from(residuesByChain.keys()))

            try {
              // Get the actual structure object from the cell
              const structureRef = structures[0]
              if (!structureRef.cell?.obj?.data) {
                console.error('No structure data found')
                return
              }

              const structure = structureRef.cell.obj.data

              // Build loci for selected residues
              const elements: StructureElement.Loci['elements'][0][] = []

              // For each chain with selected residues
              residuesByChain.forEach((residueIds, chainId) => {
                console.log(`Looking for chain ${chainId} with residues:`, residueIds)

                // Iterate over all units in the structure
                if (!structure.units) {
                  console.error('No units found in structure')
                  return
                }

                console.log(`Structure has ${structure.units.length} units`)

                let unitIndex = 0

                for (const unit of structure.units) {
                  if (unit.kind !== 0) continue // Only atomic units

                  // Check if this unit contains our target chain
                  const unitChainName = unit.chainGroupId ? unit.model.atomicHierarchy.chains.label_asym_id.value(unit.chainGroupId) : null

                  // Only log details for first unit
                  const isFirstUnit = unitIndex === 0
                  unitIndex++

                  const hierarchy = unit.model?.atomicHierarchy
                  if (!hierarchy) {
                    console.log('No atomic hierarchy for unit')
                    continue
                  }

                  const residueIndex = hierarchy.residueAtomSegments?.index
                  const chains = hierarchy.chains
                  const residues = hierarchy.residues

                  if (!residueIndex || !chains || !residues) {
                    console.log('Missing required data in hierarchy')
                    continue
                  }

                  // Find residues in this unit that match our selection
                  const indices: number[] = []

                  let foundChains = new Set<string>()
                  let checkedElements = 0

                  // Check if we have the chain index mapping
                  const chainAtomIndex = hierarchy.chainAtomSegments?.index

                  for (let i = 0; i < unit.elements.length; i++) {
                    const elementIndex = unit.elements[i]
                    const rI = residueIndex[elementIndex]
                    checkedElements++

                    if (rI === undefined) continue

                    // Get chain index from atom
                    let chainIndex: number | undefined
                    if (chainAtomIndex) {
                      chainIndex = chainAtomIndex[elementIndex]
                    }

                    if (chainIndex === undefined) {
                      if (isFirstUnit && i < 5) console.log(`Element ${i}: No chain index for atom`)
                      continue
                    }

                    // Now get the chain ID and residue info
                    const unitChainId = chains.label_asym_id?.value?.(chainIndex)
                    const seqId = residues.label_seq_id?.value?.(rI)

                    // Only log first few for debugging
                    // if (isFirstUnit && foundChains.size < 3 && unitChainId) {
                    //   console.log(`Found chain: ${unitChainId}, seqId: ${seqId}`)
                    // }

                    if (unitChainId && !foundChains.has(unitChainId)) {
                      foundChains.add(unitChainId)
                    }

                    if (unitChainId === chainId && seqId !== undefined && residueIds.includes(seqId)) {
                      console.log(`Found matching residue: chain ${unitChainId}, seqId ${seqId}`)
                      indices.push(elementIndex)
                    }
                  }

                  if (isFirstUnit) {
                    console.log(`Checked ${checkedElements} elements`)
                    if (foundChains.size > 0) {
                      console.log(`Unit contains chains:`, Array.from(foundChains))
                    } else {
                      console.log(`No chains found in unit`)
                    }
                  }

                  if (indices.length > 0) {
                    console.log(`Found ${indices.length} atoms in unit ${unitIndex - 1} for chain ${chainId}`)
                    elements.push({ unit, indices: SortedArray.ofSortedArray(indices) })
                  }
                }
              })

              if (elements.length > 0) {
                const loci = StructureElement.Loci(structure, elements)
                console.log('Applying selection loci with', elements.length, 'elements')

                // Clear existing selection and apply new one
                molstar.managers.structure.selection.clear()
                molstar.managers.structure.selection.fromLoci('set', loci)

                // Also trigger highlight for immediate visual feedback
                molstar.managers.interactivity.lociHighlights.highlightOnly({ loci })

                // Focus camera on selected residues
                if (molstar.canvas3d) {
                  console.log('Focusing camera on selection')
                  const boundary = StructureElement.Loci.getBoundary(loci)
                  if (boundary && boundary.sphere) {
                    const sphere = boundary.sphere
                    console.log('Focus sphere:', { center: sphere.center, radius: sphere.radius })

                    // Add a small delay to ensure the selection is rendered before focusing
                    sleep(100).then(() => {
                      molstar.canvas3d.camera.focus(sphere.center, sphere.radius * 3.0, 500)
                    })
                  } else {
                    console.log('No boundary found for loci')
                  }
                } else {
                  console.log('No canvas3d available')
                }
              } else {
                console.log('No elements found for selection')
              }
            } catch (error) {
              console.error('Error updating selection:', error)
            }
          }
        }
      }

      return newState
    })
  }

  return [state, setSequence]
}

interface InternalChain {
  id: string
  name: string
  type: 'protein' | 'nucleic' | 'unknown'
  sequence: Residue[]
  length: number
  entityId?: string
}

// Helper function to convert three-letter codes to one-letter codes
function getOneLetterCode(threeLetter: string): string {
  const codeMap: Record<string, string> = {
    // Amino acids
    'ALA': 'A', 'ARG': 'R', 'ASN': 'N', 'ASP': 'D',
    'CYS': 'C', 'GLN': 'Q', 'GLU': 'E', 'GLY': 'G',
    'HIS': 'H', 'ILE': 'I', 'LEU': 'L', 'LYS': 'K',
    'MET': 'M', 'PHE': 'F', 'PRO': 'P', 'SER': 'S',
    'THR': 'T', 'TRP': 'W', 'TYR': 'Y', 'VAL': 'V',
    // Non-standard
    'SEC': 'U', 'PYL': 'O',
    // Nucleotides
    'A': 'A', 'C': 'C', 'G': 'G', 'T': 'T', 'U': 'U',
    'DA': 'A', 'DC': 'C', 'DG': 'G', 'DT': 'T',
    // Common ions and molecules
    'MG': '●', 'CA': '●', 'ZN': '●', 'FE': '●', 'NA': '●', 'CL': '●',
    'HOH': '○', 'WAT': '○',
    'ADP': '◆', 'ATP': '◆', 'GTP': '◆', 'GDP': '◆',
    // Unknown
    'UNK': 'X'
  }

  // For anything not in the map, if it's 1-2 characters, use as-is, otherwise use first letter
  const mapped = codeMap[threeLetter.toUpperCase()]
  if (mapped) return mapped

  // For short codes (like ions), use as-is
  if (threeLetter.length <= 2) return threeLetter

  // Otherwise use first letter or X
  return threeLetter.charAt(0).toUpperCase() || 'X'
}
