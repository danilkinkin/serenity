import React, { useEffect, useRef, useState } from 'react'
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
import { Color } from 'three'
import { mix } from './utils/mix'

export function Scene() {
  const cameraRef = useRef<PerspectiveCameraType>(null)
  const [perlin] = useState(() => new ImprovedNoise())
  const pointLightRef = useRef<PointLight>()
  const directionalLightRef = useRef<DirectionalLight>()
  const currWindShift = useRef<number>(0)
  const [isLoaded, setIsLoad] = useState(false)
  const cameraControls = {
    manual: false,
  } /*useControls('Camera', {
    manual: false,
  })*/
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
  const springsInit = useSpring({
    value: isLoaded ? 1 : 0,
    config: {
      mass: 10,
      friction: 1800,
      tension: 600,
    },
  })

  const initPosition = {
    x: 2,
    y: 18,
    z: 20,
  }

  const initLookAt = {
    x: 0,
    y: 25,
    z: 1,
  }

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

    const targetPosition: any = mix(
      initPosition,
      {
        x: 2 - move,
        y: 7 + 0.05 * Math.sin(state.clock.elapsedTime),
        z: 20 + distance / 30,
      },
      springsInit.value.get(),
      ['x', 'y', 'z']
    )

    const targetLookAt: any = mix(
      initLookAt,
      {
        x: 0 - move / 2,
        y: 3 + 0.05 * Math.sin(state.clock.elapsedTime - 1),
        z: 1,
      },
      springsInit.value.get(),
      ['x', 'y', 'z']
    )

    cameraRef.current?.position.set(
      targetPosition.x,
      targetPosition.y,
      targetPosition.z
    )
    cameraRef.current?.lookAt(targetLookAt.x, targetLookAt.y, targetLookAt.z)
  }, -2)

  useHelper(pointLightRef, PointLightHelper, 5, 'red')
  useHelper(directionalLightRef, DirectionalLightHelper, 5, 'red')

  useEffect(() => {
    setIsLoad(true)
  }, [])

  const bgColor = new Color(0xfef8f5)

  return (
    <>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        fov={45}
        near={0.1}
        far={1000}
        position={[0, 20, 20]}
      />
      {cameraControls.manual && <CameraControls enabled />}
      {/*<axesHelper args={[5]} position={[-2, 3, 1]} />
      <axesHelper args={[2]} position={[0, 0, 0]} />*/}
      <color attach="background" args={[bgColor.r, bgColor.g, bgColor.b]} />
      <ambientLight color="#fef8f5" intensity={1} />
      <Island rotation={[0, anglToRad(-110), 0]} />
      <WindStreamEffect />
    </>
  )
}
