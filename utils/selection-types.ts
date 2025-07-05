// Selection-related types

export interface SelectionQuery {
  type: 'chain' | 'residue' | 'atom' | 'element' | 'expression'
  chainId?: string
  chainIds?: string[]
  residueIds?: number[]
  atomNames?: string[]
  element?: string
  expression?: string
}

export interface SelectedAtom {
  id: string
  name: string         // 'CA', 'CB', etc
  element: string      // 'C', 'N', 'O', etc
  chainId: string
  residueId: number
  residueName: string  // 'ALA', 'GLY', etc
  coords: { x: number; y: number; z: number }
}

export interface SelectedResidue {
  chainId: string
  residueId: number
  residueName: string  // 'ALA', 'GLY', etc
  atomCount: number
  sequence?: string    // single letter code 'A', 'G', etc
}

export interface SelectedChain {
  chainId: string
  residueCount: number
  atomCount: number
  type: 'protein' | 'nucleic' | 'unknown'
  sequence?: string    // full sequence if available
}

export interface SelectionBounds {
  min: { x: number; y: number; z: number }
  max: { x: number; y: number; z: number }
}

export interface Selection {
  enabled: boolean
  loading: boolean
  atoms: SelectedAtom[]
  chains: SelectedChain[]
  residues: SelectedResidue[]
  isEmpty: boolean
  summary: string
  bounds: SelectionBounds | null
  center: { x: number; y: number; z: number } | null
  sequence: string  // concatenated sequence for protein selections
}

export interface SelectionChangeEvent {
  atoms: SelectedAtom[]
  residues: SelectedResidue[]
  chains: SelectedChain[]
  isEmpty: boolean
  bounds: SelectionBounds | null
  center: { x: number; y: number; z: number } | null
  sequence: string
}

export interface ModeChangeEvent {
  enabled: boolean
}

export interface HoverEvent {
  atom: SelectedAtom | null
  residue: SelectedResidue | null
  chain: SelectedChain | null
}

export type SelectionEventMap = {
  'selection-change': SelectionChangeEvent
  'mode-change': ModeChangeEvent
  'hover': HoverEvent
}

export interface SelectionManager {
  // Mode controls
  enable: () => void
  disable: () => void
  toggle: () => void
  
  // Selection operations
  select: (query: SelectionQuery) => void
  add: (query: SelectionQuery) => void
  remove: (query: SelectionQuery) => void
  clear: () => void
  
  // Convenience methods
  selectChain: (chainId: string) => void
  selectChains: (chainIds: string[]) => void
  selectResidue: (chainId: string, residueId: number) => void
  selectResidues: (chainId: string, residueIds: number[]) => void
  
  // Presets
  selectAll: () => void
  selectProtein: () => void
  selectLigand: () => void
  selectWater: () => void
  selectNucleic: () => void
  
  // View operations
  focus: () => void
  isolate: () => void
  highlight: (query: SelectionQuery) => void
  clearHighlight: () => void
  
  // Events
  on: <K extends keyof SelectionEventMap>(event: K, callback: (data: SelectionEventMap[K]) => void) => () => void
}