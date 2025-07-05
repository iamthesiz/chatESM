import styled from '@emotion/styled'

export const ControlGroup = styled.div`
  margin-bottom: 1.5rem;
`

export const Label = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #8e8ea0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
`

export const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`

export const SmallButton = styled.button<{ isActive?: boolean }>`
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

export const Slider = styled.input`
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #e5e5e7;
  outline: none;
  border-radius: 2px;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: #202123;
    cursor: pointer;
    border-radius: 50%;
  }
  
  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #202123;
    cursor: pointer;
    border-radius: 50%;
    border: none;
  }
`

export const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  font-size: 0.625rem;
  color: #202123;
`

export const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`

export const ResetButton = styled.button`
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: #8e8ea0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    color: #202123;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`

export const ColorPickerWrapper = styled.div`
  position: relative;
  display: inline-block;
`

export const ColorPickerInput = styled.input`
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #e5e5e7;
  border-radius: 0.25rem;
  cursor: pointer;
  background: transparent;
  
  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  
  &::-webkit-color-swatch {
    border: none;
    border-radius: 0.25rem;
  }
`

export const ToggleSwitch = styled.label`
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
    background-color: #e5e5e7;
    transition: .4s;
    border-radius: 34px;
    
    &:before {
      position: absolute;
      content: "";
      height: 12px;
      width: 12px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }
  
  input:checked + span {
    background-color: #202123;
  }
  
  input:checked + span:before {
    transform: translateX(14px);
  }
`

export const SelectDropdown = styled.select`
  width: 100%;
  padding: 0.25rem 0.5rem;
  border: 1px solid #e5e5e7;
  border-radius: 0.25rem;
  background-color: #ffffff;
  color: #202123;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f7f7f8;
  }
  
  &:focus {
    outline: none;
    border-color: #202123;
  }
`

export const ColorPicker = styled.input`
  width: 32px;
  height: 24px;
  border: 1px solid #e5e5e7;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  
  &::-webkit-color-swatch-wrapper {
    padding: 2px;
  }
  
  &::-webkit-color-swatch {
    border: none;
    border-radius: 2px;
  }
`