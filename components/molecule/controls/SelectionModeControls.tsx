/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { useMolecule } from '../../../hooks/useMolecule'
import { ControlGroup, Label, SelectDropdown } from './styled'

export const SelectionModeControls: FC = () => {
  const [molecule, { setGranularity }] = useMolecule()

  return (
    <ControlGroup>
      <Label>Selection Mode</Label>
      <SelectDropdown
        value={molecule.granularity || 'residue'}
        onChange={(e) => setGranularity(e.target.value)}
      >
        <option value="atom">Atom/Coarse Element</option>
        <option value="residue">Residue</option>
        <option value="chain">Chain</option>
        <option value="entity">Entity</option>
        <option value="model">Model</option>
        <option value="operator">Operator</option>
        <option value="structure">Structure/Shape</option>
        <option value="atom-instance">Atom/Coarse Element Instances</option>
        <option value="residue-instance">Residue Instances</option>
        <option value="chain-instance">Chain Instances</option>
      </SelectDropdown>
    </ControlGroup>
  )
}
