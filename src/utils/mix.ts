// Mix object from a, to b, by properties from array of strings
// Example: mix({a: 1, b: 2}, {a: 2, b: 3}, 0.5, ['a']) => {a: 1.5}
export function mix(a, b, t, keys) {
  var result = {}
  keys.forEach(function (key) {
    result[key] = a[key] * (1 - t) + b[key] * t
  })
  return result
}
