// Global type overrides for react-icons compatibility with Next.js 15
// This fixes the "cannot be used as a JSX component" error

declare module 'react-icons/fa' {
  import { FC, SVGProps } from 'react'
  export type IconType = FC<SVGProps<SVGSVGElement> & { size?: string | number }>
  
  export const FaMousePointer: IconType
  export const FaCube: IconType
  export const FaPalette: IconType
  export const FaLayerGroup: IconType
  export const FaDna: IconType
  export const FaEye: IconType
  export const FaEyeSlash: IconType
  export const FaTrash: IconType
  export const FaPlus: IconType
  export const FaTimes: IconType
  export const FaCopy: IconType
  export const FaDownload: IconType
  
  // Add more as needed
  const exports: Record<string, IconType>
  export default exports
}

declare module 'react-icons/fi' {
  import { FC, SVGProps } from 'react'
  export type IconType = FC<SVGProps<SVGSVGElement> & { size?: string | number }>
  
  export const FiTool: IconType
  export const FiX: IconType
  export const FiMenu: IconType
  export const FiRefreshCw: IconType
  
  // Add more as needed
  const exports: Record<string, IconType>
  export default exports
}

declare module 'react-icons/md' {
  import { FC, SVGProps } from 'react'
  export type IconType = FC<SVGProps<SVGSVGElement> & { size?: string | number }>
  
  export const MdLayers: IconType
  
  // Add more as needed
  const exports: Record<string, IconType>
  export default exports
}

declare module 'react-icons/bi' {
  import { FC, SVGProps } from 'react'
  export type IconType = FC<SVGProps<SVGSVGElement> & { size?: string | number }>
  
  export const BiShapePolygon: IconType
  export const BiSidebar: IconType
  
  // Add more as needed
  const exports: Record<string, IconType>
  export default exports
}

declare module 'react-icons/hi2' {
  import { FC, SVGProps } from 'react'
  export type IconType = FC<SVGProps<SVGSVGElement> & { size?: string | number }>
  
  export const HiOutlinePencilSquare: IconType
  
  // Add more as needed
  const exports: Record<string, IconType>
  export default exports
}