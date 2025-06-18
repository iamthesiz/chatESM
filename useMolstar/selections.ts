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

export const REPRESENTATION_PRESETS: Record<string, string> = {
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

// Helper function to convert hex color to RGB
export const typeMap1 = {
  protein: 'protein',
  ligand: 'ligand',
  water: 'water',
  ion: 'ion',
  nucleic: 'nucleic'
}

// Map component types to their labels in the state tree
export const componentMap = {
  protein: ['Polymer', 'Protein'],
  ligand: ['Ligand'],
  water: ['Water'],
  ion: ['Ion'],
  nucleic: ['Nucleic', 'RNA', 'DNA']
}

// Component type mapping
export const labelToType: Record<string, string> = {
  'Polymer': 'protein',
  'Protein': 'protein',
  'Ligand': 'ligand',
  'Water': 'water',
  'Ion': 'ion',
  'Nucleic': 'nucleic',
  'RNA': 'nucleic',
  'DNA': 'nucleic'
}


export const repTypeMap = {
  'cartoon': 'Cartoon',
  'ball-and-stick': 'Ball & Stick',
  'molecular-surface': 'Surface',
  'spacefill': 'Spacefill',
  'backbone': 'Backbone',
  'line': 'Line',
  'gaussian-surface': 'Gaussian Surface'
}

// Map our component types to Molstar's labels
export const typeToLabels: Record<string, string[]> = {
  'protein': ['Polymer', 'Protein'],
  'ligand': ['Ligand', 'Non-standard', 'Modified Residues'],
  'water': ['Water'],
  'ion': ['Ion'],
  'nucleic': ['Nucleic', 'RNA', 'DNA']
}

// Map our component types to possible labels
export const typeToLabels2: Record<string, string[]> = {
  'protein': ['Polymer', 'Protein', 'protein', 'helix', 'beta-strand', 'beta-sheet', 'backbone', 'sidechain'],
  'ligand': ['Ligand', 'ligand', 'Non-standard', 'Modified Residues'],
  'water': ['Water', 'water'],
  'ion': ['Ion', 'ion'],
  'nucleic': ['Nucleic', 'nucleic', 'RNA', 'DNA']
}

export const granularityMap = {
  'atom': 'element',
  'residue': 'residue',
  'chain': 'chain',
  'entity': 'entity',
  'model': 'model',
  'operator': 'operator',
  'structure': 'structure',
  'atom-instance': 'element-instance',
  'residue-instance': 'residue-instance',
  'chain-instance': 'chain-instance'
} as const

export const lightingPresets = {
  bright: { lightIntensity: 1.0, ambientIntensity: 0.4 },
  soft: { lightIntensity: 0.6, ambientIntensity: 0.6 },
  dramatic: { lightIntensity: 0.8, ambientIntensity: 0.2 },
  off: { lightIntensity: 0, ambientIntensity: 1.0 }
}

export const representationTypeMap = {
  'cartoon': 'Cartoon',
  'ball-and-stick': 'Ball & Stick',
  'molecular-surface': 'Surface',
  'spacefill': 'Spacefill',
  'backbone': 'Backbone',
  'line': 'Line',
  'gaussian-surface': 'Gaussian Surface'
} as const

export const representationMap = {
  cartoon: 'cartoon',
  'ball-stick': 'ball-and-stick',
  surface: 'molecular-surface',
  ribbon: 'backbone',
  spacefill: 'spacefill',
};

// Default values for postprocessing effects
export const DEFAULT_OCCLUSION_PARAMS = {
  samples: 32,
  radius: 5,
  bias: 0.8,
  blurKernelSize: 15,
  blurDepthBias: 0.5,
  resolutionScale: 1,
  transparentThreshold: 0.8
}

export const DEFAULT_MULTISCALE_LEVELS = [
  { radius: 2, blur: 1 },
  { radius: 4, blur: 1 },
  { radius: 8, blur: 1 },
  { radius: 16, blur: 1 }
]

export const DEFAULT_DOF_PARAMS = {
  blurSize: 9,
  blurSpread: 1.0,
  inFocus: 0.0,
  PPM: 20.0,
  center: 'camera-target' as const,
  mode: 'plane' as const
}

export const DEFAULT_SHADOW_PARAMS = {
  steps: 1,
  maxDistance: 3,
  tolerance: 1.0
}

export const DEFAULT_OUTLINE_PARAMS = {
  scale: 1,
  threshold: 0.33
}

export const DEFAULT_FOG_INTENSITY = 15

// Background color mapping - includes both hex and decimal representations
export const BACKGROUND_COLOR_MAP: Record<string | number, string> = {
  16777215: 'white',     // 0xffffff in decimal
  0xffffff: 'white',     // hex representation
  0: 'black', 
  11: 'black',           // Molstar uses 11 for black
  0x00000000: 'transparent'
}

// Reverse mapping for named colors
export const NAMED_COLORS: Record<string, number> = {
  transparent: 0x00000000,
  black: 11,  // Use 11 instead of 0x000000 to match what Molstar expects
  white: 0xffffff
}

// Style presets configuration
type StylePreset = {
  renderer?: { style: { name: string } }
  lighting?: string
  outline: { on: boolean, params?: any }
  occlusion: boolean
  shadow: { on: boolean, params?: any }
}

export const STYLE_PRESETS: Record<string, StylePreset> = {
  default: {
    renderer: { style: { name: 'auto' } },
    lighting: 'soft',
    outline: { on: false },
    occlusion: false,
    shadow: { on: false }
  },
  illustrative: {
    renderer: { style: { name: 'illustrative' } },
    lighting: 'off',
    outline: { on: true, params: { scale: 1, threshold: 0.33 } },
    occlusion: false,
    shadow: { on: false }
  },
  publication: {
    renderer: { style: { name: 'auto' } },
    lighting: 'soft',
    outline: { on: true, params: { scale: 0.6, threshold: 0.8, includeTransparent: true } },
    occlusion: false,
    shadow: { on: false }
  },
  performance: {
    renderer: { style: { name: 'auto' } },
    outline: { on: false },
    occlusion: false,
    shadow: { on: false }
  }
}

// Helper to extract representation type from various sources
export const extractRepresentationType = (repr: any): string => {
  let reprTypeName = ''

  // Method 1: From transform params
  if (repr.transform?.params?.type?.name) {
    reprTypeName = repr.transform.params.type.name
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
    reprTypeName = repr.transform.params?.type?.name || repr.transform.transformer.definition.params.type.defaultValue.name
  }

  return reprTypeName
}

// Helper to determine component type from label
export const determineComponentType = (label: string): string => {
  // Check if this is a component type we recognize
  for (const [labelKey, typeValue] of Object.entries(labelToType)) {
    if (label.includes(labelKey)) {
      return typeValue
    }
  }

  // Check for custom component labels (e.g., "protein Component", "helix Component")
  if (label.includes(' Component')) {
    const selectionName = label.replace(' Component', '').toLowerCase()
    return typeMap1[selectionName] ?? selectionName
  }

  return 'custom'
}
