/** @jsxImportSource @emotion/react */
import { FC, useState } from 'react'
import { useCamera } from '../../../hooks/useCamera'
import { SliderLabel, ButtonGroup, SmallButton } from './styled'

export const AnimationControls: FC = () => {
  const [, setCamera] = useCamera()
  const [animationType, setAnimationType] = useState<'off' | 'spin' | 'rock'>('off')

  return (
    <>
      <SliderLabel>
        <span>Animation</span>
        <span>{animationType === 'off' ? 'Off' : animationType.charAt(0).toUpperCase() + animationType.slice(1)}</span>
      </SliderLabel>
      <ButtonGroup>
        <SmallButton
          isActive={animationType === 'off'}
          onClick={() => {
            setAnimationType('off')
            setCamera({ animation: 'off' })
          }}
        >
          Off
        </SmallButton>
        <SmallButton
          isActive={animationType === 'spin'}
          onClick={() => {
            setAnimationType('spin')
            setCamera({ animation: 'spin' })
          }}
        >
          Spin
        </SmallButton>
        <SmallButton
          isActive={animationType === 'rock'}
          onClick={() => {
            setAnimationType('rock')
            setCamera({ animation: 'rock' })
          }}
        >
          Rock
        </SmallButton>
      </ButtonGroup>
    </>
  )
}