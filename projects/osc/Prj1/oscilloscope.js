var gl;

var program1;
var programBackground;
var vBufferId;
var positionLoc;
var positionLocBG;
var colorLoc;
var colorLocBG;
var colors;
var colorBG;
var vertices;
var verticesBG
var colorFrame;
var enableProgramXY;
var vertToDraw = 0;
var colorLoopCount = 0;
var frame = 0;
var roundNum = 0;
const MAX_SAMPLES = 10000;
const NUM_GRID = 36;


window.onload = function init() {
    colorFrame = 0;
    var canvas = document.getElementById("gl-canvas");
    enableProgramXY = document.getElementById("enableXY");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 1);

    // Load shaders and initialize attribute buffers
    program1 = initShaders(gl, "vertex-shader", "fragment-shader");
    program2 = initShaders(gl, "vertex-shader2", "fragment-shader2");
    programXY = initShaders(gl, "vertex-shader3", "fragment-shader3");
    programBackground = initShaders(gl, "vertex-shader-background", "fragment-shader-background");

    gl.useProgram(program1);

    // get location of thing referenced in html script
    positionLoc = gl.getAttribLocation(program1, "vPosition");
    positionLoc2 = gl.getAttribLocation(program2, "vPosition2");
    positionLocBG = gl.getAttribLocation(programBackground, "bg_position");
    colorLoc = gl.getUniformLocation(program1, "vColor");
    colorLoc2 = gl.getUniformLocation(program2, "vColor2");
    colorLocBG = gl.getUniformLocation(programBackground, "vColorBG");
    colorLoc2XY = gl.getUniformLocation(programXY, "vColor2");
    secsScaleLoc = gl.getUniformLocation(program1, "secsScale");
    secsScaleLoc2 = gl.getUniformLocation(program2, "secsScale2");
    secsScaleLocXY = gl.getUniformLocation(programXY, "secsScale");
    secsScaleLoc2XY = gl.getUniformLocation(programXY, "secsScale2");
    roundLoc = gl.getUniformLocation(program1, "round");
    roundLoc2 = gl.getUniformLocation(program2, "round2");
    roundLocXY = gl.getUniformLocation(programXY, "round");
    voltsScaleLoc = gl.getUniformLocation(program1, "voltsScale");
    voltsScaleLoc2 = gl.getUniformLocation(program2, "voltsScale2");
    voltsScaleLocXY = gl.getUniformLocation(programXY, "voltsScale");
    voltsScaleLoc2XY = gl.getUniformLocation(programXY, "voltsScale2");
    optLoc = gl.getUniformLocation(program1, "opt");
    optLoc2 = gl.getUniformLocation(program2, "opt2");
    optLocXY = gl.getUniformLocation(programXY, "opt");
    optLoc2XY = gl.getUniformLocation(programXY, "opt2");


    verticesBG = [
        vec2((1 / 6), 1),
        vec2((1 / 6), -1),
        vec2((1 / 3), 1),
        vec2((1 / 3), -1),
        vec2((1 / 2), 1),
        vec2((1 / 2), -1),
        vec2((2 / 3), 1),
        vec2((2 / 3), -1),
        vec2((1 / 6) * 5, 1),
        vec2((1 / 6) * 5, -1),
        vec2(0, 1),
        vec2(0, -1),
        vec2((-1 / 6), 1),
        vec2((-1 / 6), -1),
        vec2((-1 / 3), 1),
        vec2((-1 / 3), -1),
        vec2((-1 / 2), 1),
        vec2((-1 / 2), -1),
        vec2((-2 / 3), 1),
        vec2((-2 / 3), -1),
        vec2((-1 / 6) * 5, 1),
        vec2((-1 / 6) * 5, -1),
        vec2(-1, (1 / 4)),
        vec2(1, (1 / 4)),
        vec2(-1, (1 / 2)),
        vec2(1, (1 / 2)),
        vec2(-1, (3 / 4)),
        vec2(1, (3 / 4)),
        vec2(-1, 0),
        vec2(1, 0),
        vec2(-1, (-1 / 4)),
        vec2(1, (-1 / 4)),
        vec2(-1, (-1 / 2)),
        vec2(1, (-1 / 2)),
        vec2(-1, (-3 / 4)),
        vec2(1, (-3 / 4))
    ];

    vertices = [];
    
    for (var k = 0; k <= MAX_SAMPLES; k++) {
        vertices.push(vec2(transformFrameToCoord(k), 0));
    }


    //program 1
    positionBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuff);
    gl.bufferData(gl.ARRAY_BUFFER, new flatten(vertices), gl.STATIC_DRAW);

    colors = [
        vec4(1.0, 0.0, 0.0, 1.0),
        vec4(0.0, 1.0, 0.0, 1.0),
        vec4(0.0, 1.0, 1.0, 1.0)
    ];
    
    colorBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuff);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);


    //program 2
    positionBuff2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuff2);
    gl.bufferData(gl.ARRAY_BUFFER, new flatten(vertices), gl.STATIC_DRAW);

    colorBuff2 = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuff2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    //program background
    colorBG = [
        vec4(1.0, 0.0, 0.0, 1.0)
    ];

    positionBuffBG = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffBG);
    gl.bufferData(gl.ARRAY_BUFFER, new flatten(verticesBG), gl.STATIC_DRAW);

    colorBuffBG = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffBG);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorBG), gl.STATIC_DRAW);

    render();
}

