import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import styled from '@emotion/styled'
import { capitalize } from 'lodash'
import { useToggles } from 'toggles'
import { MoleculeInstance } from '../../hooks/types'
import * as FaIcons from 'react-icons/fa'
import * as MdIcons from 'react-icons/md'
import * as BiIcons from 'react-icons/bi'

const FaTrash = FaIcons.FaTrash as any
const FaCube = FaIcons.FaCube as any
const FaPalette = FaIcons.FaPalette as any
const FaLayerGroup = FaIcons.FaLayerGroup as any
const FaEllipsisV = FaIcons.FaEllipsisV as any
const FaTimes = FaIcons.FaTimes as any
const FaDna = FaIcons.FaDna as any
const MdLayers = MdIcons.MdLayers as any
const MdVisibility = MdIcons.MdVisibility as any
const MdVisibilityOff = MdIcons.MdVisibilityOff as any
const BiShapePolygon = BiIcons.BiShapePolygon as any
import { getSelectionCategories, MolstarRepresentationTypes } from '../../utils/molstar-selections'
import { IconButtonWithTooltip, TooltipContext } from './IconButtonWithTooltip'
interface NativeControlPanelProps {
  molecule: MoleculeInstance
  setAppearance?: (config: any) => void
  setStylePreset?: (preset: 'default' | 'illustrative' | 'publication' | 'performance') => void
  setRepresentationPreset?: (preset: 'default' | 'cartoon' | 'spacefill' | 'surface') => void
}

