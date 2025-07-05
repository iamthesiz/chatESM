import React from 'react'
import styled from '@emotion/styled'
import { useMolecule } from '../hooks/useMolecule'
import { ComponentsTest } from '../components/test/ComponentsTest'
import { DEFAULT_MOLSTAR_ID } from '../hooks/constants'

export default function TestComponentsHook() {
  const [molecule] = useMolecule(DEFAULT_MOLSTAR_ID)

  // Load a structure on mount
  React.useEffect(() => {
    molecule.load({ 
      pdbId: '1AON',
      hideNativeControls: true 
    })
  }, [])

  return (
    <PageContainer>
      <Header>
        <h1>useComponents Hook Test</h1>
        <p>Testing the new components management hook</p>
      </Header>
      
      <Layout>
        <ControlPanel>
          <ComponentsTest molstarId={DEFAULT_MOLSTAR_ID} />
        </ControlPanel>
        
        <ViewerPanel>
          <ViewerContainer ref={molecule.ref} />
        </ViewerPanel>
      </Layout>
    </PageContainer>
  )
}

const PageContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f7fafc;
`

const Header = styled.div`
  padding: 20px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  
  h1 {
    margin: 0 0 8px 0;
    font-size: 24px;
    color: #2d3748;
  }
  
  p {
    margin: 0;
    color: #718096;
  }
`

const Layout = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`

const ControlPanel = styled.div`
  width: 400px;
  background: white;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
`

const ViewerPanel = styled.div`
  flex: 1;
  padding: 20px;
`

const ViewerContainer = styled.div`
  width: 100%;
  height: 100%;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
`