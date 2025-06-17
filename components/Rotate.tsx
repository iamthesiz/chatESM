import { motion } from 'framer-motion'
import { useState } from 'react'
import styled from '@emotion/styled'

const Rotated = styled.div<{ deg?: number }>`
  display: flex;
  justify-content: center;
  align-items: center;
  transform: rotateZ(${p => p.deg || 0}deg);
  transition: transform 1s;
  width: 100%;
  height: 100%;
`

const Rotate = ({ onClick, children, ...props }: any) => {
  const [{ flipped = false, count = 0 }, setState] = useState(() => ({}))
  return (
    <motion.div
      whileTap={{ scale: 1.2, transition: { type: 'spring', stiffness: 1000 } }}
      onClick={(e: any) => {
        onClick?.(e)
        setState({ count: count + 1, flipped: !flipped })
      }}
      style={{ 
        display: 'inline-flex',
        width: '20px',
        height: '20px',
        position: 'relative'
      }}
      {...props}
    >
      <Rotated deg={count * 180}>
        {children}
      </Rotated>
    </motion.div>
  )
}

export default Rotate