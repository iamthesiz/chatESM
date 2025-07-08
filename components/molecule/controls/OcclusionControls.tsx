/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled'
import { FC, useState } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import Rotate from '../../Rotate'
import { useMolecule } from '../../../hooks/useMolecule'
import { useToggles } from 'toggles'
import { ToggleSwitch, Slider, SliderLabel, SliderRow, ResetButton, ColorPicker } from './styled'

export const OcclusionControls: FC = () => {
  const [, { setQuality }] = useMolecule()
  const [{ occlusionToggle }, { toggle }] = useToggles(false)
  const [occlusionSettings, setOcclusionSettings] = useState({
    samples: 32,
    multiScale: {
      enabled: false,
      levels: [
        { radius: 2, blur: 1 },
        { radius: 4, blur: 1 },
        { radius: 8, blur: 1 },
        { radius: 16, blur: 1 }
      ],
      nearThreshold: 10,
      farThreshold: 1500
    },
    radius: 5,
    bias: 0.8,
    blurKernelSize: 15,
    blurDepthBias: 0.5,
    resolutionScale: 1,
    color: '#000000',
    transparentThreshold: 0.8
  })

  return (
    <>
      <SliderLabel>
        <span>Occlusion</span>
        <ToggleSwitch>
          <input
            type="checkbox"
            checked={occlusionToggle.isOn}
            onChange={(e) => {
              toggle(occlusionToggle)
              setQuality({
                occlusion: e.target.checked ? {
                  enabled: true,
                  ...occlusionSettings
                } : false
              })
            }}
          />
          <span></span>
        </ToggleSwitch>
      </SliderLabel>

      {occlusionToggle.isOn && (
        <>
          <SliderLabel>
            <span>Samples</span>
            <span>{occlusionSettings.samples}</span>
          </SliderLabel>
          <Slider
            type="range"
            min="1"
            max="256"
            step="1"
            value={occlusionSettings.samples}
            onChange={(e) => {
              const newSettings = { ...occlusionSettings, samples: parseInt(e.target.value) }
              setOcclusionSettings(newSettings)
              setQuality({
                occlusion: {
                  enabled: true,
                  ...newSettings
                }
              })
            }}
          />

          <SliderLabel>
            <span>Radius</span>
            <span>{occlusionSettings.radius.toFixed(1)}</span>
          </SliderLabel>
          <Slider
            type="range"
            min="0"
            max="20"
            step="0.1"
            value={occlusionSettings.radius}
            onChange={(e) => {
              const newSettings = { ...occlusionSettings, radius: parseFloat(e.target.value) }
              setOcclusionSettings(newSettings)
              setQuality({
                occlusion: {
                  enabled: true,
                  ...newSettings
                }
              })
            }}
          />

          <SliderLabel>
            <span>Bias</span>
            <span>{occlusionSettings.bias.toFixed(2)}</span>
          </SliderLabel>
          <SliderRow>
            <Slider
              type="range"
              min="0"
              max="3"
              step="0.01"
              value={occlusionSettings.bias}
              onChange={(e) => {
                const newSettings = { ...occlusionSettings, bias: parseFloat(e.target.value) }
                setOcclusionSettings(newSettings)
                setQuality({
                  occlusion: {
                    enabled: true,
                    ...newSettings
                  }
                })
              }}
            />
            <Rotate
              onClick={() => {
                const newSettings = { ...occlusionSettings, bias: 0.8 }
                setOcclusionSettings(newSettings)
                setQuality({
                  occlusion: {
                    enabled: true,
                    ...newSettings
                  }
                })
              }}
            >
              <ResetButton title="Reset bias">
                <FiRefreshCw />
              </ResetButton>
            </Rotate>
          </SliderRow>

          <SliderLabel>
            <span>Color</span>
            <ColorPicker
              type="color"
              value={occlusionSettings.color}
              onChange={(e) => {
                const newSettings = { ...occlusionSettings, color: e.target.value }
                setOcclusionSettings(newSettings)
                setQuality({
                  occlusion: {
                    enabled: true,
                    ...newSettings
                  }
                })
              }}
            />
          </SliderLabel>
        </>
      )}
    </>
  )
}