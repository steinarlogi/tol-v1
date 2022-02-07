"use strict";

//states of the game
const GAME = 1;
const FINISHED = 2;

var currentState = GAME;

var gl;
var mariusVertices;
var goldVertices;
var pointsVertices;
var monsterVertices;
var counter = 0;

//Global breytur fyrir hraðann.
const speed = 0.01;
const jumpSpeed = 0.01;
const jumpHeight = 0.3;
const monsterSpeed = 0.005;

//Breytur fyrir hreyfingarnar hans maríusar.
var deltaXMarius = 0;
var deltaYMarius = 0;
var movingMariusRight = false;
var movingMariusLeft = false;
var mariusJumping = false;
var colorMarius = vec4(0.0, 0.0, 1.0, 1.0);

//Breytur fyrir gullið
var colorGold = vec4(0.85, 0.56, 0, 1.0);
var goldOffsetX = (Math.random() * 1.9) - 0.95;
var goldOffsetY = (Math.random()* 0.35);
var points = 0;

//Breytur fyrir skrímslin
var colorMonsters = vec4(0.0, 1.0, 0.0, 1.0);
var monstersOffsetX = [];

//Breytur fyrir stigin
var colorPoints = vec4(0.0, 0.0, 0.0, 1.0);
var spaceBetweenPoints = 0.02;

//Color location
var colorLoc;

//Offset location
var offsetXLoc;
var offsetYLoc;

//buffers
var mariusBuffer;
var goldCoinBuffer;
var pointsBuffer;
var monsterBuffer;

//Position attribute
var positionLoc;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // First, initialize the corners of marius with three vertices.
    mariusVertices = new Float32Array([
        0, -0.9,
        -0.05,  -1,
        0.05, -1
    ]);

    //TODO Taka þetta útemp
    goldVertices = new Float32Array([
      0, -0.95,
      0, -0.9,
      0.05, -0.95,
      0, -1,
      -0.05, -0.95,
      0, -0.9
    ]);

    pointsVertices = new Float32Array([
      0.6, 0.8,
      0.6, 0.9
    ]);

    monsterVertices = new Float32Array([
      1.0, -0.9,
      1.1, -0.9,
      1.0, -1.0,
      1.1, -1.0
    ]);

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 0.9, 0.9, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    colorLoc = gl.getUniformLocation(program, "rColor");

    mariusBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, mariusBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, mariusVertices, gl.STATIC_DRAW );

    goldCoinBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, goldCoinBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, goldVertices, gl.STATIC_DRAW);

    pointsBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, pointsVertices, gl.STATIC_DRAW);

    monsterBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, monsterBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, monsterVertices, gl.STATIC_DRAW);

    // Associate out shader variables with our data buffer

    positionLoc = gl.getAttribLocation( program, "vPosition" );
    //gl.vertexAttribPointer( positionLoc, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( positionLoc );

    offsetXLoc = gl.getUniformLocation(program, "offsetX");
    offsetYLoc = gl.getUniformLocation(program, "offsetY");

    initKeyListeners(canvas);

    render();
};

function initKeyListeners(canvas) {
  window.addEventListener('keydown', function(e) {

    switch(e.keyCode) {
      //Vinstri ör.
      case 37:
        movingMariusLeft = true;
        break;

      //Hægri ör
      case 39:
        movingMariusRight = true;
        break;

      //Space takkinn:
      case 32:
        if(deltaYMarius == 0) {
          mariusJumping = true;
        }
        break;

    }

  });

  window.addEventListener('keyup', function(e) {

    switch(e.keyCode) {

      //Vinstri ör.
      case 37:
        movingMariusLeft = false;
        break;

      //Hægri ör
      case 39:
        movingMariusRight = false;
        break;

    }

  });

  window.addEventListener('mousedown', function(e) {
    if(currentState == FINISHED) {
      currentState = GAME;
    }
  });
}

