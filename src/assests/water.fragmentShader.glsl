#include <packing>
#include <fog_pars_fragment>
#include <common>

#ifdef GL_ES
precision mediump float;
#endif


uniform sampler2D ocean_texture;
varying vec2 vUv;
varying vec3 viewZ;
varying float depthLevel;
uniform vec2 resolution;
uniform float uWind;
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

float readDepth(sampler2D depthSampler, vec2 coord) {
  float fragCoordZ = texture2D(depthSampler, coord).x;
  float viewZ = perspectiveDepthToViewZ(fragCoordZ, camera_near, camera_far);
  return viewZToOrthographicDepth(viewZ, camera_near, camera_far);
}

vec2 random2(vec2 p) {
  return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;

  float time = uTime * 0.001;
  float distanceDark = 8.0;
  float distanceLight = 12.0;

  // Depth of point on ocean surface
  float depth2 = viewZ.z;

  // Normalised depth of scene betweet 0 and 1
  float depth = readDepth(depth_map, (gl_FragCoord.xy / resolution.xy));

  // Depth of scene in range of camera
  float depth1 = mix(camera_near, camera_far, depth);

  float windForce = min(max(uWind / 80.0, 0.0), 2.0) / 2.0;

  vec4 col1 = vec4(color_shallow, max(opacity_shallow, windForce));
  vec4 col2 = vec4(color_deep, opacity_deep);

  vec4 darkFoam = 1.0 - 0.2 * smoothstep(distanceDark, 0.0, depth2) * texture2D(map, vUv * repeat * 1.25);
  vec4 lightFoam = vec4(color_foam, 1.0) * texture2D(
    map, 
    vUv * repeat + (1.0 / repeat) * vec2(
      sin(time * 2.0 + repeat * 10.0 * vUv.x), 
      cos(time * 2.0 + repeat * 10.0 * vUv.y)
    ) + (2.0 / repeat) * vec2(
      sin(repeat * 20.0 * vUv.x), 
      cos(repeat * 20.0 * vUv.y)
    )) * 0.5 * smoothstep(distanceLight, 0.0, depth2);

  if(depth1 - depth2 < 0.2) {
    gl_FragColor = vec4(color_foam, opacity_foam * smoothstep(0.0, 0.1, depth1 - depth2));
    
    //gl_FragColor = texture2D(ocean_texture, vUv);
  } else {
    vec4 depthCol;
    float transition = smoothstep(0.2, 0.4, depth1 - depth2);
    float refracdepth_map = mix(camera_near, camera_far, readDepth(depth_map, (gl_FragCoord.xy + (10.0 / (depth2 * depth2)) * vec2(sin(time + 30.0 * repeat * vUv.x), cos(time + 30.0 * repeat * vUv.y))) / resolution.xy));

    float maxDepthCoeficent = (1.0 - min(windForce, 0.6)) * max_depth;

    depthCol = mix(0.5 * col1, col2, smoothstep(0.0, maxDepthCoeficent, refracdepth_map - depth2));

    // Don't ripple if the sampled texel is in front of the plane
    if(depth2 > refracdepth_map) {
      depthCol = mix(0.5 * col1, col2, smoothstep(0.0, maxDepthCoeficent, depth1 - depth2));
    }

    /* gl_FragColor = mix(vec4(color_foam, opacity_foam), depthCol * darkFoam + lightFoam, //mix(depthCol * darkFoam + lightFoam, vec4(vec3(color_foam), 1.0), depthLevel * 0.5 + 0.5), 
    transition); */

    //gl_FragColor = depthCol * darkFoam + lightFoam;

    vec2 st = vUv;
    vec4 color = depthCol * darkFoam + lightFoam;

    // Scale
    st *= 400.0;

    // Tile the space
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);

    float m_dist = 1.;  // minimum distance

    for(int y = -1; y <= 1; y++) {
      for(int x = -1; x <= 1; x++) {
            // Neighbor place in the grid
        vec2 neighbor = vec2(float(x), float(y));

            // Random position from current + neighbor place in the grid
        vec2 point = random2(i_st + neighbor);

			// Animate the point
        point = 0.5 + 0.5 * sin(uTime + 6.2831 * point);

			// Vector between the pixel and the point
        vec2 diff = neighbor + point - f_st;

            // Distance to the point
        float dist = length(diff);

            // Keep the closer distance
        m_dist = min(m_dist, dist);
      }
    }

    // Draw the min distance (distance field)
    color = mix(color, vec4(color_foam, opacity_foam), m_dist * (1.0 - smoothstep(0.4, 1.2, depth1 - depth2)));

    // Draw cell center
    // color += 1.-step(.02, m_dist);

    // Draw grid
    // color.r += step(.98, f_st.x) + step(.98, f_st.y);

    // Show isolines
    // color -= step(.7,abs(sin(27.0*m_dist)))*.5;

    gl_FragColor = color;

    gl_FragColor = texture2D(ocean_texture, vUv);

    // gl_FragColor = vec4(color_deep, 1.0);
  }

  #include <fog_fragment>
}