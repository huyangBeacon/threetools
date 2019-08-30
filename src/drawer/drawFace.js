import * as THREE from 'three'

function drawFace (option = {
    scene: undefined,
    nextPoint: undefined, // 打点数组
    color: 'red', // 面的颜色
    opcity: 0.5, // 面的透明度
    bounding: true // 是否绘制边线
  }) {
  let scene = option.scene
  // 绘制闭合线
  function drawLineNoEnd (
    color // 线的颜色
  ) {

    // 根据名字获取绘制图层（组）
    let drawLayer = scene.getObjectByName('drawLayer')

    if (drawLayer === undefined) {
      drawLayer = new THREE.Group()
      drawLayer.name = 'drawLayer'
      scene.add(drawLayer)
    }
    while (drawLayer.getObjectByName('drawLine')) {
      drawLayer.remove(drawLayer.getObjectByName('drawLine'))
    }
    // 从绘制图层获取当前已打点的坐标序列
    var posArr = [].concat(drawLayer.userData.pointArr)

    if (posArr.length > 0)
      posArr.push(posArr[0])

    var geometry = new THREE.BufferGeometry()
    let bufferArr = []
    var material = new THREE.LineBasicMaterial({ vertexColors: THREE.VertexColors, linewidth: 50 })

    const newColor = new THREE.Color(color)
    var colors = [] // 颜色缓冲区类型化数组
    let length = posArr.length

    for (let i = 0; i < length; ++i) {
      // 缓冲区类型化数组填值
      bufferArr.push(posArr[i].x, posArr[i].y, posArr[i].z)
      colors.push(newColor.r)
      colors.push(newColor.g)
      colors.push(newColor.b)
    }
    // 绑定类型化数组到顶点缓冲区
    geometry.addAttribute('position', new THREE.Float32BufferAttribute(bufferArr, 3))
    // 绑定类型化数组到颜色缓冲区
    geometry.addAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    geometry.computeBoundingSphere()

    let line = new THREE.Line(geometry, material)

    line.name = 'drawLine'
    drawLayer.add(line)
    scene.add(drawLayer)
    geometry.dispose()
    return line
  }

  const { nextPoint, color, opcity, bounding } = option
  var material = new THREE.MeshStandardMaterial({ transparent: true, color: option.color, side: THREE.DoubleSide })

  material.opacity = opcity

  var drawLayer = scene.getObjectByName('drawLayer')

  if (drawLayer === undefined) {
    drawLayer = new THREE.Group()
    drawLayer.name = 'drawLayer'

    drawLayer.userData.pointArr = []

    scene.add(drawLayer)
  }

  var posArr = drawLayer.userData.pointArr

  posArr.push(nextPoint)

  while (drawLayer.getObjectByName('markMesh')) {
    drawLayer.remove(drawLayer.getObjectByName('markMesh'))
  }

  var drawObj = {
    lineObject: undefined,
    faceObject: undefined
  }

  for (let i = 0; i < posArr.length - 2; ++i) {
    var geometry = new THREE.Geometry()
    geometry.vertices.push(posArr[0])
    geometry.vertices.push(posArr[i + 1])
    geometry.vertices.push(posArr[i + 2])

    var normal = new THREE.Vector3(0, 1, 0) // optional
    var itemColor = new THREE.Color(color)
    var face = new THREE.Face3(0, 1, 2, normal, itemColor, 0)

    // add the face to the geometry's faces array
    geometry.faces.push(face)

    // the face normals and vertex normals can be calculated automatically if not supplied above
    geometry.computeFaceNormals()
    geometry.computeVertexNormals()

    let faceMesh = new THREE.Mesh(geometry, material)
    faceMesh.name = 'markMesh'
    drawLayer.add(faceMesh)
    drawObj.faceObject = faceMesh
    geometry.dispose()
  }

  if (bounding) {
    drawObj.lineObject = drawLineNoEnd('red')
  }

  return drawObj
}

export { drawFace }
