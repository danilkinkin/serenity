import React, { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useControls } from 'leva'
import { randomize } from '@src/utils/randomize'
import { Color, BackSide } from 'three'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise'
import { Environment, Html, Stats } from '@react-three/drei'
import { Scene } from './Scene'
import { Grass } from './Grass'
import { useWindStore } from './windState'
import { LayerMaterial, Depth, Noise } from 'lamina'

function Field() {
  const { density, size, randomizeShift } = {
    density: 2,
    size: 10,
    randomizeShift: 1,
  }
  /*const { density, size, randomizeShift } = useControls('Field', {
    density: 2,
    size: 10,
    randomizeShift: 1,
  })*/
  const [perlin] = useState(() => new ImprovedNoise())

  const countPerSide = density * size
  const shiftDistancePerSide = 1 / density
  const halfShift = shiftDistancePerSide * ((countPerSide - 1) / 2)

  return (
    <group>
      {Array.from({ length: countPerSide }).map((_, x) =>
        Array.from({ length: countPerSide }).map((_, y) => (
          <Grass
            key={`${x}-${y}`}
            perlin={perlin}
            x={x}
            y={y}
            quality={4}
            position={[
              x * shiftDistancePerSide - halfShift + randomize(randomizeShift),
              0,
              y * shiftDistancePerSide - halfShift + randomize(randomizeShift),
            ]}
          />
        ))
      )}
    </group>
  )
}

function App() {
  useEffect(() => {
    const forceWind = () => {
      useWindStore.getState().forceWind()
    }
    const calmWind = () => {
      useWindStore.getState().calmWind()
    }

    window.addEventListener('mousedown', forceWind)
    window.addEventListener('mouseup', calmWind)

    return () => {
      window.removeEventListener('mousedown', forceWind)
      window.removeEventListener('mouseup', calmWind)
    }
  }, [])

  return (
    <Canvas dpr={[1, 2]}>
      {/* <fog attach="fog" args={[new Color(0xaad9ff), 30, 650]} /> */}
      <Suspense fallback={<Html>loading...</Html>}>
        <Scene />
      </Suspense>
      {/*<Stats />*/}
    </Canvas>
  )
}

export default App
