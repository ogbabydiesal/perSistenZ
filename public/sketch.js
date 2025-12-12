

class xClass {  
    constructor(x, y, name) {
        this.x = x;
        this.y = y;
        this.size = 30;
        this.name = name;
        this.playState = false;
    }
    move(newX, newY) {
        this.x = newX;
        this.y = newY;
    }
    render(x, y) {
        this.x = x;
        this.y = y;
        push();
        fill(150, 0, 150);
        noStroke();
        ellipse(this.x, this.y, this.size);
        // line(this.x - this.size / 2, this.y - this.size / 2, this.x + this.size / 2, this.y + this.size / 2);
        // line(this.x + this.size / 2, this.y - this.size / 2, this.x - this.size / 2, this.y + this.size / 2);
        fill(9, 0, 150);
        text(this.name, this.x + 20, this.y);
        text(`playing = ${this.playState}`, this.x + 20, this.y + 20);
        pop();
    }
 }

let socket = io();
let playing = false;

let positionsJson = {};
let sources = [];

socket.on('invokePersistence', (data) => {
    console.log('set default positions');
    console.log(data);

    for (const [source, position] of Object.entries(data)) {
        console.log(source, position);
        positionsJson[source] = position;
        console.log(position.x);
        sourcey = new xClass(position.x, position.y, position.name);
        sources.push(sourcey);
    }
});

// ADDED: Listen for position updates from other clients
socket.on('relaySoundPosition', (data) => {
    console.log('received position update:', data);
    positionsJson[data.source] = { x: data.x, y: data.y };
});

function playSound() {
    playing = true;
    console.log('thishappend');
    mySound.play();
    mySound.loop();
}

function preload() {
    mySound = loadSound('assets/gateOpening.mp3');
}



function setup() {
    cnv = createCanvas(640, 480);
    cnv.parent('main');
    cnv.mousePressed(playSound());
    textFont('Courier New');
    textSize(12);
    mySound.disconnect();
    panner = new p5.Panner3D();
    panner.set(0, 0, 0);
    mySound.connect(panner);
}

function draw() {
    background(220);
    text('perSistenZ (release candidate v0.1)', 10, 10);
    if (!playing) {
        text('click to connect...', 10, 20);

    } else {
        text('connected', 10, 20);
    }
    
    for (const [source, position] of Object.entries(positionsJson)) {
        let index = Object.keys(positionsJson).indexOf(source);
        sources[index].render(position.x, position.y, position.name);
        
    }
    //update panner position based on source1
    if (positionsJson['source1']) {
        let x = map(positionsJson['source1'].x, 0, width, -1, 1);
        let y = map(positionsJson['source1'].y, 0, height, 1, -1);
        panner.set(x, y, 0);
    }
    //check to see if mouse if pressed and over one of the sources
    if (mouseIsPressed || touches.length > 0) {
        for (const [source, position] of Object.entries(positionsJson)) {
            let d = dist(mouseX, mouseY, position.x, position.y);
            if (d < 30) {
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

