/** @jsxImportSource @emotion/react */
import { FC, useState } from 'react'
import styled from '@emotion/styled'
import { useToggles } from 'toggles'

interface StructureTypeControlsProps {
  id?: string
}

export const StructureTypeControls: FC<StructureTypeControlsProps> = ({ id }) => {
  const [structureType, setStructureType] = useState('model')
  const [{ dynamicBonds }, { toggle }] = useToggles()

  return (
    <>
      <Label>Type</Label>
      <Select
        value={structureType}
        onChange={(e) => {
          setStructureType(e.target.value)
        }}
      >
        <option value="model">Model</option>
        <option value="assembly">Assembly</option>
        <option value="symmetry-mates">Symmetry Mates</option>
        <option value="symmetry-indices">Symmetry (Indices)</option>
        <option value="symmetry-assembly">Symmetry (Assembly)</option>
      </Select>

      <SliderLabel style={{ marginTop: '12px' }}>
        <span>Dynamic Bonds</span>
        <ToggleSwitch>
          <input
            type="checkbox"
            checked={dynamicBonds.isOn}
            onChange={() => {
              toggle(dynamicBonds)
              console.log('Dynamic bonds:', !dynamicBonds.isOn)
            }}
          />
          <span></span>
        </ToggleSwitch>
      </SliderLabel>
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

const Select = styled.select`
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
  margin-top: 8px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #4299e1;
  }
`

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: #718096;
  
  span:last-child {
    color: #4a5568;
    font-weight: 500;
  }
`

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #e2e8f0;
    transition: all 0.2s;
    border-radius: 12px;
    
    &:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: all 0.2s;
      border-radius: 50%;
    }
  }
  
  input:checked + span {
    background-color: #4299e1;
  }
  
  input:checked + span:before {
    transform: translateX(14px);
  }
`
