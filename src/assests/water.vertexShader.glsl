#include <fog_pars_vertex>

varying vec2 vUv;
varying vec3 viewZ;
uniform float uTime;
uniform sampler2D map;
uniform float repeat;

#define M_PI 3.14159265358979323846

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
	d = -0.5 * cos(d * M_PI) + 0.5;
	
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

void mainOld() {
  vUv = uv;

  vec3 pos = position;
  float noiseFreq = 3.5;
  float noiseAmp = 0.3; 
  vec3 noisePos = vec3(pos.x * noiseFreq, pos.y * noiseFreq + uTime, pos.z);
  pos.z += (snoiseWater(noisePos) * 0.8 + snoiseFoam(noisePos) * 0.2) * noiseAmp;

  vUv.y = snoiseWater(noisePos) * 0.7 + snoiseFoam(noisePos) * 0.3;//pos.z;


  #include <begin_vertex>
  #include <project_vertex>
  #include <fog_vertex>

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}

void main() {
  float time = uTime * 0.5;
  vUv = uv;
  vec3 newPos = position.xyz;
  newPos.z += 0.05*sin(time/1.8 + repeat*uv.y) + 0.05 * cos(time/2.0 + repeat*uv.x);
  viewZ = -(modelViewMatrix * vec4(newPos, 1.)).xyz;

  #include <begin_vertex>
  #include <project_vertex>
  #include <fog_vertex>

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
}