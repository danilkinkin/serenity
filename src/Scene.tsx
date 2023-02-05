import React, { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { anglToRad } from '@src/utils/angle'
import { Model as Island } from './Island'
import { CameraControls, PerspectiveCamera } from '@react-three/drei'
import { WindStreamEffect } from './WindStreamEffect'

export function Scene() {
  const cameraRef = useRef(null)

  useFrame(() => {
    // console.log('lookAt')
    // cameraRef.current?.lookAt(-2, 3, 1)
  }, -2)

  useEffect(() => {
    // cameraRef.current?.lookAt(-2, 3, 1)
  }, [])

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={45}
        near={0.1}
        far={1000}
        position={[0, 4, 18]}
      />
      <CameraControls enabled />
      <axesHelper args={[5]} position={[-2, 3, 1]} />
      <axesHelper args={[2]} position={[0, 0, 0]} />
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      {/* <Field /> */}
      <Island rotation={[0, anglToRad(-110), 0]} />
      <WindStreamEffect />
    </>
  )
}
