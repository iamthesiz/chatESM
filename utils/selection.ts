// Selection-related utility functions and constants

export const ONE_LETTER_CODES: Record<string, string> = {
  // Amino acids
  'ALA': 'A', 'ARG': 'R', 'ASN': 'N', 'ASP': 'D', 'CYS': 'C', 'GLN': 'Q', 
  'GLU': 'E', 'GLY': 'G', 'HIS': 'H', 'ILE': 'I', 'LEU': 'L', 'LYS': 'K',
  'MET': 'M', 'PHE': 'F', 'PRO': 'P', 'SER': 'S', 'THR': 'T', 'TRP': 'W', 
  'TYR': 'Y', 'VAL': 'V', 'SEC': 'U', 'PYL': 'O',
  // Nucleotides
  'A': 'A', 'C': 'C', 'G': 'G', 'T': 'T', 'U': 'U',
  'DA': 'A', 'DC': 'C', 'DG': 'G', 'DT': 'T', 'UNK': 'X'
}

export const getOneLetterCode = (threeLetter: string): string => {
  return ONE_LETTER_CODES[threeLetter.toUpperCase()] || 'X'
}

export const buildSelectionSummary = (
  atoms: any[],
  chains: any[],
  residues: any[]
): string => {
  if (atoms.length === 0) return 'Nothing selected'
  
  return [
    chains.length === 1 ? `Chain ${chains[0].chainId}` : 
    chains.length > 1 ? `${chains.length} chains` : null,
    residues.length === 1 ? `residue ${residues[0].residueId}` : 
    residues.length > 1 ? `${residues.length} residues` : null,
    `${atoms.length} atoms`
  ].filter(Boolean).join(', ')
}

export const getChainType = (
  entities: any,
  entityId: string
): 'protein' | 'nucleic' | 'unknown' => {
  for (let i = 0; i < entities._rowCount; i++) {
    if (entities.id.value(i) === entityId) {
      const subtype = entities.subtype.value(i)
      if (subtype === 'polypeptide') return 'protein'
      if (subtype === 'polynucleotide') return 'nucleic'
      break
    }
  }
  return 'unknown'
}

export const calculateBounds = (atoms: Array<{ coords: { x: number; y: number; z: number } }>) => {
  if (atoms.length === 0) return { bounds: null, center: null }
  
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  
  for (const atom of atoms) {
    minX = Math.min(minX, atom.coords.x)
    minY = Math.min(minY, atom.coords.y)
    minZ = Math.min(minZ, atom.coords.z)
    maxX = Math.max(maxX, atom.coords.x)
    maxY = Math.max(maxY, atom.coords.y)
    maxZ = Math.max(maxZ, atom.coords.z)
  }
  
  return {
    bounds: {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ }
    },
    center: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2
    }
  }
}

// Helper to extract atom data from unit and index
export const extractAtomData = (unit: any, idx: number) => {
  const atomicHierarchy = unit.model.atomicHierarchy
  const residueIndex = atomicHierarchy.residueAtomSegments.index[idx]
  const chainIndex = atomicHierarchy.residues.chainIndex[residueIndex]
  
  return {
    atomId: `${unit.id}-${idx}`,
    element: unit.model.atomicData.atoms.type_symbol.value(
      atomicHierarchy.atoms.type_symbol.value(idx)
    ),
    name: atomicHierarchy.atoms.label_atom_id.value(idx),
    chainId: atomicHierarchy.chains.label_asym_id.value(chainIndex),
    chainIndex,
    residueId: atomicHierarchy.residues.label_seq_id.value(residueIndex),
    residueName: atomicHierarchy.residues.label_comp_id.value(residueIndex),
    residueIndex,
    coords: {
      x: unit.conformation.x[idx],
      y: unit.conformation.y[idx],
      z: unit.conformation.z[idx]
    }
  }
}

// Event emitter helper
export const createEventEmitter = <T extends Record<string, any>>() => {
  const callbacks: { [K in keyof T]?: Set<(data: T[K]) => void> } = {}
  
  return {
    emit: <K extends keyof T>(event: K, data: T[K]) => {
      callbacks[event]?.forEach(cb => cb(data))
    },
    on: <K extends keyof T>(event: K, callback: (data: T[K]) => void) => {
      if (!callbacks[event]) callbacks[event] = new Set()
      callbacks[event]!.add(callback)
      return () => callbacks[event]?.delete(callback)
    },
    getCallbacks: () => callbacks
  }
}

// Selection preset expressions
export const SELECTION_PRESETS = {
  protein: 'protein',
  ligand: 'ligand',
  water: 'water',
  nucleic: 'nucleic'
} as const