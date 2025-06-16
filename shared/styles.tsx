import { css } from '@emotion/react'

export const global = css`
  html,
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 16px;
    color: #202123;
    background-color: #ffffff;
  }
  
  * {
    box-sizing: border-box;
  }
  
  #__next {
    height: 100vh;
    width: 100vw;
  }
`