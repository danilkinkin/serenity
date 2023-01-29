import React, { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { anglToRad } from '@src/utils/angle'
import { randomize } from '@src/utils/randomize'
import {
  MeshStandardMaterial,
  PlaneGeometry,
  Color,
  Skeleton,
  Bone,
  SkinnedMesh,
  SkeletonHelper,
  Uint16BufferAttribute,
  Float32BufferAttribute,
  Vector3,
  Mesh,
  CatmullRomCurve3,
  LineLoop,
  BufferGeometry,
  LineBasicMaterial,
  DoubleSide,
  SphereGeometry,
  Group,
} from 'three'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise'
import { Flow, InstancedFlow } from 'three/examples/jsm/modifiers/CurveModifier'
import { useSpring, animated } from '@react-spring/three'
import { create } from 'zustand'

interface WindState {
  variant: 'calm' | 'force'
  calm: {
    force: number
    calm: number
    speed: number
    scale: number
  }
  force: {
    force: number
    calm: number
    speed: number
    scale: number
  }
  forceWind: () => void
  calmWind: () => void
}

const useWindStore = create<WindState>((set) => ({
  variant: 'calm',
  calm: {
    force: 10,
    calm: 4,
    speed: 2,
    scale: 70,
  },
  force: {
    force: 170,
    calm: 4,
    speed: 30,
    scale: 70,
  },
  forceWind: () =>
    set({
      variant: 'force',
    }),
  calmWind: () =>
    set({
      variant: 'calm',
    }),
}))

function Grass(props) {
  const { perlin, x, y, quality, ...restProps } = props
  const {
    width: rawWidth,
    height: rawHeight,
    randomizeSize,
  } = useControls('Grass', { width: 0.05, height: 1, randomizeSize: 1 })
  const currWindShift = useRef<number>(0)
  const windStore = {
    force: 170,
    calm: 4,
    speed: 30,
    scale: 70,
  }
  const [{ height, width }] = useState(() => {
    const width = rawWidth + randomize(randomizeSize * rawWidth)
    const height = rawHeight + randomize(randomizeSize * rawHeight)

    return { height, width }
  })
  const [randomShift, setRandomShift] = useState(() =>
    randomize(windStore.calm)
  )
  const [skeleton] = useState(() => {
    const bones = []

    Array.from({ length: quality + 1 }).forEach((_, index) => {
      const bone = new Bone()

      if (index !== 0) bone.position.y = height / quality

      const prevBone = bones[bones.length - 1]
      if (prevBone) prevBone.add(bone)
      bones.push(bone)
    })

    return new Skeleton(bones)
  })
  const materialRef = useRef<MeshStandardMaterial>(null)
  const meshRef = useRef<SkinnedMesh>(null)
  const geometryRef = useRef<PlaneGeometry>(null)
  const { scene } = useThree()
  const windStoreD = useWindStore()
  const springs = useSpring(windStoreD[windStoreD.variant])

  useEffect(() => {
    geometryRef.current.translate(0, height / 2, 0)

    const position = geometryRef.current.attributes.position
    const vertex = new Vector3()

    const skinIndices = []
    const skinWeights = []

    const segmentHeight = height / quality
    const halfHeight = segmentHeight / 2

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i)

      const y = vertex.y + halfHeight

      const skinIndex = Math.floor(y / segmentHeight)
      const skinWeight = 0

      skinIndices.push(skinIndex, skinIndex + 1, 0, 0)
      skinWeights.push(1 - skinWeight, skinWeight, 0, 0)
    }

    geometryRef.current.setAttribute(
      'skinIndex',
      new Uint16BufferAttribute(skinIndices, 4)
    )
    geometryRef.current.setAttribute(
      'skinWeight',
      new Float32BufferAttribute(skinWeights, 4)
    )

    meshRef.current.add(skeleton.bones[0])
    meshRef.current.bind(skeleton)

    // const helper = new SkeletonHelper( meshRef.current );
    // scene.add(helper);

    return () => {
      geometryRef.current.translate(0, -height / 2, 0)
    }
  }, [])

  useEffect(() => {
    setRandomShift(randomize(windStore.calm))
  }, [windStore.calm])

  useFrame((state, delta) => {
    const speed = springs.speed.get()
    const scale = springs.scale.get()
    const force = springs.force.get()

    currWindShift.current = currWindShift.current + delta * speed

    const noise = perlin.noise(
      (x + currWindShift.current) / scale,
      y / scale,
      0
    )
    const boundedNoise = noise + 0.2
    const color =
      Math.max(Math.min(1 - (1 - boundedNoise), 0.6), 0) *
      (Math.min(force, 100) / 100)

    const angle =
      (Math.sin(state.clock.elapsedTime) * 10 * randomShift) / quality
    const angleWinded = (force * boundedNoise) / quality

    skeleton.bones.forEach((bone, index) => {
      const angleForce =
        0.5 - Math.abs(index / (skeleton.bones.length - 1) - 0.5) + 0.25

      bone.rotation.z = anglToRad(angle + angleWinded) * angleForce
      bone.rotation.y = anglToRad(angle) * angleForce
    })
    materialRef.current.color = new Color(color, color, color)
  })

  return (
    <skinnedMesh {...restProps} ref={meshRef}>
      <planeGeometry args={[width, height, 1, quality]} ref={geometryRef} />
      <meshStandardMaterial color={[0, 0, 0]} ref={materialRef} />
    </skinnedMesh>
  )
}

