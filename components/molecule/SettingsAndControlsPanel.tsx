/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled'
import { FiX } from 'react-icons/fi'
import { Noun, useVerbs } from 'toggles'
import type { FC } from 'react'
import { CameraControls } from './controls/CameraControls'
import { BackgroundControls } from './controls/BackgroundControls'
import { VisualEffectsControls } from './controls/VisualEffectsControls'
import { QualityControls } from './controls/QualityControls'
import { SelectionModeControls } from './controls/SelectionModeControls'
import { CameraSettingsControls } from './controls/CameraSettingsControls'

interface Props {
  id?: string
  controlsPanel: Noun
}

export const SettingsAndControlsPanel: FC<Props> = ({ id, controlsPanel }) => {
  const { close } = useVerbs()

  return (
    <Panel isOpen={controlsPanel.isOpen}>
      <PanelHeader>
        <PanelTitle>Settings & Controls</PanelTitle>
        <CloseButton onClick={() => close(controlsPanel)}><FiX size={20} /></CloseButton>
      </PanelHeader>
      <PanelContent>
        <CameraControls id={id} />
        <BackgroundControls id={id} />
        <VisualEffectsControls id={id} />
        <QualityControls id={id} />
        <SelectionModeControls id={id} />
        <CameraSettingsControls id={id} />
      </PanelContent>
    </Panel>
  )
}

const Panel = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 0;
  right: ${props => props.isOpen ? '0' : '-280px'};
  width: 280px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  border-left: 1px solid #e5e5e7;
  background-color: #ffffff;
  padding-top: 1rem;
  box-sizing: border-box;
  z-index: 15;
  transition: right 0.3s ease-in-out;
  
  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f7f7f8;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #d5d5d7;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #b5b5b7;
  }
`

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem 1rem 1rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid #e5e5e7;
`

const PanelTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #202123;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;

  &:hover {
    color: #202123;
  }
`

const PanelContent = styled.div`
  padding: 0 1rem 1rem 1rem;
`
