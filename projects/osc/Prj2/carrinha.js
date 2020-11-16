// TODO : DESENHAR RESTO DA CARRINHA; FAZER ANIMACOES DAS RODAS; 


var gl, program;

var matrixStack=[];
var modelView= mat4();
var canvas;

const WIREFRAME = 0, SOLID = 1;
const CUBE = 0, SPHERE = 1; TORUS = 2; CYLINDER = 3;
const ZOOM_SCALE = 0.005;
const GRAY_V = 0;
const WHITE_V = 1;
const RED_V = 2;
const GREEN_V = 3;
const BLUE_V = 4;
const BLACK_V = 5;
const YELLOW_V = 6;
const GRAY = [0.5,0.5,0.5,1];
const WHITE = [1,1,1,1];
const RED = [1,0,0,1];
const GREEN = [0,1,0,1];
const BLUE = [0,0,1,1];
const BLACK = [0,0,0,1];
const YELLOW = [1,1,0,1];
const GROUND_COLLSNUM = 5;
const WHEELS_PER_AXIS = 2;
const WHEEL_DIAMETER = 38 ;
const WHEEL_CIRCUNFERENCE = WHEEL_DIAMETER*Math.PI;

var tx = 0.6;
var ty = -0.4;
var tz = 0.6;
var mode = SOLID;
var animation = true;
var turn_right = false;
var turn_left = false;
var accelerationFactor = 0;
var accelerationMultiplyer = 1/10000;
var acceleration;
var timeWhenAccelerationStarted = 0;
var time = 0;
var colors = [];
var speed = 0;
var pos = 0; // x value of position
var wheelRotation = 0;
var antennaRotation = 0;
var antennaElevation = 0;


var mModelLoc;
var mView, mProjection;


function fit_canvas_to_window()
{

    canvas.width = window.innerHeight;
    canvas.height = window.innerHeight;

    aspect = canvas.height / canvas.height;
    gl.viewport(0, 0,canvas.height, canvas.height);

}
window.onresize = function () {
    fit_canvas_to_window();
}


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl) { alert("WebGL isn't available"); }
    //fit_canvas_to_window();
    
    // Configure WebGL
    gl.viewport(0,0,canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    
    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);

    mModelLoc = gl.getUniformLocation(program, "mModel");
    mViewLoc = gl.getUniformLocation(program, "mView");
    mProjectionLoc = gl.getUniformLocation(program, "mProjection");
    fColorLoc = gl.getUniformLocation(program, "fColor");

    cubeInit(gl);
    sphereInit(gl);
    cylinderInit(gl);
    torusInit(gl);

    document.onkeydown = function(event) {
        switch(event.key) {
            case ' ':
                if (mode==SOLID)
                    mode = WIREFRAME; 
                else
                    mode = SOLID;
                break;
            case "a": // FALTA VERIFICAR SE ACCEL FACTOR == 0 ANTES DE MUDAR; MESMO PARA O "D"
                if(accelerationFactor == 0)
                    turn_left = true;
                    turn_right = false;
                    break;
            case "d":
                if(accelerationFactor == 0)
                    turn_right = true;
                    turn_left = false;
                    break;
            case "w":
                if(accelerationFactor == 0)
                    timeWhenAccelerationStarted = time;
                turn_left = false;
                turn_right = false;
                accelerationFactor++;
                break;
            case "s":
                if(accelerationFactor == 0)
                    timeWhenAccelerationStarted = time;
                turn_left = false;
                turn_right = false;
                accelerationFactor--;
                break;
            case "j":
                antennaRotation++;
                break;
            case "l":
                antennaRotation--;
                break;
            case "i":
                antennaElevation++;
                break;
            case "k":
                antennaElevation--;
                break;
        }
    }

    colors = [
        GRAY ,
        WHITE ,
        RED ,
        GREEN ,
        BLUE,
        BLACK ,
        YELLOW
    ]

    colorBuff = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuff);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    render();
}


function update_ctm()
{
    if(matrixStack.length==0) return;
    
    let tx = parseFloat(document.getElementById('tx').value);
    let ty = parseFloat(document.getElementById('ty').value);
    let tz = parseFloat(document.getElementById('tz').value);
    let rx = parseFloat(document.getElementById('rx').value);
    let ry = parseFloat(document.getElementById('ry').value);
    let rz = parseFloat(document.getElementById('rz').value);
    let sx = parseFloat(document.getElementById('sx').value);
    let sy = parseFloat(document.getElementById('sy').value);
    let sz = parseFloat(document.getElementById('sz').value);

    let m = mult(translate([tx, ty, tz]), 
          mult(rotateZ(rz), 
          mult(rotateY(ry),
          mult(rotateX(rx),
          scalem([sx,sy,sz])))));
    matrixStack[matrixStack.length-1].t = m;
}

