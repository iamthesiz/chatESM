import createEmotion from '@emotion/css/create-instance'

export const {
  flush,
  hydrate,
  cx,
  merge,
  getRegisteredStyles,
  injectGlobal,
  keyframes,
  css,
  sheet,
  cache
} = createEmotion({
  key: 'molstar',
  container: typeof document !== 'undefined' ? document.head : undefined
})

// Re-export styled from @emotion/styled with our cache
export { default as styled } from '@emotion/styled'