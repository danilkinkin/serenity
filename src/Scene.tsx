import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { anglToRad } from '@src/utils/angle'
import { Model as Island } from './Island'
import { CameraControls, PerspectiveCamera } from '@react-three/drei'
import { WindStreamEffect } from './WindStreamEffect'
import { useWindStore } from './windState'
import { useSpring } from '@react-spring/three'
import { PerspectiveCamera as PerspectiveCameraType } from 'three'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise'

export function Scene() {
  const cameraRef = useRef<PerspectiveCameraType>(null)
  const [perlin] = useState(() => new ImprovedNoise())
  const currWindShift = useRef<number>(0)
  const windStore = useWindStore()
  const springsMove = useSpring({
    ...windStore[windStore.variant],
    config: {
      mass: 50,
      friction: 220,
      tension: 90,
    },
  })
  const springsAngle = useSpring({
    ...windStore[windStore.variant],
    config: {
      mass: 60,
      friction: 200,
      tension: 800,
    },
  })
  const springsDisatance = useSpring({
    ...windStore[windStore.variant],
    config: {
      mass: 1,
      friction: 90,
      tension: 170,
    },
  })

  useFrame((state, delta) => {
    currWindShift.current = currWindShift.current + delta * springsAngle.speed.get()

    const noise = perlin.noise(
      (-2 + currWindShift.current) / springsAngle.scale.get(),
      3 / springsAngle.scale.get(),
      1
    )

    const move = (noise + (Math.min(springsMove.force.get(), 100) / 100) * 0.9) * springsMove.calm.get() * 0.4
    const distance = springsMove.force.get()

    cameraRef.current?.position.set(
      -move, 
      4 + 0.05 * Math.sin(state.clock.elapsedTime), 
      18 + distance  / 100,
    )
    cameraRef.current?.lookAt(-2 - move / 2, 3 + 0.05 * Math.sin(state.clock.elapsedTime - 1), 1)
  }, -2)

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
      {/* <CameraControls enabled /> */}
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