function render(time) {
    

    gl.clear(gl.COLOR_BUFFER_BIT);

    if(enableProgramXY.value == 0){
        //program 1 render


        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuff);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(
            positionLoc, //location
            2, //size
            gl.FLOAT, //type
            false, //nomalize
            0, //stride
            0, //offset
        );


        gl.useProgram(program1);
        gl.uniform1f(roundLoc, roundNum);
        gl.uniform1f(secsScaleLoc, secsScale.value);
        gl.uniform1f(voltsScaleLoc, voltsScale.value); 
        gl.uniform1f(optLoc, opt.value); 
        gl.uniform4fv(colorLoc, colors[0]);
        
        gl.drawArrays(gl.LINE_STRIP, 0, vertToDraw);
        
        //program 2 render

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuff2);
        gl.enableVertexAttribArray(positionLoc2);
        gl.vertexAttribPointer(
            positionLoc2, //location
            2, //size
            gl.FLOAT, //type
            false, //nomalize
            0, //stride
            0, //offset
        );


        gl.useProgram(program2);
        gl.uniform1f(roundLoc2, roundNum);
        gl.uniform1f(secsScaleLoc2, secsScale2.value);
        gl.uniform1f(voltsScaleLoc2, voltsScale2.value); 
        gl.uniform1f(optLoc2, opt2.value); 
        gl.uniform4fv(colorLoc2, colors[1]);
        
        gl.drawArrays(gl.LINE_STRIP, 0, vertToDraw);
    }


    // render program XY

    else{ 
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuff);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(
            positionLoc, //location
            2, //size
            gl.FLOAT, //type
            false, //nomalize
            0, //stride
            0, //offset
        );


        gl.useProgram(programXY);
        gl.uniform1f(roundLocXY, roundNum);
        gl.uniform1f(secsScaleLocXY, secsScale.value);
        gl.uniform1f(voltsScaleLocXY, voltsScale.value); 
        gl.uniform1f(secsScaleLoc2XY, secsScale2.value);
        gl.uniform1f(voltsScaleLoc2XY, voltsScale2.value); 
        gl.uniform1f(optLocXY, opt.value);
        gl.uniform1f(optLoc2XY, opt2.value); 
        gl.uniform4fv(colorLoc2XY, colors[2]);
        
        gl.drawArrays(gl.LINE_STRIP, 0, vertToDraw);
    }
    
    // render program BACKGROUND

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffBG);
    gl.enableVertexAttribArray(positionLocBG);
    gl.vertexAttribPointer(
        positionLocBG, // location
        2, // size (components per iteration)
        gl.FLOAT, // type of to get from buffer
        false, // normalize
        0, // stride (bytes to advance each iteration)
        0, // offset (bytes from start of buffer)
    );

    gl.useProgram(programBackground);
    gl.drawArrays(gl.LINES, 0, NUM_GRID);

    


    //calculate new number of vertex to draw
    if (vertToDraw >= 10000) {
        vertToDraw = 0;
        roundNum++;
    } else {
        vertToDraw += 50;
    }
    
    window.requestAnimFrame(render);

}
// definir samples a desenhar

function loadAnotherVertex(newVert) {
    var vertices = [newVert];
    vBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);
}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
}


function transformFrameToCoord(vertexNum) { // X value according to frame
    return (vertexNum / MAX_SAMPLES) * 2 - 1;
}