import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { anglToRad } from '@src/utils/angle'
import { Model as Island } from './Island'
import {
  CameraControls,
  Environment,
  PerspectiveCamera,
  useHelper,
} from '@react-three/drei'
import { WindStreamEffect } from './WindStreamEffect'
import { useWindStore } from './windState'
import { useSpring } from '@react-spring/three'
import {
  PerspectiveCamera as PerspectiveCameraType,
  BackSide,
  PointLight,
  PointLightHelper,
  DirectionalLight,
  DirectionalLightHelper,
} from 'three'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise'
import { useControls } from 'leva'
import { Color } from 'three';

export function Scene() {
  const cameraRef = useRef<PerspectiveCameraType>(null)
  const [perlin] = useState(() => new ImprovedNoise())
  const pointLightRef = useRef<PointLight>()
  const directionalLightRef = useRef<DirectionalLight>()
  const currWindShift = useRef<number>(0)
  const cameraControls = useControls('Camera', {
    manual: false,
  })
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

  useFrame((state, delta) => {
    if (cameraControls.manual) return

    currWindShift.current =
      currWindShift.current + delta * springsAngle.speed.get()

    const noise = perlin.noise(
      (-2 + currWindShift.current) / springsAngle.scale.get(),
      3 / springsAngle.scale.get(),
      1
    )

    const move =
      (noise + (Math.min(springsMove.force.get(), 100) / 100) * 0.9) *
      springsMove.calm.get() *
      0.2
    const distance = springsMove.force.get()

    cameraRef.current?.position.set(
      2 - move,
      7 + 0.05 * Math.sin(state.clock.elapsedTime),
      20 + distance / 30
    )
    cameraRef.current?.lookAt(
      0 - move / 2,
      3 + 0.05 * Math.sin(state.clock.elapsedTime - 1),
      1
    )
  }, -2)

  useHelper(pointLightRef, PointLightHelper, 5, 'red')
  useHelper(directionalLightRef, DirectionalLightHelper, 5, 'red')

  const bgColor = new Color(0xfef8f5);

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={45}
        near={0.1}
        far={1000}
        position={[0, 7, 20]}
      />
      {cameraControls.manual && <CameraControls enabled />}
      {/*<axesHelper args={[5]} position={[-2, 3, 1]} />
      <axesHelper args={[2]} position={[0, 0, 0]} />*/}
      <color
        attach="background"
        args={[bgColor.r, bgColor.g, bgColor.b]}
      />
      <ambientLight color="#fef8f5" intensity={1}  />
      <Island rotation={[0, anglToRad(-110), 0]} />
      <WindStreamEffect />
    </>
  )
}
