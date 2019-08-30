import * as THREE from 'three'
import { MTLLoader } from '../jsm/loaders/MTLLoader'
import { OBJLoader } from '../jsm/loaders/OBJLoader'
import { OrbitControls } from '../jsm/controls/OrbitControls'
import { test } from './extends'
import { drawLine } from './drawer/drawLine'

var TTs = {
  loadObjModel(modelPath, modelName) {
    return new Promise(function (resolve, reject) {
      new MTLLoader()
        .setPath(modelPath)
        .load(modelName + '.mtl', function (materials) {
          materials.preload()
          new OBJLoader()
            .setMaterials(materials)
            .setPath(modelPath)
            .load(modelName + '.obj', function (object) {

              // 设置模型空间状态，包括位置坐标，旋转角度，缩放比例
              object.position.set(472.5, -349, -907)
              object.scale.set(6.8, 6.8, 6.8)
              object.rotateY(Math.PI / 2)

              // 圆滑着色，淡化模型点与线对渲染后图像的外形造成扭曲
              object.children.forEach((obj) => {
                obj.material.flatShading = false
                obj.material.needsUpdate = true
              })

              resolve(object)
            })
        })
    })
  },
  // 更改网格实体材质的全景环境光映射
  updataLightMap(texture, meshs) {
    meshs.forEach((obj) => {
      if (obj.type != 'Mesh')
        return
      obj.material.lightMap = texture
      obj.material.opacity = 0.3
      obj.material.needsUpdate = true
    })
  },

  updata360Mesh(picUrl, scene) {
    let objects = scene.children

    let textureLoader = new THREE.TextureLoader()
    let mesh360Temp,mesh360

    textureLoader.load(picUrl , function (texture) {
      texture.mapping = THREE.UVMapping
      let texture360 = texture
      mesh360Temp = mesh360

      for (let i = 0;i < objects.length;++i) {
        if ('Mesh' === objects[i].type)
          this.updata360Mesh(objects[i], texture)
      }

      // 全景容器网格
      mesh360 = new THREE.Mesh(new THREE.SphereBufferGeometry(7900, 3900, 5),
        new THREE.MeshBasicMaterial({map: texture}))
      mesh360.geometry.scale(-0.5, 0.5, 0.5)
      scene.add(mesh360)

      // 释放材质与几何体缓冲区资源
      if (mesh360Temp !== undefined) {
        mesh360Temp.visible = false
        scene.remove(mesh360Temp)
        mesh360Temp.geometry.dispose()
        mesh360Temp.material.dispose()
      }
    })
  },

  clickMouseToSelectObj(camera, objects, callBack) {
    let selected
    let internalId
    var raycaster = new THREE.Raycaster()
    var mouse = new THREE.Vector2()

    document.addEventListener('mousedown', onDocumentMouseDown, false)

    function onDocumentMouseDown (event) {
      if (2 === event.button) {
        document.removeEventListener('mousedown', onDocumentMouseDown, false)
        return
      }

      event.preventDefault()

      mouse.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1)

      raycaster.setFromCamera(mouse, camera)

      let intersects = raycaster.intersectObjects(objects)
      if (intersects.length > 0) {
        selected = intersects[0]
        callBack(selected)
      }
    }
  },

  // 生成poi
  createPoi(poiOption) {
    const { position, imgSrc, message, toggleRemove } = poiOption
    let screen = position.clone().project(camera)
    let halfWidth = window.innerWidth / 2
    let halfHeight = window.innerHeight / 2

    // 获取场景中位置对应的屏幕坐标
    let screenPos = new THREE.Vector2(-screen.y * halfHeight + halfHeight, screen.x * halfWidth + halfWidth)
    let divContainer = document.createElement('div')
    if (toggleRemove) {
      divContainer.addEventListener('mousedown', (event) => {
        event.stopPropagation()
        console.log('mouse click')

        document.body.removeChild(divContainer)
      })
    }

    divContainer.style.display = 'block'
    divContainer.style.position = 'fixed'
    divContainer.style.backgroundColor = '0x477674'
    divContainer.innerHTML = message === undefined ? '' : message; // poi文字信息

    document.body.appendChild(divContainer)
    divContainer.style.top = screenPos.x - 80 + 'px'
    divContainer.style.left = screenPos.y + 'px'
    if (imgSrc !== undefined) {
      let img = document.createElement('img')

      img.style.position = 'absolute'
      img.style.left = '0px'
      img.style.top = '0px'

      img.style.height = '60px'
      img.style.width = '60px'
      img.style.opacity = 0.7
      img.src = imgSrc
      divContainer.appendChild(img)
    }

    // 监听渲染循环事件，并在回调中更新poi位置
    scene.addEventListener('preRender', () => {
      let screen = position.clone().project(camera)

      let screenPos = new THREE.Vector2(-screen.y * halfHeight + halfHeight, screen.x * halfWidth + halfWidth)

      divContainer.style.top = screenPos.x - 80 + 'px'
      divContainer.style.left = screenPos.y + 'px'
    })

    return { poi: divContainer,target: position }
  },

  // 初始化场景
  initScene(option) {
    let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000)
    camera.position.set(500, 800, 1300)
    camera.lookAt(0, 0, 0)

    let controls = new OrbitControls(camera)

    let scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0fff0f0)

    let ambientLight = new THREE.AmbientLight(0x606060)
    scene.add(ambientLight)

    let directionalLight = new THREE.DirectionalLight(0xffffff)
    directionalLight.position.set(1, 0.75, 0.5).normalize()
    scene.add(directionalLight)

    window.addEventListener('resize', onWindowResize, false)

    function onWindowResize () {
      console.log('window resize')
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()

      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    let renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    let mouseEventControler = {
      mouseDown: undefined,
      mouseMove: undefined,
      mouseUp: undefined
    }
    let glCanvas = renderer.domElement
    if (option === undefined || option.glcId === undefined) {
      document.body.appendChild(glCanvas)
    }else {
      document.getElementById(option.glcId).appendChild(glCanvas)
    }
    glCanvas.addEventListener('mousedown', (event) => {
      mouseEventControler.mouseDown = event
    })
    glCanvas.addEventListener('mousemove', (event) => {
      mouseEventControler.mouseMove = event
    })
    glCanvas.addEventListener('mouseup', (event) => {
      mouseEventControler.mouseUp = event
    })

    animate()

    function animate () {
      // 每次渲染前向scene发出预渲染事件，供scene监听，在事件监听回调中辅助完成场景其他处理
      // 监听语法：scene.addEventListener('preRender', () => {/**callBack to do something */})

      scene.dispatchEvent({ type: 'preRender', message: 'preUpdata' })

      scene.dispatchEvent({ type: 'eventControl', message: mouseEventControler })

      requestAnimationFrame(animate)

      controls.update()

      renderer.render(scene, camera)
    }
    return {
      scene: scene,
      camera: camera
    }
  },

  // 绘制面
  drawFace(option = {
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
  },

  drawLine0(option = {
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
  },
  drawLine,
  test,
  drawWord(option = {
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
}

window.TTs = STTs
export { TTs }
