/** @jsxImportSource @emotion/react */
import { FC } from 'react'
import { useCamera } from '../../../hooks/useCamera'
import { SliderLabel, ButtonGroup, SmallButton } from './styled'

export const AnimationControls: FC = () => {
  const [{ animation }, setCamera] = useCamera()

  return (
    <>
      <SliderLabel>
        <span>Animation</span>
        <span>{animation.type === 'off' ? 'Off' : animation.type.charAt(0).toUpperCase() + animation.type.slice(1)}</span>
      </SliderLabel>
      <ButtonGroup>
        <SmallButton
          isActive={animation.type === 'off'}
          onClick={() => setCamera({ animation: 'off' })}
        >
          Off
        </SmallButton>
        <SmallButton
          isActive={animation.type === 'spin'}
          onClick={() => setCamera({ animation: 'spin' })}
        >
          Spin
        </SmallButton>
        <SmallButton
          isActive={animation.type === 'rock'}
          onClick={() => setCamera({ animation: 'rock' })}
        >
          Rock
        </SmallButton>
      </ButtonGroup>
    </>
  )
}
