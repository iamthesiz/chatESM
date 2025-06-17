import '@emotion/react'

declare module '@emotion/react' {
  export interface Theme {}
}

declare module '@emotion/styled' {
  import { CreateStyled } from '@emotion/styled/types/index'
  const styled: CreateStyled
  export default styled
}