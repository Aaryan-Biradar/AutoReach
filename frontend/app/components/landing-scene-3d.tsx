"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const BAR_COUNT = 140;
const BASE_RADIUS = 2;
const INNER_SCALE = 0.32;
const OUTER_SCALE = 0.88;
const BAR_THICKNESS = 0.012;
const BAR_DEPTH_BASE = 0.06;
const BAR_DEPTH_WAVE = 0.06; // depth wave amplitude (pulsate in Z)
const WAVE_SPEED = 1.8;
const ROTATION_SPEED = 0.008;
const WAVE_FREQ = 5; // waves around the ring (depth only; outline stays circular)

interface BarData {
  angle: number;
  innerR: number;
  outerR: number;
  midR: number;
  width: number;
  color: THREE.Color;
}

function RingBars() {
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const barDataRef = useRef<BarData[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const timeRef = useRef(0);

  const { barData, geometry } = useMemo(() => {
    const barData: BarData[] = [];
    const colorArray = new Float32Array(BAR_COUNT * 3);

    for (let i = 0; i < BAR_COUNT; i++) {
      const angle = (i / BAR_COUNT) * Math.PI * 2;
      const rOuter = BASE_RADIUS * OUTER_SCALE;
      const rInner = BASE_RADIUS * INNER_SCALE;
      const midR = (rInner + rOuter) * 0.5;
      const width = rOuter - rInner;

      // Color: teal → slate gradient (angle-based), bright so it's visible
      const normalizedAngle =
        ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const t = (Math.sin(normalizedAngle - Math.PI * 0.15) + 1) / 2;
      const t2 = Math.pow(t, 1.5);
      const r = (100 * t2 + 90 * (1 - t2)) / 255;
      const g = (200 * t2 + 120 * (1 - t2)) / 255;
      const b = (210 * t2 + 140 * (1 - t2)) / 255;
      const color = new THREE.Color(r, g, b);
      colorArray[i * 3 + 0] = r;
      colorArray[i * 3 + 1] = g;
      colorArray[i * 3 + 2] = b;

      barData.push({ angle, innerR: rInner, outerR: rOuter, midR, width, color });
    }

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    geometry.setAttribute(
      "color",
      new THREE.InstancedBufferAttribute(colorArray, 3)
    );
    return { barData, geometry };
  }, []);

  barDataRef.current = barData;

  const rotRef = useRef(0);

  useFrame((_, delta) => {
    if (!instancedRef.current) return;
    rotRef.current += ROTATION_SPEED;
    timeRef.current += delta;

    const rotY = rotRef.current;
    const t = timeRef.current;

    barDataRef.current.forEach((bar, i) => {
      const angle = bar.angle + rotY;
      // Depth wave only (ring outline stays a perfect circle)
      const depthWave =
        1 +
        Math.sin(angle * WAVE_FREQ + t * WAVE_SPEED) *
          (BAR_DEPTH_WAVE / BAR_DEPTH_BASE);
      const depth = BAR_DEPTH_BASE * depthWave;

      dummy.position.set(
        Math.cos(angle) * bar.midR,
        Math.sin(angle) * bar.midR,
        depth * 0.5
      );
      dummy.rotation.z = -angle;
      dummy.scale.set(bar.width, BAR_THICKNESS, depth);
      dummy.updateMatrix();
      instancedRef.current!.setMatrixAt(i, dummy.matrix);
    });
    instancedRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={instancedRef}
      args={[geometry, undefined, BAR_COUNT]}
      castShadow
      receiveShadow
    >
      <meshBasicMaterial
        vertexColors
        toneMapped={false}
      />
    </instancedMesh>
  );
}

function Scene() {
  const { size } = useThree();
  const aspect = size.width / size.height;
  // Scale so the ring stays a circle on screen (counter perspective aspect squash)
  const scaleX = aspect > 1 ? aspect : 1;
  const scaleY = aspect < 1 ? 1 / aspect : 1;

  return (
    <>
      <ambientLight intensity={0.85} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} />
      <pointLight position={[0, 0, 3]} intensity={0.3} />
      <group scale={[scaleX, scaleY, 1]}>
        <RingBars />
      </group>
    </>
  );
}

export function LandingScene3D() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[#eee7d3]">
      <div className="aspect-square h-full w-auto max-w-full">
        <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        shadows
        dpr={[1, 2]}
      >
        <color attach="background" args={["#eee7d3"]} />
        <fog attach="fog" args={["#eee7d3", 8, 14]} />
        <Scene />
      </Canvas>
      </div>
    </div>
  );
}
