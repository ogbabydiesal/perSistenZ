let socket = io();
let playing = false;

let positionsJson = {};

socket.on('invokePersistence', (data) => {
    console.log('set default positions');
    console.log(data);
    for (const [source, position] of Object.entries(data)) {
        console.log(source, position);
        positionsJson[source] = position;
    }
});

// ADDED: Listen for position updates from other clients
socket.on('relaySoundPosition', (data) => {
    console.log('received position update:', data);
    positionsJson[data.source] = { x: data.x, y: data.y };
});

function preload() {
    mySound = loadSound('assets/gateOpening.mp3');
}

function setup() {
    createCanvas(400, 400);
    
    mySound.disconnect();
    panner = new p5.Panner3D();
    panner.set(0, 0, 0);
    mySound.connect(panner);
    connect = createP('connect...');
    connect.id('connect');
    connect.mousePressed(() => {
        mySound.play();
        console.log('sound played');
    });
    connect.position(10, 20);
}

function draw() {
    background(220);
    text('perSistenZ', 10, 10);
    for (const [source, position] of Object.entries(positionsJson)) {
        ellipse(position.x, position.y, 20, 20);
        text(source, position.x + 10, position.y);
    }
    //update panner position based on source1
    if (positionsJson['source1']) {
        let x = map(positionsJson['source1'].x, 0, width, -1, 1);
        let y = map(positionsJson['source1'].y, 0, height, 1, -1);
        panner.set(x, y, 0);
    }
    //check to see if mouse if pressed and over one of the sources
    if (mouseIsPressed) {
        for (const [source, position] of Object.entries(positionsJson)) {
            let d = dist(mouseX, mouseY, position.x, position.y);
            if (d < 10) {
                //update position
                positionsJson[source] = { x: mouseX, y: mouseY };
                //send new position to server
                setSoundPosition(mouseX, mouseY, source);
            }
        }
    }
}

function setSoundPosition(x, y, source) {
    socket.emit('setSoundPosition', { x: x, y: y, source: source });
}