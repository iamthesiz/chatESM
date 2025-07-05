# Molstar Selection API Examples

This document provides practical examples of using Molstar's selection API programmatically.

## Basic Selection Usage

### 1. Applying Built-in Selections

```javascript
import { StructureSelectionQueries } from 'molstar/lib/mol-plugin-state/helpers/structure-selection-query';

// Get reference to your Molstar plugin instance
const plugin = viewer.plugin;

// Select all proteins
plugin.managers.structure.selection.fromSelectionQuery('set', StructureSelectionQueries.protein);

// Add helices to current selection
plugin.managers.structure.selection.fromSelectionQuery('add', StructureSelectionQueries.helix);

// Remove water molecules from selection
plugin.managers.structure.selection.fromSelectionQuery('remove', StructureSelectionQueries.water);

// Intersect with ligands (keep only parts that are also ligands)
plugin.managers.structure.selection.fromSelectionQuery('intersect', StructureSelectionQueries.ligand);
```

### 2. Selection Modifiers Explained

```javascript
// 'set' - Replace current selection entirely
plugin.managers.structure.selection.fromSelectionQuery('set', query);

// 'add' - Add to current selection (union)
plugin.managers.structure.selection.fromSelectionQuery('add', query);

// 'remove' - Remove from current selection (subtract)
plugin.managers.structure.selection.fromSelectionQuery('remove', query);

// 'intersect' - Keep only overlapping parts
plugin.managers.structure.selection.fromSelectionQuery('intersect', query);
```

### 3. Working with Specific Amino Acids

```javascript
import { ResidueQuery, StructureSelectionCategory } from 'molstar/lib/mol-plugin-state/helpers/structure-selection-query';

// Create a query for histidines
const histidineQuery = ResidueQuery(
    [['HIS'], 'Histidine'], 
    StructureSelectionCategory.AminoAcid
);

// Select all histidines
plugin.managers.structure.selection.fromSelectionQuery('set', histidineQuery);

// Create a query for multiple residue types
const aromaticQuery = ResidueQuery(
    [['PHE', 'TYR', 'TRP'], 'Aromatic Residues'], 
    StructureSelectionCategory.Residue
);
```

## Advanced Selection Examples

### 4. Creating Custom Selections with MolScript

```javascript
import { StructureSelectionQuery } from 'molstar/lib/mol-plugin-state/helpers/structure-selection-query';
import { MolScriptBuilder as MS } from 'molstar/lib/mol-script/language/builder';

// Select residues 10-20 in chain A
const residueRangeQuery = StructureSelectionQuery('Chain A residues 10-20',
    MS.struct.generator.atomGroups({
        'chain-test': MS.core.rel.eq([MS.ammp('auth_asym_id'), 'A']),
        'residue-test': MS.core.rel.inRange([MS.ammp('auth_seq_id'), 10, 20])
    }),
    { category: 'Custom' }
);

// Select atoms within 5Å of residue 50
const nearbyAtomsQuery = StructureSelectionQuery('Near residue 50',
    MS.struct.modifier.includeSurroundings({
        0: MS.struct.generator.atomGroups({
            'residue-test': MS.core.rel.eq([MS.ammp('auth_seq_id'), 50])
        }),
        radius: 5,
        'as-whole-residues': false
    }),
    { category: 'Custom' }
);

// Select by element type
const sulfurAtomsQuery = StructureSelectionQuery('Sulfur atoms',
    MS.struct.generator.atomGroups({
        'atom-test': MS.core.rel.eq([MS.acp('elementSymbol'), 'S'])
    }),
    { category: 'Atom Property' }
);
```

### 5. Combining Multiple Conditions

```javascript
// Select hydrophobic residues in helices
const hydrophobicHelixQuery = StructureSelectionQuery('Hydrophobic in Helices',
    MS.struct.modifier.intersectBy({
        0: MS.struct.generator.atomGroups({
            'residue-test': MS.core.set.has([
                MS.set('ALA', 'VAL', 'LEU', 'ILE', 'MET', 'PHE', 'TRP', 'PRO'),
                MS.ammp('auth_comp_id')
            ])
        }),
        by: StructureSelectionQueries.helix.expression
    }),
    { category: 'Custom' }
);

// Select interface residues between chains
const interfaceQuery = StructureSelectionQuery('Chain Interface',
    MS.struct.modifier.wholeResidues([
        MS.struct.modifier.includeSurroundings({
            0: MS.struct.generator.atomGroups({
                'chain-test': MS.core.rel.eq([MS.ammp('auth_asym_id'), 'A'])
            }),
            radius: 4,
            'as-whole-residues': false
        })
    ]),
    { category: 'Custom' }
);
```

