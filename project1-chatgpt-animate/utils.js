function multiplyMatrices(matrixA, matrixB) {
  var result = [];

  for (var i = 0; i < 4; i++) {
    result[i] = [];
    for (var j = 0; j < 4; j++) {
      var sum = 0;
      for (var k = 0; k < 4; k++) {
        sum += matrixA[i * 4 + k] * matrixB[k * 4 + j];
      }
      result[i][j] = sum;
    }
  }

  // Flatten the result array
  return result.reduce((a, b) => a.concat(b), []);
}
function createIdentityMatrix() {
  // prettier-ignore
  return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}
function createScaleMatrix(scale_x, scale_y, scale_z) {
  // prettier-ignore
  return new Float32Array([
        scale_x, 0, 0, 0,
        0, scale_y, 0, 0,
        0, 0, scale_z, 0,
        0, 0, 0, 1
    ]);
}

function createTranslationMatrix(x_amount, y_amount, z_amount) {
  // prettier-ignore
  return new Float32Array([
        1, 0, 0, x_amount,
        0, 1, 0, y_amount,
        0, 0, 1, z_amount,
        0, 0, 0, 1
    ]);
}

function createRotationMatrix_Z(radian) {
  // prettier-ignore
  return new Float32Array([
        Math.cos(radian), -Math.sin(radian), 0, 0,
        Math.sin(radian), Math.cos(radian), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_X(radian) {
  // prettier-ignore
  return new Float32Array([
        1, 0, 0, 0,
        0, Math.cos(radian), -Math.sin(radian), 0,
        0, Math.sin(radian), Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_Y(radian) {
  // prettier-ignore
  return new Float32Array([
        Math.cos(radian), 0, Math.sin(radian), 0,
        0, 1, 0, 0,
        -Math.sin(radian), 0, Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function getTransposeMatrix(matrix) {
  // prettier-ignore
  return new Float32Array([
        matrix[0], matrix[4], matrix[8], matrix[12],
        matrix[1], matrix[5], matrix[9], matrix[13],
        matrix[2], matrix[6], matrix[10], matrix[14],
        matrix[3], matrix[7], matrix[11], matrix[15]
    ]);
}

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal; // Normal vector for lighting

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

uniform vec3 lightDirection;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vNormal = vec3(normalMatrix * vec4(normal, 0.0));
    vLightDirection = lightDirection;

    gl_Position = vec4(position, 1.0) * projectionMatrix * modelViewMatrix; 
}

`;

const fragmentShaderSource = `
precision mediump float;

uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vLightDirection);
    
    // Ambient component
    vec3 ambient = ambientColor;

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Specular component (view-dependent)
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Assuming the view direction is along the z-axis
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * specularColor;

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

`;

/**
 * @WARNING DO NOT CHANGE ANYTHING ABOVE THIS LINE
 */

let log = false;

/**
 *
 * @TASK1 Calculate the model view matrix by using the chatGPT
 */
function getChatGPTModelViewMatrix() {
  // prettier-ignore
  const transformationMatrix = new Float32Array([
    0.1767767,   0.3061862,   -0.3535534,  0,
    -0.2866117,  0.3695995,   0.1767767,   0,
    0.7391989,   0.2803301,   0.6123725,   0,
    0.1246859,  -0.0005440,  -0.1502600,   1,
  ]);

  const transposedTransformationMatrix =
    getTransposeMatrix(transformationMatrix);

  if (!log) {
    log = true;
    console.log(transposedTransformationMatrix);
  }

  return transposedTransformationMatrix;
}

/**
 *
 * @TASK2 Calculate the model view matrix by using the given
 * transformation methods and required transformation parameters
 * stated in transformation-prompt.txt
 */
function getModelViewMatrix() {
  // calculate the model view matrix by using the transformation
  // methods and return the modelView matrix in this method
  const degreeToRadian = (degree) => (degree * Math.PI) / 180;

  const translation = createTranslationMatrix(0.3, -0.25, 0);
  const scale = createScaleMatrix(0.5, 0.5, 1);
  const rotationX = createRotationMatrix_X(degreeToRadian(30));
  const rotationY = createRotationMatrix_Y(degreeToRadian(45));
  const rotationZ = createRotationMatrix_Z(degreeToRadian(60));

  let transformationMatrix = createIdentityMatrix();
  transformationMatrix = multiplyMatrices(transformationMatrix, translation);
  transformationMatrix = multiplyMatrices(transformationMatrix, rotationZ);
  transformationMatrix = multiplyMatrices(transformationMatrix, rotationY);
  transformationMatrix = multiplyMatrices(transformationMatrix, rotationX);
  transformationMatrix = multiplyMatrices(transformationMatrix, scale);

  // Reverse order
  //   let transformationMatrix = multiplyMatrices(rotationZ, rotationY);
  //   transformationMatrix = multiplyMatrices(transformationMatrix, rotationX);
  //   transformationMatrix = multiplyMatrices(transformationMatrix, translation);
  //   transformationMatrix = multiplyMatrices(transformationMatrix, scale);

  // Straight order
  //   let transformationMatrix = multiplyMatrices(translation, scale);
  //   transformationMatrix = multiplyMatrices(transformationMatrix, rotationX);
  //   transformationMatrix = multiplyMatrices(transformationMatrix, rotationY);
  //   transformationMatrix = multiplyMatrices(transformationMatrix, rotationZ);

  if (!log) {
    log = true;
    console.log(transformationMatrix);
  }

  return transformationMatrix;
}

/**
 *
 * @TASK3 Ask CHAT-GPT to animate the transformation calculated in
 * task2 infinitely with a period of 10 seconds.
 * First 5 seconds, the cube should transform from its initial
 * position to the target position.
 * The next 5 seconds, the cube should return to its initial position.
 */
function getPeriodicMovement() {
  // Get the current time in seconds
  const currentTime = Date.now() / 1000;
  // Loop the animation every 10 seconds
  const elapsedTime = currentTime % 10;

  let t;
  if (elapsedTime < 5) {
    // First 5 seconds: t goes from 0 to 1
    t = elapsedTime / 5;
  } else {
    // Last 5 seconds: t goes from 1 to 0
    t = (10 - elapsedTime) / 5;
  }

  const degreeToRadian = (degree) => (degree * Math.PI) / 180;

  // Initial transformation parameters
  const initialTranslation = [0, 0, 0];
  const initialScale = [1, 1, 1];
  const initialRotationX = 0;
  const initialRotationY = 0;
  const initialRotationZ = 0;

  // Final transformation parameters from getModelViewMatrix
  const finalTranslation = [0.3, -0.25, 0];
  const finalScale = [0.5, 0.5, 1];
  const finalRotationX = degreeToRadian(30);
  const finalRotationY = degreeToRadian(45);
  const finalRotationZ = degreeToRadian(60);

  // Interpolate transformation parameters
  const translation = [
    initialTranslation[0] + t * (finalTranslation[0] - initialTranslation[0]),
    initialTranslation[1] + t * (finalTranslation[1] - initialTranslation[1]),
    initialTranslation[2] + t * (finalTranslation[2] - initialTranslation[2]),
  ];

  const scale = [
    initialScale[0] + t * (finalScale[0] - initialScale[0]),
    initialScale[1] + t * (finalScale[1] - initialScale[1]),
    initialScale[2] + t * (finalScale[2] - initialScale[2]),
  ];

  const rotationX = initialRotationX + t * (finalRotationX - initialRotationX);
  const rotationY = initialRotationY + t * (finalRotationY - initialRotationY);
  const rotationZ = initialRotationZ + t * (finalRotationZ - initialRotationZ);

  // Create transformation matrices
  const translationMatrix = createTranslationMatrix(...translation);
  const scaleMatrix = createScaleMatrix(...scale);
  const rotationXMatrix = createRotationMatrix_X(rotationX);
  const rotationYMatrix = createRotationMatrix_Y(rotationY);
  const rotationZMatrix = createRotationMatrix_Z(rotationZ);

  // Combine transformations in the correct order
  let transformationMatrix = createIdentityMatrix();
  transformationMatrix = multiplyMatrices(
    transformationMatrix,
    translationMatrix
  );
  transformationMatrix = multiplyMatrices(
    transformationMatrix,
    rotationZMatrix
  );
  transformationMatrix = multiplyMatrices(
    transformationMatrix,
    rotationYMatrix
  );
  transformationMatrix = multiplyMatrices(
    transformationMatrix,
    rotationXMatrix
  );
  transformationMatrix = multiplyMatrices(transformationMatrix, scaleMatrix);

  return transformationMatrix;
}
