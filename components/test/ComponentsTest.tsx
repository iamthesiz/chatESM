import React from 'react'
import styled from '@emotion/styled'
import { useComponents } from '../../hooks/useComponents'

interface ComponentsTestProps {
  molstarId: string
}

export function ComponentsTest({ molstarId }: ComponentsTestProps) {
  const [components, manager] = useComponents(molstarId)

  if (manager.loading) {
    return <Container>Loading components...</Container>
  }

  return (
    <Container>
      <h3>Components Test</h3>
      
      {/* Display current components */}
      <Section>
        <h4>Current Components ({components.length})</h4>
        <Button onClick={() => manager.update()}>Refresh Components</Button>
        {components.map((component) => (
          <ComponentRow key={component.ref}>
            <ComponentInfo>
              <Label>{component.label}</Label>
              <Type>{component.type}</Type>
              <Representation>{component.representation}</Representation>
              <Status visible={component.isVisible}>
                {component.isVisible ? 'visible' : 'hidden'}
              </Status>
            </ComponentInfo>
            <Actions>
              <Button onClick={() => manager.toggle(component)}>
                {component.isVisible ? 'Hide' : 'Show'}
              </Button>
              <Button onClick={() => manager.remove(component)}>
                Remove
              </Button>
            </Actions>
          </ComponentRow>
        ))}
      </Section>

      {/* Add new components */}
      <Section>
        <h4>Add Components</h4>
        <ButtonGroup>
          <Button onClick={() => manager.add({ 
            selection: 'protein',
            representation: 'cartoon',
            label: 'Protein'
          })}>
            Add Protein
          </Button>
          <Button onClick={() => manager.add({ 
            selection: 'ligand',
            representation: 'ball-and-stick',
            label: 'Ligands'
          })}>
            Add Ligands
          </Button>
          <Button onClick={() => manager.add({ 
            selection: 'water',
            representation: 'spacefill',
            label: 'Water',
            checkExisting: true
          })}>
            Add Water
          </Button>
        </ButtonGroup>
      </Section>

      {/* Bulk operations */}
      <Section>
        <h4>Bulk Operations</h4>
        <ButtonGroup>
          <Button onClick={() => manager.showAll()}>
            Show All
          </Button>
          <Button onClick={() => manager.hideAll()}>
            Hide All
          </Button>
          <Button onClick={() => manager.clear()}>
            Clear All
          </Button>
        </ButtonGroup>
      </Section>

      {/* Presets */}
      <Section>
        <h4>Apply Preset</h4>
        <select onChange={(e) => manager.setPreset({ preset: e.target.value })}>
          <option value="">Choose preset...</option>
          <option value="auto">Automatic</option>
          <option value="empty">Empty</option>
          <option value="polymer-cartoon">Polymer Cartoon</option>
          <option value="polymer-and-ligand">Polymer & Ligand</option>
          <option value="protein-and-nucleic">Protein & Nucleic</option>
          <option value="atomic-detail">Atomic Detail</option>
        </select>
      </Section>

    </Container>
  )
}

const Container = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`

const Section = styled.div`
  margin-bottom: 24px;
  
  h4 {
    margin: 0 0 12px 0;
    color: #2d3748;
  }
`

const ComponentRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 8px;
`

const ComponentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const Label = styled.span`
  font-weight: 500;
  color: #2d3748;
`

const Type = styled.span`
  padding: 2px 8px;
  background: #e6fffa;
  color: #234e52;
  border-radius: 4px;
  font-size: 12px;
`

const Representation = styled.span`
  padding: 2px 8px;
  background: #f0fff4;
  color: #276749;
  border-radius: 4px;
  font-size: 12px;
`

const Status = styled.span<{ visible: boolean }>`
  color: ${props => props.visible ? '#48bb78' : '#718096'};
  font-size: 12px;
`

const Actions = styled.div`
  display: flex;
  gap: 8px;
`

const Button = styled.button`
  padding: 6px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  
  &:hover {
    background: #f7fafc;
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

