import React, { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import { anglToRad } from '@src/utils/angle'
import { Mesh, MeshStandardMaterial, PlaneGeometry, Color } from 'three';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise';

function Grass(props) {
  const { perlin, x, y, wind, ...restProps } = props;
  const [randomShift, setRandomShift] = useState(() => (Math.random() - 0.5) * wind.calm);
  const materialRef = useRef<MeshStandardMaterial>(null);
  const meshRef = useRef<Mesh>(null);
  const geometryRef = useRef<PlaneGeometry>(null);
  const { width, height } = useControls('Grass', { width: 0.05, height: 0.8 })

  useEffect(() => {
    geometryRef.current.translate(0, height / 2, 0);

    return () => {
      geometryRef.current.translate(0, -height / 2, 0);
    }
  }, []);

  useEffect(() => {
    setRandomShift((Math.random() - 0.5) * wind.calm);
  }, [wind.calm]);


  useFrame((state, delta, xrFrame) => {
    const noise = perlin.noise((x + state.clock.elapsedTime * wind.speed) / wind.scale, y / wind.scale, 0);
    const boundedNoise = noise + 0.2;
    const color = Math.max(Math.min(1 - (boundedNoise * 2 + 0.5), 0.8), 0);

    meshRef.current.rotation.z = anglToRad(Math.sin(state.clock.elapsedTime) * 10 * randomShift + wind.force * boundedNoise);
    meshRef.current.rotation.y = anglToRad(Math.cos(state.clock.elapsedTime) * 10 * randomShift);
    materialRef.current.color = new Color(color, color, color)
  })
  
  return (
    <mesh {...restProps} ref={meshRef}>
      <planeGeometry args={[width, height]} ref={geometryRef} />
      <meshStandardMaterial color={[0, 0, 0]} ref={materialRef} />
    </mesh>
  )
}

function Field() {
  const { density, size } = useControls('Plane', { density: 1, size: 10 });
  const { force, calm, speed, scale } = useControls('Wind', { force: 100, calm: 2, speed: 30, scale: 70 });
  const [perlin] = useState(() => new ImprovedNoise());
  
  const countPerSide = density * size;
  const shiftDistancePerSide = 1 / density;
  const halfShift = shiftDistancePerSide * ((countPerSide - 1) / 2);

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
                  perlin={perlin}
                  x={x}
                  y={y}
                  wind={{
                    force,
                    calm,
                    speed,
                    scale,
                  }}
                  position={[x * shiftDistancePerSide - halfShift, 0, y * shiftDistancePerSide - halfShift]}
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
