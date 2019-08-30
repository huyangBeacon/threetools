import * as THREE from 'three'

function drawWord (option = {
    scene: undefined, // 三维场景容器
    word: '迅维', // 绘制的文字文本
    color: 'red', // 字体颜色
    size: 83, // 字体大小
    position: { x: 0, y: 0, z: 0 }, // 字体在场景中位置
    rotation: { x: 0, y: 0, z: 0 } // 旋转角度
  }) {
  const { scene, word, color, size, position, rotation } = option

  // 获取canvas对象，作为生成带有字符的材质的中间容器
  var canvas = document.createElement('canvas')
  canvas.width = 1600
  canvas.height = 800
  var ctx = canvas.getContext('2d')

  ctx.font = 'Normal  320px Arial'
  ctx.lineWidth = 10
  ctx.fillStyle = color // 字体颜色
  // ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(word, 10, 10)
  // 从canvas获取带有文字的材质
  var texture = new THREE.CanvasTexture(canvas)

  let material = new THREE.MeshBasicMaterial()
  material.map = texture
  let mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 8000, 16000), material)
  let markWordLayer = scene.getObjectByName('markWordLayer')

  if (markWordLayer === undefined) {
    markWordLayer = new THREE.Group()
    markWordLayer.name = 'markWordLayer'
    scene.add(markWordLayer)
  }
  markWordLayer.add(mesh)
  // 在透明通道过滤出透明度大于0.5d的像素
  mesh.material.alphaTest = 0.5
  mesh.material.needsUpdate = true
  mesh.scale.set(1, size / 8000, size / 8000)
  mesh.position.set(
    position.x,
    position.y,
    position.z
  )

  mesh.rotation.set(rotation.x, rotation.y, rotation.z)
  mesh.name = 'word3D'
  return mesh
}

export { drawWord }
