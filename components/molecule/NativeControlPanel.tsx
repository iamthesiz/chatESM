import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'
import { capitalize } from 'lodash'
import { MoleculeInstance } from '../../useMolstar/types'
import { FaTrash, FaRuler, FaCube, FaPalette, FaLayerGroup, FaStream, FaEllipsisV, FaTimes } from 'react-icons/fa'
import { MdLayers, MdVisibility, MdVisibilityOff } from 'react-icons/md'
import { BiShapePolygon } from 'react-icons/bi'
import { getSelectionCategories, MolstarRepresentationTypes } from '../../useMolstar/molstar-selections'

interface NativeControlPanelProps {
  molecule: MoleculeInstance
  setAppearance?: (config: any) => void
  setStylePreset?: (preset: 'default' | 'illustrative' | 'publication' | 'performance') => void
  setRepresentationPreset?: (preset: 'default' | 'cartoon' | 'spacefill' | 'surface') => void
}

const Container = styled.div`
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
`

const Section = styled.div`
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
`

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2d3748;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  
  svg {
    opacity: 0.6;
  }
  
  &:hover {
    color: #1a202c;
  }
`

const Select = styled.select`
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
  margin-top: 8px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #4299e1;
  }
`

const Label = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #718096;
  margin-bottom: 4px;
`

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: #718096;
  
  span:last-child {
    color: #4a5568;
    font-weight: 500;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  font-size: 13px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f7fafc;
    border-color: #cbd5e0;
  }
  
  &:active {
    background: #edf2f7;
  }
  
  svg {
    font-size: 14px;
  }
`


const Input = styled.input`
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
  margin-top: 8px;
  
  &:focus {
    outline: none;
    border-color: #4299e1;
  }
`

const ComponentRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:hover {
    background: #f8f9fa;
  }
`

const ComponentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
`

const ComponentLabel = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #2d3748;
  min-width: 70px;
`

const RepresentationType = styled.span`
  font-size: 12px;
  color: #718096;
  padding: 3px 8px;
  background: #edf2f7;
  border-radius: 4px;
`

const VisibilityStatus = styled.span<{ isVisible: boolean }>`
  font-size: 12px;
  color: ${props => props.isVisible ? '#48bb78' : '#718096'};
  margin-left: 8px;
`

const ComponentActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const ActionButton = styled.button<{ isActive?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: ${props => props.isActive ? '#4299e1' : '#718096'};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  
  svg {
    width: 16px;
    height: 16px;
  }
  
  &:hover {
    background: #edf2f7;
    color: ${props => props.isActive ? '#3182ce' : '#4a5568'};
  }
  
  &:active {
    background: #e2e8f0;
  }
`


const StructureItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 12px;
`

const StructureInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const StructureName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: #2d3748;
`

const StructureDescription = styled.div`
  font-size: 12px;
  color: #718096;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const PresetButtons = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  
  svg {
    width: 16px;
    height: 16px;
    color: #718096;
  }
  
  &:hover {
    background: #f7fafc;
    border-color: #cbd5e0;
    
    svg {
      color: #4a5568;
    }
  }
`

const Tooltip = styled.div<{ visible: boolean; x: number; y: number }>`
  position: fixed;
  top: ${props => props.y}px;
  left: ${props => props.x}px;
  transform: translateX(-50%);
  padding: 6px 10px;
  background: #2d3748;
  color: white;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.15s;
  z-index: 999999;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 0 4px 4px 4px;
    border-color: transparent transparent #2d3748 transparent;
  }
`

const Modal = styled.div<{ isOpen: boolean }>`
  display: ${props => props.isOpen ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  align-items: center;
  justify-content: center;
  z-index: 10000;
`

const ModalContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`

const ModalHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
`

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
`

const ModalBody = styled.div`
  padding: 20px;
`

const CloseButton = styled.button`
  border: none;
  background: none;
  color: #718096;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #4a5568;
  }
`

const FormSection = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`

const FormLabel = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 8px;
`

const SelectGroup = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #4299e1;
  }
  
  optgroup {
    font-weight: 600;
    color: #4a5568;
  }
  
  option {
    font-weight: normal;
    padding: 4px 0;
  }
