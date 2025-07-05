# Molstar Selection Options Reference

This document provides a comprehensive list of all selection options available in Molstar, organized by category.

## Selection Categories

### 1. Type
Selections based on molecular entity types:
- **All**: Select all atoms/elements
- **Current Selection**: The currently selected elements
- **Polymer**: All polymer entities (proteins, nucleic acids)
- **Protein**: Protein molecules only
- **Nucleic**: Nucleic acid molecules (DNA/RNA)
- **Water**: Water molecules
- **Ion**: Ion molecules
- **Lipid**: Lipid molecules
- **Carbohydrate**: Branched carbohydrate molecules
- **Ligand**: Small molecule ligands (non-polymer, non-water, non-ion)
- **Coarse Elements**: Coarse-grained representation elements

### 2. Structure Property
Selections based on structural properties:
- **Trace**: Backbone trace (CA atoms for proteins, P atoms for nucleic acids)
- **Backbone**: Protein backbone atoms or nucleic acid backbone atoms
- **Sidechain**: Sidechain atoms only
- **Sidechain with Trace**: Sidechain atoms plus trace atoms
- **Helix**: Alpha helix secondary structure
- **Beta Strand/Sheet**: Beta sheet secondary structure

### 3. Atom Property
Selections based on atom properties:
- **Element Symbol**: Dynamic list based on elements present in structure (e.g., C, N, O, S, P)

### 4. Bond Property
Selections based on bonding:
- **Disulfide Bridges**: Cysteine disulfide bonds
- **NOS Bridges**: CSO-LYS bridges

### 5. Residue Property
Selections based on residue properties:
- **Non-standard Residues in Polymers**: Modified or unusual residues
- **Rings in Residues**: All ring structures
- **Aromatic Rings in Residues**: Aromatic ring structures only

### 6. Amino Acid
All standard amino acids:
- Alanine (ALA)
- Arginine (ARG)
- Asparagine (ASN)
- Aspartic Acid (ASP)
- Cysteine (CYS)
- Glutamic Acid (GLU)
- Glutamine (GLN)
- Glycine (GLY)
- Histidine (HIS)
- Isoleucine (ILE)
- Leucine (LEU)
- Lysine (LYS)
- Methionine (MET)
- Phenylalanine (PHE)
- Proline (PRO)
- Serine (SER)
- Threonine (THR)
- Tryptophan (TRP)
- Tyrosine (TYR)
- Valine (VAL)
- Selenocysteine (SEC)
- Pyrrolysine (PYL)
- Unknown (UNK)

### 7. Nucleic Base
Standard nucleic acid bases:
- Adenosine (A, DA)
- Cytidine (C, DC)
- Guanosine (G, DG)
- Thymidine (T, DT)
- Inosine (I, DI)
- Uridine (U, DU)
- Unknown (N, DN)

### 8. Manipulate Selection
Operations on current selection:
- **Surrounding Residues (5 Å) of Selection**: Residues within 5 Å
- **Surrounding Ligands (5 Å) of Selection**: Ligands within 5 Å
- **Surrounding Atoms (5 Å) of Selection**: Atoms within 5 Å
- **Inverse / Complement of Selection**: Everything not selected
- **Residues Covalently Bonded to Selection**: Connected residues
- **Residues with Cov. or Metallic Bond to Selection**: Connected via covalent or coordination bonds
- **Covalently Bonded Component**: Entire connected component
- **Whole Residues of Selection**: Expand selection to complete residues

### 9. Dynamic Queries
These are generated based on the loaded structure:
- **Ligand/Non-standard Residue**: Dynamic list of non-standard residues found in the structure
- **Polymer/Carbohydrate Entities**: Dynamic list of polymer and carbohydrate entities by description

### 10. Internal (Hidden)
These are used internally but not shown in UI:
- Carbohydrate with Connected
- Connected to Carbohydrate
- Ligand with Connected
- Connected to Ligand
- Connected to Ligand or Carbohydrate

## Selection Modifiers

When applying selections, you can use these modifiers:
- **Set**: Replace current selection
- **Add/Union**: Add to current selection
- **Remove/Subtract**: Remove from current selection
- **Intersect**: Keep only overlapping parts

## Programmatic Usage

### Using Built-in Selections
```javascript
import { StructureSelectionQueries } from 'molstar/lib/mol-plugin-state/helpers/structure-selection-query';

// Access a specific query
const proteinQuery = StructureSelectionQueries.protein;
const helixQuery = StructureSelectionQueries.helix;

// Apply selection
plugin.managers.structure.selection.fromSelectionQuery('set', proteinQuery);
```

### Creating Custom Selections
```javascript
import { StructureSelectionQuery } from 'molstar/lib/mol-plugin-state/helpers/structure-selection-query';
import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder';

// Create a custom selection for a specific residue range
const customQuery = StructureSelectionQuery('Residues 10-20', 
    MS.struct.generator.atomGroups({
        'residue-test': MS.core.rel.inRange([
            MS.ammp('auth_seq_id'), 10, 20
        ])
    }), 
    { category: 'Custom' }
);
```

### Selection Categories Enum
```javascript
import { StructureSelectionCategory } from 'molstar/lib/mol-plugin-state/helpers/structure-selection-query';

// Available categories:
// StructureSelectionCategory.Type
// StructureSelectionCategory.Structure
// StructureSelectionCategory.Atom
// StructureSelectionCategory.Bond
// StructureSelectionCategory.Residue
// StructureSelectionCategory.AminoAcid
// StructureSelectionCategory.NucleicBase
// StructureSelectionCategory.Manipulate
// StructureSelectionCategory.Validation
// StructureSelectionCategory.Misc
// StructureSelectionCategory.Internal
```

## Notes

1. Some selections require custom properties to be calculated (e.g., secondary structure)
2. Dynamic queries are generated based on the loaded structure's content
3. Selection granularity can be controlled (atom, residue, chain, etc.)
4. Selections can reference the current selection for manipulation operations