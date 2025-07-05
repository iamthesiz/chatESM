/** @jsxImportSource @emotion/react */
import { FC, useState } from 'react'
import styled from '@emotion/styled'
import { useMolecule } from '../../../hooks/useMolecule'

interface QuickStylesControlsProps {
  id?: string
}

export const QuickStylesControls: FC<QuickStylesControlsProps> = ({ id }) => {
  const [, { setStylePreset, setRepresentationPreset }] = useMolecule(id)
  const [selectedRepresentation, setSelectedRepresentation] = useState('default')
  const [selectedStylePreset, setSelectedStylePreset] = useState('default')

  return (
    <>
      <Label>Representation Presets</Label>
      <ButtonGroup>
        <Button
          onClick={async () => {
            setSelectedRepresentation('default')
            await setRepresentationPreset('default')
          }}
          style={{
            background: selectedRepresentation === 'default' ? '#e6fffa' : 'white',
            borderColor: selectedRepresentation === 'default' ? '#48bb78' : '#e2e8f0'
          }}
        >
          Default
        </Button>
        <Button
          onClick={async () => {
            setSelectedRepresentation('cartoon')
            await setRepresentationPreset('cartoon')
          }}
          style={{
            background: selectedRepresentation === 'cartoon' ? '#e6fffa' : 'white',
            borderColor: selectedRepresentation === 'cartoon' ? '#48bb78' : '#e2e8f0'
          }}
        >
          Cartoon
        </Button>
        <Button
          onClick={async () => {
            setSelectedRepresentation('spacefill')
            await setRepresentationPreset('spacefill')
          }}
          style={{
            background: selectedRepresentation === 'spacefill' ? '#e6fffa' : 'white',
            borderColor: selectedRepresentation === 'spacefill' ? '#48bb78' : '#e2e8f0'
          }}
        >
          Spacefill
        </Button>
        <Button
          onClick={async () => {
            setSelectedRepresentation('surface')
            await setRepresentationPreset('surface')
          }}
          style={{
            background: selectedRepresentation === 'surface' ? '#e6fffa' : 'white',
            borderColor: selectedRepresentation === 'surface' ? '#48bb78' : '#e2e8f0'
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
            await setStylePreset('default')
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
            await setStylePreset('illustrative')
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
            await setStylePreset('publication')
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
            await setStylePreset('performance')
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
  )
}

const Label = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #718096;
  margin-bottom: 4px;
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