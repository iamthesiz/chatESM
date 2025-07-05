/** @jsxImportSource @emotion/react */
import React, { useState, useEffect } from 'react'
import styled from '@emotion/styled'
import { useSequence, Residue } from '../../hooks/useSequence'
import { DEFAULT_MOLSTAR_ID } from '../../hooks/constants'

interface SequenceViewerProps {
  molstarId?: string
}

export function SequenceViewer({ molstarId = DEFAULT_MOLSTAR_ID }: SequenceViewerProps) {
  const [sequence, setSequence] = useSequence(molstarId)
  const [highlightedResidues, setHighlightedResidues] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Residue | null>(null)
  const [dragModifiers, setDragModifiers] = useState<{ ctrlKey: boolean; metaKey: boolean }>({ ctrlKey: false, metaKey: false })

  // Global mouse up handler to end drag
  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false)
      setDragStart(null)
      setDragModifiers({ ctrlKey: false, metaKey: false })
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  // Helper functions
  const getResidueRange = (residues: Residue[], start: Residue, end: Residue): Residue[] => {
    const startIdx = residues.findIndex(r => r.index === start.index)
    const endIdx = residues.findIndex(r => r.index === end.index)
    const minIdx = Math.min(startIdx, endIdx)
    const maxIdx = Math.max(startIdx, endIdx)
    return residues.slice(minIdx, maxIdx + 1)
  }

  const handleResidueClick = (residue: Residue, e: React.MouseEvent) => {
    e.preventDefault()
    const { residues } = sequence
    const isSelected = residue.selected

    if (e.shiftKey) {
      const selectedResidues = residues.filter(r => r.selected)
      if (selectedResidues.length > 0) {
        const lastSelected = selectedResidues[selectedResidues.length - 1]
        const rangeSelection = getResidueRange(residues, lastSelected, residue)
        setSequence({ residues: rangeSelection })
      } else {
        setSequence({ residues: [residue] })
      }
    } else if (!e.ctrlKey && !e.metaKey) {
      // Single click without modifiers
      if (isSelected && residues.filter(r => r.selected).length === 1) {
        // If clicking the only selected residue, deselect it
        setSequence({ residues: [] })
      } else {
        // Otherwise, select only this residue
        setSequence({ residues: [residue] })
      }
    } else {
      // Ctrl/Cmd click - toggle this residue
      if (isSelected) {
        const newSelection = residues.filter(r => r.selected && r !== residue)
        setSequence({ residues: newSelection })
      } else {
        const newSelection = residues.filter(r => r.selected)
        newSelection.push(residue)
        setSequence({ residues: newSelection })
      }
    }
  }

  const handleDragStart = (residue: Residue, e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart(residue)
    setDragModifiers({ ctrlKey: e.ctrlKey, metaKey: e.metaKey })
  }

  const handleDragOver = (residue: Residue) => {
    if (!isDragging || !dragStart) return

    const { residues } = sequence
    const rangeSelection = getResidueRange(residues, dragStart, residue)

    if (dragModifiers.ctrlKey || dragModifiers.metaKey) {
      // Add range to existing selection
      const existingSelection = residues.filter(r => r.selected)
      const combinedSet = new Set([...existingSelection, ...rangeSelection])
      setSequence({ residues: Array.from(combinedSet) })
    } else {
      // Replace selection with range
      setSequence({ residues: rangeSelection })
    }
  }

  if (sequence.loading) {
    return (
      <LoadingContainer>
        Loading sequence data...
      </LoadingContainer>
    )
  }

  const { residues, chains, entities, structures } = sequence
  const isNonPolymer = entities.find(e => e.id === sequence.entity)?.type !== 'polymer'

  return (
    <Container>
      {/* Control Dropdowns */}
      <DropdownContainer>
        {structures.length > 0 && (
          <DropdownGroup>
            <DropdownLabel>Structure</DropdownLabel>
            <Dropdown
              value={sequence.structure || ''}
              onChange={(e) => setSequence({ structure: e.target.value })}
            >
              {structures.map(struct => (
                <option key={struct.id} value={struct.id}>
                  {struct.label}
                </option>
              ))}
            </Dropdown>
          </DropdownGroup>
        )}

        <DropdownGroup>
          <DropdownLabel>Mode</DropdownLabel>
          <Dropdown
            value={sequence.mode}
            onChange={(e) => setSequence({ mode: e.target.value as any })}
          >
            <option value="chain">Chain</option>
            <option value="polymers">Polymers</option>
            <option value="everything">Everything</option>
          </Dropdown>
        </DropdownGroup>

        {entities.length > 0 && (
          <DropdownGroup>
            <DropdownLabel>Entity</DropdownLabel>
            <Dropdown
              value={sequence.entity || ''}
              onChange={(e) => setSequence({ entity: e.target.value })}
            >
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.label ? `${entity.id}: ${entity.label}` : `Entity ${entity.id}`}
                </option>
              ))}
            </Dropdown>
          </DropdownGroup>
        )}

        {chains.length > 0 && (
          <DropdownGroup>
            <DropdownLabel>Chain</DropdownLabel>
            <Dropdown
              value={sequence.chain || ''}
              onChange={(e) => setSequence({ chain: e.target.value })}
            >
              {chains.map(chain => (
                <option key={chain.id} value={chain.id}>
                  {chain.label || chain.id}
                </option>
              ))}
            </Dropdown>
          </DropdownGroup>
        )}
      </DropdownContainer>

      {/* Sequence Display */}
      <ChainContainer>
        <ChainHeader>
          <ChainLabel>
            {chains.find(c => c.id === sequence.chain)?.label || 'Sequence'}
          </ChainLabel>
          <ChainInfo>
            {residues.length > 0 ? `${residues.length} residues` : 'No sequence data'}
          </ChainInfo>
        </ChainHeader>

        <SequenceWrapper>
          {!residues || residues.length === 0 ? (
            <NoSequenceMessage>No sequence data available for this entity</NoSequenceMessage>
          ) : isNonPolymer ? (
            <NonPolymerContainer>
              {residues.map((residue) => (
                <NonPolymerResidue
                  key={`${residue.chainId}-${residue.seqId}`}
                  isSelected={residue.selected}
                  onClick={() => setSequence({ residues: [residue] })}
                  title={`${residue.name} ${residue.seqId}`}
                >
                  {residue.seqId} {residue.name}
                </NonPolymerResidue>
              ))}
            </NonPolymerContainer>
          ) : (
            <SequenceContainer>
              {residues.map((residue, i) => {
                const residueKey = `${residue.chainId}-${residue.seqId}`
                const isSelected = residue.selected
                const isHighlighted = highlightedResidues.has(residueKey)

                return (
                  <React.Fragment key={residueKey}>
                    <ResidueSpan
                      isSelected={isSelected}
                      isHighlighted={isHighlighted}
                      onMouseDown={(e) => {
                        handleDragStart(residue, e)
                        handleResidueClick(residue, e)
                      }}
                      onMouseEnter={() => {
                        if (isDragging) {
                          handleDragOver(residue)
                        } else {
                          setHighlightedResidues(new Set([residueKey]))
                        }
                      }}
                      onMouseLeave={() => {
                        if (!isDragging) {
                          setHighlightedResidues(new Set())
                        }
                      }}
                      title={`${residue.name}${residue.seqId}`}
                    >
                      {residue.code}
                    </ResidueSpan>
                    {(i + 1) % 10 === 0 && <SequenceBreak />}
                  </React.Fragment>
                )
              })}
            </SequenceContainer>
          )}
        </SequenceWrapper>

        <SequenceStats>
          <span>Selected: {residues.filter(r => r.selected).length}</span>
        </SequenceStats>
      </ChainContainer>

      {/* Action Buttons */}
      <ActionBar>
        <Button onClick={() => setSequence({ residues: [] })}>
          Clear Selection
        </Button>
        <Button onClick={() => setSequence({ residues })}>
          Select All
        </Button>
      </ActionBar>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const DropdownContainer = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
