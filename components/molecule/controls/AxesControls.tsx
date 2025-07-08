/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import Rotate from '../../Rotate'
import { useAxes } from '../../../hooks/useAxes'
import { ToggleSwitch, Slider, SliderLabel, SliderRow, ResetButton, ColorPickerInput } from './styled'

export const AxesControls: FC = () => {
  const [axes, setAxes] = useAxes()

  return (
    <>
      <SliderLabel>
        <span>Axes</span>
        <ToggleSwitch>
          <input
            type="checkbox"
            checked={axes.visible}
            onChange={(e) => {
              setAxes({ visible: e.target.checked })
            }}
          />
          <span></span>
        </ToggleSwitch>
      </SliderLabel>

      {axes.visible && (
        <>
          <SliderLabel>
            <span>Axes Opacity</span>
            <span>{Math.round(axes.opacity * 100)}%</span>
          </SliderLabel>
          <SliderRow>
            <Slider
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={axes.opacity}
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                setAxes({ opacity: value })
              }}
            />
            <Rotate
              onClick={() => {
                setAxes({ opacity: 0.51 })
              }}
            >
              <ResetButton title="Reset axes opacity">
                <FiRefreshCw />
              </ResetButton>
            </Rotate>
          </SliderRow>

          <SliderLabel>
            <span>Axes Scale</span>
            <span>{axes.scale.toFixed(1)}</span>
          </SliderLabel>
          <SliderRow>
            <Slider
              type="range"
              min="0.1"
              max="2.5"
              step="0.1"
              value={axes.scale}
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                setAxes({ scale: value })
              }}
            />
            <Rotate
              onClick={() => {
                setAxes({ scale: 0.33 })
              }}
            >
              <ResetButton title="Reset axes scale">
                <FiRefreshCw />
              </ResetButton>
            </Rotate>
          </SliderRow>

          <SliderLabel>
            <span>Axes Colors</span>
          </SliderLabel>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.625rem', width: '20px' }}>X:</span>
            <ColorPickerInput
              type="color"
              value={axes.x}
              onChange={(e) => {
                setAxes({ x: e.target.value })
              }}
            />
            <span style={{ fontSize: '0.625rem', width: '20px' }}>Y:</span>
            <ColorPickerInput
              type="color"
              value={axes.y}
              onChange={(e) => {
                setAxes({ y: e.target.value })
              }}
            />
            <span style={{ fontSize: '0.625rem', width: '20px' }}>Z:</span>
            <ColorPickerInput
              type="color"
              value={axes.z}
              onChange={(e) => {
                setAxes({ z: e.target.value })
              }}
            />
          </div>
          <div style={{ fontSize: '0.625rem', color: '#8e8ea0', marginBottom: '0.5rem' }}>
            Note: Stereo rendering may require specific browser/WebGL support
          </div>
        </>
      )}
    </>
  )
}