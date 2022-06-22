import * as THREE from './node_modules/three/build/three.module.js'
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from './node_modules/three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from './node_modules/three/examples/jsm/controls/OrbitControls.js'                        

import { RenderPass } from './node_modules/three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from './node_modules/three/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from './node_modules/three/examples/jsm/postprocessing/EffectComposer.js';




let currentObject = {}


let lastObject = {}

const canvas= document.querySelector('canvas.webgl')
const prDiv=document.querySelector('div.pr')
console.log("canvas===",canvas);


const scene =new THREE.Scene()





let urls = [
    './skybox/Sky_RT.jpg', 
    './skybox/Sky_LF.jpg', 
    './skybox/Sky_UP.jpg', 
    './skybox/Sky_DN.jpg', 
    './skybox/Sky_BK.jpg', 
    './skybox/Sky_FR.jpg'  
];
let skyboxCubemap=new THREE.CubeTextureLoader().load(urls);
scene.background=skyboxCubemap;


const camera =new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight)
camera.position.z=5
scene.add(camera)


const light = new THREE.AmbientLight(0xFFFFFF, 1);
camera.add(light);


const renderer=new THREE.WebGLRenderer(
    {    
    canvas:canvas,
    antialias:true 
    });
renderer.setSize(window.innerWidth,window.innerHeight)
renderer.outputEncoding=THREE.sRGBEncoding;

renderer.render(scene,camera)


const composer= new EffectComposer(renderer)

const renderPass=new RenderPass(scene,camera)
composer.addPass(renderPass)

const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 10;
outlinePass.edgeGlow = 0.1;
outlinePass.edgeThickness = 1;

outlinePass.visibleEdgeColor.set('#B31985');
outlinePass.hiddenEdgeColor.set('#190a05');
composer.addPass(outlinePass);




let sceneReady=false
const loadingManager=new THREE.LoadingManager(
    
    ()=>{
        console.log("载入完成")
        sceneReady=true
        console.log("scene===",scene)
    },
    
    
    (itemUrl, itemsLoaded, itemsTotal) => {
        console.log("载入中...", itemsLoaded)
    }

)




const dracoLoader=new DRACOLoader()
dracoLoader.setDecoderPath('./models/draco/')

const gltfLoader=new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)
gltfLoader.load(
    './models/tunnel.gltf',
    (gltf)=>{
        const object =gltf.scene || gltf.scene[0]

        
        const box = new THREE.Box3().setFromObject(object)
        const size = box.getSize(new THREE.Vector3()).length()
        const center = box.getCenter(new THREE.Vector3())
        object.position.x += (object.position.x - center.x);
        object.position.y += (object.position.y - center.y);
        object.position.z += (object.position.z - center.z);
        
        camera.near = size / 100
        camera.far = size * 100
        camera.updateProjectionMatrix()
        

        camera.position.copy(center)
        camera.position.x += size / 0.5
        camera.position.y += size / 0.2
        camera.position.z += size / 2
        camera.lookAt(center)
        console.log(camera.position.x)
        console.log(camera.position.y)
        console.log(camera.position.z)
        console.log(size)
        console.log(center)


        scene.add(object)
        console.log("scene===",scene);

    }
)


const controls = new OrbitControls(camera, canvas)



window.addEventListener('resize',()=>{
    
    camera.aspect=window.innerWidth/window.innerHeight
    camera.updateProjectionMatrix()
    
    renderer.setSize(window.innerWidth,window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))
})


const raycaster =new THREE.Raycaster()

const mouse= new THREE.Vector2()

window.addEventListener('mousemove',(event)=>{
    mouse.x=event.clientX/window.innerWidth*2-1

    mouse.y= - (event.clientY / window.innerHeight) * 2 + 1
})


const generateTable=(data)=>{
    console.log("data===",data)
    var table=document.createElement('table')
    table.className='styled-table'
    if(Object.keys(data).length==0){
        return
    }
    var thead=document.createElement('thead')
    var headtr=document.createElement('tr')
    var headFirst = document.createElement('th')
    var headSecond = document.createElement('th')
    headFirst.textContent='属性'
    headSecond.textContent='属性值'
    headtr.appendChild(headFirst)
    headtr.appendChild(headSecond)
    thead.appendChild(headtr)
    table.appendChild(thead)

    var tbody=document.createElement('tbody');
    table.appendChild(tbody)

   for (const [key, value] of Object.entries(data)) {
      if(key !='Properties'){
        var row = document.createElement('tr');
        var cellFirst = document.createElement('td');
        var cellSecond = document.createElement('td');
        cellFirst.textContent = key;
        cellSecond.textContent=value
        row.appendChild(cellFirst);
        row.appendChild(cellSecond);
        tbody.appendChild(row);
       
      }else{
        for (const [key, value] of Object.entries(data.Properties)) {
        
            var row = document.createElement('tr');
            var cellFirst = document.createElement('td');
            var cellSecond = document.createElement('td');
            cellFirst.textContent = key;
            cellSecond.textContent=value
            row.appendChild(cellFirst);
            row.appendChild(cellSecond);
            tbody.appendChild(row);
           
        }
      }
    }

    prDiv.innerHTML='';
    prDiv.style.width='400px';
    prDiv.style.height='500px';
    prDiv.appendChild(table);

}

window.addEventListener('click',()=>{

  
    if(JSON.stringify(currentObject)!='{}' && currentObject != undefined && currentObject != null&& currentObject != lastObject){
        console.log("选中了")
        console.log("click",currentObject)
        lastObject=currentObject
        prDiv.style.visibility='visible'
       generateTable(currentObject.userData)

        let outlineObjcets=[]
        outlineObjcets.push(currentObject)
        outlinePass.selectedObjects=outlineObjcets


    }else{
        console.log("没有选中")
        lastObject={}
        currentObject={}
        outlinePass.selectedObjects=[]
        prDiv.style.visibility='hidden'
    }

})


const animate=function(){
    requestAnimationFrame(animate)
    if(sceneReady){
        raycaster.setFromCamera(mouse,camera)
        const intersects=raycaster.intersectObjects(scene.children[1].children[0].children)

        
        if(intersects.length>0){
            const selectedObject=intersects[0].object
            if(currentObject!=selectedObject){
                currentObject=selectedObject
            }
        
        }else{
            currentObject={}
        }

    }
    
    controls.update()
    renderer.render(scene,camera)
     
     composer.render()
}

animate()