function Field() {
  const { density, size, randomizeShift } = useControls('Field', {
    density: 2,
    size: 10,
    randomizeShift: 1,
  })
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

function Wind() {
  const { scene, camera } = useThree()
  const [flows, setFlows] =
    useState<{ flow: Flow; speedShift: number; windMesh: Mesh }[]>(null)
  const windEffect = useControls('WindEffect', {
    flowSize: 0.6,
    flowLength: 6,
    steps: 10,
    randomizePath: 1,
    randomizeSize: 0,
    randomizeLength: 1,
    randomizeSpeed: 2,
  })
  const windStore = useWindStore()

  const leftX = -30
  const rightX = 30

  const createFlow = (y: number, z: number) => {
    const stepSize = (rightX - leftX) / (windEffect.steps - 1)
    const points = [
      new Vector3(leftX - 10, y, z),
      ...Array.from({ length: windEffect.steps }).map(
        (_, index) =>
          new Vector3(
            leftX + index * stepSize,
            y +
              ((index % 2) * 2 - 1) * 0.1 +
              randomize(windEffect.randomizePath),
            z
          )
      ),
      new Vector3(rightX + 10, y, z),
    ]
    const curve = new CatmullRomCurve3(points, false, 'centripetal')

    const speedShift = (Math.random() + 0.5) * windEffect.randomizeSpeed
    const length = windEffect.flowLength + randomize(windEffect.randomizeLength)
    const geometry = new PlaneGeometry(
      length,
      windEffect.flowSize + randomize(windEffect.randomizeSize),
      length,
      1
    )

    geometry.rotateX(-camera.rotation.x)
    const material = new MeshStandardMaterial({
      color: new Color(0.8, 0.8, 0.8),
      side: DoubleSide,
    })
    const mesh = new Mesh(geometry, material)

    const flow = new Flow(mesh)
    flow.updateCurve(0, curve)

    const debug = new Group()

    const line = new LineLoop(
      new BufferGeometry().setFromPoints(curve.getPoints(50)),
      new LineBasicMaterial({ color: new Color(0.3, 0.3, 0.8) })
    )
    debug.add(line)
    const materialDebugPoint = new MeshStandardMaterial({
      color: new Color(0.3, 0.3, 0.8),
    })
    const geometryDebugPoint = new SphereGeometry(0.1, 4, 3)
    points.map((point) => {
      const pointMesh = new Mesh(geometryDebugPoint, materialDebugPoint)
      pointMesh.position.set(point.x, point.y, point.z)

      debug.add(pointMesh)
    })

    return { flow, debug, speedShift, windMesh: mesh }
  }

  useEffect(() => {
    const rawFlows = [
      createFlow(5, 0),
      createFlow(3, 0),
      createFlow(10, 0),
      createFlow(1, 0),
      createFlow(9, 0),
      createFlow(5.2, 0),
    ]

    rawFlows.forEach(({ flow, debug }) => {
      flow.moveAlongCurve(-flow.uniforms.pathOffset.value + 0.9)
      scene.add(flow.object3D)
      //scene.add(debug);
    })

    setFlows(
      rawFlows.map(({ flow, speedShift, windMesh }) => ({
        flow,
        speedShift,
        windMesh,
      }))
    )

    return () => {
      rawFlows.forEach(({ flow, debug }) => {
        scene.remove(flow.object3D)
        //scene.remove(debug);
      })
    }
  }, [])

  useFrame((state, delta) => {
    flows?.forEach(({ flow, speedShift, windMesh }) => {
      if (
        flow.uniforms.pathOffset.value < 0.9 ||
        windStore.variant === 'force'
      ) {
        flow.moveAlongCurve(-0.01 * delta * windStore.force.speed * speedShift)
        if (flow.uniforms.pathOffset.value <= 0.1) {
          flow.moveAlongCurve(-flow.uniforms.pathOffset.value + 0.9)
        }
      }
    })
  })

  return null
}

function App() {
  const windUser = useControls('Wind', {
    force: 170,
    calm: 4,
    speed: 30,
    scale: 70,
  })

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
    <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 10, 15] }}>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Field />
      <Wind />
    </Canvas>
  )
}

export default App
