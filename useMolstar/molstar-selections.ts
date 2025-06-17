/**
 * Molstar selection options pulled from the source code
 * These match the built-in selection queries available in Molstar
 */

export const MolstarSelectionOptions = {
  // Type selections
  type: {
    polymer: 'Polymer',
    protein: 'Protein', 
    nucleic: 'Nucleic',
    water: 'Water',
    ion: 'Ion',
    lipid: 'Lipid',
    branched: 'Branched (Carbohydrate)',
    ligand: 'Ligand',
    'non-standard': 'Non-standard Residue',
    coarse: 'Coarse Elements'
  },
  
  // Structure property selections
  structureProperty: {
    trace: 'Trace',
    backbone: 'Backbone',
    sidechain: 'Sidechain',
    'sidechain-with-trace': 'Sidechain with Trace',
    helix: 'Helix',
    'beta-strand': 'Beta Strand',
    'beta-sheet': 'Beta Sheet',
    coil: 'Coil',
    turn: 'Turn',
    dna: 'DNA',
    rna: 'RNA',
    carbohydrate: 'Carbohydrate'
  },
  
  // Atom property selections (elements)
  atomProperty: {
    C: 'Carbon (C)',
    N: 'Nitrogen (N)',
    O: 'Oxygen (O)',
    S: 'Sulfur (S)',
    P: 'Phosphorus (P)',
    H: 'Hydrogen (H)',
    metal: 'Metal',
    halogen: 'Halogen'
  },
  
  // Bond property selections
  bondProperty: {
    disulfide: 'Disulfide Bridges',
    covalent: 'Covalent Bonds',
    metallic: 'Metallic Bonds',
    nos: 'NOS Bridges'
  },
  
  // Residue property selections
  residueProperty: {
    'non-standard': 'Non-standard Residues',
    aromatic: 'Aromatic Rings',
    charged: 'Charged',
    polar: 'Polar',
    nonpolar: 'Non-polar', 
    acidic: 'Acidic',
    basic: 'Basic',
    small: 'Small',
    nucleotide: 'Nucleotide',
    pyrimidine: 'Pyrimidine',
    purine: 'Purine',
    modified: 'Modified'
  },
  
  // Amino acids (3-letter codes)
  aminoAcid: {
    ALA: 'Alanine (ALA)',
    ARG: 'Arginine (ARG)',
    ASN: 'Asparagine (ASN)',
    ASP: 'Aspartic Acid (ASP)',
    CYS: 'Cysteine (CYS)',
    GLN: 'Glutamine (GLN)',
    GLU: 'Glutamic Acid (GLU)',
    GLY: 'Glycine (GLY)',
    HIS: 'Histidine (HIS)',
    ILE: 'Isoleucine (ILE)',
    LEU: 'Leucine (LEU)',
    LYS: 'Lysine (LYS)',
    MET: 'Methionine (MET)',
    PHE: 'Phenylalanine (PHE)',
    PRO: 'Proline (PRO)',
    PYL: 'Pyrrolysine (PYL)',
    SEC: 'Selenocysteine (SEC)',
    SER: 'Serine (SER)',
    THR: 'Threonine (THR)',
    TRP: 'Tryptophan (TRP)',
    TYR: 'Tyrosine (TYR)',
    UNK: 'Unknown (UNK)',
    VAL: 'Valine (VAL)'
  },
  
  // Nucleic bases
  nucleicBase: {
    A: 'Adenosine (A)',
    C: 'Cytidine (C)',
    G: 'Guanosine (G)',
    I: 'Inosine (I)',
    T: 'Thymidine (T)',
    U: 'Uridine (U)',
    DA: 'Deoxyadenosine (DA)',
    DC: 'Deoxycytidine (DC)',
    DG: 'Deoxyguanosine (DG)',
    DI: 'Deoxyinosine (DI)',
    DT: 'Deoxythymidine (DT)',
    DU: 'Deoxyuridine (DU)',
    N: 'Unknown (N)',
    DN: 'Deoxy Unknown (DN)'
  },
  
  // Internal selections
  internal: {
    'has-representation': 'Has Representation',
    'latest-created': 'Latest Created',
    'carb-with-connected': 'Carbohydrate with Connected',
    'connected-to-carb': 'Connected to Carbohydrate',
    'ligand-with-connected': 'Ligand with Connected',
    'connected-to-ligand': 'Connected to Ligand',
    'connected-to-ligand-or-carb': 'Connected to Ligand or Carbohydrate'
  },
  
  // Manipulate selection operations
  manipulateSelection: {
    'surrounding-residues-5': 'Surrounding Residues (5 Å)',
    'surrounding-ligands-5': 'Surrounding Ligands (5 Å)',
    'surrounding-atoms-5': 'Surrounding Atoms (5 Å)',
    'expand-by-distance-3': 'Expand by Distance (3 Å)',
    'expand-by-distance-5': 'Expand by Distance (5 Å)',
    'expand-by-distance-8': 'Expand by Distance (8 Å)',
    'expand-to-whole-residues': 'Expand to Whole Residues',
    'expand-by-covalent-bond': 'Expand by Covalent Bond',
    'select-connected-component': 'Select Connected Component',
    'covalently-bonded': 'Residues Covalently Bonded',
    'cov-or-metallic': 'Residues with Cov. or Metallic Bond',
    'covalent-component': 'Covalently Bonded Component',
    'whole-residues': 'Whole Residues of Selection',
    inverse: 'Inverse / Complement',
    'invert-within-residues': 'Invert within Residues',
    'invert-within-chains': 'Invert within Chains',
    'invert-all': 'Invert All',
    'set-selection': 'Set Selection',
    'add-selection': 'Add to Selection',
    'subtract-selection': 'Subtract from Selection'
  }
}

// Representation types available in Molstar
export const MolstarRepresentationTypes = {
  'cartoon': 'Cartoon',
  'backbone': 'Backbone',
  'ball-and-stick': 'Ball & Stick',
  'carbohydrate': 'Carbohydrate',
  'ellipsoid': 'Ellipsoid',
  'gaussian-surface': 'Gaussian Surface',
  'gaussian-volume': 'Gaussian Volume',
  'label': 'Label',
  'line': 'Line',
  'molecular-surface': 'Molecular Surface',
  'orientation': 'Orientation',
  'plane': 'Plane',
  'point': 'Point',
  'putty': 'Putty',
  'spacefill': 'Spacefill'
}

// Helper to get all selection options for dropdown
export function getSelectionCategories() {
  return {
    'Type': MolstarSelectionOptions.type,
    'Structure Property': MolstarSelectionOptions.structureProperty,
    'Atom Property': MolstarSelectionOptions.atomProperty,
    'Bond Property': MolstarSelectionOptions.bondProperty,
    'Residue Property': MolstarSelectionOptions.residueProperty,
    'Amino Acid': MolstarSelectionOptions.aminoAcid,
    'Nucleic Base': MolstarSelectionOptions.nucleicBase,
    'Internal': MolstarSelectionOptions.internal,
    'Manipulate Selection': MolstarSelectionOptions.manipulateSelection
  }
}