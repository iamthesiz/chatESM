// Core types for useMolstar hook

export interface LoadConfig {
  // Source (one of these required)
  pdbId?: string
  url?: string  
  file?: File
  
  // Format
  format?: 'pdb' | 'cif' | 'mmcif' | 'sdf' | 'mol' | 'mol2'
  
  // Display options
  animate?: 'spin' | 'rock' | 'none'
  camera?: 'perspective' | 'orthographic'
  preset?: 'default' | 'auto' | 'illustrative' | 'publication' | 'performance' | 'cartoon' | 'polymer' | 'ball-and-stick'
  autoZoom?: boolean
  showAxes?: boolean
  
  // Performance 
  quality?: 'low' | 'medium' | 'high'
  asyncLoad?: boolean
  
  // Initial styling
  background?: string | 'white' | 'black' | 'transparent'
  lighting?: 'bright' | 'soft' | 'dramatic' | 'off'
  protein?: AppearanceSettings
  ligand?: AppearanceSettings
  nucleic?: AppearanceSettings
  water?: AppearanceSettings & { visible?: boolean }
  ion?: AppearanceSettings
}

export interface ScreenshotOptions {
  copy?: boolean           // Copy to clipboard
  download?: boolean       // Auto-download file
  filename?: string        // Custom filename
  resolution?: number      // Multiplier (1x, 2x, 4x)
  format?: 'png' | 'jpeg'  // File format
  quality?: number         // JPEG quality 0-100
  transparent?: boolean    // Transparent background
  axes?: boolean          // Show coordinate axes
  autocrop?: boolean      // Trim whitespace
}

export interface MoleculeInstance {
  // State
  isInitialized: boolean
  selections: string[]  // Array of current selection queries
  selectionMode?: 'atom' | 'residue' | 'chain' | 'entity' | 'model' | 'operator' | 'structure' | 'atom-instance' | 'residue-instance' | 'chain-instance'
  
  // Component visibility state
  componentVisibility?: {
    protein: boolean
    ligand: boolean
    nucleic: boolean
    water: boolean
    ion: boolean
  }
  
  // Available components in the loaded structure
  availableComponents?: string[]
  
  // Active components with their details
  components?: Array<{
    type: string
    label: string
    representation: string
    isVisible: boolean
    ref: string
  }>
  
  // Current appearance state
  background?: string | 'white' | 'black' | 'transparent'
  lighting?: 'bright' | 'soft' | 'dramatic' | 'off'
  protein?: AppearanceSettings
  ligand?: AppearanceSettings
  nucleic?: AppearanceSettings
  water?: AppearanceSettings
  ion?: AppearanceSettings
  quality?: QualitySettings
  
  // Loading
  load: (config: LoadConfig) => Promise<void>
  
  // Actions
  screenshot: (options?: ScreenshotOptions) => Promise<string | void>
  fullscreen: () => void  // Toggle fullscreen
  
  // Camera controls
  resetZoom: () => void
  resetCamera: () => void
  orientAxes: () => void
  resetAxes: () => void
  center: () => void
  focus: (selection: string) => void
  
  // Native Molstar features
  plugin?: any  // Direct access to Molstar plugin instance
  
  // State management
  saveState: (name: string) => Promise<void>
  loadState: (name: string) => Promise<void>
  clearState: () => void
  states: string[]  // List of saved state names
  
  // Measurements
  measureDistance: (atom1: string, atom2: string) => void
  measureAngle: (atom1: string, atom2: string, atom3: string) => void
  measureDihedral: (atom1: string, atom2: string, atom3: string, atom4: string) => void
  clearMeasurements: () => void
  
  // Structure tools
  toggleComponent: (type: 'protein' | 'ligand' | 'nucleic' | 'water' | 'ion') => void
  hideComponent: (type: 'protein' | 'ligand' | 'nucleic' | 'water' | 'ion') => void
  showComponent: (type: 'protein' | 'ligand' | 'nucleic' | 'water' | 'ion') => void
  removeComponent: (type: 'protein' | 'ligand' | 'nucleic' | 'water' | 'ion') => void
  
  // Hierarchy
  getHierarchy: () => any  // Returns structure hierarchy
  toggleChain: (chainId: string) => void
  
  // Presets
  applyComponentPreset: (preset: string) => Promise<void>
  
