import styled from '@emotion/styled'
import { useMolstar } from '../../useMolstar/useMolstar'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
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
`

const ViewerContainer = styled.div`
  flex: 1;
  position: relative;
  background-color: #f0f0f0;
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

const LoadingText = styled.div`
  font-size: 0.875rem;
  color: #8e8ea0;
`

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
`

export function MoleculeViewer() {
  const { canvasRef, isLoading } = useMolstar('1tqn')

  return (
    <Container>
      <Header>
        <Title>1TQN - Trypsin-BPTI Complex</Title>
        <Controls>
          <ControlButton>Reset View</ControlButton>
          <ControlButton>Screenshot</ControlButton>
          <ControlButton>Settings</ControlButton>
        </Controls>
      </Header>
      <ViewerContainer>
        {isLoading && (
          <LoadingOverlay>
            <LoadingText>Loading structure...</LoadingText>
          </LoadingOverlay>
        )}
        <Canvas ref={canvasRef} />
      </ViewerContainer>
    </Container>
  )
}