`

const FormRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #4a5568;
  cursor: pointer;
  
  input {
    cursor: pointer;
  }
`

const CreateButton = styled.button`
  width: 100%;
  padding: 10px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #3182ce;
  }
  
  &:active {
    background: #2c5282;
  }
`

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #e2e8f0;
    transition: all 0.2s;
    border-radius: 12px;
    
    &:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: all 0.2s;
      border-radius: 50%;
    }
  }
  
  input:checked + span {
    background-color: #4299e1;
  }
  
  input:checked + span:before {
    transform: translateX(14px);
  }
`

const TreeView = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: white;
  padding: 8px;
  margin-top: 8px;
`

const TreeItem = styled.div`
  padding: 4px 8px;
  font-size: 13px;
  color: #4a5568;
  cursor: pointer;
  user-select: none;
  
  &:hover {
    background: #f7fafc;
    border-radius: 4px;
  }
  
  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`

const MeasurementList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const MeasurementItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  
  &:hover {
    background: #f7fafc;
  }
`

const MeasurementInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const MeasurementType = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #2d3748;
`

const MeasurementRequirement = styled.div`
  font-size: 11px;
  color: #718096;
`

const AddButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #4a5568;
  font-size: 18px;
  font-weight: 300;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  
  &:hover {
    background: #4299e1;
    color: white;
    border-color: #4299e1;
  }
