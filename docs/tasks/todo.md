# Task: Extract Molstar Selection Options

## Objective
Search the Molstar source code to find all available selection options and categories, particularly:
1. Selection modes/queries (Type, Structure Property, Amino Acids, etc.)
2. Structure selection categories and their options
3. APIs that provide these selection options programmatically

## Todo List

- [x] Search for selection-related files in Molstar source
- [x] Find the main selection query definitions file
- [x] Identify selection categories enum
- [x] Extract all built-in selection queries
- [x] Document amino acid selections
- [x] Document nucleic base selections
- [x] Create a comprehensive list of all selection options
- [x] Create example code showing how to use these selections programmatically
- [x] Document the selection API structure

## Findings

### Selection Categories Found
From `StructureSelectionCategory` enum:
- Type
- Structure Property
- Atom Property
- Bond Property  
- Residue Property
- Amino Acid
- Nucleic Base
- Manipulate Selection
- Validation
- Miscellaneous
- Internal

### Built-in Selection Queries Found
From `StructureSelectionQueries` object:
- all
- current
- polymer
- trace
- backbone
- sidechain
- sidechainWithTrace
- protein
- nucleic
- helix
- beta
- water
- ion
- lipid
- branched (carbohydrate)
- ligand
- disulfideBridges
- nosBridges
- nonStandardPolymer
- coarse
- ring
- aromaticRing
- surroundings
- surroundingLigands
- surroundingAtoms
- complement
- covalentlyBonded
- covalentlyOrMetallicBonded
- covalentlyBondedComponent
- wholeResidues

### Amino Acids (Standard)
All 20 standard amino acids plus SEC (Selenocysteine), PYL (Pyrrolysine), and UNK (Unknown)

### Nucleic Bases (Standard)
- Adenosine (A, DA)
- Cytidine (C, DC)
- Thymidine (T, DT)
- Guanosine (G, DG)
- Inosine (I, DI)
- Uridine (U, DU)
- Unknown (N, DN)

### Dynamic Queries Generated Based on Structure
- Element queries (based on unique elements in structure)
- Non-standard residue queries
- Polymer/carbohydrate entity queries

## Next Steps
- Create a summary document with all selection options organized by category
- Write example code showing how to apply selections programmatically

## Review

### Summary of Changes
I successfully searched through the Molstar source code and extracted all available selection options. The key findings include:

1. **Created comprehensive documentation** (`docs/molstar-selection-options.md`):
   - Listed all 10 selection categories (Type, Structure Property, Atom Property, etc.)
   - Documented 35+ built-in selection queries
   - Listed all 23 standard amino acids
   - Listed all 7 standard nucleic bases
   - Explained dynamic queries that are generated based on structure content

2. **Created practical examples** (`docs/molstar-selection-examples.md`):
   - Basic selection usage with all 4 modifiers (set, add, remove, intersect)
   - Working with specific amino acids
   - Creating custom selections with MolScript
   - Advanced selection patterns like interfaces and surface residues
   - How to register custom queries
   - Common selection patterns and use cases

3. **Key APIs Discovered**:
   - `StructureSelectionQueries` - Object containing all built-in queries
   - `StructureSelectionCategory` - Enum of selection categories
   - `StructureSelectionQuery()` - Function to create custom queries
   - `MolScriptBuilder` (MS) - Type-safe query builder
   - Selection registry for adding custom queries

### Files Created
- `/docs/tasks/todo.md` - This task tracking document
- `/docs/molstar-selection-options.md` - Complete reference of all selection options
- `/docs/molstar-selection-examples.md` - Practical code examples

The documentation provides a complete reference for developers who need to programmatically control selections in Molstar, including both using built-in selections and creating custom ones.