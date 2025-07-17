/** @jsxImportSource @emotion/react */
import { FaEye, FaEyeSlash, FaTrash, FaPlus } from 'react-icons/fa'
import styled from '@emotion/styled'
import { useState } from 'react'
import { useComponents } from '../../hooks/useComponents'
import { useToggles } from 'toggles'

export function ComponentsPanel() {
  const [components, manager] = useComponents()
  const [{ addDialog }, { open }] = useToggles('global')

  if (manager.loading) {
    return (
      <Container>
        <LoadingMessage>Loading components...</LoadingMessage>
      </Container>
    )
  }

  if (components.length === 0) {
    return (
      <Container>
        <EmptyMessage>
          <p>No components found</p>
          <AddButton onClick={() => open(addDialog)}>
            <FaPlus /> Add Component
          </AddButton>
        </EmptyMessage>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <Title>Components ({components.length})</Title>
        <HeaderButton onClick={() => open(addDialog)} title="Add component">
          <FaPlus />
        </HeaderButton>
      </Header>

      <ComponentsList>
        {components.map((component) => (
          <ComponentItem key={component.ref}>
            <ComponentInfo>
              <ComponentLabel>{component.label}</ComponentLabel>
              <ComponentDetails>
                <TypeBadge type={component.type}>{component.type}</TypeBadge>
                <RepresentationType>{component.representation}</RepresentationType>
              </ComponentDetails>
            </ComponentInfo>

            <ComponentActions>
              <ActionButton
                onClick={() => manager.toggle(component)}
                title={component.isVisible ? 'Hide' : 'Show'}
                isActive={component.isVisible}
              >
                {component.isVisible ? <FaEye /> : <FaEyeSlash />}
              </ActionButton>
              <ActionButton
                onClick={() => manager.remove(component)}
                title="Remove"
                variant="danger"
              >
                <FaTrash />
              </ActionButton>
            </ComponentActions>
          </ComponentItem>
        ))}
      </ComponentsList>

      <ActionBar>
        <ActionBarButton onClick={() => manager.showAll()}>
          Show All
        </ActionBarButton>
        <ActionBarButton onClick={() => manager.hideAll()}>
          Hide All
        </ActionBarButton>
        <ActionBarButton onClick={() => manager.clear()} variant="danger">
          Clear All
        </ActionBarButton>
      </ActionBar>

      {addDialog.isOpen && <AddComponentDialog manager={manager} />}
    </Container>
  )
}

function AddComponentDialog({ manager }: { manager: any }) {
  const [{ addDialog }, { close }] = useToggles('global')
  const [selection, setSelection] = useState('polymer')
  const [representation, setRepresentation] = useState('cartoon')
  const [label, setLabel] = useState('')

  const handleAdd = async () => {
    try {
      await manager.add({
        selection,
        representation,
        label: label || `${selection} (${representation})`
      })
      close(addDialog)
    } catch (error) {
      console.error('Failed to add component:', error)
    }
  }

  return (
    <DialogOverlay onClick={() => close(addDialog)}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <h3>Add Component</h3>
          <CloseButton onClick={() => close(addDialog)}>×</CloseButton>
        </DialogHeader>

        <DialogBody>
          <FormGroup>
            <Label>Selection</Label>
            <Select value={selection} onChange={(e) => setSelection(e.target.value)}>
              <option value="polymer">Polymer</option>
              <option value="ligand">Ligand</option>
              <option value="water">Water</option>
              <option value="ion">Ion</option>
              <option value="nucleic">Nucleic Acid</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Representation</Label>
            <Select value={representation} onChange={(e) => setRepresentation(e.target.value)}>
              <option value="cartoon">Cartoon</option>
              <option value="ball-and-stick">Ball & Stick</option>
              <option value="spacefill">Spacefill</option>
              <option value="surface">Surface</option>
              <option value="ribbon">Ribbon</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Label (optional)</Label>
            <Input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Custom label"
            />
          </FormGroup>
        </DialogBody>

        <DialogFooter>
          <Button onClick={() => close(addDialog)} variant="secondary">Cancel</Button>
          <Button onClick={handleAdd} variant="primary">Add</Button>
        </DialogFooter>
      </DialogContent>
    </DialogOverlay>
  )
}

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

const LoadingMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #718096;
`

const EmptyMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #718096;
  
  p {
    margin-bottom: 16px;
  }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e7;
`

const Title = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #202123;
`

const HeaderButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #718096;
  transition: color 0.2s;
  
  &:hover {
    color: #202123;
  }
`

const ComponentsList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`

const ComponentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: #f7f7f8;
  border-radius: 8px;
  transition: background 0.2s;
  
  &:hover {
    background: #ececed;
  }
`

const ComponentInfo = styled.div`
  flex: 1;
`

const ComponentLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #202123;
  margin-bottom: 4px;
`

const ComponentDetails = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

const TypeBadge = styled.span<{ type: string }>`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  background: ${props => {
    switch (props.type) {
      case 'protein': return '#e3f2fd';
      case 'ligand': return '#f3e5f5';
      case 'water': return '#e8f5e9';
      case 'ion': return '#fff3e0';
      case 'nucleic': return '#fce4ec';
      default: return '#f5f5f5';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'protein': return '#1976d2';
      case 'ligand': return '#7b1fa2';
      case 'water': return '#388e3c';
      case 'ion': return '#f57c00';
      case 'nucleic': return '#c2185b';
      default: return '#616161';
    }
  }};
`

const RepresentationType = styled.span`
  font-size: 12px;
  color: #718096;
`

const ComponentActions = styled.div`
  display: flex;
  gap: 4px;
`

const ActionButton = styled.button<{ isActive?: boolean; variant?: string }>`
  background: ${props => props.isActive ? '#202123' : 'transparent'};
  border: 1px solid ${props => props.variant === 'danger' ? '#ef4444' : '#e5e5e7'};
  padding: 6px;
  border-radius: 4px;
  cursor: pointer;
  color: ${props => {
    if (props.variant === 'danger') return '#ef4444';
    return props.isActive ? '#ffffff' : '#718096';
  }};
  transition: all 0.2s;
  
  &:hover {
    background: ${props => {
    if (props.variant === 'danger') return '#fef2f2';
    return props.isActive ? '#3a3a3c' : '#f7f7f8';
  }};
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
`

const ActionBar = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #e5e5e7;
`

const ActionBarButton = styled.button<{ variant?: string }>`
  flex: 1;
  padding: 8px;
  border: 1px solid ${props => props.variant === 'danger' ? '#ef4444' : '#e5e5e7'};
  border-radius: 4px;
  background: ${props => props.variant === 'danger' ? '#fef2f2' : '#ffffff'};
  color: ${props => props.variant === 'danger' ? '#ef4444' : '#202123'};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.variant === 'danger' ? '#fee2e2' : '#f7f7f8'};
  }
`

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #e5e5e7;
  border-radius: 6px;
  background: #ffffff;
  color: #202123;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f7f7f8;
  }
`

// Dialog styles
const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const DialogContent = styled.div`
  background: white;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
`

const DialogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e7;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #202123;
  }
`

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #718096;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #202123;
  }
`

const DialogBody = styled.div`
  padding: 20px;
`

const DialogFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  border-top: 1px solid #e5e5e7;
`

const FormGroup = styled.div`
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #202123;
  margin-bottom: 6px;
`

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e5e7;
  border-radius: 6px;
  font-size: 14px;
  color: #202123;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #4299e1;
  }
`

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e5e7;
  border-radius: 6px;
  font-size: 14px;
  color: #202123;
  
  &:focus {
    outline: none;
    border-color: #4299e1;
  }
`

const Button = styled.button<{ variant?: string }>`
  padding: 8px 16px;
  border: 1px solid ${props => props.variant === 'primary' ? '#202123' : '#e5e5e7'};
  border-radius: 6px;
  background: ${props => props.variant === 'primary' ? '#202123' : '#ffffff'};
  color: ${props => props.variant === 'primary' ? '#ffffff' : '#202123'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.variant === 'primary' ? '#3a3a3c' : '#f7f7f8'};
  }
`
