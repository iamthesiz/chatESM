/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import Rotate from '../../Rotate'
import { useStereo } from '../../../hooks/useStereo'
import { ToggleSwitch, Slider, SliderLabel, SliderRow, ResetButton } from './styled'

export const StereoControls: FC = () => {
  const [stereo, setStereo] = useStereo()

  return (
    <>
      <SliderLabel>
        <span>Stereo</span>
        <ToggleSwitch>
          <input
            type="checkbox"
            checked={stereo.enabled}
            onChange={(e) => {
              setStereo({ enabled: e.target.checked })
            }}
          />
          <span></span>
        </ToggleSwitch>
      </SliderLabel>

      {stereo.enabled && (
        <>
          <SliderLabel>
            <span>Eye Separation</span>
            <span>{stereo.eyeSeparation.toFixed(3)}</span>
          </SliderLabel>
          <SliderRow>
            <Slider
              type="range"
              min="0.02"
              max="0.1"
              step="0.003"
              value={stereo.eyeSeparation}
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                setStereo({ eyeSeparation: value })
              }}
            />
            <Rotate
              onClick={() => {
                setStereo({ eyeSeparation: 0.064 })
              }}
            >
              <ResetButton title="Reset eye separation">
                <FiRefreshCw />
              </ResetButton>
            </Rotate>
          </SliderRow>

          <SliderLabel>
            <span>Stereo Focus</span>
            <span>{stereo.focus.toFixed(1)}</span>
          </SliderLabel>
          <SliderRow>
            <Slider
              type="range"
              min="1"
              max="20"
              step="0.3"
              value={stereo.focus}
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                setStereo({ focus: value })
              }}
            />
            <Rotate
              onClick={() => {
                setStereo({ focus: 10 })
              }}
            >
              <ResetButton title="Reset stereo focus">
                <FiRefreshCw />
              </ResetButton>
            </Rotate>
          </SliderRow>
        </>
      )}
    </>
  )
}