  // Advanced selection
  selectByExpression: (expression: string) => void
  createSelectionSet: (name: string, selection: string) => void
  applySelectionSet: (name: string) => void
  deleteSelectionSet: (name: string) => void
  selectionSets: Map<string, string>
  
  // Component creation
  createComponent: (selection: string, representation: string, label?: string, checkExisting?: boolean) => Promise<void>
  
  // Style presets
  setStylePreset: (preset: 'default' | 'illustrative' | 'publication' | 'performance') => Promise<void>
  setRepresentationPreset: (preset: 'default' | 'cartoon' | 'spacefill' | 'surface') => Promise<void>
}

// Appearance types
export type StyleType = 'cartoon' | 'ball-stick' | 'surface' | 'line' | 'spacefill' | 'ribbon'
export type ColorType = 'by-chain' | 'by-element' | 'by-secondary-structure' | 'uniform' | string

export interface AppearanceSettings {
  style?: StyleType
  color?: ColorType
  transparency?: number
}

// Structure config
export interface StructureConfig {
  // Show/hide molecular types
  protein?: boolean
  ligand?: boolean
  nucleic?: boolean
  water?: boolean
  ion?: boolean
  
  // Show/hide specific chains
  chains?: Record<string, boolean>         // { A: true, B: false }
  
  // Show/hide by residue ranges
  residues?: Record<string, boolean>       // { 'A:1-100': true, 'B:50-150': false }
  
  // Show only around selection
  around?: {
    selection: string
    distance: number
    hideRest?: boolean
  }
  
  // Surface representations
  surface?: {
    protein?: boolean
    cavity?: boolean
    electrostatic?: boolean
  }
  
  // Property-based filtering
  byProperty?: {
    bfactor?: { min: number, max: number }
    occupancy?: { min: number, max: number }
  }
}

// Camera config
export interface CameraConfig {
  position?: [number, number, number]
  target?: [number, number, number]
  zoom?: number
  view?: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'
  projection?: 'perspective' | 'orthographic'
  fov?: number                             // Field of view for perspective
  clipping?: ClippingSettings
  animation?: 'off' | 'spin' | 'rock'
  axes?: {
    opacity?: number
    scale?: number
    colors?: {
      x?: string
      y?: string
      z?: string
    }
  }
  stereo?: {
    enabled: boolean
    eyeSeparation?: number
    focus?: number
  }
}

// Quality settings
export interface QualitySettings {
  level?: 'high' | 'medium' | 'low'        // Overall quality preset
  antialiasing?: boolean                    // MSAA on/off
  shadows?: { 
    enabled: boolean
    quality: 'low' | 'medium' | 'high'
    steps?: number
  }
  occlusion?: boolean | OcclusionSettings   // Occlusion settings
  postprocessing?: {
    blur?: boolean | DofSettings
    sharpening?: boolean
    outline?: { enabled: boolean, scale: number }
  }
  performance?: {
    maxFps?: number
    adaptiveQuality?: boolean               // Lower quality when interacting
    levelOfDetail?: boolean                 // Simplify distant objects
  }
  multisampling?: {
    mode?: 'off' | 'on' | 'temporal'
    sampleLevel?: number
    reduceFlicker?: boolean
  }
}

// Selection config
export interface SelectionConfig {
  // Selection operations (applied in sequence)
  set?: string                             // Replace current selection
  add?: string                             // Add to current selection  
  remove?: string                          // Remove from current selection
  intersect?: string                       // Keep only intersection
  clear?: boolean                          // Clear all selections
  
  // Visual styling for selected elements
  highlight?: {
    color?: string
    style?: 'outline' | 'glow' | 'brighten'
    intensity?: number                     // 0-1
    thickness?: number                     // For outline style
  }
  
  // Selection behavior
  mode?: 'atom' | 'residue' | 'chain' | 'entity' | 'model' | 'operator' | 'structure' | 'atom-instance' | 'residue-instance' | 'chain-instance'     // What granularity to select
  preferAtoms?: boolean                    // Prefer atoms over bonds when clicking
  
  // Focus behavior  
  autoFocus?: boolean                      // Auto-focus camera on selection
  showLabels?: boolean                     // Show residue labels for selection
}

