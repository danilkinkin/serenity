import React, { Suspense, useEffect, useRef, useState } from 'react'
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
  SkeletonHelper,
} from 'three'
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise'
import { Flow } from 'three/examples/jsm/modifiers/CurveModifier'
import { useSpring } from '@react-spring/three'
import { create } from 'zustand'
import { Model as Island } from './Island'
import { CameraControls, Environment, Html, PerspectiveCamera, Stats } from '@react-three/drei'
// import { EffectComposer, Noise } from '@react-three/postprocessing'

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

export const useWindStore = create<WindState>((set) => ({
  variant: 'calm',
  calm: {
    force: 10,
    calm: 4,
    speed: 2,
    scale: 70,
  },
  force: {
    force: 220,
    calm: 4,
    speed: 50,
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

export function Grass(props) {
  const { perlin, quality, material, geometry: sketchGeometry, position, resistance = 1, ...restProps } = props
  const { scene } = useThree()
  const currWindShift = useRef<number>(0)
  const windStore = useWindStore()
  const springs = useSpring({
    ...windStore[windStore.variant],
    config: {
      mass: 5,
      friction: 120,
      tension: 120,
    }
  })
  const [{ height, width, geometry }] = useState(() => {
    const width = sketchGeometry.boundingBox.min.x - sketchGeometry.boundingBox.max.x;
    const height = sketchGeometry.boundingBox.min.z - sketchGeometry.boundingBox.max.z;
    const geometry = new PlaneGeometry(width, height, 1, quality * 2);

    geometry.rotateX(anglToRad(-90))
    geometry.rotateZ(anglToRad(180))

    return { height, width, geometry }
  })
  const [randomShift] = useState(() =>
    randomize(springs.calm.get())
  )
  const [skeleton] = useState(() => {
    const bones = []

    Array.from({ length: quality + 1 }).forEach((_, index) => {
      const bone = new Bone()

      if (index !== 0) bone.position.z = height / quality
      else bone.position.z = -height / 2

      const prevBone = bones[bones.length - 1]
      if (prevBone) prevBone.add(bone)
      bones.push(bone)
    })

    return new Skeleton(bones)
  })
  const meshRef = useRef<SkinnedMesh>(null)
  const geometryRef = useRef<PlaneGeometry>(null)

  useEffect(() => {
    const position = geometry.attributes.position
    const vertex = new Vector3()

    const skinIndices = []
    const skinWeights = []

    const segmentHeight = height / quality
    const halfHeight = height / 2

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i)

      const y = vertex.z + halfHeight

      const skinIndex = Math.floor(y / segmentHeight)
      const skinWeight = ( y % segmentHeight ) / segmentHeight;

      skinIndices.push(skinIndex, skinIndex + 1, 0, 0)
      skinWeights.push(1 - skinWeight, skinWeight, 0, 0)
    }

    geometry.setAttribute(
      'skinIndex',
      new Uint16BufferAttribute(skinIndices, 4)
    )
    geometry.setAttribute(
      'skinWeight',
      new Float32BufferAttribute(skinWeights, 4)
    )

    meshRef.current.add(skeleton.bones[0])
    meshRef.current.bind(skeleton)

    const helper = new SkeletonHelper(meshRef.current);

    //scene.add(helper)
  }, [])

  useFrame((state, delta) => {
    const speed = springs.speed.get()
    const scale = springs.scale.get()
    const force = springs.force.get()

    currWindShift.current = currWindShift.current + delta * speed

    const noise = perlin.noise(
      (position[0] + currWindShift.current) / scale,
      position[1] / scale,
      position[2]
    )
    const boundedNoise = noise + 0.2

    const angle =
      (Math.sin(state.clock.elapsedTime) * 10 * randomShift) / quality
    const angleWinded = (force * boundedNoise + force / 4) / quality

    let commulutiveAngle = 0

    skeleton.bones.forEach((bone, index) => {
      const angleForce =
        0.5 - Math.abs(index / (skeleton.bones.length - 1) - 0.5) + 0.25

      const boneAngle = (angle + angleWinded) * angleForce / resistance

      if (commulutiveAngle <= 90 && commulutiveAngle + boneAngle >= 90) {
        bone.rotation.y = anglToRad(90 - commulutiveAngle)
      } else if (commulutiveAngle <= 90) {
        bone.rotation.y = anglToRad(boneAngle)
      } else {
        bone.rotation.y = anglToRad(0)
      }
      commulutiveAngle += boneAngle
      // bone.rotation.x = anglToRad(angle) * angleForce * 6
    })
  })

  return (
    <skinnedMesh {...restProps} position={position} ref={meshRef} material={material} geometry={geometry}>
      {/* <planeGeometry args={[width, height, 1, quality]} ref={geometryRef} /> */}
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

function WindEffect() {
  const { scene, camera } = useThree()
  const [flows, setFlows] =
    useState<{ flow: Flow; speedShift: number; windMesh: Mesh }[]>(null)
  const windEffect = useControls('WindEffect', {
    flowSize: 0.4,
    flowLength: 4,
    steps: 10,
    randomizePath: 1,
    randomizeSize: 0.3,
    randomizeLength: 3,
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

    geometry.rotateX(anglToRad(70))
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
      createFlow(5, -3),
      createFlow(2, 3.6),
      createFlow(4, 3.5),
      createFlow(3, -0.3),
      createFlow(7, 2),
      createFlow(1, 6),
      createFlow(9, -2),
      createFlow(5.2, 1.4),
    ]

    rawFlows.forEach(({ flow, debug }) => {
      flow.moveAlongCurve(-flow.uniforms.pathOffset.value + 0.9)
      scene.add(flow.object3D)
      // scene.add(debug);
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
        // scene.remove(debug);
      })
    }
  }, [])

  useFrame((state, delta) => {
    flows?.forEach((flow) => {
      if (
        flow.flow.uniforms.pathOffset.value < 0.9 ||
        windStore.variant === 'force'
      ) {
        flow.flow.moveAlongCurve(-0.005 * delta * windStore.force.speed * flow.speedShift)
        if (flow.flow.uniforms.pathOffset.value <= 0.1) {
          flow.flow.moveAlongCurve(-flow.flow.uniforms.pathOffset.value + 0.9)
          flow.speedShift = (Math.random() + 0.5) * windEffect.randomizeSpeed;
        }
      }
    })
  })

  return null
}

function Scene() {
  const cameraRef = useRef(null);

  useFrame(() => {

    //cameraRef.current?.lookAt(-2, 3, 1)
  })

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
      <WindEffect />
    </>
  )
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
    <Canvas>
      <fog attach="fog" args={[new Color(0xaad9ff), 30, 51.5]} />
      <Environment background preset="sunset" blur={0.8} />
        <Scene />
      {/* <EffectComposer>
        <Noise opacity={0.02} />
  </EffectComposer> */}
      <Stats />
    </Canvas>
  )
}

export default App
