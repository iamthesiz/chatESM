import styled from '@emotion/styled'
import { keyframes } from '@emotion/react'
import { useEffect, useState, useRef, useMemo } from 'react'
import { useMolstar } from '../../hooks/useMolstar'
import type { FC } from 'react'
import { NativeControlPanel } from './NativeControlPanel'
import { FiTool, FiRefreshCw, FiX, FiMenu } from 'react-icons/fi'
import Rotate from '../Rotate'

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

const Title = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: #202123;
  margin: 0;
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

const ViewerContainer = styled.div<{ bgColor?: string }>`
  flex: 1;
  position: relative;
  background-color: ${props => {
    if (props.bgColor === 'transparent') return 'transparent';
    if (props.bgColor === 'black') return '#000000';
    if (props.bgColor === 'white') return '#ffffff';
    return props.bgColor || '#ffffff';
  }};
  display: flex;
  width: 100%;
  overflow: hidden;
`

const ViewerContent = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  min-width: 0;
`

const NativePanelSidebar = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 0;
  right: ${props => props.isOpen ? '0' : '-400px'};
  width: 400px;
  height: 100%;
  background: white;
  border-left: 1px solid #e5e5e7;
  transition: right 0.3s ease;
  z-index: 20;
  display: flex;
  flex-direction: column;
  box-shadow: ${props => props.isOpen ? '-2px 0 8px rgba(0, 0, 0, 0.1)' : 'none'};
  pointer-events: ${props => props.isOpen ? 'auto' : 'none'};
`

const NativePanelHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e5e5e7;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
  
  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #202123;
  }
`

const NativePanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
`

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #718096;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #202123;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`

const NativeToolsButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 4rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 0.95);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background-color: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  svg {
    width: 20px;
    height: 20px;
    color: #4a5568;
  }
`

const HamburgerButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #202123;
  
  &:hover {
    background-color: rgba(255, 255, 255, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`

const ControlsPanel = styled.div`
  width: 280px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  border-left: 1px solid #e5e5e7;
  background-color: #ffffff;
  padding: 1rem;
  box-sizing: border-box;
  flex-shrink: 0;
  
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

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 10;
`

const shimmer = keyframes`
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
`

const LoadingText = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-block;
  color: #8e8ea0;
  background: linear-gradient(
    90deg,
    #8e8ea0 0%,
    #8e8ea0 20%,
    #c5c5d2 50%,
    #8e8ea0 80%,
    #8e8ea0 100%
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ${shimmer} 2s linear infinite;
`

const MolstarContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  
  .msp-plugin {
    width: 100% !important;
    height: 100% !important;
  }
`

const ControlGroup = styled.div`
  margin-bottom: 1.5rem;
`

const Label = styled.label`
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #8e8ea0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
`

const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`

const SmallButton = styled.button<{ isActive?: boolean }>`
  padding: 0.25rem 0.5rem;
  border: 1px solid ${props => props.isActive ? '#202123' : '#e5e5e7'};
  border-radius: 0.25rem;
  background-color: ${props => props.isActive ? '#202123' : '#ffffff'};
  color: ${props => props.isActive ? '#ffffff' : '#202123'};
  font-size: 0.625rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.isActive ? '#202123' : '#f7f7f8'};
  }
`

const ColorPickerWrapper = styled.div`
  position: relative;
  display: inline-block;
`

const ColorPickerInput = styled.input`
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid #e5e5e7;
  border-radius: 0.25rem;
  cursor: pointer;
  background: transparent;
  
  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  
  &::-webkit-color-swatch {
    border: none;
    border-radius: 0.25rem;
  }
`

const Slider = styled.input`
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #e5e5e7;
  outline: none;
  border-radius: 2px;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    background: #202123;
    cursor: pointer;
    border-radius: 50%;
  }
  
  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: #202123;
    cursor: pointer;
    border-radius: 50%;
    border: none;
  }
`

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  font-size: 0.625rem;
  color: #202123;
`

const SliderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
`

const ResetButton = styled.button`
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: #8e8ea0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    color: #202123;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`

const ColorPicker = styled.input`
  width: 32px;
  height: 24px;
  border: 1px solid #e5e5e7;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  
  &::-webkit-color-swatch-wrapper {
    padding: 2px;
  }
  
  &::-webkit-color-swatch {
    border: none;
    border-radius: 2px;
  }
`

const LevelItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px;
  background: #f7f7f8;
  border-radius: 4px;
`

const LevelInput = styled.input`
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #e5e5e7;
  border-radius: 4px;
  font-size: 12px;
`

const RemoveButton = styled.button`
  background: transparent;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #c82333;
  }
`

const AddButton = styled.button`
  width: 100%;
  padding: 6px 12px;
  border: 1px solid #e5e5e7;
  border-radius: 4px;
  background: #fff;
  color: #666;
  cursor: pointer;
  font-size: 12px;
  margin-top: 8px;
  
  &:hover {
    background: #f7f7f8;
  }
`

const ScreenshotDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e5e5e7;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 280px;
`

const ScreenshotPreview = styled.div`
  width: 100%;
  height: 150px;
  border: 1px solid #e5e5e7;
  border-radius: 4px;
  margin-bottom: 12px;
  overflow: hidden;
  background: #f7f7f8;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
`

const ScreenshotOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const ScreenshotRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

const ScreenshotButton = styled.button`
  flex: 1;
  padding: 8px 16px;
  border: 1px solid #e5e5e7;
  border-radius: 4px;
  background: white;
  color: #333;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover {
    background: #f7f7f8;
  }
  
  &:active {
    background: #e5e5e7;
  }
`