`

const DropdownGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const DropdownLabel = styled.label`
  font-size: 11px;
  font-weight: 500;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const Dropdown = styled.select`
  padding: 6px 10px;
  font-size: 13px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  background: white;
  color: #2d3748;
  cursor: pointer;
  min-width: 150px;
  max-width: 300px;
  
  option {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  &:hover {
    border-color: #a0aec0;
  }
  
  &:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 1px #3182ce;
  }
`

const LoadingContainer = styled.div`
  padding: 20px;
  text-align: center;
  color: #718096;
`

const ChainContainer = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
`

const ChainHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e2e8f0;
`

const ChainLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #2d3748;
`

const ChainInfo = styled.div`
  font-size: 11px;
  color: #718096;
`

const SequenceWrapper = styled.div`
  background: white;
`

const SequenceContainer = styled.div`
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.8;
  padding: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
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

const SequenceStats = styled.div`
  padding: 6px 12px;
  background: #f8f9fa;
  border-top: 1px solid #e2e8f0;
  font-size: 11px;
  color: #718096;
`

const ActionBar = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
`

const Button = styled.button`
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 4px;
  font-size: 12px;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f7fafc;
    border-color: #cbd5e0;
  }
`

const NoSequenceMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #718096;
  font-style: italic;
`

const NonPolymerContainer = styled.div`
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
`

const NonPolymerResidue = styled.div<{ isSelected: boolean }>`
  font-family: 'Monaco', 'Consolas', 'Courier New', monospace;
  font-size: 14px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: ${props => props.isSelected ? '#3182ce' : '#f7fafc'};
  color: ${props => props.isSelected ? 'white' : '#2d3748'};
  border: 1px solid ${props => props.isSelected ? '#3182ce' : '#e2e8f0'};
  
  &:hover {
    background-color: ${props => props.isSelected ? '#2c5282' : '#edf2f7'};
    border-color: ${props => props.isSelected ? '#2c5282' : '#cbd5e0'};
  }
`