function reset_sliders() {
    update_sliders([0,0,0]);
}

function update_sliders(t)
{
    document.getElementById("tx").value = t[0];
    document.getElementById("ty").value = t[1];
    document.getElementById("tz").value = t[2];
}

function render() {
    //console.log(speed);
    time++;
    var timeDifference = time - timeWhenAccelerationStarted;
    acceleration = -accelerationFactor * accelerationMultiplyer;
    speed =  (acceleration * timeDifference);  // UNIDADES POR FRAME 

    var at = vec3(0,0,0); //[0, 0, 0];
    var eye = [tx,ty,tz];
    var up = [0, 1, 0];
    mView = lookAt(eye, at, up);
    mProjection = ortho(-2,2,-2,2,10,-10);


    gl.uniformMatrix4fv(mViewLoc, false, flatten(mView));
    
    gl.uniformMatrix4fv(mProjectionLoc, false, flatten(mProjection));
    //gl.uniform4fv(fColorLoc, flatten([0.0, 1.0, 0.0, 0.0]));

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    


    // MODEL GENERATION ( T * R * S )

    modelView = mat4();
    multTranslation(0,-1,0);
    multScale(ZOOM_SCALE,ZOOM_SCALE,ZOOM_SCALE);

    // DRAW GROUND
    
    for(i = -GROUND_COLLSNUM; i < GROUND_COLLSNUM; i++){
        for(j = -GROUND_COLLSNUM; j < GROUND_COLLSNUM; j++){
            //console.log(Math.abs((i+j)%2));
            gl.uniform4fv(fColorLoc, colors[Math.abs((i+j)%2)]);
            pushMatrix();
                multTranslation(i*500, -76, j*500);
                multScale(500,100,500);
                drawPrimitive(CUBE, mode, program);
            popMatrix();
        }
    }
    
    // MOVE CAR
    pos = pos + 0 + (1/2)*acceleration*Math.pow(timeDifference, 2);
    multTranslation( pos , 0, 0);
    //console.log(speed*time);
    
    // DRAW CAR OBS PARA PROFESSOR: Sabemos que tem push pops a mais, mas por falta de tempo nao os limpamos. pedimos desculpas
    
    gl.uniform4fv(fColorLoc, colors[GREEN_V]);
    //multTranslation(50,0,0);

    // DRAW ANTENNA
    pushMatrix();
        //elevateAntenna();

        pushMatrix(); // ANTENNA JOINT
            multTranslation(145, 290, 85);
            multScale(40,40,40);
            drawPrimitive(SPHERE, mode, program);
        popMatrix();

        pushMatrix(); // LOWER ANTENNA
            multTranslation(145, 230, 85);
            multScale(30,100,30);
            drawPrimitive(CYLINDER, mode, program);
        popMatrix();

        pushMatrix();
            rotateAntenna();
            elevateAntenna();
            pushMatrix(); // UPPER ANTENNA
                multTranslation(100, 290, 85);
                multRotationZ(90);
                multScale(30,100,30);
                drawPrimitive(CYLINDER, mode, program);
            popMatrix();

            gl.uniform4fv(fColorLoc, colors[RED_V]);
            pushMatrix(); // PARABOLIC ANTENNA (infelizmente nao tivemos tempo de fazer o paraboloide, tera de ser um torus)
                multTranslation(50, 300, 85);
                multScale(50,100,50);
                drawPrimitive(TORUS, mode, program);
            popMatrix();
        popMatrix();

    popMatrix();


    // DRAW CHASSIS
    pushMatrix();
        pushMatrix();
            
            gl.uniform4fv(fColorLoc, colors[BLACK_V]);
            pushMatrix(); // REAR BUMPER
                multTranslation(350, 20, 85);
                multScale(30,30,170);
                drawPrimitive(CUBE, mode, program);
            popMatrix();

            pushMatrix(); // FRONT BUMPER
                multTranslation(-80, 30, 85);
                multScale(80,50,180);
                drawPrimitive(CUBE, mode, program);
            popMatrix();
            
            gl.uniform4fv(fColorLoc, colors[BLUE_V]);
            pushMatrix(); // MIDDLE BETWEEN WHEELS
                multTranslation(145, 20, 85);
                multScale(230,30,170);
                drawPrimitive(CUBE, mode, program);
            popMatrix();

        popMatrix();

        multTranslation(125,-85,85);

        gl.uniform4fv(fColorLoc, colors[YELLOW_V]);
        
        pushMatrix(); // TOP PART
            multTranslation(15,265,0);
            multScale(420,50,170);
            drawPrimitive(CUBE, mode, program);
        popMatrix();
    
        pushMatrix(); // MAIN BODY
            multTranslation(0,180,0);
            multScale(470,120,170);
            drawPrimitive(CUBE, mode, program);
        popMatrix();

        gl.uniform4fv(fColorLoc, colors[BLUE_V]);
        pushMatrix(); // FONT WINDOW
            multTranslation(-237,200,0);
            multScale(5,80,150);
            drawPrimitive(CUBE, mode, program);
        popMatrix();

    popMatrix();
    
    
    // DRAW WHEELS

    gl.uniform4fv(fColorLoc, colors[BLACK_V]);
    
    
        
    pushMatrix();
        multTranslation(290,0,0); 
        wheelSpin();
        multRotationX(-90);
        multScale(38, 38, 38);
        drawPrimitive(TORUS, mode, program);
        drawRimsOnWheel();
    popMatrix();

    pushMatrix(); // RODA PRINCIPAL; EIXO 0 0 0
        //multTranslation(0,0,0);  
        turnWheels();
        wheelSpin();
        multRotationX(-90);
        multScale(38, 38, 38);
        drawPrimitive(TORUS, mode, program);
        drawRimsOnWheel();
    popMatrix();

    pushMatrix();
        multTranslation(0,0,170);
        turnWheels();
        wheelSpin();
        multRotationX(-90);
        multScale(38, 38, 38);
        drawPrimitive(TORUS, mode, program);
        drawRimsOnWheel();
    popMatrix();

    pushMatrix();
        multTranslation(290,0,170);
        wheelSpin();
        multRotationX(-90);
        multScale(38, 38, 38);
        drawPrimitive(TORUS, mode, program);
        drawRimsOnWheel();
    popMatrix();


    //generateModel(gl, program);
    window.requestAnimationFrame(render);

    function drawRimsOnWheel() {
        pushMatrix();
        gl.uniform4fv(fColorLoc, colors[RED_V]);
        multRotationZ(90);
        multScale(0.5, 1, 0.5);
        drawPrimitive(CYLINDER, mode, program);
        popMatrix();
        gl.uniform4fv(fColorLoc, colors[BLACK_V]);
    }

    function turnWheels() {
        if (turn_left) {
            multRotationY(-45);
        }
        if (turn_right) {
            multRotationY(45);
        }
    }

    function wheelSpin() {
        wheelRotation += -(speed / WHEEL_CIRCUNFERENCE) * (2* Math.PI) / ZOOM_SCALE;
        multRotationZ(wheelRotation);
    }

    function rotateAntenna() {
        multTranslation(140, 290, 85);
        multRotationY(antennaRotation * (2* Math.PI) );
        multTranslation(-140, -290, -85);
    }

    function elevateAntenna() {
        multTranslation(140, 290, 85);
        multRotationZ(antennaElevation * (2* Math.PI) );
        multTranslation(-140, -290, -85);
    }
}


