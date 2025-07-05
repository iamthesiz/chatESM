/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled'
import { useState, useRef, useEffect } from 'react'
import { useMolecule } from '../../hooks/useMolecule'
import { useAxes } from '../../hooks/useAxes'
import useToggles from 'toggles'
import type { FC } from 'react'
import { sleep } from '../../utils'

interface ScreenshotButtonProps {
  id?: string
}

export const ScreenshotButton: FC<ScreenshotButtonProps> = ({ id }) => {
  const [molecule] = useMolecule(id)
  const [axes, setAxes] = useAxes(id)
  const [{ dropdown, transparent, copied }, { toggle, close }] = useToggles(false, false, false)
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png')
  const [preview, setPreview] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        close(dropdown)
      }
    }

    if (dropdown.isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdown.isOpen])

  const updatePreview = async () => {
    if (!molecule.screenshot) return

    const dataUrl = await molecule.screenshot({
      download: false,
      transparent: transparent.isOn
    })

    if (dataUrl && typeof dataUrl === 'string') {
      setPreview(dataUrl)
    }
  }

  const handleScreenshotClick = async () => {
    if (!dropdown.isOpen) {
      await updatePreview()
    }
    toggle(dropdown)
  }

  const handleTransparentChange = async () => {
    toggle(transparent)
    await updatePreview()
  }

  const handleAxesChange = async (checked: boolean) => {
    setAxes({ visible: checked })
    await updatePreview()
  }

  const handleCopy = async () => {
    try {
      toggle(copied)
      await molecule.copyScreenshot({
        transparent: transparent.isOn,
        format,
        axes: axes.visible
      })
      await sleep(1500)
      toggle(copied)
    } catch (err) {
      console.error('Failed to copy screenshot:', err)
    }
  }

  const handleDownload = async () => {
    await molecule.downloadScreenshot({
      transparent: transparent.isOn,
      format,
      axes: axes.visible,
      filename: `molecule-${Date.now()}.${format}`
    })
    close(dropdown)
  }

  return (
    <DropdownWrapper ref={dropdownRef}>
      <ControlButton onClick={handleScreenshotClick}>
        Screenshot
      </ControlButton>

      {dropdown.isOpen && (
        <Dropdown>
          {preview && (
            <Preview>
              <img src={preview} alt="Screenshot preview" />
            </Preview>
          )}

          <Options>
            <Row>
              <span>Format:</span>
              <Select
                value={format}
                onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg' | 'webp')}
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
              </Select>
            </Row>

            <Row>
              <span>Transparent:</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={transparent.isChecked}
                  onChange={handleTransparentChange}
                />
                <span></span>
              </ToggleSwitch>
            </Row>

            <Row>
              <span>Axes:</span>
              <ToggleSwitch>
                <input
                  type="checkbox"
                  checked={axes.visible}
                  onChange={(e) => handleAxesChange(e.target.checked)}
                />
                <span></span>
              </ToggleSwitch>
            </Row>

            <Row>
              <ActionButton onClick={handleCopy}>
                {copied.isOn ? 'Copied!' : 'Copy'}
              </ActionButton>

              <ActionButton onClick={handleDownload}>
                Download
              </ActionButton>
            </Row>
          </Options>
        </Dropdown>
      )}
    </DropdownWrapper>
  )
}

const DropdownWrapper = styled.div`
  position: relative;
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
`

const Dropdown = styled.div`
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

const Preview = styled.div`
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

const Options = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`

const ActionButton = styled.button`
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

const Select = styled.select`
  padding: 6px 12px;
  border: 1px solid #e5e5e7;
  border-radius: 4px;
  background: white;
  font-size: 14px;
  cursor: pointer;
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