`

// IconButton with tooltip component
function IconButtonWithTooltip({ 
  id,
  title, 
  onClick, 
  children 
}: { 
  id: string,
  title: string, 
  onClick: () => void, 
  children: React.ReactNode 
}) {
  const { activeTooltip, setActiveTooltip } = React.useContext(TooltipContext)
  const [isHovered, setIsHovered] = useState(false)
  const [tooltipText, setTooltipText] = useState(title)
  const [showCopied, setShowCopied] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Check if this button's tooltip should be visible
  const isActive = activeTooltip === id
  const shouldShowTooltip = isActive && (isHovered || showCopied)
  
  const updateTooltipPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8
      })
    }
  }
  
  const handleClick = () => {
    onClick()
    setTooltipText('Copied')
    setShowCopied(true)
    setActiveTooltip(id)
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Reset after 2 seconds
    timeoutRef.current = setTimeout(() => {
      setTooltipText(title)
      setShowCopied(false)
      // Only clear active tooltip if it's still this one
      setActiveTooltip((current: string | null) => current === id ? null : current)
    }, 2000)
  }
  
  const handleMouseEnter = () => {
    setIsHovered(true)
    setActiveTooltip(id)
    updateTooltipPosition()
  }
  
  const handleMouseLeave = () => {
    setIsHovered(false)
    // Only clear active tooltip if not showing "Copied"
    if (!showCopied) {
      setActiveTooltip((current: string | null) => current === id ? null : current)
    }
  }
  
  // Clear this tooltip if another one becomes active
  useEffect(() => {
    if (activeTooltip !== id && activeTooltip !== null) {
      setIsHovered(false)
      if (showCopied) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        setTooltipText(title)
        setShowCopied(false)
      }
    }
  }, [activeTooltip, id, showCopied, title])
  
  // Update position on scroll/resize
  useEffect(() => {
    if (shouldShowTooltip) {
      const handleUpdate = () => updateTooltipPosition()
      window.addEventListener('scroll', handleUpdate, true)
      window.addEventListener('resize', handleUpdate)
      
      return () => {
        window.removeEventListener('scroll', handleUpdate, true)
        window.removeEventListener('resize', handleUpdate)
      }
    }
  }, [shouldShowTooltip])
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return (
    <>
      <IconButton 
        ref={buttonRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {children}
      </IconButton>
      {shouldShowTooltip && createPortal(
        <Tooltip 
          visible={true}
          x={tooltipPosition.x}
          y={tooltipPosition.y}
        >
          {tooltipText}
        </Tooltip>,
        document.body
      )}
    </>
  )
}

// Create a context to manage tooltip state across all buttons
const TooltipContext = React.createContext<{
  activeTooltip: string | null
  setActiveTooltip: React.Dispatch<React.SetStateAction<string | null>>
}>({
  activeTooltip: null,
  setActiveTooltip: () => {}
})

export function NativeControlPanel({ molecule }: NativeControlPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    structure: true,
    measurements: false,
    quickStyles: false,
    components: false,
    volumeStreaming: false
  })
  
  const [selectedStyle, setSelectedStyle] = useState('default')
  const [selectedStylePreset, setSelectedStylePreset] = useState('default')
  
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [structureType, setStructureType] = useState('model')
  const [dynamicBonds, setDynamicBonds] = useState(false)
  const [showAddComponentModal, setShowAddComponentModal] = useState(false)
  
  // Add component form state
  const [componentSelection, setComponentSelection] = useState('current-selection')
  const [componentRepresentation, setComponentRepresentation] = useState('create-later')
  const [componentLabel, setComponentLabel] = useState('')
  const [checkExisting, setCheckExisting] = useState(false)
  
  // Get components directly from molecule instance
  const components = molecule.components || []
  
  // Force re-render when components change
  const [componentUpdateKey, setComponentUpdateKey] = useState(0)
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }
  
  return (
    <TooltipContext.Provider value={{ activeTooltip, setActiveTooltip }}>
      <Container>
        {/* Structure */}
        <Section>
          <SectionTitle onClick={() => toggleSection('structure')}>
            <FaCube />
            Structure
            <span style={{ marginLeft: 'auto' }}>{expandedSections.structure ? '−' : '+'}</span>
          </SectionTitle>
          {expandedSections.structure && (
            <>
              <StructureItem>
                <StructureInfo>
                  <StructureName>1TQN</StructureName>
                  <StructureDescription>Crystal Structure of Human...</StructureDescription>
                </StructureInfo>
                <PresetButtons>
                  <IconButtonWithTooltip 
                    id="preset-default"
                    title="Default (Assembly)" 
                    onClick={() => {
                      // Copy to clipboard
                      navigator.clipboard.writeText('Default (Assembly)')
                      console.log('Default')
                    }}
                  >
                    <FaCube />
                  </IconButtonWithTooltip>
                  <IconButtonWithTooltip 
                    id="preset-unit-cell"
                    title="Unit Cell" 
                    onClick={() => {
                      // Copy to clipboard
                      navigator.clipboard.writeText('Unit Cell')
                      console.log('Unit Cell')
                    }}
                  >
                    <BiShapePolygon />
                  </IconButtonWithTooltip>
                  <IconButtonWithTooltip 
                    id="preset-super-cell"
                    title="Super Cell" 
                    onClick={() => {
                      // Copy to clipboard
                      navigator.clipboard.writeText('Super Cell')
                      console.log('Super Cell')
                    }}
                  >
                    <FaLayerGroup />
                  </IconButtonWithTooltip>
                  <IconButtonWithTooltip 
                    id="preset-crystal-contacts"
                    title="Crystal Contacts" 
                    onClick={() => {
                      // Copy to clipboard
                      navigator.clipboard.writeText('Crystal Contacts')
                      console.log('Crystal Contacts')
                    }}
                  >
                    <MdLayers />
                  </IconButtonWithTooltip>
                </PresetButtons>
              </StructureItem>
            
            <Label>Type</Label>
            <Select 
              value={structureType} 
              onChange={(e) => {
                setStructureType(e.target.value)
                console.log('Type:', e.target.value)
              }}
            >
              <option value="model">Model</option>
              <option value="assembly">Assembly</option>
              <option value="symmetry-mates">Symmetry Mates</option>
              <option value="symmetry-indices">Symmetry (Indices)</option>
              <option value="symmetry-assembly">Symmetry (Assembly)</option>
            </Select>
            
            <SliderLabel style={{ marginTop: '12px' }}>
              <span>Dynamic Bonds</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={dynamicBonds}
                  onChange={(e) => {
                    setDynamicBonds(e.target.checked)
                    console.log('Dynamic bonds:', e.target.checked)
                  }}
                />
                <span></span>
              </ToggleSwitch>
            </SliderLabel>
            
            <Label style={{ marginTop: '12px' }}>Focus</Label>
            <TreeView>
              <TreeItem>
                <span>▶ Protein</span>
              </TreeItem>
              <TreeItem>
                <span>▶ Ligand</span>
              </TreeItem>
              <TreeItem>
                <span>▶ Water</span>
              </TreeItem>
            </TreeView>
          </>
        )}
      </Section>
      
      {/* Measurements */}
      <Section>
        <SectionTitle onClick={() => toggleSection('measurements')}>
          <FaRuler />
          Measurements
          <span style={{ marginLeft: 'auto' }}>{expandedSections.measurements ? '−' : '+'}</span>
        </SectionTitle>
        {expandedSections.measurements && (
          <>
            <MeasurementList>
              <MeasurementItem>
                <MeasurementInfo>
                  <MeasurementType>Label</MeasurementType>
                  <MeasurementRequirement>(1 selection item required)</MeasurementRequirement>
                </MeasurementInfo>
                <AddButton onClick={() => console.log('Add label measurement')}>
                  +
                </AddButton>
              </MeasurementItem>
              
              <MeasurementItem>
                <MeasurementInfo>
                  <MeasurementType>Distance</MeasurementType>
                  <MeasurementRequirement>(2 selection items required)</MeasurementRequirement>
                </MeasurementInfo>
                <AddButton onClick={() => console.log('Add distance measurement')}>
                  +
                </AddButton>
              </MeasurementItem>
              
              <MeasurementItem>
                <MeasurementInfo>
                  <MeasurementType>Angle</MeasurementType>
                  <MeasurementRequirement>(3 selection items required)</MeasurementRequirement>
                </MeasurementInfo>
                <AddButton onClick={() => console.log('Add angle measurement')}>
                  +
                </AddButton>
              </MeasurementItem>
              
              <MeasurementItem>
                <MeasurementInfo>
                  <MeasurementType>Dihedral</MeasurementType>
                  <MeasurementRequirement>(4 selection items required)</MeasurementRequirement>
                </MeasurementInfo>
                <AddButton onClick={() => console.log('Add dihedral measurement')}>
                  +
                </AddButton>
              </MeasurementItem>
              
              <MeasurementItem>
                <MeasurementInfo>
                  <MeasurementType>Orientation</MeasurementType>
                  <MeasurementRequirement>(selection required)</MeasurementRequirement>
                </MeasurementInfo>
                <AddButton onClick={() => console.log('Add orientation measurement')}>
                  +
                </AddButton>
              </MeasurementItem>
              
              <MeasurementItem>
                <MeasurementInfo>
                  <MeasurementType>Plane</MeasurementType>
                  <MeasurementRequirement>(selection required)</MeasurementRequirement>
                </MeasurementInfo>
                <AddButton onClick={() => console.log('Add plane measurement')}>
                  +
                </AddButton>
              </MeasurementItem>
            </MeasurementList>
          </>
        )}
      </Section>
      
      {/* Quick Styles */}
      <Section>
        <SectionTitle onClick={() => toggleSection('quickStyles')}>
          <FaPalette />
          Quick Styles
          <span style={{ marginLeft: 'auto' }}>{expandedSections.quickStyles ? '−' : '+'}</span>
        </SectionTitle>
        {expandedSections.quickStyles && (
          <>
            <Label>Representation Presets</Label>
            <ButtonGroup>
              <Button 
                onClick={async () => {
                  setSelectedStyle('default')
                  await molecule.setRepresentationPreset('default')
                }}
                style={{ 
                  background: selectedStyle === 'default' ? '#e6fffa' : 'white',
                  borderColor: selectedStyle === 'default' ? '#48bb78' : '#e2e8f0'
                }}
              >
                Default
              </Button>
              <Button 
                onClick={async () => {
                  setSelectedStyle('cartoon')
                  await molecule.setRepresentationPreset('cartoon')
                }}
                style={{ 
                  background: selectedStyle === 'cartoon' ? '#e6fffa' : 'white',
                  borderColor: selectedStyle === 'cartoon' ? '#48bb78' : '#e2e8f0'
                }}
              >
                Cartoon
              </Button>
              <Button 
                onClick={async () => {
                  setSelectedStyle('spacefill')
                  await molecule.setRepresentationPreset('spacefill')
                }}
                style={{ 
                  background: selectedStyle === 'spacefill' ? '#e6fffa' : 'white',
                  borderColor: selectedStyle === 'spacefill' ? '#48bb78' : '#e2e8f0'
                }}
              >
                Spacefill
              </Button>
              <Button 
                onClick={async () => {
                  setSelectedStyle('surface')
                  await molecule.setRepresentationPreset('surface')
                }}
                style={{ 
                  background: selectedStyle === 'surface' ? '#e6fffa' : 'white',
                  borderColor: selectedStyle === 'surface' ? '#48bb78' : '#e2e8f0'
                }}
              >
                Surface
              </Button>
            </ButtonGroup>
            
            <Label style={{ marginTop: '12px' }}>Style Presets</Label>
            <ButtonGroup>
              <Button 
                onClick={async () => {
                  setSelectedStylePreset('default')
                  await molecule.setStylePreset('default')
                }}
                style={{ 
                  background: selectedStylePreset === 'default' ? '#e6fffa' : 'white',
                  borderColor: selectedStylePreset === 'default' ? '#48bb78' : '#e2e8f0'
                }}
              >
                Default
              </Button>
              <Button 
                onClick={async () => {
                  setSelectedStylePreset('illustrative')
                  await molecule.setStylePreset('illustrative')
                }}
                style={{ 
                  background: selectedStylePreset === 'illustrative' ? '#e6fffa' : 'white',
                  borderColor: selectedStylePreset === 'illustrative' ? '#48bb78' : '#e2e8f0'
                }}
              >
                Illustrative
              </Button>
              <Button 
                onClick={async () => {
                  setSelectedStylePreset('publication')
                  await molecule.setStylePreset('publication')
                }}
                style={{ 
                  background: selectedStylePreset === 'publication' ? '#e6fffa' : 'white',
                  borderColor: selectedStylePreset === 'publication' ? '#48bb78' : '#e2e8f0'
                }}
              >
                Publication
              </Button>
              <Button 
                onClick={async () => {
                  setSelectedStylePreset('performance')
                  await molecule.setStylePreset('performance')
                }}
                style={{ 
                  background: selectedStylePreset === 'performance' ? '#e6fffa' : 'white',
                  borderColor: selectedStylePreset === 'performance' ? '#48bb78' : '#e2e8f0'
                }}
              >
                Performance
              </Button>
            </ButtonGroup>
          </>
        )}
      </Section>
      
      {/* Components */}
      <Section>
        <SectionTitle onClick={() => toggleSection('components')}>
          <MdLayers />
          Components
          <span style={{ marginLeft: 'auto' }}>{expandedSections.components ? '−' : '+'}</span>
        </SectionTitle>
        {expandedSections.components && (
          <>
            <div style={{ marginBottom: '12px' }}>
              <Label>Preset</Label>
              <Select 
                defaultValue="auto"
                onChange={async (e) => {
                  const preset = e.target.value
                  await molecule.applyComponentPreset(preset)
                }}
              >
                <option value="empty">Empty</option>
                <option value="auto">Automatic</option>
                <option value="atomic-detail">Atomic Detail</option>
                <option value="polymer-cartoon">Polymer Cartoon</option>
                <option value="polymer-and-ligand">Polymer & Ligand</option>
                <option value="protein-and-nucleic">Protein & Nucleic</option>
                <option value="coarse-surface">Coarse Surface</option>
                <option value="illustrative">Illustrative</option>
                <option value="molecular-surface">Molecular Surface</option>
                <option value="automatic-detail">Automatic Detail</option>
              </Select>
            </div>
            {components.map((component) => (
              <ComponentRow key={`${component.ref}-${componentUpdateKey}`}>
                <ComponentInfo>
                  <ComponentLabel>{capitalize(component.label)}</ComponentLabel>
                  <RepresentationType>{component.representation}</RepresentationType>
                  <VisibilityStatus isVisible={component.isVisible}>
                    {component.isVisible ? 'visible' : 'hidden'}
                  </VisibilityStatus>
                </ComponentInfo>
                <ComponentActions>
                  <ActionButton 
                    isActive={component.isVisible}
                    onClick={() => molecule.toggleComponent(component.ref)}
                    title={component.isVisible ? 'Hide' : 'Show'}
                  >
                    {component.isVisible ? <MdVisibility /> : <MdVisibilityOff />}
                  </ActionButton>
                  <ActionButton 
                    onClick={() => molecule.removeComponent(component.ref)}
                    title="Remove"
                  >
                    <FaTrash />
                  </ActionButton>
                  <ActionButton 
                    onClick={() => console.log('Settings for', component.type)}
                    title="Settings"
                  >
                    <FaEllipsisV />
                  </ActionButton>
                </ComponentActions>
              </ComponentRow>
            ))}
            
            <Button 
              style={{ marginTop: '12px', width: '100%' }}
              onClick={() => setShowAddComponentModal(true)}
            >
              <FaLayerGroup />
              Add Component
            </Button>
          </>
        )}
      </Section>
      
      {/* Volume Streaming */}
      <Section>
        <SectionTitle onClick={() => toggleSection('volumeStreaming')}>
          <FaStream />
          Volume Streaming
          <span style={{ marginLeft: 'auto' }}>{expandedSections.volumeStreaming ? '−' : '+'}</span>
        </SectionTitle>
        {expandedSections.volumeStreaming && (
          <>
            <Label>Server</Label>
            <Select>
              <option value="emdb">EMDB (wwPDB)</option>
              <option value="custom">Custom Server</option>
            </Select>
            
            <Label style={{ marginTop: '12px' }}>Entry ID</Label>
            <Input
              type="text"
              placeholder="e.g., EMD-1234"
            />
            
            <Button style={{ marginTop: '12px', width: '100%' }}>
              <FaStream />
              Stream Volume
            </Button>
          </>
        )}
      </Section>
      {/* Add Component Modal */}
      {showAddComponentModal && createPortal(
        <Modal isOpen={showAddComponentModal} onClick={() => setShowAddComponentModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Add Component</ModalTitle>
              <CloseButton onClick={() => setShowAddComponentModal(false)}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <FormSection>
                <FormLabel>Selection</FormLabel>
                <SelectGroup 
                  value={componentSelection}
                  onChange={(e) => setComponentSelection(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="current-selection">Current Selection</option>
                  {(() => {
                    const categories = getSelectionCategories()
                    return Object.entries(categories).map(([categoryName, options]) => (
                      <optgroup key={categoryName} label={categoryName}>
                        {Object.entries(options).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </optgroup>
                    ))
                  })()}
                </SelectGroup>
              </FormSection>

              <FormSection>
                <FormLabel>Representation</FormLabel>
                <Select 
                  value={componentRepresentation}
                  onChange={(e) => setComponentRepresentation(e.target.value)}
                >
                  <option value="create-later">&lt; Create Later &gt;</option>
                  {Object.entries(MolstarRepresentationTypes).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </FormSection>

              <FormSection>
                <FormLabel>Label</FormLabel>
                <Input 
                  type="text"
                  placeholder="Component label"
                  value={componentLabel}
                  onChange={(e) => setComponentLabel(e.target.value)}
                />
              </FormSection>

              <FormSection>
                <FormRow>
                  <CheckboxLabel>
                    <input 
                      type="checkbox"
                      checked={checkExisting}
                      onChange={(e) => setCheckExisting(e.target.checked)}
                    />
                    Check Existing
                  </CheckboxLabel>
                </FormRow>
              </FormSection>

              <FormSection>
                <CreateButton onClick={async () => {
                  console.log('Creating component:', {
                    selection: componentSelection,
                    representation: componentRepresentation,
                    label: componentLabel,
                    checkExisting
                  })
                  
                  // Create the component using the molecule instance
                  await molecule.createComponent(
                    componentSelection,
                    componentRepresentation,
                    componentLabel || undefined,
                    checkExisting
                  )
                  
                  // Wait a bit for Molstar to update
                  await new Promise(resolve => setTimeout(resolve, 500))
                  
                  // Log the components after creation
                  console.log('Components after creation:', molecule.components)
                  
                  // Force a re-render by updating a state variable
                  setComponentUpdateKey(prev => prev + 1)
                  setShowAddComponentModal(false)
                  
                  // Reset form
                  setComponentSelection('current-selection')
                  setComponentRepresentation('create-later')
                  setComponentLabel('')
                  setCheckExisting(false)
                }}>
                  Create Component
                </CreateButton>
              </FormSection>
            </ModalBody>
          </ModalContent>
        </Modal>,
        document.body
      )}
    </Container>
    </TooltipContext.Provider>
  )
}