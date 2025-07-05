/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { useMolecule } from '../../../hooks/useMolecule'
import { ControlGroup, Label, ButtonGroup, SmallButton } from './styled'

interface QualityControlsProps {
  id?: string
}

export const QualityControls: FC<QualityControlsProps> = ({ id }) => {
  const [molecule, { setQuality }] = useMolecule(id)
  const activeQuality = molecule.quality?.level || 'medium'

  return (
    <ControlGroup>
      <Label>Quality</Label>
      <ButtonGroup>
        <SmallButton
          isActive={activeQuality === 'low'}
          onClick={() => setQuality({ level: 'low' })}
        >
          Low
        </SmallButton>
        <SmallButton
          isActive={activeQuality === 'medium'}
          onClick={() => setQuality({ level: 'medium' })}
        >
          Medium
        </SmallButton>
        <SmallButton
          isActive={activeQuality === 'high'}
          onClick={() => setQuality({ level: 'high' })}
        >
          High
        </SmallButton>
      </ButtonGroup>
    </ControlGroup>
  )
}