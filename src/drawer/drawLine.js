import * as THREE from 'three'

function drawLine (option = {
    scene: undefined,
    nextPoint: undefined,
    color: 'red'
  }) {
  let scene = option.scene
  let drawLayer = scene.getObjectByName('drawLayer')
  if (drawLayer === undefined) {
    drawLayer = new THREE.Group()
    drawLayer.name = 'drawLayer'
    drawLayer.userData.pointArr = []

    scene.add(drawLayer)
  }
  var posArr = drawLayer.userData.pointArr

  var geometry = new THREE.BufferGeometry()
  let bufferArr = []

  var material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors, linewidth: 50 })

  const { nextPoint, color } = option
  posArr.push(nextPoint)

  const newColor = new THREE.Color(color)
  var colorBuf = []

  let length = posArr.length
  for (let i = 0; i < length; ++i) {
    bufferArr.push(posArr[i].x, posArr[i].y, posArr[i].z)
    colorBuf.push(newColor.r)
    colorBuf.push(newColor.g)
    colorBuf.push(newColor.b)
  }

  geometry.addAttribute('position', new THREE.Float32BufferAttribute(bufferArr, 3))
  geometry.addAttribute('color', new THREE.Float32BufferAttribute(colorBuf, 3))
  geometry.computeBoundingSphere()
  let line = new THREE.Line(geometry, material)
  line.name = 'drawLine'
  drawLayer.add(line)

  scene.add(drawLayer)
  geometry.dispose()
  return line
}

export { drawLine }