function calculateMovements() {
  if(movingMariusLeft) {
    deltaXMarius -= speed;
    if(deltaXMarius < -0.95) {
      deltaXMarius = -0.95;
    }
  }

  if(movingMariusRight) {
    deltaXMarius += speed;
    if(deltaXMarius > 0.95) {
      deltaXMarius = 0.95;
    }
  }

  if(mariusJumping) {
    deltaYMarius += jumpSpeed;
    if(deltaYMarius > jumpHeight) {
      mariusJumping = false;
    }
  }

  if(deltaYMarius > 0 && !mariusJumping) {
    deltaYMarius -= jumpSpeed;
    if(deltaYMarius < 0) {
      deltaYMarius = 0;
    }
  }

  for(let i = 0; i < monstersOffsetX.length; i++) {
    monstersOffsetX[i] -= monsterSpeed;
    if(monstersOffsetX[i] < -2.2) {
      monstersOffsetX.splice(i, i+1);
    }
  }
}

function checkCollisionsCoin() {
  var collisionX = deltaXMarius + 0.05 >= goldOffsetX-0.05 && deltaXMarius-0.05 <= goldOffsetX+0.05;
  var collisionY = deltaYMarius <= goldOffsetY + 0.05 && deltaYMarius + 0.1 >= goldOffsetY - 0.05;

  return collisionX && collisionY;
}

function checkCollisionMonster() {
  for(let i = 0; i < monstersOffsetX.length; i++) {
    var collisionX = deltaXMarius + 0.05 >= monstersOffsetX[i] + 1.05 - 0.05
                      && deltaXMarius - 0.05 <= monstersOffsetX[i] + 1.05 + 0.05;

    var collisionY = deltaYMarius <= 0.1 && deltaYMarius + 0.1 >= 0;

    if(collisionX && collisionY) {
      points = 0;
      deltaXMarius = 0;
      deltaYMarius = 0;
      monstersOffsetX = [];
      currentState = FINISHED;
    }
  }
}

function newPositionForGoldCoin() {
  goldOffsetX = (Math.random() * 1.9) - 0.95;
  goldOffsetY = (Math.random()* 0.35);
}

function spawnMonsters() {
  let randomNumber = Math.random()*1000;
  if(randomNumber <= 2.5) {
    monstersOffsetX.push(0);
  }
}

function render() {

  setTimeout(function() {
    window.requestAnimFrame(render);

      if(currentState == GAME) {
        gl.clearColor(0.9, 0.9, 0.9, 1.0);
        calculateMovements();
        var collision = checkCollisionsCoin();
        checkCollisionMonster();
        spawnMonsters();

        //Teikna marius
        gl.uniform1f(offsetXLoc, deltaXMarius);
        gl.uniform1f(offsetYLoc, deltaYMarius);

        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, mariusBuffer);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        gl.uniform4fv(colorLoc, flatten(colorMarius));
        gl.drawArrays(gl.TRIANGLES, 0, mariusVertices.length/2);

        if(collision) {
          points += 1;
          var pointsParagraph = document.getElementById("points");
          pointsParagraph.innerHTML = points;
          newPositionForGoldCoin();
          if(points >= 10) {
            points = 0;
            deltaXMarius = 0;
            deltaYMarius = 0;
            monstersOffsetX = [];
            currentState = FINISHED;
          }
        }

        //Teikna gullmolann, passa að hann sé ekki færður á sama hátt og marius
        gl.uniform1f(offsetXLoc, goldOffsetX);
        gl.uniform1f(offsetYLoc, goldOffsetY);

        gl.bindBuffer(gl.ARRAY_BUFFER, goldCoinBuffer);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        gl.uniform4fv(colorLoc, flatten(colorGold));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, goldVertices.length/2);

        //Teikna stigin
        gl.bindBuffer(gl.ARRAY_BUFFER, pointsBuffer);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        gl.uniform4fv(colorLoc, flatten(colorPoints));
        gl.uniform1f(offsetYLoc, 0);
        for(let i = 0; i < points; i++) {
          gl.uniform1f(offsetXLoc, i*spaceBetweenPoints);
          gl.drawArrays(gl.LINES, 0, pointsVertices.length/2);
        }

        //Teikna skrímslin
        gl.bindBuffer(gl.ARRAY_BUFFER, monsterBuffer);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        gl.uniform4fv(colorLoc, flatten(colorMonsters));
        gl.uniform1f(offsetYLoc, 0);

        for(let i = 0; i < monstersOffsetX.length; i++) {
          gl.uniform1f(offsetXLoc, monstersOffsetX[i]);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, monsterVertices.length/2);
        }

      } else if(currentState == FINISHED) {
        gl.clearColor(1.0, 0.5, 0.5, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
    }, 10);
}
