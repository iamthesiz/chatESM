import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { useSelection } from '../../hooks/useSelection'
import { DEFAULT_MOLSTAR_ID } from '../../hooks/constants'

export function SelectionTest() {
  const [selection, manager] = useSelection(DEFAULT_MOLSTAR_ID)
  const [, forceUpdate] = useState({})
  
  // Subscribe to selection changes to trigger re-renders
  useEffect(() => {
    const unsubscribe = manager.on('selection-change', () => {
      forceUpdate({})
    })
    return unsubscribe
  }, [manager])
  
  if (selection.loading) {
    return <Container>Loading...</Container>
  }

  return (
    <Container>
      <h3>Selection Test</h3>
      
      <InfoSection>
        <h4>Current Selection</h4>
        <InfoGrid>
          <InfoItem>
            <Label>Atoms:</Label>
            <Value>{selection.atoms.length}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Residues:</Label>
            <Value>{selection.residues.length}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Chains:</Label>
            <Value>{selection.chains.length}</Value>
          </InfoItem>
          <InfoItem>
            <Label>Empty:</Label>
            <Value>{selection.isEmpty ? 'Yes' : 'No'}</Value>
          </InfoItem>
        </InfoGrid>
      </InfoSection>
      
      <Section>
        <h4>Quick Selections</h4>
        <ButtonGroup>
          <Button onClick={() => manager.selectAll()}>
            Select All
          </Button>
          <Button onClick={() => manager.selectProtein()}>
            Select Protein
          </Button>
          <Button onClick={() => manager.selectLigand()}>
            Select Ligand
          </Button>
          <Button onClick={() => manager.selectWater()}>
            Select Water
          </Button>
          <Button onClick={() => manager.selectNucleic()}>
            Select Nucleic
          </Button>
          <Button onClick={() => manager.clear()}>
            Clear Selection
          </Button>
        </ButtonGroup>
      </Section>
      
      <Section>
        <h4>Chain Selection</h4>
        <ButtonGroup>
          <Button onClick={() => manager.select({ type: 'chain', chainId: 'A' })}>
            Chain A
          </Button>
          <Button onClick={() => manager.select({ type: 'chain', chainId: 'B' })}>
            Chain B
          </Button>
          <Button onClick={() => manager.add({ type: 'chain', chainId: 'A' })}>
            Add Chain A
          </Button>
          <Button onClick={() => manager.remove({ type: 'chain', chainId: 'A' })}>
            Remove Chain A
          </Button>
        </ButtonGroup>
      </Section>
      
      <Section>
        <h4>Residue Selection</h4>
        <ButtonGroup>
          <Button onClick={() => manager.select({ 
            type: 'residue', 
            chainId: 'A', 
            residueIds: [1, 2, 3, 4, 5] 
          })}>
            Residues 1-5
          </Button>
          <Button onClick={() => manager.select({ 
            type: 'residue', 
            chainId: 'A', 
            residueIds: [10, 20, 30, 40, 50] 
          })}>
            Residues 10,20,30,40,50
          </Button>
        </ButtonGroup>
      </Section>
      
      <Section>
        <h4>Focus & View</h4>
        <ButtonGroup>
          <Button onClick={() => manager.focus()}>
            Focus Selection
          </Button>
          <Button onClick={() => manager.isolate()}>
            Isolate Selection
          </Button>
        </ButtonGroup>
      </Section>
      
      <Section>
        <h4>Custom Expression</h4>
        <Input 
          type="text" 
          placeholder="e.g., chain A and residue 1-10"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const expression = (e.target as HTMLInputElement).value
              manager.select({ type: 'expression', expression })
            }
          }}
        />
      </Section>
    </Container>
  )
}

const Container = styled.div`
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
`

const Section = styled.div`
  margin-bottom: 24px;
  
  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: #2d3748;
  }
`

const InfoSection = styled(Section)`
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Label = styled.span`
  font-size: 13px;
  color: #718096;
`

const Value = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`

const Button = styled.button`
  padding: 6px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f7fafc;
    border-color: #cbd5e0;
  }
`

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
  
  &:focus {
    outline: none;
    border-color: #4299e1;
  }
`