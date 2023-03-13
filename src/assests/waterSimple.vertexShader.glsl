#include <fog_pars_vertex>

#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265359

varying vec2 vUv;
varying vec3 viewZ;


void main() {
  vUv = uv;

  vec3 pos = position;

  viewZ = -(modelViewMatrix * vec4(pos, 1.)).xyz;

  #include <begin_vertex>
  #include <project_vertex>
  #include <fog_vertex>

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}