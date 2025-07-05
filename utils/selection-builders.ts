// Selection builder utilities

export const createSelectionMatchers = (query: any) => {
  const h = (loc: any) => loc.unit.model.atomicHierarchy
  
  return {
    chain: (loc: any) => {
      const chainId = h(loc).chains.label_asym_id.value(loc.element)
      return query.chainId ? chainId === query.chainId : query.chainIds?.includes(chainId)
    },
    
    residue: (loc: any) => {
      const chainId = h(loc).chains.label_asym_id.value(h(loc).residues.chainIndex[loc.element])
      const residueId = h(loc).residues.label_seq_id.value(loc.element)
      return chainId === query.chainId && new Set(query.residueIds || []).has(residueId)
    },
    
    atom: (loc: any) => 
      new Set(query.atomNames || []).has(h(loc).atoms.label_atom_id.value(loc.element)),
    
    element: (loc: any) => {
      const typeIdx = h(loc).atoms.type_symbol.value(loc.element)
      return loc.unit.model.atomicData.atoms.type_symbol.value(typeIdx) === query.element
    }
  }
}