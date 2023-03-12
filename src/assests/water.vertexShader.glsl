#include <fog_pars_vertex>

#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359

varying vec2 vUv;
varying vec3 viewZ;
varying float depthLevel;
uniform float uTime;
uniform float uWind;
uniform sampler2D map;
uniform float repeat;

float rand(vec2 co){return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);}
float rand (vec2 co, float l) {return rand(vec2(rand(co), l));}
float rand (vec2 co, float l, float t) {return rand(vec2(rand(co, l), t));}

float perlin(vec2 p, float dim, float time) {
	vec2 pos = floor(p * dim);
	vec2 posx = pos + vec2(1.0, 0.0);
	vec2 posy = pos + vec2(0.0, 1.0);
	vec2 posxy = pos + vec2(1.0);
	
	float c = rand(pos, dim, time);
	float cx = rand(posx, dim, time);
	float cy = rand(posy, dim, time);
	float cxy = rand(posxy, dim, time);
	
	vec2 d = fract(p * dim);
	d = -0.5 * cos(d * PI) + 0.5;
	
	float ccx = mix(c, cx, d.x);
	float cycxy = mix(cy, cxy, d.x);
	float center = mix(ccx, cycxy, d.y);
	
	return center * 2.0 - 1.0;
}

float snoiseFoam(vec3 pos) {
  float normal = perlin(vec2(pos.y * 0.1, pos.x * 0.1), 6.0, 0.0);
  float small = perlin(vec2(pos.y * 0.1, pos.x * 0.1), 12.0, 0.0);

  return normal * 0.3 + small * 0.7;
}


float snoiseWater(vec3 pos) {
  float huge = perlin(vec2(pos.y * 0.05, pos.x * 0.05), 0.7, 0.0);
  float big = perlin(vec2(pos.y * 0.05, pos.x * 0.05), 2.0, 0.0);

  return huge * 0.6 + big * 0.4;
}

float snoise(vec3 pos) {
  return snoiseFoam(pos) + snoiseWater(pos);
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

void main() {
  vUv = uv * rotate2d(PI * (-20.0 / 180.0));
  vec2 rTimeSpeed = vec2(uTime) * rotate2d(PI * ((70.0) / 180.0)) * 0.5;
  vec2 rTimeSlow = vec2(uTime) * rotate2d(PI * ((70.0) / 180.0)) * 0.2;

  vec3 pos = position;
  float noiseFreq = 3.5;
  float noiseAmp = 0.3; 
  vec3 noisePosBig = vec3(pos.x * noiseFreq + rTimeSlow.x, pos.y * noiseFreq + rTimeSlow.y, pos.z);
  vec3 noisePosSmall = vec3(pos.x * noiseFreq + rTimeSpeed.x, pos.y * noiseFreq + rTimeSpeed.y, pos.z);

  float windForce = max(uWind / 20.0, 1.0);
  float waveBig = (snoiseWater(noisePosBig) * 0.8);
  float waveSmall = (snoiseFoam(noisePosSmall) * 0.1);
  float displace = (waveBig + waveSmall);

  pos.z += displace * noiseAmp * windForce;

  viewZ = -(modelViewMatrix * vec4(pos, 1.)).xyz;

  depthLevel = snoiseWater(noisePosBig) * 0.2 + snoiseFoam(noisePosSmall) * 0.8;

  #include <begin_vertex>
  #include <project_vertex>
  #include <fog_vertex>

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}

void mainAlt() {
  float time = uTime * 0.5;
  vUv = uv * rotate2d(PI * (-20.0 / 180.0));
  vec2 rTime = vec2(time) * rotate2d(PI * ((45.0) / 180.0));
  vec3 newPos = position.xyz;
  float displace = (sin(rTime.y + repeat*vUv.y) + cos(rTime.x + repeat*vUv.x)) * max(min(uWind / 20.0, 1.0), 0.5);
  newPos.z += displace * 0.1;
  viewZ = -(modelViewMatrix * vec4(newPos, 1.)).xyz;

  depthLevel = displace;

  #include <begin_vertex>
  #include <project_vertex>
  #include <fog_vertex>

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
}