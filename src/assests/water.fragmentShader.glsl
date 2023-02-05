#include <packing>
#include <fog_pars_fragment>
#define PI 3.1415926

varying vec2 vUv;
varying vec3 viewZ;
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


  float time = uTime * 0.001;
  float distanceDark = 8.0;
  float distanceLight = 12.0;
  float max_depth = 3.0;

  // Depth of point on ocean surface
  float depth2 = viewZ.z;

  // Normalised depth of scene betweet 0 and 1
  float depth = readDepth( depth_map, (gl_FragCoord.xy/resolution.xy) );

  // Depth of scene in range of camera
  float depth1 = mix( camera_near, camera_far, depth);

  vec4 col1 = vec4( color_shallow, opacity_shallow );
  vec4 col2 = vec4( color_deep, opacity_deep );

  vec4 darkFoam = 1.0 - 0.2*smoothstep(distanceDark, 0.0,depth2)*texture2D(map, vUv * repeat*1.25);
  vec4 lightFoam = vec4(color_foam,1.0) * texture2D(map, vUv * repeat +
    (1.0/repeat) * vec2(sin(time*2.0+repeat*10.0*vUv.x), cos(time*2.0+repeat*10.0*vUv.y)) +
    (2.0/repeat) * vec2(sin(repeat*20.0*vUv.x), cos(repeat*20.0*vUv.y))
  ) * 0.5 * smoothstep(distanceLight, 0.0,depth2);

  if (depth1 - depth2 < 0.2) {
    gl_FragColor = vec4(color_foam,opacity_foam * smoothstep(0.0,0.1,depth1 - depth2));
  } else {
    vec4 depthCol;
    float transition = smoothstep(0.2 , 0.3, depth1 - depth2);
    float refracdepth_map = mix( camera_near, camera_far, readDepth( depth_map, (gl_FragCoord.xy + (10.0/(depth2*depth2))*vec2(sin(time + 30.0*repeat*vUv.x),cos(time + 30.0*repeat*vUv.y)))/resolution.xy ));

    depthCol = 1.5 * mix(0.5 * col1, col2, smoothstep(0.0, max_depth, refracdepth_map - depth2));

    // Don't ripple if the sampled texel is in front of the plane
    if (depth2 > refracdepth_map) {
      depthCol = 1.5 * mix(0.5 * col1, col2, smoothstep(0.0, max_depth, depth1 - depth2));
    }
    
    gl_FragColor = mix(vec4(color_foam,opacity_foam), depthCol * darkFoam + lightFoam, transition);
  }

  

  //gl_FragColor = mix(mix(deepBlue, blue, uv.y + 1.0), foam, uv.y);//texture2D( map, uv );


  #include <fog_fragment>
}