import * as THREE from 'three'

function createPoi(poiOption) {
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
  }

  export { createPoi }
