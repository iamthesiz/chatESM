/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import Rotate from '../../Rotate'
import { useCamera } from '../../../hooks/useCamera'
import { ControlGroup, Label, SliderLabel, ButtonGroup, SmallButton, Slider, SliderRow, ResetButton } from './styled'
import { AxesControls } from './AxesControls'
import { StereoControls } from './StereoControls'

interface CameraSettingsControlsProps {
  id?: string
}

export const CameraSettingsControls: FC<CameraSettingsControlsProps> = ({ id }) => {
  const [camera, setCamera] = useCamera(id)

  return (
    <ControlGroup>
      <Label>Camera</Label>

      <SliderLabel>
        <span>Projection</span>
        <span>{camera.mode === 'perspective' ? 'Perspective' : 'Orthographic'}</span>
      </SliderLabel>
      <ButtonGroup>
        <SmallButton
          isActive={camera.mode === 'perspective'}
          onClick={() => {
            setCamera({ mode: 'perspective' })
          }}
        >
          Perspective
        </SmallButton>
        <SmallButton
          isActive={camera.mode === 'orthographic'}
          onClick={() => {
            setCamera({ mode: 'orthographic' })
          }}
        >
          Orthographic
        </SmallButton>
      </ButtonGroup>

      <AxesControls id={id} />
      <StereoControls id={id} />

      <SliderLabel>
        <span>Field of View</span>
        <span>{camera.fov}°</span>
      </SliderLabel>
      <SliderRow>
        <Slider
          type="range"
          min="10"
          max="130"
          step="1"
          value={camera.fov}
          onChange={(e) => {
            const value = parseInt(e.target.value)
            setCamera({ fov: value })
          }}
        />
        <Rotate
          onClick={() => {
            setCamera({ fov: 45 })
          }}
        >
          <ResetButton title="Reset field of view">
            <FiRefreshCw />
          </ResetButton>
        </Rotate>
      </SliderRow>
    </ControlGroup>
  )
}