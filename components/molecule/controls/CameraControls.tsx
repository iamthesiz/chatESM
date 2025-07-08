/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled'
import { FC } from 'react'
import { useMolecule } from '../../../hooks/useMolecule'

export const CameraControls: FC = () => {
  const [molecule] = useMolecule()
  return (
    <ControlGroup>
      <Label>Camera Controls</Label>
      <ButtonGroup>
        <SmallButton onClick={() => molecule.resetZoom()}>
          Reset Zoom
        </SmallButton>
        <SmallButton onClick={() => molecule.orientAxes()}>
          Orient Axes
        </SmallButton>
        <SmallButton onClick={() => molecule.resetAxes()}>
          Reset Axes
        </SmallButton>
      </ButtonGroup>
    </ControlGroup>
  )
}

const ControlGroup = styled.div`
  margin-bottom: 1.5rem;
`

const Label = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #8e8ea0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
`

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`

const SmallButton = styled.button<{ isActive?: boolean }>`
  padding: 0.25rem 0.5rem;
  border: 1px solid ${props => props.isActive ? '#202123' : '#e5e5e7'};
  border-radius: 0.25rem;
  background-color: ${props => props.isActive ? '#202123' : '#ffffff'};
  color: ${props => props.isActive ? '#ffffff' : '#202123'};
  font-size: 0.625rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.isActive ? '#202123' : '#f7f7f8'};
  }
`