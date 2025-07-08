/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled'
import { FC } from 'react'
import { useFog } from '../../../hooks/useFog'
import { ToggleSwitch, Slider, SliderLabel } from './styled'

export const FogControls: FC = () => {
  const [fog, setFog] = useFog()
  return (
    <>
      <SliderLabel>
        <span>Fog</span>
        <ToggleSwitch>
          <input
            type="checkbox"
            checked={fog.enabled}
            onChange={(e) => {
              setFog({ enabled: e.target.checked })
            }}
          />
          <span></span>
        </ToggleSwitch>
      </SliderLabel>

      {fog.enabled && (
        <>
          <SliderLabel>
            <span>Intensity</span>
            <span>{fog.intensity}</span>
          </SliderLabel>
          <Slider
            type="range"
            min="1"
            max="100"
            value={fog.intensity}
            onChange={(e) => {
              const value = parseInt(e.target.value)
              setFog({ intensity: value })
            }}
          />
        </>
      )}
    </>
  )
}