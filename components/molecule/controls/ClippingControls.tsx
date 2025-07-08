/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { useClipping } from '../../../hooks/useClipping'
import { ToggleSwitch, Slider, SliderLabel } from './styled'

export const ClippingControls: FC = () => {
  const [clipping, setClipping] = useClipping()

  return (
    <>
      <SliderLabel>
        <span>Clipping</span>
        <span>{clipping.radius}%</span>
      </SliderLabel>
      <Slider
        type="range"
        min="0"
        max="99"
        value={clipping.radius}
        onChange={(e) => setClipping({ radius: parseInt(e.target.value) })}
      />

      {clipping.radius > 0 && (
        <>
          <SliderLabel>
            <span>Far</span>
            <ToggleSwitch>
              <input
                type="checkbox"
                checked={clipping.clipFar}
                onChange={(e) => setClipping({ clipFar: e.target.checked })}
              />
              <span></span>
            </ToggleSwitch>
          </SliderLabel>

          <SliderLabel>
            <span>Min Near</span>
            <span>{clipping.minNear.toFixed(1)}</span>
          </SliderLabel>
          <Slider
            type="range"
            min="0.1"
            max="100"
            step="0.1"
            value={clipping.minNear}
            onChange={(e) => setClipping({ minNear: parseFloat(e.target.value) })}
          />
        </>
      )}
    </>
  )
}