const FormatSelect = styled.select`
  padding: 6px 12px;
  border: 1px solid #e5e5e7;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
`

const SelectDropdown = styled.select`
  width: 100%;
  padding: 0.25rem 0.5rem;
  border: 1px solid #e5e5e7;
  border-radius: 0.25rem;
  background-color: #ffffff;
  color: #202123;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f7f7f8;
  }
  
  &:focus {
    outline: none;
    border-color: #202123;
  }
`

const SequenceViewer = styled.div`
  font-family: monospace;
  font-size: 0.75rem;
  line-height: 1.6;
  background-color: #f7f7f8;
  padding: 0.75rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #e5e5e7;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #d5d5d7;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #b5b5b7;
  }
`

const ResidueSpan = styled.span<{ isSelected?: boolean; isHighlighted?: boolean }>`
  cursor: pointer;
  padding: 0 1px;
  border-radius: 2px;
  transition: all 0.2s;
  
  ${props => props.isSelected && `
    background-color: #202123;
    color: #ffffff;
  `}
  
  ${props => props.isHighlighted && !props.isSelected && `
    background-color: #e3f2fd;
    color: #1976d2;
  `}
  
  &:hover {
    background-color: ${props => props.isSelected ? '#202123' : '#d1d1d3'};
    color: ${props => props.isSelected ? '#ffffff' : '#202123'};
  }
`

const SequenceInfo = styled.div`
  font-size: 0.625rem;
  color: #8e8ea0;
  margin-top: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const DropdownWrapper = styled.div`
  position: relative;
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
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23202123' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  padding-right: 2rem;

  &:hover {
    background-color: #f7f7f8;
  }
  
  &:focus {
    outline: none;
    border-color: #202123;
  }
`

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #e5e5e7;
    transition: .4s;
    border-radius: 34px;
    
    &:before {
      position: absolute;
      content: "";
      height: 12px;
      width: 12px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
  }
  
  input:checked + span {
    background-color: #202123;
  }
  
  input:checked + span:before {
    transform: translateX(14px);
  }
`

