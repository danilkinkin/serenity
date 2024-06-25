import { useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { anglToRad } from '@src/utils/angle'
import { randomize } from '@src/utils/randomize'
import {
  MeshStandardMaterial,
  PlaneGeometry,
  Color,
  Vector3,
  Mesh,
  CatmullRomCurve3,
  LineLoop,
  BufferGeometry,
  LineBasicMaterial,
  DoubleSide,
  SphereGeometry,
  Group,
  MeshBasicMaterial,
} from 'three'
import { Flow } from 'three/examples/jsm/modifiers/CurveModifier'
import { useWindStore } from './windState'

export function WindStreamEffect() {
  const { scene, camera } = useThree()
  const [flows, setFlows] =
    useState<{ flow: Flow; speedShift: number; windMesh: Mesh }[]>(null)
  const windEffect = {
    flowSize: 0.4,
    flowLength: 4,
    steps: 10,
    randomizePath: 1,
    randomizeSize: 0.3,
    randomizeLength: 3,
    randomizeSpeed: 2,
  }
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
    const material = new MeshBasicMaterial({
      color: new Color(0xe8f4ff),
      side: DoubleSide,
      toneMapped: false,
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
    flows?.forEach((flow) => {
      if (
        flow.flow.uniforms.pathOffset.value < 0.9 ||
        windStore.variant === 'force'
      ) {
        flow.flow.moveAlongCurve(
          -0.005 * delta * windStore.force.speed * flow.speedShift
        )
        if (flow.flow.uniforms.pathOffset.value <= 0.1) {
          flow.flow.moveAlongCurve(-flow.flow.uniforms.pathOffset.value + 0.9)
          flow.speedShift = (Math.random() + 0.5) * windEffect.randomizeSpeed
        }
      }
    })
  })

  return null
}