export function NativeControlPanel({ molecule }: NativeControlPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    structure: true,
    quickStyles: true,
    components: true,
    sequenceViewer: true
  })

  const [selectedStyle, setSelectedStyle] = useState('default')
  const [selectedStylePreset, setSelectedStylePreset] = useState('default')

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [structureType, setStructureType] = useState('model')
  const [{ dynamicBonds, addComponentModal, checkExisting }, { toggle }] = useToggles(false)

  const [componentSelection, setComponentSelection] = useState('current-selection')
  const [componentRepresentation, setComponentRepresentation] = useState('create-later')
  const [componentLabel, setComponentLabel] = useState('')

  const [selectedResidues, setSelectedResidues] = useState<number[]>([])
  const [highlightedResidues, setHighlightedResidues] = useState<number[]>([])

  const mockSequence = React.useMemo(() => {
    const residues = 'ACDEFGHIKLMNPQRSTVWY'
    return Array.from({ length: 280 }, (_, i) => {
      return residues[(i * 7 + 3) % residues.length]
    })
  }, [])

  const components = molecule.components || []

  const [componentUpdateKey, setComponentUpdateKey] = useState(0)

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <TooltipContext.Provider value={{ activeTooltip, setActiveTooltip }}>
      <Container>
        <Section>
          <SectionTitle onClick={() => toggleSection('sequenceViewer')}>
            <FaDna />
            Sequence Viewer
            <span style={{ marginLeft: 'auto' }}>{expandedSections.sequenceViewer ? '−' : '+'}</span>
          </SectionTitle>
          {expandedSections.sequenceViewer && (
            <>
              <SequenceViewerContainer>
                {mockSequence.map((residue, i) => {
                  const residueNum = i + 1
                  const isSelected = selectedResidues.includes(residueNum)
                  const isHighlighted = highlightedResidues.includes(residueNum)

                  return (
                    <ResidueSpan
                      key={residueNum}
                      isSelected={isSelected}
                      isHighlighted={isHighlighted}
                      onClick={() => {
                        let newSelected: number[]
                        if (isSelected) {
                          newSelected = selectedResidues.filter(r => r !== residueNum)
                        } else {
                          newSelected = [...selectedResidues, residueNum]
                        }
                        setSelectedResidues(newSelected)
                      }}
                      onMouseEnter={() => {
                        setHighlightedResidues([residueNum])
                      }}
                      onMouseLeave={() => {
                        setHighlightedResidues([])
                      }}
                      title={`${residue}${residueNum}`}
                    >
                      {residue}
                    </ResidueSpan>
                  )
                }).reduce((acc, curr, i) => {
                  if (i > 0 && i % 10 === 0) {
                    return [...acc, ' ', curr]
                  }
                  return [...acc, curr]
                }, [] as React.ReactNode[])}
              </SequenceViewerContainer>
              <SequenceInfo>
                <span>Chain A: 280 residues</span>
                <span>{selectedResidues.length} selected</span>
              </SequenceInfo>

              <ButtonGroup style={{ marginTop: '0.5rem' }}>
                <SmallButton onClick={() => setSelectedResidues([])}>
                  Clear Selection
                </SmallButton>
                <SmallButton onClick={() => {
                  const allResidues = Array.from({ length: 280 }, (_, i) => i + 1)
                  setSelectedResidues(allResidues)
                }}>
                  Select All
                </SmallButton>
              </ButtonGroup>
            </>
          )}
        </Section>

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
                onClick={() => toggle(addComponentModal)}
              >
                <FaLayerGroup />
                Add Component
              </Button>
            </>
          )}
        </Section>

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
              checked={dynamicBonds.isOn}
              onChange={() => {
                toggle(dynamicBonds)
                console.log('Dynamic bonds:', !dynamicBonds)
              }}
            />
            <span></span>
          </ToggleSwitch>
        </SliderLabel>

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
                      navigator.clipboard.writeText('Crystal Contacts')
                      console.log('Crystal Contacts')
                    }}
                  >
                    <MdLayers />
                  </IconButtonWithTooltip>
                </PresetButtons>
              </StructureItem>


            </>
          )}
        </Section>
        {addComponentModal.isOpen && createPortal(
          <Modal isOpen={addComponentModal.isOpen} onClick={() => toggle(addComponentModal)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <ModalTitle>Add Component</ModalTitle>
                <CloseButton onClick={() => toggle(addComponentModal)}>
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
                        checked={checkExisting.isOn}
                        onChange={() => toggle(checkExisting)}
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

                    await molecule.createComponent(
                      componentSelection,
                      componentRepresentation,
                      componentLabel || undefined,
                      checkExisting.isOn
                    )

                    setComponentUpdateKey(prev => prev + 1)
                    toggle(addComponentModal)

                    setComponentSelection('current-selection')
                    setComponentRepresentation('create-later')
                    setComponentLabel('')
                    if (checkExisting.isOn) toggle(checkExisting)
                  }}>
                    Create Component
                  </CreateButton>
                </FormSection>
              </ModalBody>
            </ModalContent>
          </Modal> as any,
          document.body
        ) as any}
      </Container>
    </TooltipContext.Provider>
  )
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
    width: 16px;
    height: 16px;
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
    width: 16px;
    height: 16px;
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

const SequenceViewerContainer = styled.div`
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px;
  overflow-x: auto;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin-top: 8px;
  min-height: 120px;
  max-height: 200px;
`

const ResidueSpan = styled.span<{ isSelected: boolean; isHighlighted: boolean }>`
  cursor: pointer;
  padding: 2px 3px;
  border-radius: 3px;
  transition: all 0.2s;
  background-color: ${props =>
    props.isSelected ? '#3182ce' :
      props.isHighlighted ? '#e6fffa' :
        'transparent'
  };
  color: ${props => props.isSelected ? 'white' : '#2d3748'};
  
  &:hover {
    background-color: ${props => props.isSelected ? '#2c5282' : '#bee3f8'};
  }
`

const SequenceInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: #718096;
  
  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`

const SmallButton = styled.button<{ isActive?: boolean }>`
  padding: 4px 8px;
  border: 1px solid ${props => props.isActive ? '#48bb78' : '#e2e8f0'};
  background: ${props => props.isActive ? '#e6fffa' : 'white'};
  border-radius: 4px;
  font-size: 12px;
  color: ${props => props.isActive ? '#276749' : '#4a5568'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.isActive ? '#c6f6d5' : '#f7fafc'};
    border-color: ${props => props.isActive ? '#38a169' : '#cbd5e0'};
  }
`