var drawFuncs = [
    [cubeDrawWireFrame, sphereDrawWireFrame, torusDrawWireFrame, cylinderDrawWireFrame],
    [cubeDrawFilled, sphereDrawFilled, torusDrawFilled, cylinderDrawFilled],
];

function drawPrimitive(obj, mode, program) {
    gl.uniformMatrix4fv(mModelLoc, false, flatten(modelView));
    drawFuncs[mode][obj](gl, program);
}



// Funcoes Auxiliares

// Stack related operations
function pushMatrix() {
    var m = mat4( modelView[0], modelView[1], modelView[2], modelView[3]);
    matrixStack.push(m);
}

function zero() {
    tx = document.getElementById("tx").value;
    ty = document.getElementById("ty").value;
    tz = document.getElementById("tz").value;
}
function one(){
    tx = 0.0001;
    ty = -5.0;
    tz = 0.0001;
}
function two(){
    tx = 0.0001;
    ty = 0.0001;
    tz = -5.0;
}
function three(){
    
    tx = 5.0;
    ty = 0.0001;
    tz = 0.0001;
}

function popMatrix() {
    modelView = matrixStack.pop();
}
    // Append transformations to modelView
function multMatrix(m) {
    modelView = mult(modelView, m);
}

function multTranslation(x, y, z) {
    modelView = mult(modelView,translate(x, y, z));
}

function multScale(x,y,z) {
    modelView = mult(modelView, scalem(x,y,z));
}

function multRotationX(angle) {
    modelView = mult(modelView, rotateX(angle));
}

function multRotationY(angle) {
    modelView = mult(modelView, rotateY(angle));
}

function multRotationZ(angle) {
    modelView = mult(modelView, rotateZ(angle));
}