import React from 'react'
import styled from '@emotion/styled'
import { useSequence } from '../../hooks/useSequence'
import { DEFAULT_MOLSTAR_ID } from '../../hooks/constants'

export function SequenceTest() {
  const [sequence, setSequence] = useSequence(DEFAULT_MOLSTAR_ID)
  const [highlightedResidues, setHighlightedResidues] = React.useState<Set<string>>(new Set())
  
  if (sequence.loading) {
    return <Container>Loading sequence data...</Container>
  }

  const chains = sequence.chains || []
  if (chains.length === 0) {
    return <Container>No sequence data available. Load a structure first.</Container>
  }

  return (
    <Container>
      <h3>Sequence Viewer Test</h3>
      <p>Note: This test component needs to be updated to use the new useSequence API</p>
      <p>Chains found: {chains.map(c => c.label).join(', ')}</p>
    </Container>
  )
}

const Container = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`

// TODO: Update this component to use the new API - the old implementation is commented out below
/*
      
      {chains.map(chain => (
        <ChainSection key={chain.id}>
          <ChainHeader>
            <ChainTitle>Chain {chain.id}</ChainTitle>
            <ChainInfo>
              {chain.type} • {chain.length} residues
            </ChainInfo>
          </ChainHeader>
          
          <SequenceContainer>
            {chain.sequence.map((residue, i) => (
              <React.Fragment key={`${residue.chainId}-${residue.seqId}`}>
                <ResidueSpan
                  isSelected={selectedResidues.has(`${residue.chainId}-${residue.seqId}`)}
                  isHighlighted={highlightedResidues.has(`${residue.chainId}-${residue.seqId}`)}
                  onClick={() => {
                    const key = `${residue.chainId}-${residue.seqId}`
                    const isSelected = selectedResidues.has(key)
                    const newSelection = isSelected 
                      ? chain.sequence.filter(r => selectedResidues.has(`${r.chainId}-${r.seqId}`) && r !== residue)
                      : [...chain.sequence.filter(r => selectedResidues.has(`${r.chainId}-${r.seqId}`)), residue]
                    manager.selectResidues(newSelection)
                  }}
                  onMouseEnter={() => {
                    const key = `${residue.chainId}-${residue.seqId}`
                    setHighlightedResidues(new Set([key]))
                  }}
                  onMouseLeave={() => setHighlightedResidues(new Set())}
                  title={`${residue.name}${residue.seqId}`}
                >
                  {residue.code}
                </ResidueSpan>
                {(i + 1) % 10 === 0 && <SequenceBreak />}
              </React.Fragment>
            ))}
          </SequenceContainer>
          
          <SequenceInfo>
            <span>Selected: {chain.sequence.filter(r => selectedResidues.has(`${r.chainId}-${r.seqId}`)).length}</span>
          </SequenceInfo>
        </ChainSection>
      ))}
    </Container>
  )
}

const Container = styled.div`
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
`

const ActionBar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
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

const ChainSection = styled.div`
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
`

const ChainHeader = styled.div`
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const ChainTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
`

const ChainInfo = styled.span`
  font-size: 12px;
  color: #718096;
`

const SequenceContainer = styled.div`
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.8;
  padding: 16px;
  background: white;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
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

const SequenceBreak = styled.span`
  margin-right: 8px;
`

const SequenceInfo = styled.div`
  padding: 8px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
  color: #718096;
`*/
