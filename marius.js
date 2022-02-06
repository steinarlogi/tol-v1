"use strict";

var gl;
var mariusVertices;
var goldVertices;
var counter = 0;

//Global breytur fyrir hraðann.
var speed = 0.01;
var jumpSpeed = 0.01;
var jumpHeight = 0.4;

//Breytur fyrir hreyfingarnar hans maríusar.
var deltaXMarius = 0;
var deltaYMarius = 0;
var deltaXMariusLoc;
var deltaYMariusLoc;
var movingMariusRight = false;
var movingMariusLeft = false;
var mariusJumping = false;
var colorMarius = vec4(0.0, 0.0, 1.0, 1.0);

//Breytur fyrir gullið
var colorGold = vec4(0.85, 0.56, 0, 1.0);
var goldOffsetX = (Math.random() * 1.9) - 0.95;
var goldOffsetY = (Math.random()* 0.1);
var goldOffsetXLoc;
var goldOffsetYLoc;
var points = 0;

//Color location
var colorLoc;

//buffers
var mariusBuffer;
var goldCoinBuffer;

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

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

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

    // Associate out shader variables with our data buffer

    positionLoc = gl.getAttribLocation( program, "vPosition" );
    //gl.vertexAttribPointer( positionLoc, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( positionLoc );

    deltaXMariusLoc = gl.getUniformLocation(program, "deltaXMarius");
    deltaYMariusLoc = gl.getUniformLocation(program, "deltaYMarius");

    goldOffsetXLoc = gl.getUniformLocation(program, "goldOffsetX");
    goldOffsetYLoc = gl.getUniformLocation(program, "goldOffsetY");

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
}

function checkCollisions() {
  var collisionX = deltaXMarius + 0.05 >= goldOffsetX-0.05 && deltaXMarius-0.05 <= goldOffsetX+0.05;
  var collisionY = deltaYMarius <= goldOffsetY + 0.05 && deltaYMarius + 0.1 >= goldOffsetY - 0.05;

  return collisionX && collisionY;
}

function newPositionForGoldCoin() {
  goldOffsetX = (Math.random() * 1.9) - 0.95;
  goldOffsetY = (Math.random()* 0.1);
}

function render() {
    calculateMovements();
    var collision = checkCollisions();

    //Teikna marius
    gl.uniform1f(deltaXMariusLoc, deltaXMarius);
    gl.uniform1f(deltaYMariusLoc, deltaYMarius);

    gl.uniform1f(goldOffsetXLoc, 0);
    gl.uniform1f(goldOffsetYLoc, 0);

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
    }

    //Teikna gullmolann, passa að hann sé ekki færður á sama hátt og marius
    gl.uniform1f(deltaXMariusLoc, 0);
    gl.uniform1f(deltaYMariusLoc, 0);

    gl.uniform1f(goldOffsetXLoc, goldOffsetX);
    gl.uniform1f(goldOffsetYLoc, goldOffsetY);

    gl.bindBuffer(gl.ARRAY_BUFFER, goldCoinBuffer);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4fv(colorLoc, flatten(colorGold));
    gl.drawArrays(gl.TRIANGLE_FAN, 0, goldVertices.length/2);

    window.requestAnimFrame(render);
}
