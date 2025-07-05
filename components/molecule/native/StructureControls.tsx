/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import styled from '@emotion/styled'
import { FaCube, FaLayerGroup } from 'react-icons/fa'
import { MdLayers } from 'react-icons/md'
import { BiShapePolygon } from 'react-icons/bi'
import { IconButtonWithTooltip } from '../IconButtonWithTooltip'
import { useMolecule } from '../../../hooks/useMolecule'

interface StructureControlsProps {
  id?: string
}

export const StructureControls: FC<StructureControlsProps> = ({ id }) => {
  const [molecule] = useMolecule(id)
  
  // Get structure info from molecule state
  const structureName = molecule.title?.split(' ')[0] || '1TQN'
  const structureDescription = molecule.title || 'Crystal Structure of Human...'

  return (
    <StructureItem>
      <StructureInfo>
        <StructureName>{structureName}</StructureName>
        <StructureDescription>{structureDescription}</StructureDescription>
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
  )
}

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