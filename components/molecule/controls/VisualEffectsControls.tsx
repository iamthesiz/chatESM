/** @jsxImportSource @emotion/react */
import { FC, useState } from 'react'
import { useMolecule } from '../../../hooks/useMolecule'
import { ControlGroup, Label, ToggleSwitch, Slider, SliderLabel } from './styled'
import { OcclusionControls } from './OcclusionControls'
import { FogControls } from './FogControls'
import { ClippingControls } from './ClippingControls'
import { AnimationControls } from './AnimationControls'

export const VisualEffectsControls: FC = () => {
  const [, { setAppearance, setQuality }] = useMolecule()
  const [shadowsEnabled, setShadowsEnabled] = useState(false)
  const [outlineEnabled, setOutlineEnabled] = useState(false)
  const [outlineScale, setOutlineScale] = useState(1)

  return (
    <ControlGroup>
      <Label>Visual Effects</Label>

      <OcclusionControls />

      <SliderLabel>
        <span>Shadows</span>
        <ToggleSwitch>
          <input
            type="checkbox"
            checked={shadowsEnabled}
            onChange={(e) => {
              setShadowsEnabled(e.target.checked)
              setAppearance({
                shadows: e.target.checked
              })
            }}
          />
          <span></span>
        </ToggleSwitch>
      </SliderLabel>

      <SliderLabel>
        <span>Outline</span>
        <ToggleSwitch>
          <input
            type="checkbox"
            checked={outlineEnabled}
            onChange={(e) => {
              setOutlineEnabled(e.target.checked)
              setQuality({
                postprocessing: {
                  outline: {
                    enabled: e.target.checked,
                    scale: outlineScale
                  }
                }
              })
            }}
          />
          <span></span>
        </ToggleSwitch>
      </SliderLabel>

      {outlineEnabled && (
        <>
          <SliderLabel>
            <span>Outline Scale</span>
            <span>{outlineScale.toFixed(1)}</span>
          </SliderLabel>
          <Slider
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={outlineScale}
            onChange={(e) => {
              const value = parseFloat(e.target.value)
              setOutlineScale(value)
              setQuality({
                postprocessing: {
                  outline: {
                    enabled: true,
                    scale: value
                  }
                }
              })
            }}
          />
        </>
      )}

      <FogControls />
      <ClippingControls />
      <AnimationControls />
    </ControlGroup>
  )
}