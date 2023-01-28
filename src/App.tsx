import React, { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { anglToRad } from '@src/utils/angle'

function Grass(props) {
  const { width, height } = useControls('Grass', { width: 0.05, height: 2 })
  
  return (
    <mesh {...props}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  )
}

function Field() {
  const { density, size } = useControls('Plane', { density: 4, size: 10 });
  
  const countPerSide = density * size;
  const shiftDistancePerSide = 1 / density;
  const halfShift = shiftDistancePerSide * ((countPerSide - 1) / 2);

  useFrame((state, delta) => {
    
  })

  return (
    <group>
      {
        Array
          .from({ length: countPerSide })
          .map(
            (_, x) => Array
              .from({ length: countPerSide })
              .map((_, y) => (
                <Grass 
                  key={`${x}-${y}`} 
                  position={[x * shiftDistancePerSide - halfShift, 0, y * shiftDistancePerSide - halfShift]}
                  rotation={[0, 0, anglToRad(10)]}
                />
              ))
          )
      }
    </group>
  )
}

function App() {
  return (
    <Canvas
      camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 10, 15] }}
    >
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Field />
    </Canvas>
  )
}

export default App
