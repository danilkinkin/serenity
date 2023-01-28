import React, { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { anglToRad } from '@src/utils/angle'
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
} from 'three';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise';

function Grass(props) {
  const { perlin, x, y, quality, wind, ...restProps } = props;
  const { width: rawWidth, height: rawHeight, randomize } = useControls('Grass', { width: 0.05, height: 1, randomize: 1 });
  const [{ height, width }] = useState(() => {
    const width = rawWidth + (Math.random() - 0.5) * randomize * rawWidth;
    const height = rawHeight + (Math.random() - 0.5) * randomize * rawHeight;

    return { height, width };
  });
  const [randomShift, setRandomShift] = useState(() => (Math.random() - 0.5) * wind.calm);
  const [skeleton] = useState(() => {
    const bones = [];

    Array.from({ length: quality + 1 }).forEach((_, index) => {
      const bone = new Bone();

      if (index !== 0) bone.position.y = height / quality;

      const prevBone = bones[bones.length - 1];
      if (prevBone) prevBone.add(bone);
      bones.push(bone);
    })

    return new Skeleton( bones )
  });
  const materialRef = useRef<MeshStandardMaterial>(null);
  const meshRef = useRef<SkinnedMesh>(null);
  const geometryRef = useRef<PlaneGeometry>(null);
  const { scene } = useThree();

  useEffect(() => {
    geometryRef.current.translate(0, height / 2, 0);

    const position = geometryRef.current.attributes.position;
    const vertex = new Vector3();

    const skinIndices = [];
    const skinWeights = [];

    const segmentHeight = height / quality;
    const halfHeight = segmentHeight / 2;

    for ( let i = 0; i < position.count; i ++ ) {
      vertex.fromBufferAttribute( position, i );

      const y = ( vertex.y + halfHeight );

      const skinIndex = Math.floor( y / segmentHeight );
      const skinWeight = 0;

      skinIndices.push(skinIndex, skinIndex + 1, 0, 0);
      skinWeights.push(1 - skinWeight, skinWeight, 0, 0);
    }

    geometryRef.current.setAttribute('skinIndex', new Uint16BufferAttribute(skinIndices, 4));
    geometryRef.current.setAttribute('skinWeight', new Float32BufferAttribute(skinWeights, 4));

    meshRef.current.add(skeleton.bones[0])
    meshRef.current.bind(skeleton)

    // const helper = new SkeletonHelper( meshRef.current );
    // scene.add(helper);

    return () => {
      geometryRef.current.translate(0, -height / 2, 0);
    }
  }, []);

  useEffect(() => {
    setRandomShift((Math.random() - 0.5) * wind.calm);
  }, [wind.calm]);


  useFrame((state) => {
    const noise = perlin.noise((x + state.clock.elapsedTime * wind.speed) / wind.scale, y / wind.scale, 0);
    const boundedNoise = noise + 0.2;
    const color = Math.max(Math.min(1 - (boundedNoise * 2 + 0.7), 0.8), 0);

    const angle = (Math.sin(state.clock.elapsedTime) * 10 * randomShift) / quality;
    const angleWinded = (wind.force * boundedNoise) / quality;

    skeleton.bones.forEach((bone, index) => {
      if (index === 0) return;

      bone.rotation.z = anglToRad(angle + angleWinded);
      bone.rotation.y = anglToRad(angle);
    });
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
  const { density, size, randomizeShift } = useControls('Field', { density: 2, size: 10, randomizeShift: 1 });
  const { force, calm, speed, scale } = useControls('Wind', { force: 100, calm: 4, speed: 30, scale: 70 });
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
                  quality={4}
                  wind={{
                    force,
                    calm,
                    speed,
                    scale,
                  }}
                  position={[
                    x * shiftDistancePerSide - halfShift + (Math.random() - 0.5) * randomizeShift, 
                    0, 
                    y * shiftDistancePerSide - halfShift + (Math.random() - 0.5) * randomizeShift,
                  ]}
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
