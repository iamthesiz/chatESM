/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled'
import { FC, useState } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import Rotate from '../../Rotate'
import { useMolecule } from '../../../hooks/useMolecule'

export const BackgroundControls: FC = () => {
  const [molecule, { setAppearance }] = useMolecule()
  const [brightnessAdjust, setBrightnessAdjust] = useState(0)

  return (
    <ControlGroup>
      <Label>Background</Label>
      <ButtonGroup>
        <SmallButton
          isActive={molecule.background === 'white'}
          onClick={() => setAppearance({ background: 'white' })}
        >
          White
        </SmallButton>
        <SmallButton
          isActive={molecule.background === 'black'}
          onClick={() => setAppearance({ background: 'black' })}
        >
          Black
        </SmallButton>
        <ColorPickerWrapper>
          <ColorPickerInput
            type="color"
            value={(() => {
              const bg = molecule.background
              if (bg === 'white') return '#ffffff'
              if (bg === 'black') return '#000000'
              if (bg === 'transparent') return '#ffffff'
              return bg.startsWith('#') ? bg : '#ffffff'
            })()}
            onChange={(e) => {
              setAppearance({ background: e.target.value })
            }}
          />
        </ColorPickerWrapper>
      </ButtonGroup>

      <SliderLabel style={{ marginTop: '12px' }}>
        <span>Brightness</span>
        <span>{brightnessAdjust > 0 ? `+${brightnessAdjust}` : brightnessAdjust}%</span>
      </SliderLabel>
      <SliderRow>
        <Slider
          type="range"
          min="-100"
          max="100"
          value={brightnessAdjust}
          onChange={(e) => {
            const value = parseInt(e.target.value)
            setBrightnessAdjust(value)
            if (value < 0) {
              setAppearance({
                postprocessing: {
                  lighten: Math.abs(value) / 100,
                  darken: undefined
                }
              })
            } else if (value > 0) {
              setAppearance({
                postprocessing: {
                  darken: value / 100,
                  lighten: undefined
                }
              })
            } else {
              setAppearance({
                postprocessing: {
                  lighten: undefined,
                  darken: undefined
                }
              })
            }
          }}
        />
        <Rotate
          onClick={() => {
            setBrightnessAdjust(0)
            setAppearance({
              postprocessing: {
                lighten: undefined,
                darken: undefined
              }
            })
          }}
        >
          <ResetButton title="Reset brightness">
            <FiRefreshCw />
          </ResetButton>
        </Rotate>
      </SliderRow>
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

const ColorPickerWrapper = styled.div`
  position: relative;
  display: inline-block;
`

const ColorPickerInput = styled.input`
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

const Slider = styled.input`
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

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  font-size: 0.625rem;
  color: #202123;
`

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`

const ResetButton = styled.button`
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