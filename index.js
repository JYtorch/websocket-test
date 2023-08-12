import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.132.2/build/three.module.js';

const userList = document.getElementById('user-list');
const userListContainer = document.getElementById('user-list-container')
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const cubes = {}; // Object to store cubes by user ID


camera.position.z = 5;

// WebSocket setup
const socket = new WebSocket('ws://695a-1-237-38-86.ngrok-free.app');
alert(socket)
let myCubeId
let myColor
// let clientId, x, y, z, color
// Handle cube movement and send position updates
const handleMovement = (event) => {
    switch (event.key) {
        case 'ArrowUp':
            cubes[myCubeId].position.z -= moveSpeed;
            break;
        case 'ArrowDown':
            cubes[myCubeId].position.z += moveSpeed;
            break;
        case 'ArrowLeft':
            cubes[myCubeId].position.x -= moveSpeed;
            break;
        case 'ArrowRight':
            cubes[myCubeId].position.x += moveSpeed;
            break;
    }

    // Send updated position to the server
    const positionData = {
        clientId: myCubeId,        
        x: cubes[myCubeId].position.x,
        y: cubes[myCubeId].position.y,
        z: cubes[myCubeId].position.z,
        color: myColor
    };
    socket.send(JSON.stringify(positionData));
};


// Handle window resize for responsive rendering
window.addEventListener('resize', () => {
  const newWidth = window.innerWidth;
  const newHeight = window.innerHeight;

  camera.aspect = newWidth / newHeight;
  camera.updateProjectionMatrix();  
  renderer.setSize(newWidth, newHeight);  
  console.log(userListContainer.style)
});


window.addEventListener('keydown', handleMovement);



// Move the cube
const moveSpeed = 0.03;
const moveDirection = new THREE.Vector2(0, 0);
let isMoving = false;
const moveCube = () => {
  if (!isMoving) return;

  cubes[myCubeId].position.x += moveDirection.y * moveSpeed;
  cubes[myCubeId].position.z -= moveDirection.x * moveSpeed;

  // Ensure the cube stays within the screen bounds
  const maxX = window.innerWidth / 2;
  const minX = -maxX;
  const maxZ = window.innerHeight / 2;
  const minZ = -maxZ;

  cubes[myCubeId].position.x = THREE.MathUtils.clamp(cubes[myCubeId].position.x, minX, maxX);
  cubes[myCubeId].position.z = THREE.MathUtils.clamp(cubes[myCubeId].position.z, minZ, maxZ);
};


// Animate loop
const animate = () => {
    requestAnimationFrame(animate);

    // Update the position of all cubes
    for (const userId in cubes) {
        cubes[userId].rotation.x += 0.01;
        cubes[userId].rotation.y += 0.01;
    }
    moveCube()
    // console.log(Object.keys(cubes))
    renderer.render(scene, camera);
};

animate();



// Listen for position updates from the server
socket.addEventListener('message', (event) => {
    console.log(event.data)
    const data = JSON.parse(event.data);
    let userInfo = data.userInfo

    let clientId, x, y, z, color
    if (typeof userInfo === "string") {
      userInfo = JSON.parse(userInfo)
    }
    clientId = userInfo.clientId
    x = userInfo.x
    y = userInfo.y
    z = userInfo.z
    color = userInfo.color  

    if (!cubes[clientId]) {
      console.log("New cube generated!", clientId)
      if (Object.keys(cubes).length === 0) {
        myCubeId = clientId
        myColor = color       
      }
      createUserCube({clientId, color })
    }    
    const cube = cubes[clientId];    
    cube.position.x = x || 0;
    cube.position.y = y || 0;
    cube.position.z = z || 0;
});

// Inform the server that a new user has joined and create the user's cube
socket.addEventListener('open', (event) => {
    alert('Connected to the server.');
    console.log(socket.userInfo)
    // Create the cube for the user
    // if (socket.userInfo !== undefined) {      
      // createUserCube(socket.userInfo)
      // Send a message to the server indicating a new user joined
      // socket.send('New user joined.');
    // }
});

// Handle cube creation for new users
const createUserCube = ({clientId, color}) => {
  console.log("생성 색깔:", color)
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color });
  const cube = new THREE.Mesh(geometry, material);
  console.log("Create", clientId, color)
  scene.add(cube);
  cubes[clientId] = cube; // Store the cube in the object
  const li = document.createElement('li');
  li.textContent = clientId;
  userList.appendChild(li);  
};


// Handle touch controls
const stick = document.getElementById('stick');
const stickContainer = document.getElementById('stick-container');

let stickPointerId = -1;
const stickMaxMove = stickContainer.offsetWidth / 3;

stickContainer.addEventListener('touchstart', (event) => {
    if (stickPointerId === -1) {
        stickPointerId = event.changedTouches[0].identifier;
    }
});

stickContainer.addEventListener('touchmove', (event) => {
    event.preventDefault();
    for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        if (touch.identifier === stickPointerId) {
            const rect = stickContainer.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            let deltaX = touch.clientX - rect.left - centerX;
            let deltaY = touch.clientY - rect.top - centerY;

            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = rect.width / 2;

            if (distance > maxDistance) {
                const scaleFactor = maxDistance * 2/ distance;
                deltaX *= scaleFactor;
                deltaY *= scaleFactor;
            }

            stick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

            const normalizedX = deltaX / maxDistance;
            const normalizedY = deltaY / maxDistance;

            isMoving = true;
            moveDirection.set(normalizedX, -normalizedY);
            break;
        }
    }
});

stickContainer.addEventListener('touchend', (event) => {
    for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        if (touch.identifier === stickPointerId) {
            stickPointerId = -1;
            stick.style.transform = 'translate(50%, 50%)';
            isMoving = false;
            moveDirection.set(0, 0);
            break;
        }
    }
});