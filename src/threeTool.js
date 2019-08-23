import * as THREE from 'three'
import { MTLLoader } from '../jsm/loaders/MTLLoader'
import { OBJLoader } from '../jsm/loaders/OBJLoader'
import { OrbitControls } from '../jsm/controls/OrbitControls'

var TTs = {
  // poiLayer: {
  //   poiLayers: [],
  //   add: (poi) => {
  //     poiLayers.push(poi)
  //   },
  //   lock: 2,
  //   updataDivPos: () => {
  //     scene.addEventListener('preRender', () => {
  //       if (0 !== lock)
  //         return
  //       let lock = lock > 10 ? 0 : lock
  //       let screen = map.target.clone().project(camera)
  //       let screenPos = new THREE.Vector2(-screen.y * halfHeight + halfHeight, screen.x * halfWidth + halfWidth)
  //       console.log('updata screen pos', screenPos)
  //       divContainer.style.top = screenPos.x - 80 + 'px'
  //       divContainer.style.left = screenPos.y + 'px'
  //     })
  //   }
  // },
  // 加载模型文件，obj和mtl
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
  createWordCanvasTexture(option = {
      txt: '莫扎特', // 文字文本
      size: '23', // 文字大小尺寸
      color: 'red' // 文字颜色
    }) {
    const {txt, size, color} = option
    var canvas = document.createElement('canvas')
    var ctx = canvas.getContext('2d')
    let font = 'Normal ' + size + 'px Arial'
    console.log(font)
    ctx.font = 'Normal ' + size + 'px Arial'
    ctx.lineWidth = 1
    ctx.fillStyle = color // 字体颜色
    ctx.textAlign = 'left'
    ctx.textBaseline = 'center'
    ctx.fillText(txt, 100, 100)
    var texture = new THREE.CanvasTexture(canvas)
    // mesh.material.map = texture
    return texture
  },
  drawWord(option = {
      scene: scene,
      word: '迅维', // 绘制的文字文本
      color: 'red', // 字体颜色
      size: 23, // 字体大小
      position: {x: 0,y: 0,z: 0}, // 字体在场景中位置
      rotation: {x: 0,y: 0,z: 0} // 旋转角度
    }) {


    const {scene, word, color, size, position, rotation} = option
    let material = new THREE.MeshBasicMaterial()
    material.map = this.createWordCanvasTexture(
      word, size, color)

    let mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(200, 4000, 8000), material)
    mesh.name = 'wordMesh'
    scene.add(mesh)

    // 在透明通道过滤出透明度大于0.5d的像素
    //mesh.material.alphaTest = 0
    mesh.material.needsUpdate = true
    mesh.scale.set(500, 500, 500)

    mesh.position.set(position.x,
      position.y,
      position.z
    )

    mesh.rotation.set(rotation.x, rotation.y, rotation.z)
    return mesh
  },
  drawFace(){
    
  }
}
window.TTs = TTs
export default TTs