### 6. Working with Structure Properties

```javascript
// Select based on B-factor (temperature factor)
const highBFactorQuery = StructureSelectionQuery('High B-factor atoms',
    MS.struct.generator.atomGroups({
        'atom-test': MS.core.rel.gr([MS.acp('B_iso_or_equiv'), 50])
    }),
    { category: 'Atom Property' }
);

// Select based on occupancy
const partialOccupancyQuery = StructureSelectionQuery('Partial occupancy',
    MS.struct.generator.atomGroups({
        'atom-test': MS.core.rel.lt([MS.acp('occupancy'), 1])
    }),
    { category: 'Atom Property' }
);
```

### 7. Dynamic Selection Based on Current Selection

```javascript
// Expand current selection to whole residues
plugin.managers.structure.selection.fromSelectionQuery('set', 
    StructureSelectionQueries.wholeResidues
);

// Select surrounding residues of current selection
plugin.managers.structure.selection.fromSelectionQuery('add', 
    StructureSelectionQueries.surroundings
);

// Get complement of current selection
plugin.managers.structure.selection.fromSelectionQuery('set', 
    StructureSelectionQueries.complement
);
```

## Registering Custom Queries

### 8. Adding Custom Queries to the Registry

```javascript
// Get the selection registry
const registry = plugin.query.structure.registry;

// Create and add a custom query
const myCustomQuery = StructureSelectionQuery('Active Site',
    MS.struct.generator.atomGroups({
        'residue-test': MS.core.set.has([
            MS.set('HIS', 'ASP', 'SER'),
            MS.ammp('auth_comp_id')
        ])
    }),
    { 
        category: 'Custom',
        description: 'Catalytic triad residues'
    }
);

registry.add(myCustomQuery);
```

### 9. Getting Selection Results

```javascript
// Get the current selection
const currentSelection = plugin.managers.structure.selection.get();

// Apply a query and get the result
async function getSelectionResult(structure, query) {
    const ctx = plugin.managers.structure.selection.context;
    const selection = await query.getSelection(plugin, ctx, structure);
    return selection;
}

// Count selected atoms
const selection = await getSelectionResult(structure, StructureSelectionQueries.protein);
const atomCount = StructureSelection.atomCount(selection);
console.log(`Selected ${atomCount} atoms`);
```

## Common Selection Patterns

### 10. Useful Selection Combinations

```javascript
// Select protein-ligand interface
async function selectProteinLigandInterface(plugin) {
    // First select ligands
    plugin.managers.structure.selection.fromSelectionQuery('set', 
        StructureSelectionQueries.ligand
    );
    
    // Then get surrounding protein residues
    plugin.managers.structure.selection.fromSelectionQuery('set', 
        StructureSelectionQueries.surroundings
    );
    
    // Intersect with protein
    plugin.managers.structure.selection.fromSelectionQuery('intersect', 
        StructureSelectionQueries.protein
    );
}

// Select surface residues
async function selectSurfaceResidues(plugin) {
    // This would require SASA calculation
    // Example shows the pattern
    const surfaceQuery = StructureSelectionQuery('Surface Residues',
        MS.struct.generator.atomGroups({
            'residue-test': MS.core.rel.gr([
                MS.ammp('exposedArea'), // Requires SASA property
                20 // Å² threshold
            ])
        }),
        { 
            category: 'Custom',
            ensureCustomProperties: async (ctx, structure) => {
                // Ensure SASA is calculated
                // await SASAProvider.attach(ctx, structure);
            }
        }
    );
}
```

## Notes

1. All selection queries return a `StructureSelection` object
2. Some queries require custom properties (like secondary structure) to be calculated first
3. The `MS` (MolScriptBuilder) provides a type-safe way to build complex queries
4. Selection performance depends on structure size and query complexity
5. Always consider using whole residues for cleaner visual results

## Available MolScript Properties

Common atom properties (`MS.acp`):
- `elementSymbol` - Element symbol (C, N, O, etc.)
- `B_iso_or_equiv` - B-factor/temperature factor
- `occupancy` - Atom occupancy

Common atom mapping properties (`MS.ammp`):
- `auth_comp_id` - Residue name (HIS, ALA, etc.)
- `auth_seq_id` - Residue number
- `auth_asym_id` - Chain identifier
- `label_atom_id` - Atom name (CA, CB, etc.)
- `entityType` - Entity type (polymer, water, etc.)
- `secondaryStructureFlags` - Secondary structure assignment