/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { useEffect, useState } from 'react'
import { useMolecule } from '../../hooks/useMolecule'
import { useSelection } from '../../hooks/useSelection'
import type { FC } from 'react'
import { NativeControlPanel } from './NativeControlPanel'
import { ScreenshotButton } from './ScreenshotButton'
import { SettingsAndControlsPanel } from './SettingsAndControlsPanel'
import { StructureTitle } from './StructureTitle'
import { MolstarCanvas } from '../MolstarCanvas'
import { FiTool, FiX, FiMenu } from 'react-icons/fi'
import { FaMousePointer } from 'react-icons/fa'
import useToggles from 'toggles'

export const MoleculeViewer: FC = () => {
  const [molecule] = useMolecule()

  const [selection, selectionManager] = useSelection()
  const [{ controlsPanel, nativePanel }, { toggle }] = useToggles('global')

  const [currentVersion, setCurrentVersion] = useState('v3')
  const [versions] = useState([
    { id: 'v0', name: 'v0', date: '2024-01-10' },
    { id: 'v1', name: 'v1', date: '2024-01-15' },
    { id: 'v2', name: 'v2', date: '2024-01-20' },
    { id: 'v3', name: 'v3', date: '2024-01-25' }
  ])

  // Load initial structure
  useEffect(() => {
    molecule.load({
      pdbId: '7D3T', // Rice protein complex structure
      preset: 'default',
      quality: 'medium',
      background: 'white',
      lighting: 'soft',
      protein: {
        style: 'cartoon',
        color: 'chain-id'
      },
      hideNativeControls: true
    })
  }, [])

  return (
    <Container>
      <Header>
        <StructureTitle />
        <Controls>
          <ControlButton onClick={() => molecule.fullscreen()}>
            Fullscreen
          </ControlButton>
          <ScreenshotButton />
          <VersionDropdown value={currentVersion} onChange={(e) => setCurrentVersion(e.target.value)}>
            {versions.map(version => (
              <option key={version.id} value={version.id}>
                {version.name}
              </option>
            ))}
          </VersionDropdown>
        </Controls>
      </Header>
      <ViewerContainer bgColor={molecule.background || 'white'}>
        <ViewerContent>
          {molecule.loading && (
            <LoadingOverlay>
              <LoadingText data-text="Loading structure...">Loading structure...</LoadingText>
            </LoadingOverlay>
          )}

          <MolstarCanvas
            style={{
              opacity: molecule.loading ? 0 : 1,
              transition: 'opacity 0.2s',
              width: '100%',
              height: '100%'
            }}
          />

          <ToolbarContainer>
            <ToolbarButton
              onClick={() => selectionManager.toggle()}
              title={selection.enabled ? 'Disable selection mode' : 'Enable selection mode'}
              isActive={selection.enabled}
            >
              <FaMousePointer />
              {selection.enabled && !selection.isEmpty && (
                <SelectionBadge>{selection.atoms.length}</SelectionBadge>
              )}
            </ToolbarButton>
            <ToolbarButton
              onClick={() => toggle(nativePanel)}
              title="Native Molstar Tools"
            >
              <FiTool />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => toggle(controlsPanel)}
              title={controlsPanel.isOpen ? 'Hide contols panel' : 'Show controls panel'}
            >
              {controlsPanel.isOpen ? <FiX /> : <FiMenu />}
            </ToolbarButton>
          </ToolbarContainer>
        </ViewerContent>

        <NativeControlPanel />

        <SettingsAndControlsPanel />
      </ViewerContainer>
    </Container >
  )
}

MoleculeViewer.displayName = 'MoleculeViewer'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`

const Header = styled.header`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e5e7;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`


const Controls = styled.div`
  display: flex;
  gap: 0.5rem;
`

const ControlButton = styled.button`
  padding: 0.375rem 0.75rem;
  border: 1px solid #e5e5e7;
  border-radius: 0.375rem;
  background-color: #ffffff;
  color: #202123;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f7f7f8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const VersionDropdown = styled.select`
  padding: 0.375rem 0.75rem;
  border: 1px solid #e5e5e7;
  border-radius: 0.375rem;
  background-color: #ffffff;
  color: #202123;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f7f7f8;
  }
`

const ViewerContainer = styled.div<{ bgColor: string }>`
  position: relative;
  flex: 1;
  overflow: hidden;
  background-color: ${props => {
    if (props.bgColor === 'transparent') return 'transparent'
    if (props.bgColor.startsWith('#')) return props.bgColor
    return props.bgColor
  }};
  /* Prevent layout shifts */
  min-height: 0;
  contain: layout size;
`

const ViewerContent = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  /* Prevent layout shifts */
  contain: layout size;
`

const ToolbarContainer = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 10;
`

const ToolbarButton = styled.button<{ isActive?: boolean }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background-color: ${props => props.isActive ? '#202123' : '#ffffff'};
  color: ${props => props.isActive ? '#ffffff' : '#202123'};
  border: 1px solid ${props => props.isActive ? '#202123' : '#e5e5e7'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background-color: ${props => props.isActive ? '#2a2b2e' : '#f7f7f8'};
  }

  svg {
    width: 1.125rem;
    height: 1.125rem;
  }
`

const SelectionBadge = styled.span`
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  background-color: #dc2626;
  color: white;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 0.625rem;
  min-width: 1.25rem;
  text-align: center;
`

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(2px);
  z-index: 20;
`

const shimmerAnimation = keyframes`
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
`

const LoadingText = styled.div`
  font-size: 1.125rem;
  color: #202123;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.6) 50%,
      transparent 100%
    );
    animation: ${shimmerAnimation} 1.5s infinite;
  }
`

