

class xClass {  
    constructor(x, y, name, pic, sound) {
        this.x = x;
        this.y = y;
        this.size = 30;
        this.name = name;
        this.playState = false;
        this.pic = pic;
        this.sound = sound;
    }
    move(newX, newY) {
        this.x = newX;
        this.y = newY;
    }
    render(x, y) {
        this.x = x;
        this.y = y;
        image(this.pic, this.x , this.y, 100, 100);
    }
 }

let socket = io();
let playing = false;
let isTerminal = false;

let positionsJson = {};
let sources = [];
let sounds = [];
let panners = [];
let images = [];

socket.on('invokePersistence', (data) => {
    for (const [source, position] of Object.entries(data)) {
        positionsJson[source] = position;
        sourcey = new xClass(position.x, position.y, position.name, images[Object.keys(data).indexOf(source)], sounds[Object.keys(data).indexOf(source)]);
        sources.push(sourcey);
    }
});

// ADDED: Listen for position updates from other clients
socket.on('relaySoundPosition', (data) => {
    positionsJson[data.source] = { x: data.x, y: data.y };
});

function playSound() {
    if (!playing) {
        for (let i = 0; i < sounds.length; i++) {
            sounds[i].play();
            sounds[i].loop();
            playing = true;
        }
    }
}

function preload() {
    for (let i = 0; i < 5; i++) {
        images[i] = loadImage(`assets/image${i}.jpg`);
        sounds[i] = loadSound(`assets/sound${i}.mp3`);
    }
}



function setup() {
    cnv = createCanvas(640, 480);
    cnv.parent('main');
    cnv.mousePressed(playSound);
    imageMode(CENTER);
    textFont('Courier New');
    textSize(12);

    for (let i = 0; i < 5; i++) {
        sounds[i].disconnect();
        panner = new p5.Panner3D();
        panners[i] = panner;
        panner.set(0, 0, 0);
        sounds[i].connect(panner);
    }

}
function keyPressed() {
    if (key === 't') {
        isTerminal = !isTerminal;
    }
}

function draw() {
    background(220);
    preventOverlap();
    if (isTerminal) {
        text('tap phone here to drop-in', width - 190, height - 10);
    }
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
    // if (positionsJson['source1']) {
    //     let x = map(positionsJson['source1'].x, 0, width, -1, 1);
    //     let y = map(positionsJson['source1'].y, 0, height, 1, -1);
    //     panners[0].set(x, y, 0);
    // }

    for (let i = 0; i < panners.length; i++) {
        if (positionsJson[`source${i+1}`]) {
            let x = map(positionsJson[`source${i+1}`].x, 0, width, -1, 1);
            let y = map(positionsJson[`source${i+1}`].y, 0, height, 1, -1);
            panners[i].set(x, 0, y, 0.1);
        }
    }

    // Draw X-axis (Red)
    stroke('red'); // Set line color to red
    strokeWeight(2); // Make the line thicker (optional)
    line(0, height / 2, width, height / 2); // From left edge to right edge at mid-height

    // Draw Y-axis (Blue)
    stroke('blue'); // Set line color to blue
    strokeWeight(2); // Make the line thicker (optional)
    line(width / 2, 0, width / 2, height); // From top edge to bottom edge at mid-width

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

function preventOverlap() {
    const minDistance = 100; // Minimum distance between objects
    const sources = Object.keys(positionsJson);
    
    for (let i = 0; i < sources.length; i++) {
        for (let j = i + 1; j < sources.length; j++) {
            let pos1 = positionsJson[sources[i]];
            let pos2 = positionsJson[sources[j]];
            
            let distance = dist(pos1.x, pos1.y, pos2.x, pos2.y);
            
            if (distance < minDistance && distance > 0) {
                // Calculate repulsion force
                let angle = atan2(pos2.y - pos1.y, pos2.x - pos1.x);
                let overlap = (minDistance - distance) / 2;
                
                // Push both objects apart
                pos1.x -= cos(angle) * overlap;
                pos1.y -= sin(angle) * overlap;
                pos2.x += cos(angle) * overlap;
                pos2.y += sin(angle) * overlap;
                
                // Emit updates for both positions
                setSoundPosition(pos1.x, pos1.y, sources[i]);
                setSoundPosition(pos2.x, pos2.y, sources[j]);
            }
        }
    }
}

function setSoundPosition(x, y, source) {
    socket.emit('setSoundPosition', { x: x, y: y, source: source });
}