export const MoleculeViewer: FC = () => {
  const [molecule, { setAppearance, setSelection, setGranularity, setQuality, setCamera, setStylePreset, setRepresentationPreset }] = useMolstar('main-viewer')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showNativePanel, setShowNativePanel] = useState(false)
  const nativePanelRef = useRef<HTMLDivElement>(null)

  // Debug mounting/unmounting
  useEffect(() => {
    console.log('MoleculeViewer mounted')
    return () => {
      console.log('MoleculeViewer unmounted')
    }
  }, [])

  // Get current state from molecule
  const activeBackground = molecule.background || 'white'
  const activeQuality = molecule.quality?.level || 'medium'

  // Local state for visual effects
  const [customColor, setCustomColor] = useState('#ffffff')
  const [brightnessAdjust, setBrightnessAdjust] = useState(0) // -100 to 100, 0 is neutral
  const [currentVersion, setCurrentVersion] = useState('v3')
  const [versions] = useState([
    { id: 'v0', name: 'v0', date: '2024-01-10' },
    { id: 'v1', name: 'v1', date: '2024-01-15' },
    { id: 'v2', name: 'v2', date: '2024-01-20' },
    { id: 'v3', name: 'v3', date: '2024-01-25' }
  ])
  const [occlusionEnabled, setOcclusionEnabled] = useState(false)
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
  const [shadowsEnabled, setShadowsEnabled] = useState(false)
  const [outlineEnabled, setOutlineEnabled] = useState(false)
  const [outlineScale, setOutlineScale] = useState(1)
  const [dofEnabled, setDofEnabled] = useState(false)
  const [dofSettings, setDofSettings] = useState({
    blurSize: 9,
    blurSpread: 1.0,
    inFocus: 0.0,
    ppm: 20.0,
    center: 'camera-target' as 'camera-target' | 'scene-center',
    mode: 'plane' as 'plane' | 'sphere'
  })
  const [fogEnabled, setFogEnabled] = useState(false)
  const [fogIntensity, setFogIntensity] = useState(15)  // Molstar default
  const [clippingRadius, setClippingRadius] = useState(0)  // 0 = no clipping
  const [clippingFar, setClippingFar] = useState(true)
  const [clippingMinNear, setClippingMinNear] = useState(5)
  const [animationType, setAnimationType] = useState<'off' | 'spin' | 'rock'>('off')

  // Screenshot state
  const [showScreenshotDropdown, setShowScreenshotDropdown] = useState(false)
  const [screenshotFormat, setScreenshotFormat] = useState<'png' | 'jpeg' | 'webp'>('png')
  const [screenshotTransparent, setScreenshotTransparent] = useState(false)
  const [screenshotAxes, setScreenshotAxes] = useState(false)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [copyButtonText, setCopyButtonText] = useState('Copy')
  const screenshotDropdownRef = useRef<HTMLDivElement>(null)

  // Camera state
  const [cameraMode, setCameraMode] = useState<'perspective' | 'orthographic'>('perspective')
  const [axesEnabled, setAxesEnabled] = useState(false)
  const [axesOpacity, setAxesOpacity] = useState(0.51) // Default from Molstar
  const [axesScale, setAxesScale] = useState(0.33) // Default from Molstar
  const [axesColorX, setAxesColorX] = useState('#ff0000') // red
  const [axesColorY, setAxesColorY] = useState('#00ff00') // green
  const [axesColorZ, setAxesColorZ] = useState('#0000ff') // blue
  const [stereoEnabled, setStereoEnabled] = useState(false)
  const [eyeSeparation, setEyeSeparation] = useState(0.064)
  const [stereoFocus, setStereoFocus] = useState(10)
  const [fieldOfView, setFieldOfView] = useState(45)


  // Click outside handler for screenshot dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (screenshotDropdownRef.current && !screenshotDropdownRef.current.contains(event.target as Node)) {
        setShowScreenshotDropdown(false)
      }
    }

    if (showScreenshotDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showScreenshotDropdown])

  // Load initial structure once initialized
  useEffect(() => {
    if (molecule.isInitialized && !loaded) {
      setLoading(true)
      molecule.load({
        pdbId: '1tqn',
        preset: 'default',
        quality: 'medium',
        background: 'white',
        lighting: 'soft',
        protein: {
          style: 'cartoon',
          color: 'by-chain'
        },
        hideNativeControls: true
      }).then(() => {
        setLoaded(true)
        setLoading(false)
      }).catch(err => {
        console.error('Failed to load structure:', err)
        setLoading(false)
      })
    }
  }, [molecule, molecule.isInitialized, loaded])

  return (
    <Container>
      <Header>
        <Title>1TQN - Trypsin-BPTI Complex</Title>
        <Controls>
          <ControlButton onClick={() => molecule.fullscreen()}>
            Fullscreen
          </ControlButton>
          <DropdownWrapper ref={screenshotDropdownRef}>
            <ControlButton onClick={() => {
              if (!showScreenshotDropdown) {
                // Generate preview
                molecule.screenshot({
                  download: false,
                  transparent: screenshotTransparent
                }).then((dataUrl: string | void) => {
                  if (dataUrl && typeof dataUrl === 'string') {
                    setScreenshotPreview(dataUrl)
                  }
                })
              }
              setShowScreenshotDropdown(!showScreenshotDropdown)
            }}>
              Screenshot
            </ControlButton>

            {showScreenshotDropdown && (
              <ScreenshotDropdown>
                {screenshotPreview && (
                  <ScreenshotPreview>
                    <img src={screenshotPreview} alt="Screenshot preview" />
                  </ScreenshotPreview>
                )}

                <ScreenshotOptions>
                  <ScreenshotRow>
                    <span>Format:</span>
                    <FormatSelect
                      value={screenshotFormat}
                      onChange={(e) => setScreenshotFormat(e.target.value as 'png' | 'jpeg' | 'webp')}
                    >
                      <option value="png">PNG</option>
                      <option value="jpeg">JPEG</option>
                      <option value="webp">WebP</option>
                    </FormatSelect>
                  </ScreenshotRow>

                  <ScreenshotRow>
                    <span>Transparent:</span>
                    <ToggleSwitch>
                      <input
                        type="checkbox"
                        checked={screenshotTransparent}
                        onChange={(e) => {
                          setScreenshotTransparent(e.target.checked)
                          // Update preview
                          molecule.screenshot({
                            download: false,
                            transparent: e.target.checked
                          }).then((dataUrl: string | void) => {
                            if (dataUrl && typeof dataUrl === 'string') {
                              setScreenshotPreview(dataUrl)
                            }
                          })
                        }}
                      />
                      <span></span>
                    </ToggleSwitch>
                  </ScreenshotRow>

                  <ScreenshotRow>
                    <span>Axes:</span>
                    <ToggleSwitch>
                      <input
                        type="checkbox"
                        checked={screenshotAxes}
                        onChange={(e) => {
                          setScreenshotAxes(e.target.checked)
                          // Apply axes visibility temporarily for preview
                          setCamera({
                            axes: {
                              ...((molecule as any).state?.camera?.axes || {}),
                              enabled: e.target.checked
                            }
                          })
                          // Update preview
                          setTimeout(() => {
                            molecule.screenshot({
                              download: false,
                              transparent: screenshotTransparent
                            }).then((dataUrl: string | void) => {
                              if (dataUrl && typeof dataUrl === 'string') {
                                setScreenshotPreview(dataUrl)
                              }
                            })
                          }, 100)
                        }}
                      />
                      <span></span>
                    </ToggleSwitch>
                  </ScreenshotRow>

                  <ScreenshotRow>
                    <ScreenshotButton onClick={async () => {
                      try {
                        setCopyButtonText('Copied!')
                        await molecule.copyScreenshot({
                          transparent: screenshotTransparent,
                          format: screenshotFormat,
                          axes: screenshotAxes
                        })
                        setTimeout(() => {
                          setCopyButtonText('Copy')
                        }, 1500)
                      } catch (err) {
                        console.error('Failed to copy screenshot:', err)
                      }
                    }}>
                      {copyButtonText}
                    </ScreenshotButton>

                    <ScreenshotButton onClick={async () => {
                      await molecule.downloadScreenshot({
                        transparent: screenshotTransparent,
                        format: screenshotFormat,
                        axes: screenshotAxes,
                        filename: `molecule-${Date.now()}.${screenshotFormat}`
                      })
                      setShowScreenshotDropdown(false)
                    }}>
                      Download
                    </ScreenshotButton>
                  </ScreenshotRow>
                </ScreenshotOptions>
              </ScreenshotDropdown>
            )}
          </DropdownWrapper>
          <VersionDropdown
            value={currentVersion}
            onChange={(e) => {
              setCurrentVersion(e.target.value)
              // Here you would typically load a different version of the structure
              console.log('Switching to version:', e.target.value)
            }}
          >
            {versions.map(version => (
              <option key={version.id} value={version.id}>
                {version.name}
              </option>
            ))}
          </VersionDropdown>
        </Controls>
      </Header>
      <ViewerContainer bgColor={activeBackground}>
        <ViewerContent>
          {loading && (
            <LoadingOverlay>
              <LoadingText data-text="Loading structure...">Loading structure...</LoadingText>
            </LoadingOverlay>
          )}
          <MolstarContainer ref={molecule.ref} />
          <NativeToolsButton
            onClick={() => setShowNativePanel(!showNativePanel)}
            title="Native Molstar Tools"
          >
            <FiTool />
          </NativeToolsButton>
          <HamburgerButton
            onClick={() => setShowControls(!showControls)}
            title={showControls ? 'Hide controls panel' : 'Show controls panel'}
          >
            {showControls ? <FiX /> : <FiMenu />}
          </HamburgerButton>
        </ViewerContent>

        {/* Native Tools Panel */}
        <NativePanelSidebar isOpen={showNativePanel} ref={nativePanelRef}>
          <NativePanelHeader>
            <h3>Native Molstar Tools</h3>
            <CloseButton onClick={() => setShowNativePanel(false)}>
              <FiX size={20} />
            </CloseButton>
          </NativePanelHeader>
          <NativePanelContent>
            <NativeControlPanel
              molecule={molecule}
              setAppearance={setAppearance}
              setStylePreset={setStylePreset}
              setRepresentationPreset={setRepresentationPreset}
            />
          </NativePanelContent>
        </NativePanelSidebar>

        {showControls && (
          <ControlsPanel>
            <ControlGroup>
              <Label>Camera Controls</Label>
              <ButtonGroup>
                <SmallButton onClick={() => molecule.resetZoom()}>
                  Reset Zoom
                </SmallButton>
                <SmallButton onClick={() => molecule.orientAxes()}>
                  Orient Axes
                </SmallButton>
                <SmallButton onClick={() => molecule.resetAxes()}>
                  Reset Axes
                </SmallButton>
              </ButtonGroup>
            </ControlGroup>

            <ControlGroup>
              <Label>Background</Label>
              <ButtonGroup>
                <SmallButton
                  isActive={molecule.background === 'white'}
                  onClick={() => {
                    setAppearance({ background: 'white' })
                  }}
                >
                  White
                </SmallButton>
                <SmallButton
                  isActive={molecule.background === 'black'}
                  onClick={() => {
                    setAppearance({ background: 'black' })
                  }}
                >
                  Black
                </SmallButton>
                <ColorPickerWrapper>
                  <ColorPickerInput
                    type="color"
                    value={(() => {
                      const bg = molecule.background
                      if (bg === 'white') return '#ffffff'
                      if (bg === 'black') return '#000000'
                      if (bg === 'transparent') return '#ffffff'
                      return bg.startsWith('#') ? bg : '#ffffff'
                    })()}
                    onChange={(e) => {
                      setCustomColor(e.target.value)
                      setAppearance({ background: e.target.value })
                    }}
                  />
                </ColorPickerWrapper>
              </ButtonGroup>

              <SliderLabel style={{ marginTop: '12px' }}>
                <span>Brightness</span>
                <span>{brightnessAdjust > 0 ? `+${brightnessAdjust}` : brightnessAdjust}%</span>
              </SliderLabel>
              <SliderRow>
                <Slider
                  type="range"
                  min="-100"
                  max="100"
                  value={brightnessAdjust}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    setBrightnessAdjust(value)
                    if (value < 0) {
                      // Negative values lighten
                      setAppearance({
                        postprocessing: {
                          lighten: Math.abs(value) / 100,
                          darken: undefined
                        }
                      })
                    } else if (value > 0) {
                      // Positive values darken
                      setAppearance({
                        postprocessing: {
                          darken: value / 100,
                          lighten: undefined
                        }
                      })
                    } else {
                      // Zero resets both
                      setAppearance({
                        postprocessing: {
                          lighten: undefined,
                          darken: undefined
                        }
                      })
                    }
                  }}
                />
                <Rotate
                  onClick={() => {
                    setBrightnessAdjust(0)
                    setAppearance({
                      postprocessing: {
                        lighten: undefined,
                        darken: undefined
                      }
                    })
                  }}
                >
                  <ResetButton title="Reset brightness">
                    <FiRefreshCw />
                  </ResetButton>
                </Rotate>
              </SliderRow>
            </ControlGroup>

            <ControlGroup>
              <Label>Visual Effects</Label>

              <SliderLabel>
                <span>Occlusion</span>
                <ToggleSwitch>
                  <input
                    type="checkbox"
                    checked={occlusionEnabled}
                    onChange={(e) => {
                      setOcclusionEnabled(e.target.checked)
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

              {occlusionEnabled && (
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
                    <span>Blur Kernel Size</span>
                    <span>{occlusionSettings.blurKernelSize}</span>
                  </SliderLabel>
                  <SliderRow>
                    <Slider
                      type="range"
                      min="1"
                      max="25"
                      step="1"
                      value={occlusionSettings.blurKernelSize}
                      onChange={(e) => {
                        const newSettings = { ...occlusionSettings, blurKernelSize: parseInt(e.target.value) }
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
                        const newSettings = { ...occlusionSettings, blurKernelSize: 15 }
                        setOcclusionSettings(newSettings)
                        setQuality({
                          occlusion: {
                            enabled: true,
                            ...newSettings
                          }
                        })
                      }}
                    >
                      <ResetButton title="Reset blur kernel size">
                        <FiRefreshCw />
                      </ResetButton>
                    </Rotate>
                  </SliderRow>

                  <SliderLabel>
                    <span>Blur Depth Bias</span>
                    <span>{occlusionSettings.blurDepthBias.toFixed(2)}</span>
                  </SliderLabel>
                  <Slider
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={occlusionSettings.blurDepthBias}
                    onChange={(e) => {
                      const newSettings = { ...occlusionSettings, blurDepthBias: parseFloat(e.target.value) }
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
                    <span>Resolution Scale</span>
                    <span>{occlusionSettings.resolutionScale.toFixed(2)}</span>
                  </SliderLabel>
                  <Slider
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.01"
                    value={occlusionSettings.resolutionScale}
                    onChange={(e) => {
                      const newSettings = { ...occlusionSettings, resolutionScale: parseFloat(e.target.value) }
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
                    <span>Transparent Threshold</span>
                    <span>{occlusionSettings.transparentThreshold.toFixed(2)}</span>
                  </SliderLabel>
                  <Slider
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={occlusionSettings.transparentThreshold}
                    onChange={(e) => {
                      const newSettings = { ...occlusionSettings, transparentThreshold: parseFloat(e.target.value) }
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

                  <SliderLabel>
                    <span>Multi Scale</span>
                    <ToggleSwitch>
                      <input
                        type="checkbox"
                        checked={occlusionSettings.multiScale.enabled}
                        onChange={(e) => {
                          const newSettings = {
                            ...occlusionSettings,
                            multiScale: { ...occlusionSettings.multiScale, enabled: e.target.checked }
                          }
                          setOcclusionSettings(newSettings)
                          setQuality({
                            occlusion: {
                              enabled: true,
                              ...newSettings
                            }
                          })
                        }}
                      />
                      <span></span>
                    </ToggleSwitch>
                  </SliderLabel>

                  {occlusionSettings.multiScale.enabled && (
                    <>
                      <SliderLabel>
                        <span>Near Threshold</span>
                        <span>{occlusionSettings.multiScale.nearThreshold}</span>
                      </SliderLabel>
                      <Slider
                        type="range"
                        min="0"
                        max="50"
                        step="0.5"
                        value={occlusionSettings.multiScale.nearThreshold}
                        onChange={(e) => {
                          const newSettings = {
                            ...occlusionSettings,
                            multiScale: { ...occlusionSettings.multiScale, nearThreshold: parseFloat(e.target.value) }
                          }
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
                        <span>Far Threshold</span>
                        <span>{occlusionSettings.multiScale.farThreshold}</span>
                      </SliderLabel>
                      <Slider
                        type="range"
                        min="0"
                        max="10000"
                        step="10"
                        value={occlusionSettings.multiScale.farThreshold}
                        onChange={(e) => {
                          const newSettings = {
                            ...occlusionSettings,
                            multiScale: { ...occlusionSettings.multiScale, farThreshold: parseFloat(e.target.value) }
                          }
                          setOcclusionSettings(newSettings)
                          setQuality({
                            occlusion: {
                              enabled: true,
                              ...newSettings
                            }
                          })
                        }}
                      />

                      <SliderLabel style={{ marginBottom: '8px' }}>
                        <span>Multi Scale Levels</span>
                      </SliderLabel>
                      {occlusionSettings.multiScale.levels.map((level, index) => (
                        <LevelItem key={index}>
                          <span style={{ fontSize: '12px', minWidth: '40px' }}>R:</span>
                          <LevelInput
                            type="number"
                            value={level.radius}
                            onChange={(e) => {
                              const newLevels = [...occlusionSettings.multiScale.levels]
                              newLevels[index] = { ...level, radius: parseFloat(e.target.value) || 0 }
                              const newSettings = {
                                ...occlusionSettings,
                                multiScale: { ...occlusionSettings.multiScale, levels: newLevels }
                              }
                              setOcclusionSettings(newSettings)
                              setQuality({
                                occlusion: {
                                  enabled: true,
                                  ...newSettings
                                }
                              })
                            }}
                          />
                          <span style={{ fontSize: '12px', minWidth: '40px' }}>B:</span>
                          <LevelInput
                            type="number"
                            value={level.blur}
                            onChange={(e) => {
                              const newLevels = [...occlusionSettings.multiScale.levels]
                              newLevels[index] = { ...level, blur: parseFloat(e.target.value) || 0 }
                              const newSettings = {
                                ...occlusionSettings,
                                multiScale: { ...occlusionSettings.multiScale, levels: newLevels }
                              }
                              setOcclusionSettings(newSettings)
                              setQuality({
                                occlusion: {
                                  enabled: true,
                                  ...newSettings
                                }
                              })
                            }}
                          />
                          <RemoveButton
                            onClick={() => {
                              const newLevels = occlusionSettings.multiScale.levels.filter((_, i) => i !== index)
                              const newSettings = {
                                ...occlusionSettings,
                                multiScale: { ...occlusionSettings.multiScale, levels: newLevels }
                              }
                              setOcclusionSettings(newSettings)
                              setQuality({
                                occlusion: {
                                  enabled: true,
                                  ...newSettings
                                }
                              })
                            }}
                          >
                            🗑️
                          </RemoveButton>
                        </LevelItem>
                      ))}
                      <AddButton
                        onClick={() => {
                          const newLevels = [...occlusionSettings.multiScale.levels, { radius: 2, blur: 1 }]
                          const newSettings = {
                            ...occlusionSettings,
                            multiScale: { ...occlusionSettings.multiScale, levels: newLevels }
                          }
                          setOcclusionSettings(newSettings)
                          setQuality({
                            occlusion: {
                              enabled: true,
                              ...newSettings
                            }
                          })
                        }}
                      >
                        Add Level
                      </AddButton>
                    </>
                  )}
                </>
              )}

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

              <SliderLabel>
                <span>Depth of Field</span>
                <ToggleSwitch>
                  <input
                    type="checkbox"
                    checked={dofEnabled}
                    onChange={(e) => {
                      setDofEnabled(e.target.checked)
                      setQuality({
                        postprocessing: {
                          blur: e.target.checked
                        }
                      })
                    }}
                  />
                  <span></span>
                </ToggleSwitch>
              </SliderLabel>

              {dofEnabled && (
                <>
                  <SliderLabel>
                    <span>Blur Size</span>
                    <span>{dofSettings.blurSize}</span>
                  </SliderLabel>
                  <Slider
                    type="range"
                    min="1"
                    max="32"
                    step="1"
                    value={dofSettings.blurSize}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      const newSettings = { ...dofSettings, blurSize: value }
                      setDofSettings(newSettings)
                      setQuality({
                        postprocessing: {
                          blur: {
                            enabled: true,
                            ...newSettings
                          }
                        }
                      })
                    }}
                  />

                  <SliderLabel>
                    <span>Blur Spread</span>
                    <span>{dofSettings.blurSpread.toFixed(1)}</span>
                  </SliderLabel>
                  <Slider
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={dofSettings.blurSpread}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      const newSettings = { ...dofSettings, blurSpread: value }
                      setDofSettings(newSettings)
                      setQuality({
                        postprocessing: {
                          blur: {
                            enabled: true,
                            ...newSettings
                          }
                        }
                      })
                    }}
                  />

                  <SliderLabel>
                    <span>In Focus</span>
                    <span>{dofSettings.inFocus.toFixed(0)}</span>
                  </SliderLabel>
                  <Slider
                    type="range"
                    min="-5000"
                    max="5000"
                    step="10"
                    value={dofSettings.inFocus}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      const newSettings = { ...dofSettings, inFocus: value }
                      setDofSettings(newSettings)
                      setQuality({
                        postprocessing: {
                          blur: {
                            enabled: true,
                            ...newSettings
                          }
                        }
                      })
                    }}
                  />

                  <SliderLabel>
                    <span>PPM (Focus Area)</span>
                    <span>{dofSettings.ppm.toFixed(0)}</span>
                  </SliderLabel>
                  <Slider
                    type="range"
                    min="0"
                    max="5000"
                    step="10"
                    value={dofSettings.ppm}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      const newSettings = { ...dofSettings, ppm: value }
                      setDofSettings(newSettings)
                      setQuality({
                        postprocessing: {
                          blur: {
                            enabled: true,
                            ...newSettings
                          }
                        }
                      })
                    }}
                  />

                  <SliderLabel>
                    <span>Center</span>
                    <select
                      value={dofSettings.center}
                      onChange={(e) => {
                        const value = e.target.value as 'camera-target' | 'scene-center'
                        const newSettings = { ...dofSettings, center: value }
                        setDofSettings(newSettings)
                        setQuality({
                          postprocessing: {
                            blur: {
                              enabled: true,
                              ...newSettings
                            }
                          }
                        })
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #e5e5e7',
                        backgroundColor: '#fff',
                        fontSize: '12px'
                      }}
                    >
                      <option value="camera-target">Camera Target</option>
                      <option value="scene-center">Scene Center</option>
                    </select>
                  </SliderLabel>

                  <SliderLabel>
                    <span>Mode</span>
                    <select
                      value={dofSettings.mode}
                      onChange={(e) => {
                        const value = e.target.value as 'plane' | 'sphere'
                        const newSettings = { ...dofSettings, mode: value }
                        setDofSettings(newSettings)
                        setQuality({
                          postprocessing: {
                            blur: {
                              enabled: true,
                              ...newSettings
                            }
                          }
                        })
                      }}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #e5e5e7',
                        backgroundColor: '#fff',
                        fontSize: '12px'
                      }}
                    >
                      <option value="plane">Plane</option>
                      <option value="sphere">Sphere</option>
                    </select>
                  </SliderLabel>
                </>
              )}

              <SliderLabel>
                <span>Fog</span>
                <ToggleSwitch>
                  <input
                    type="checkbox"
                    checked={fogEnabled}
                    onChange={(e) => {
                      setFogEnabled(e.target.checked)
                      setAppearance({
                        fog: e.target.checked ? {
                          enabled: true,
                          intensity: fogIntensity
                        } : false
                      })
                    }}
                  />
                  <span></span>
                </ToggleSwitch>
              </SliderLabel>

              {fogEnabled && (
                <>
                  <SliderLabel>
                    <span>Intensity</span>
                    <span>{fogIntensity}</span>
                  </SliderLabel>
                  <Slider
                    type="range"
                    min="1"
                    max="100"
                    value={fogIntensity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      setFogIntensity(value)
                      setAppearance({
                        fog: {
                          enabled: true,
                          intensity: value
                        }
                      })
                    }}
                  />
                </>
              )}

              <SliderLabel>
                <span>Clipping</span>
                <span>{clippingRadius}%</span>
              </SliderLabel>
              <Slider
                type="range"
                min="0"
                max="99"
                value={clippingRadius}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  setClippingRadius(value)
                  setCamera({
                    clipping: {
                      radius: value,
                      far: clippingFar,
                      minNear: clippingMinNear
                    }
                  })
                }}
              />

              {clippingRadius > 0 && (
                <>
                  <SliderLabel>
                    <span>Far</span>
                    <ToggleSwitch>
                      <input
                        type="checkbox"
                        checked={clippingFar}
                        onChange={(e) => {
                          setClippingFar(e.target.checked)
                          setCamera({
                            clipping: {
                              radius: clippingRadius,
                              far: e.target.checked,
                              minNear: clippingMinNear
                            }
                          })
                        }}
                      />
                      <span></span>
                    </ToggleSwitch>
                  </SliderLabel>

                  <SliderLabel>
                    <span>Min Near</span>
                    <span>{clippingMinNear.toFixed(1)}</span>
                  </SliderLabel>
                  <Slider
                    type="range"
                    min="0.1"
                    max="100"
                    step="0.1"
                    value={clippingMinNear}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      setClippingMinNear(value)
                      setCamera({
                        clipping: {
                          radius: clippingRadius,
                          far: clippingFar,
                          minNear: value
                        }
                      })
                    }}
                  />
                </>
              )}

              <SliderLabel>
                <span>Animation</span>
                <span>{animationType === 'off' ? 'Off' : animationType.charAt(0).toUpperCase() + animationType.slice(1)}</span>
              </SliderLabel>
              <ButtonGroup>
                <SmallButton
                  isActive={animationType === 'off'}
                  onClick={() => {
                    setAnimationType('off')
                    setCamera({
                      animation: 'off'
                    })
                  }}
                >
                  Off
                </SmallButton>
                <SmallButton
                  isActive={animationType === 'spin'}
                  onClick={() => {
                    setAnimationType('spin')
                    setCamera({
                      animation: 'spin'
                    })
                  }}
                >
                  Spin
                </SmallButton>
                <SmallButton
                  isActive={animationType === 'rock'}
                  onClick={() => {
                    setAnimationType('rock')
                    setCamera({
                      animation: 'rock'
                    })
                  }}
                >
                  Rock
                </SmallButton>
              </ButtonGroup>
            </ControlGroup>


            <ControlGroup>
              <Label>Quality</Label>
              <ButtonGroup>
                <SmallButton
                  isActive={activeQuality === 'low'}
                  onClick={() => setQuality({ level: 'low' })}
                >
                  Low
                </SmallButton>
                <SmallButton
                  isActive={activeQuality === 'medium'}
                  onClick={() => setQuality({ level: 'medium' })}
                >
                  Medium
                </SmallButton>
                <SmallButton
                  isActive={activeQuality === 'high'}
                  onClick={() => setQuality({ level: 'high' })}
                >
                  High
                </SmallButton>
              </ButtonGroup>
            </ControlGroup>

            <ControlGroup>
              <Label>Selection Mode</Label>
              <SelectDropdown
                value={molecule.granularity || 'residue'}
                onChange={(e) => {
                  const mode = e.target.value
                  setGranularity(mode)
                }}
              >
                <option value="atom">Atom/Coarse Element</option>
                <option value="residue">Residue</option>
                <option value="chain">Chain</option>
                <option value="entity">Entity</option>
                <option value="model">Model</option>
                <option value="operator">Operator</option>
                <option value="structure">Structure/Shape</option>
                <option value="atom-instance">Atom/Coarse Element Instances</option>
                <option value="residue-instance">Residue Instances</option>
                <option value="chain-instance">Chain Instances</option>
              </SelectDropdown>
            </ControlGroup>

            <ControlGroup>
              <Label>Camera</Label>

              <SliderLabel>
                <span>Projection</span>
                <span>{cameraMode === 'perspective' ? 'Perspective' : 'Orthographic'}</span>
              </SliderLabel>
              <ButtonGroup>
                <SmallButton
                  isActive={cameraMode === 'perspective'}
                  onClick={() => {
                    setCameraMode('perspective')
                    setCamera({ projection: 'perspective' })
                  }}
                >
                  Perspective
                </SmallButton>
                <SmallButton
                  isActive={cameraMode === 'orthographic'}
                  onClick={() => {
                    setCameraMode('orthographic')
                    setCamera({ projection: 'orthographic' })
                  }}
                >
                  Orthographic
                </SmallButton>
              </ButtonGroup>

              <SliderLabel>
                <span>Axes</span>
                <ToggleSwitch>
                  <input
                    type="checkbox"
                    checked={axesEnabled}
                    onChange={(e) => {
                      setAxesEnabled(e.target.checked)
                      if (e.target.checked) {
                        molecule.orientAxes()
                        // Don't apply any settings - let Molstar use its defaults
                        // Reset our UI values to match Molstar's defaults
                        setAxesOpacity(0.51)
                        setAxesScale(0.33) // This is the default scale in Molstar
                      } else {
                        molecule.resetAxes()
                      }
                    }}
                  />
                  <span></span>
                </ToggleSwitch>
              </SliderLabel>

              {axesEnabled && (
                <>
                  <SliderLabel>
                    <span>Axes Opacity</span>
                    <span>{Math.round(axesOpacity * 100)}%</span>
                  </SliderLabel>
                  <SliderRow>
                    <Slider
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={axesOpacity}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        setAxesOpacity(value)
                        setCamera({
                          axes: {
                            opacity: value
                            // Don't send scale - let it maintain its current value
                          }
                        })
                      }}
                    />
                    <Rotate
                      onClick={() => {
                        setAxesOpacity(0.51)
                        setCamera({
                          axes: {
                            opacity: 0.51
                          }
                        })
                      }}
                    >
                      <ResetButton title="Reset axes opacity">
                        <FiRefreshCw />
                      </ResetButton>
                    </Rotate>
                  </SliderRow>

                  <SliderLabel>
                    <span>Axes Scale</span>
                    <span>{axesScale.toFixed(1)}</span>
                  </SliderLabel>
                  <SliderRow>
                    <Slider
                      type="range"
                      min="0.1"
                      max="2.5"
                      step="0.1"
                      value={axesScale}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        setAxesScale(value)
                        setCamera({
                          axes: {
                            scale: value
                            // Don't send opacity - let it maintain its current value
                          }
                        })
                      }}
                    />
                    <Rotate
                      onClick={() => {
                        setAxesScale(0.33)
                        setCamera({
                          axes: {
                            scale: 0.33
                          }
                        })
                      }}
                    >
                      <ResetButton title="Reset axes scale">
                        <FiRefreshCw />
                      </ResetButton>
                    </Rotate>
                  </SliderRow>

                  <SliderLabel>
                    <span>Axes Colors</span>
                  </SliderLabel>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.625rem', width: '20px' }}>X:</span>
                    <ColorPickerInput
                      type="color"
                      value={axesColorX}
                      onChange={(e) => {
                        setAxesColorX(e.target.value)
                        setCamera({
                          axes: {
                            colors: { x: e.target.value, y: axesColorY, z: axesColorZ }
                          }
                        })
                      }}
                    />
                    <span style={{ fontSize: '0.625rem', width: '20px' }}>Y:</span>
                    <ColorPickerInput
                      type="color"
                      value={axesColorY}
                      onChange={(e) => {
                        setAxesColorY(e.target.value)
                        setCamera({
                          axes: {
                            colors: { x: axesColorX, y: e.target.value, z: axesColorZ }
                          }
                        })
                      }}
                    />
                    <span style={{ fontSize: '0.625rem', width: '20px' }}>Z:</span>
                    <ColorPickerInput
                      type="color"
                      value={axesColorZ}
                      onChange={(e) => {
                        setAxesColorZ(e.target.value)
                        setCamera({
                          axes: {
                            colors: { x: axesColorX, y: axesColorY, z: e.target.value }
                          }
                        })
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.625rem', color: '#8e8ea0', marginBottom: '0.5rem' }}>
                    Note: Stereo rendering may require specific browser/WebGL support
                  </div>
                </>
              )}

              <SliderLabel>
                <span>Stereo</span>
                <ToggleSwitch>
                  <input
                    type="checkbox"
                    checked={stereoEnabled}
                    onChange={(e) => {
                      setStereoEnabled(e.target.checked)
                      setCamera({
                        stereo: {
                          enabled: e.target.checked,
                          eyeSeparation: e.target.checked ? eyeSeparation : undefined,
                          focus: e.target.checked ? stereoFocus : undefined
                        }
                      })
                    }}
                  />
                  <span></span>
                </ToggleSwitch>
              </SliderLabel>

              {stereoEnabled && (
                <>
                  <SliderLabel>
                    <span>Eye Separation</span>
                    <span>{eyeSeparation.toFixed(3)}</span>
                  </SliderLabel>
                  <SliderRow>
                    <Slider
                      type="range"
                      min="0.02"
                      max="0.1"
                      step="0.003"
                      value={eyeSeparation}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        setEyeSeparation(value)
                        setCamera({
                          stereo: {
                            enabled: true,
                            eyeSeparation: value,
                            focus: stereoFocus
                          }
                        })
                      }}
                    />
                    <Rotate
                      onClick={() => {
                        setEyeSeparation(0.064)
                        setCamera({
                          stereo: {
                            enabled: true,
                            eyeSeparation: 0.064,
                            focus: stereoFocus
                          }
                        })
                      }}
                    >
                      <ResetButton title="Reset eye separation">
                        <FiRefreshCw />
                      </ResetButton>
                    </Rotate>
                  </SliderRow>

                  <SliderLabel>
                    <span>Stereo Focus</span>
                    <span>{stereoFocus.toFixed(1)}</span>
                  </SliderLabel>
                  <SliderRow>
                    <Slider
                      type="range"
                      min="1"
                      max="20"
                      step="0.3"
                      value={stereoFocus}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        setStereoFocus(value)
                        setCamera({
                          stereo: {
                            enabled: true,
                            eyeSeparation,
                            focus: value
                          }
                        })
                      }}
                    />
                    <Rotate
                      onClick={() => {
                        setStereoFocus(10)
                        setCamera({
                          stereo: {
                            enabled: true,
                            eyeSeparation,
                            focus: 10
                          }
                        })
                      }}
                    >
                      <ResetButton title="Reset stereo focus">
                        <FiRefreshCw />
                      </ResetButton>
                    </Rotate>
                  </SliderRow>
                </>
              )}

              <SliderLabel>
                <span>Field of View</span>
                <span>{fieldOfView}°</span>
              </SliderLabel>
              <SliderRow>
                <Slider
                  type="range"
                  min="10"
                  max="130"
                  step="1"
                  value={fieldOfView}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    setFieldOfView(value)
                    setCamera({ fov: value })
                  }}
                />
                <Rotate
                  onClick={() => {
                    setFieldOfView(45)
                    setCamera({ fov: 45 })
                  }}
                >
                  <ResetButton title="Reset field of view">
                    <FiRefreshCw />
                  </ResetButton>
                </Rotate>
              </SliderRow>
            </ControlGroup>

          </ControlsPanel>
        )}
      </ViewerContainer>
    </Container >
  )
}
