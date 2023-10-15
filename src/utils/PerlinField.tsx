import React, { createContext, useContext } from 'react'

interface PerlinContextValue {
  perlin: any // Replace `any` with the actual type of `perlin`
}

const PerlinContext = createContext<PerlinContextValue>({
  perlin: null,
})

export const usePerlin = () => useContext(PerlinContext)?.perlin

interface PerlinProviderProps {
  perlin: any // Replace `any` with the actual type of `perlin`
  children?: React.ReactNode // Add the `?` to make `children` optional
}

export const PerlinField: React.FC<PerlinProviderProps> = ({
  perlin,
  children,
}) => {
  return (
    <PerlinContext.Provider value={{ perlin }}>
      {children}
    </PerlinContext.Provider>
  )
}