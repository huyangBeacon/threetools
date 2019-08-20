;(function () {
  var TTs = {
    // 加载钢琴模型文件，obj和mtl
    loadObjModel(modelPath, modelName) {
      let model
      return new Promise(function (resolve, reject) {
        new THREE.MTLLoader()
          .setPath(modelPath)
          .load(modelName + '.mtl', function (materials) {
            materials.preload()
            new THREE.OBJLoader()
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

                model = object

                resolve(object)
              })
          })
      })
  },

    updata360Mesh(picUrl, scene) {
      let textureLoader = new THREE.TextureLoader()
      let mesh360Temp,mesh360

      textureLoader.load(picUrl , function (texture) {
        texture.mapping = THREE.UVMapping
        debugger
       var texture360 = texture
        mesh360Temp = mesh360

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

    clickMouseToSelectObj(camera, objects,callBack) {
      let selected
      let internalId;
      var raycaster = new THREE.Raycaster()
      var mouse = new THREE.Vector2()

      document.addEventListener('mousemove', onDocumentMouseMove, false)
      document.addEventListener('mousedown', onDocumentMouseDown, false)

      function onDocumentMouseMove (event) {
        event.preventDefault()

        mouse.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1)

        raycaster.setFromCamera(mouse, camera)

        var intersects = raycaster.intersectObjects(objects)

        if (intersects.length > 0) {
          var intersect = intersects[0]
          //console.log('on move',intersect.point)
        }
      }

      function onDocumentMouseDown (event) {
        if(2 === event.button){
           document.removeEventListener('mousemove', onDocumentMouseMove, false)
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

    // 更新poi位置
    updataDivPos(map) {
      if (map === undefined)
        return
      let divContainer = map.poi
      let screen = map.target.getWorldPosition(new THREE.Vector3()).project(camera)
      let halfWidth = window.innerWidth / 2
      let halfHeight = window.innerHeight / 2
      let screenPos = new THREE.Vector2(-screen.y * halfHeight + halfHeight, screen.x * halfWidth + halfWidth)
      document.body.appendChild(divContainer)
      divContainer.style.top = screenPos.x - 80 + 'px'
      divContainer.style.left = screenPos.y + 'px'
    },

    // 生成poi
    createPoi(mesh, imgSrc) {
      let screen = mesh.getWorldPosition(new THREE.Vector3()).project(camera)
      let halfWidth = window.innerWidth / 2
      let halfHeight = window.innerHeight / 2
      // 屏幕坐标
      let screenPos = new THREE.Vector2(screen.x * halfHeight + halfHeight, -screen.y * halfWidth + halfWidth)
      let divContainer = document.createElement('div')
      divContainer.style.display = 'block'
      divContainer.style.position = 'fixed'
      divContainer.style.backgroundColor = '0x477674'
      divContainer.innerHTML = '莫扎特'; // poi文字信息

      document.body.appendChild(divContainer)
      divContainer.style.top = screenPos.x + 'px'
      divContainer.style.left = screenPos.y + 'px'
      let img = document.createElement('img')

      img.style.position = 'absolute'
      img.style.left = '0px'
      img.style.top = '0px'

      img.style.height = '80px'
      img.style.width = '60px'
      img.style.opacity = 0.7
      img.src = imgSrc
      divContainer.appendChild(img)

      return {poi: divContainer,target: INTERSECTED}
    },

    initScene() {
      camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000)
      camera.position.set(500, 800, 1300)
      camera.lookAt(0, 0, 0)

      controls = new THREE.OrbitControls(camera)

      scene = new THREE.Scene()
      scene.background = new THREE.Color(0x0fff0f0)

      var ambientLight = new THREE.AmbientLight(0x606060)
      scene.add(ambientLight)

      var directionalLight = new THREE.DirectionalLight(0xffffff)
      directionalLight.position.set(1, 0.75, 0.5).normalize()
      scene.add(directionalLight)

      window.addEventListener('resize', onWindowResize, false)

      function onWindowResize () {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()

        renderer.setSize(window.innerWidth, window.innerHeight)
      }

      renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setPixelRatio(window.devicePixelRatio)
      renderer.setSize(window.innerWidth, window.innerHeight)
      if (option === undefined || option.glcId === undefined) {
        document.body.appendChild(renderer.domElement)
      }else {
        document.getElementById(glcId).appendChild(renderer.domElement)
      }

      animate()

      function animate () {
        // 每次渲染前向scene发出预渲染事件，供scene监听，在事件监听回调中辅助完成场景其他处理
        // 监听语法：scene.addEventListener('preRender', () => {/**callBack to do something */})

        scene.dispatchEvent({ type: 'preRender', message: 'preUpdata' })

        requestAnimationFrame(animate)

        controls.update()

        renderer.render(scene, camera)
      }
      return {
        scene: scene,
        camera: camera
      }
    }
  }

  window.TTs = TTs
})()