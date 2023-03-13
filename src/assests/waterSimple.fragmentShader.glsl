#include <packing>
#include <fog_pars_fragment>

#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926

varying vec2 vUv;
varying vec3 viewZ;
uniform float uWind;
uniform sampler2D map;
uniform float uTime;
uniform float repeat;
uniform vec3 color_foam;
uniform vec3 color_shallow;
uniform vec3 color_deep;
uniform float opacity_shallow;
uniform float opacity_deep;

void main() {
  float time = uTime * 0.001;
  float distanceDark = 8.0;
  float distanceLight = 12.0;

  // Depth of point on ocean surface
  float depth2 = viewZ.z;
  float windForce = min(max(uWind / 80.0, 0.0), 2.0) / 2.0;

  vec4 col1 = vec4(color_shallow, max(opacity_shallow, windForce));
  vec4 col2 = vec4(color_deep, opacity_deep);

  vec4 darkFoam = 1.0 - 0.2 * smoothstep(distanceDark, 0.0, depth2) * texture2D(map, vUv * repeat * 1.25);
  vec4 lightFoam = vec4(color_foam, 1.0) * texture2D(map, vUv * repeat +
    (1.0 / repeat) * vec2(sin(time * 2.0 + repeat * 10.0 * vUv.x), cos(time * 2.0 + repeat * 10.0 * vUv.y)) +
    (2.0 / repeat) * vec2(sin(repeat * 20.0 * vUv.x), cos(repeat * 20.0 * vUv.y))) * 0.5 * smoothstep(distanceLight, 0.0, depth2);

  vec4 depthCol;

  depthCol = 1.5 * col2;

  gl_FragColor = depthCol * darkFoam + lightFoam;

  #include <fog_fragment>
}