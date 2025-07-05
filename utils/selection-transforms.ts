// Pure selection data transformation utilities

import { SelectedResidue, SelectedChain } from './selection-types'

// Create chains with updated counts and sequences from residues
export const enrichChainsWithData = (chains: SelectedChain[], residues: SelectedResidue[]): SelectedChain[] => {
  return chains.map(chain => {
    const chainResidues = residues.filter(r => r.chainId === chain.chainId)
    return {
      ...chain,
      residueCount: chainResidues.length,
      sequence: chainResidues
        .sort((a, b) => a.residueId - b.residueId)
        .map(r => r.sequence || '')
        .join('')
    }
  })
}

// Sort chains alphabetically
export const sortChains = (chains: SelectedChain[]): SelectedChain[] => 
  chains.sort((a, b) => a.chainId.localeCompare(b.chainId))

// Sort residues by chain then by ID
export const sortResidues = (residues: SelectedResidue[]): SelectedResidue[] =>
  residues.sort((a, b) => 
    a.chainId !== b.chainId ? a.chainId.localeCompare(b.chainId) : a.residueId - b.residueId
  )

// Extract protein sequence from chains
export const getProteinSequence = (chains: SelectedChain[]): string =>
  chains.filter(c => c.type === 'protein').map(c => c.sequence).join('')

// Create empty selection data
export const createEmptySelectionData = (enabled: boolean) => ({
  enabled,
  atoms: [],
  chains: [],
  residues: [],
  isEmpty: true,
  summary: 'Nothing selected',
  bounds: null,
  center: null,
  sequence: ''
})

// Convert selection data to event format
export const selectionDataToEvent = (data: any) => ({
  atoms: data.atoms,
  residues: data.residues,
  chains: data.chains,
  isEmpty: data.isEmpty,
  bounds: data.bounds,
  center: data.center,
  sequence: data.sequence
})

// Extract hover info from loci
export const extractHoverInfo = (loci: any, extractAtomData: (unit: any, idx: number) => any, getOneLetterCode: (code: string) => string): any => {
  if (!loci || loci.kind !== 'element-loci' || !loci.elements.length) {
    return { atom: null, residue: null, chain: null }
  }

  const { unit, indices } = loci.elements[0]
  if (!indices.length || !unit.model.atomicHierarchy.atoms) {
    return { atom: null, residue: null, chain: null }
  }

  const atomData = extractAtomData(unit, indices[0])

  return {
    atom: {
      id: atomData.atomId,
      element: atomData.element,
      name: atomData.name,
      chainId: atomData.chainId,
      residueId: atomData.residueId,
      residueName: atomData.residueName,
      coords: atomData.coords
    },
    residue: {
      chainId: atomData.chainId,
      residueId: atomData.residueId,
      residueName: atomData.residueName,
      atomCount: 1,
      sequence: getOneLetterCode(atomData.residueName)
    },
    chain: {
      chainId: atomData.chainId,
      residueCount: 1,
      atomCount: 1,
      type: 'unknown'
    }
  }
}