// Appearance config
export interface AppearanceConfig {
  // Global canvas settings
  background?: string
  lighting?: 'bright' | 'soft' | 'dramatic' | 'off'
  shadows?: boolean | { enabled: boolean, quality: 'low' | 'medium' | 'high' }
  fog?: boolean | { enabled: boolean, intensity: number }
  
  // Postprocessing effects
  postprocessing?: {
    lighten?: number      // 0-1
    darken?: number       // 0-1
    outline?: { on: boolean, params?: any }
    occlusion?: { on: boolean, params?: any }
    shadow?: { on: boolean, params?: any }
  }
  
  // Molecular styling
  protein?: AppearanceSettings
  ligand?: AppearanceSettings
  nucleic?: AppearanceSettings
  water?: AppearanceSettings
  ion?: AppearanceSettings
  
  // Custom selection styling
  selection?: string | {
    query: string
    style?: StyleType
    color?: ColorType
    transparency?: number
  }
}

// Complete molecule state
export interface MoleculeState {
  // Global appearance
  background?: string | 'white' | 'black' | 'transparent'
  lighting?: 'bright' | 'soft' | 'dramatic' | 'off'
  shadows?: boolean | { enabled: boolean, quality: 'low' | 'medium' | 'high' }
  fog?: boolean | { enabled: boolean, intensity: number }
  
  // Postprocessing effects
  postprocessing?: {
    lighten?: number      // 0-1
    darken?: number       // 0-1
    outline?: { on: boolean, params?: any }
    occlusion?: { on: boolean, params?: any }
    shadow?: { on: boolean, params?: any }
  }
  
  // Molecular styling (built-in categories)
  protein?: AppearanceSettings
  ligand?: AppearanceSettings  
  nucleic?: AppearanceSettings
  water?: AppearanceSettings
  ion?: AppearanceSettings
  
  // Custom selection styling
  selection?: string | {
    query: string
    style?: StyleType
    color?: ColorType
    transparency?: number
  }
  
  // Structure visibility
  structure?: StructureConfig
  
  // Camera
  camera?: CameraConfig
  
  // Quality/Performance
  quality?: QualitySettings
  
  // Selection state and styling
  selected?: string[]
  selectionStyle?: {
    color?: string
    style?: 'outline' | 'glow' | 'brighten'
    intensity?: number
    thickness?: number
  }
  selectionMode?: 'atom' | 'residue' | 'chain' | 'entity' | 'model' | 'operator' | 'structure' | 'atom-instance' | 'residue-instance' | 'chain-instance'
}

// Setter functions
export type SetMolecule = (state: MoleculeState) => void
export type SetAppearance = (config: AppearanceConfig) => void
export type SetCamera = (config: CameraConfig) => void
export type SetQuality = (config: QualitySettings) => void
export type SetSelection = (config: SelectionConfig) => void
export type SetStructure = (config: StructureConfig) => void

// Hook return type
export interface UseMolstarReturn {
  molecule: MoleculeInstance
  setters: {
    setMolecule: SetMolecule
    setAppearance: SetAppearance
    setCamera: SetCamera
    setQuality: SetQuality
    setSelection: SetSelection
    setStructure: SetStructure
  }
}

// Occlusion settings
export interface OcclusionSettings {
  enabled: boolean
  samples?: number
  multiScale?: {
    enabled: boolean
    levels?: Array<{ radius: number; blur: number }>
    nearThreshold?: number
    farThreshold?: number
  }
  radius?: number
  bias?: number
  blurKernelSize?: number
  blurDepthBias?: number
  resolutionScale?: number
  color?: string
  transparentThreshold?: number
}

// DOF (Depth of Field) settings
export interface DofSettings {
  enabled: boolean
  blurSize?: number         // 1-32, default 9
  blurSpread?: number       // 0-10, default 1.0
  inFocus?: number          // -5000 to 5000, default 0
  ppm?: number              // 0-5000, default 20 (size of area in focus)
  center?: 'camera-target' | 'scene-center'  // default 'camera-target'
  mode?: 'plane' | 'sphere' // default 'plane'
}

// Clipping settings
export interface ClippingSettings {
  radius: number            // 0-99, percentage of scene to show (100 - radius = clipping amount)
  far: boolean             // Enable far plane clipping
  minNear: number          // 0.1-100, minimum near clipping distance
}