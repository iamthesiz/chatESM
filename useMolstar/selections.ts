// Molecular selection utilities and constants

// Standard amino acids
export const AMINO_ACIDS = [
  'ALA', 'ARG', 'ASN', 'ASP', 'CYS', 'GLN', 'GLU', 'GLY', 'HIS', 'ILE',
  'LEU', 'LYS', 'MET', 'PHE', 'PRO', 'SER', 'THR', 'TRP', 'TYR', 'VAL'
]

// Nucleotides
export const NUCLEOTIDES = [
  'A', 'T', 'G', 'C', 'U',
  'DA', 'DT', 'DG', 'DC', 'DU',
  'ADE', 'THY', 'GUA', 'CYT', 'URA'
]

// Water molecules
export const WATER_NAMES = ['HOH', 'H2O', 'WAT', 'SOL', 'TIP3']

// Common ions
export const ION_NAMES = [
  'MG', 'CA', 'ZN', 'FE', 'NA', 'CL', 'K', 'BR', 'I',
  'MN', 'CO', 'NI', 'CU', 'CD', 'HG', 'SR', 'BA',
  'SO4', 'PO4', 'NO3'
]

// Selection category mappings
export const SELECTION_CATEGORIES = {
  protein: AMINO_ACIDS,
  nucleic: NUCLEOTIDES,
  water: WATER_NAMES,
  ion: ION_NAMES
}

// Parse selection query to Molstar format
export function parseSelectionQuery(query: string): any {
  // This is a simplified parser - in production you'd use Molstar's full query language
  const lowerQuery = query.toLowerCase().trim()
  
  // Handle built-in categories
  if (lowerQuery === 'protein') {
    return { type: 'residue-test', residues: AMINO_ACIDS }
  }
  if (lowerQuery === 'nucleic') {
    return { type: 'residue-test', residues: NUCLEOTIDES }
  }
  if (lowerQuery === 'water') {
    return { type: 'residue-test', residues: WATER_NAMES }
  }
  if (lowerQuery === 'ion') {
    return { type: 'residue-test', residues: ION_NAMES }
  }
  if (lowerQuery === 'ligand') {
    return { type: 'ligand' }
  }
  
  // Handle chain selections
  const chainMatch = lowerQuery.match(/chain\s+([a-z0-9]+)/i)
  if (chainMatch) {
    return { type: 'chain', chains: [chainMatch[1].toUpperCase()] }
  }
  
  // Handle residue selections
  const residueMatch = lowerQuery.match(/residue\s+(\d+)(?:-(\d+))?/)
  if (residueMatch) {
    const start = parseInt(residueMatch[1])
    const end = residueMatch[2] ? parseInt(residueMatch[2]) : start
    return { type: 'residue-range', start, end }
  }
  
  // Handle combined selections (chain + residue)
  const combinedMatch = lowerQuery.match(/chain\s+([a-z0-9]+)\s+and\s+residue\s+(\d+)(?:-(\d+))?/i)
  if (combinedMatch) {
    return {
      type: 'combined',
      chain: combinedMatch[1].toUpperCase(),
      residueStart: parseInt(combinedMatch[2]),
      residueEnd: combinedMatch[3] ? parseInt(combinedMatch[3]) : parseInt(combinedMatch[2])
    }
  }
  
  // Handle within selections
  const withinMatch = lowerQuery.match(/within\s+(\d+(?:\.\d+)?)\s+of\s+(.+)/)
  if (withinMatch) {
    return {
      type: 'within',
      distance: parseFloat(withinMatch[1]),
      selection: parseSelectionQuery(withinMatch[2])
    }
  }
  
  // Default to custom query
  return { type: 'custom', query }
}

// Convert internal selection to Molstar Script
export function buildMolstarSelection(plugin: any, selection: any): any {
  const Script = plugin.builders.script
  
  switch (selection.type) {
    case 'residue-test':
      return Script.struct.generator.atomGroups({
        'residue-test': Script.core.set.has([
          Script.core.type.set(selection.residues),
          Script.struct.atomProperty.macromolecular.label_comp_id()
        ])
      })
      
    case 'chain':
      return Script.struct.generator.atomGroups({
        'chain-test': Script.core.set.has([
          Script.core.type.set(selection.chains),
          Script.struct.atomProperty.macromolecular.label_asym_id()
        ])
      })
      
    case 'residue-range':
      return Script.struct.generator.atomGroups({
        'residue-test': Script.core.logic.and([
          Script.core.rel.gte([
            Script.struct.atomProperty.macromolecular.label_seq_id(),
            selection.start
          ]),
          Script.core.rel.lte([
            Script.struct.atomProperty.macromolecular.label_seq_id(),
            selection.end
          ])
        ])
      })
      
    case 'ligand':
      // Select non-protein, non-nucleic, non-water, non-ion residues
      const excludedResidues = [
        ...AMINO_ACIDS,
        ...NUCLEOTIDES,
        ...WATER_NAMES,
        ...ION_NAMES
      ]
      return Script.struct.generator.atomGroups({
        'residue-test': Script.core.logic.not([
          Script.core.set.has([
            Script.core.type.set(excludedResidues),
            Script.struct.atomProperty.macromolecular.label_comp_id()
          ])
        ])
      })
      
    default:
      // Return all atoms as fallback
      return Script.struct.generator.all()
  }
}