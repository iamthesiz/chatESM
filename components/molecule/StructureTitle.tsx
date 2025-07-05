import { FC } from 'react'
import styled from '@emotion/styled'
import { useMolstar } from '../../hooks/useMolstar'

interface StructureTitleProps {
  id?: string
}

export const StructureTitle: FC<StructureTitleProps> = ({ id }) => {
  const molstar = useMolstar(id || 'default')

  const title = (() => {
    // Check loading state
    if (molstar.loading) return 'Loading...'
    if (!molstar.loaded) return 'No structure'

    // Try to extract structure information
    const structures = molstar.managers?.structure?.hierarchy?.current?.structures
    if (!structures?.length) return 'No structure'

    const model = structures[0]?.model
    const modelData = model?.cell?.obj?.data

    // Try different sources for title
    const entryId = model?.entryId || ''
    const structTitle = modelData?.struct?.title?.value?.(0) || ''

    // Format the title
    if (entryId && structTitle) return `${entryId} - ${structTitle}`
    if (structTitle) return structTitle
    if (entryId) return entryId

    // Fallback to other possible sources
    return model?.label || modelData?.label || 'Structure'
  })()

  return <Title>{title}</Title>
}

const Title = styled.h2`
  font-size: 1rem;
  font-weight: 600;
  color: #202123;
  margin: 0;
`
