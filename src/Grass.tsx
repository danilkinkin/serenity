import React, { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { anglToRad } from '@src/utils/angle'
import { randomize } from '@src/utils/randomize'
import {
  PlaneGeometry,
  Skeleton,
  Bone,
  SkinnedMesh,
  Uint16BufferAttribute,
  Float32BufferAttribute,
  Vector3,
  SkeletonHelper,
} from 'three'
import { useSpring } from '@react-spring/three'
import { useWindStore } from './windState'
import { usePerlin } from './utils/PerlinField'

export function Grass(props) {
  const {
    quality,
    material,
    geometry: sketchGeometry,
    position,
    resistance = 1,
    ...restProps
  } = props
  const currWindShift = useRef<number>(0)
  const perlin = usePerlin()
  const { scene } = useThree()
  const windStore = useWindStore()
  const springs = useSpring({
    ...windStore[windStore.variant],
    config: {
      mass: 5,
      friction: 120,
      tension: 120,
    },
  })
  const [{ height, width, geometry }] = useState(() => {
    const width =
      sketchGeometry.boundingBox.min.x - sketchGeometry.boundingBox.max.x
    const height =
      sketchGeometry.boundingBox.min.z - sketchGeometry.boundingBox.max.z
    const geometry = new PlaneGeometry(width, height, 1, quality * 2)

    geometry.rotateX(anglToRad(-90))
    geometry.rotateZ(anglToRad(180))

    return { height, width, geometry }
  })
  const [randomShift] = useState(() => randomize(springs.calm.get()))
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
      const skinWeight = (y % segmentHeight) / segmentHeight

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

    const helper = new SkeletonHelper(meshRef.current)

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

      const boneAngle = ((angle + angleWinded) * angleForce) / resistance

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
    <skinnedMesh
      {...restProps}
      position={position}
      ref={meshRef}
      material={material}
      geometry={geometry}
    >
      {/* <planeGeometry args={[width, height, 1, quality]} ref={geometryRef} /> */}
    </skinnedMesh>
  )
}
