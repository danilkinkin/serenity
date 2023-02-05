#include <packing>
#define PI 3.1415926

varying vec2 vUv;
uniform vec2 resolution;
uniform sampler2D depth_map;
uniform sampler2D map;
uniform float camera_near;
uniform float camera_far;
uniform float uTime;
uniform float repeat;
uniform vec3 color_foam;
uniform vec3 color_shallow;
uniform vec3 color_deep;
uniform float opacity_shallow;
uniform float opacity_deep;
uniform float opacity_foam;
uniform float max_depth;

float readDepth( sampler2D depthSampler, vec2 coord ) {
  float fragCoordZ = texture2D( depthSampler, coord ).x;
  float viewZ = perspectiveDepthToViewZ( fragCoordZ, camera_near, camera_far );
  return viewZToOrthographicDepth( viewZ, camera_near, camera_far );
}

void main() {
  vec2 uv = vUv;
  vec4 foam = vec4(1.0, 1.0, 1.0, 1.0);
  vec4 blue  = vec4(0.0, 0.0, 1.0, 1.0);
  vec4 deepBlue  = vec4(0.0, 0.0, 0.5, 1.0);

  gl_FragColor = mix(mix(deepBlue, blue, uv.y + 1.0), foam, uv.y);//texture2D( map, uv );
}