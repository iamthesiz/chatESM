/** @jsxImportSource @emotion/react */
import { useState } from 'react'
import styled from '@emotion/styled'
import { Noun, useToggles } from 'toggles'
import { FaCube, FaPalette, FaDna } from 'react-icons/fa'
import { MdLayers } from 'react-icons/md'
import { FiX } from 'react-icons/fi'
import { TooltipContext } from './IconButtonWithTooltip'
import { ComponentsPanel } from './ComponentsPanel'
import { SequenceViewer } from './SequenceViewer'
import { QuickStylesControls } from './native/QuickStylesControls'
import { StructureControls } from './native/StructureControls'
import { StructureTypeControls } from './native/StructureTypeControls'
import { Container, Section, SectionTitle } from './native/styled'

interface NativeControlPanelProps {
  id?: string
  nativePanel: Noun
}

export function NativeControlPanel({ id, nativePanel }: NativeControlPanelProps) {
  const [{ structure, quickStyles, components, sequenceViewer }, { toggle, close }] = useToggles(true, true, true, true)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  return (
    <Panel isOpen={nativePanel.isOpen}>
      <PanelHeader>
        <PanelTitle>Native Molstar Tools</PanelTitle>
        <CloseButton onClick={() => close(nativePanel)}><FiX size={20} /></CloseButton>
      </PanelHeader>
      <PanelContent>
        <TooltipContext.Provider value={{ activeTooltip, setActiveTooltip }}>
          <Container>
            <Section>
              <SectionTitle onClick={() => toggle(sequenceViewer)}>
                <FaDna />
                Sequence Viewer
                <span style={{ marginLeft: 'auto' }}>{sequenceViewer.isOn ? '−' : '+'}</span>
              </SectionTitle>
              {sequenceViewer.isOn && <SequenceViewer molstarId={id} />}
            </Section>

            <Section>
              <SectionTitle onClick={() => toggle(quickStyles)}>
                <FaPalette />
                Quick Styles
                <span style={{ marginLeft: 'auto' }}>{quickStyles.isOn ? '−' : '+'}</span>
              </SectionTitle>
              {quickStyles.isOn && <QuickStylesControls id={id} />}
            </Section>

            <Section>
              <SectionTitle onClick={() => toggle(components)}>
                <MdLayers />
                Components
                <span style={{ marginLeft: 'auto' }}>{components.isOn ? '−' : '+'}</span>
              </SectionTitle>
              {components.isOn && <ComponentsPanel id={id} />}
            </Section>

            <StructureTypeControls id={id} />

            <Section>
              <SectionTitle onClick={() => toggle(structure)}>
                <FaCube />
                Structure
                <span style={{ marginLeft: 'auto' }}>{structure.isOn ? '−' : '+'}</span>
              </SectionTitle>
              {structure.isOn && <StructureControls id={id} />}
            </Section>
          </Container>
        </TooltipContext.Provider>
      </PanelContent>
    </Panel>
  )
}

const Panel = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 0;
  right: ${props => props.isOpen ? '0' : '-400px'};
  width: 400px;
  height: 100%;
  background: white;
  border-left: 1px solid #e5e5e7;
  transition: right 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  z-index: 15;
`

const PanelHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e5e5e7;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
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
  flex: 1;
  overflow-y: auto;
`
