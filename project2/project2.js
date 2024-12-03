/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3 : Implementing Specular Lighting
 *      @task4 : Supporting Multiple Textures
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions
 */

function GetModelViewProjection(
  projectionMatrix,
  translationX,
  translationY,
  translationZ,
  rotationX,
  rotationY
) {
  // prettier-ignore
  var trans1 = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

  var rotatXCos = Math.cos(rotationX);
  var rotatXSin = Math.sin(rotationX);

  var rotatYCos = Math.cos(rotationY);
  var rotatYSin = Math.sin(rotationY);

  // prettier-ignore
  var rotatx = [
        1, 0, 0, 0,
        0, rotatXCos, -rotatXSin, 0,
        0, rotatXSin, rotatXCos, 0,
        0, 0, 0, 1
    ]

  // prettier-ignore
  var rotaty = [
        rotatYCos, 0, -rotatYSin, 0,
        0, 1, 0, 0,
        rotatYSin, 0, rotatYCos, 0,
        0, 0, 0, 1
    ]

  var test1 = MatrixMult(rotaty, rotatx);
  var test2 = MatrixMult(trans1, test1);
  var mvp = MatrixMult(projectionMatrix, test2);

  return mvp;
}

class MeshDrawer {
  // The constructor is a good place for taking care of the necessary initializations.
  constructor() {
    this.prog = InitShaderProgram(meshVS, meshFS);
    this.mvpLoc = gl.getUniformLocation(this.prog, "mvp");
    this.showTexLoc = gl.getUniformLocation(this.prog, "showTex");

    this.colorLoc = gl.getUniformLocation(this.prog, "color");

    this.vertPosLoc = gl.getAttribLocation(this.prog, "pos");
    this.texCoordLoc = gl.getAttribLocation(this.prog, "texCoord");

    this.vertbuffer = gl.createBuffer();
    this.texbuffer = gl.createBuffer();

    this.numTriangles = 0;

    // @Task2 begin
    this.lightPosLoc = gl.getUniformLocation(this.prog, "lightPos");
    this.ambientLoc = gl.getUniformLocation(this.prog, "ambient");
    this.enableLightLoc = gl.getUniformLocation(this.prog, "enableLighting");
    this.normalPosLoc = gl.getAttribLocation(this.prog, "normal");

    this.normalbuffer = gl.createBuffer();

    this.lightPos = [0, 0, 0];
    this.ambient = 0.5;
    this.enableLight = false;
    // @Task2 end

    this.texture1 = null;
    this.texture2 = null;
    this.hasTex1 = false;
    this.hasTex2 = false;

    // @Task3 begin
    this.specular = 50;

    this.specularPos = gl.getUniformLocation(this.prog, "specular");
    // @Task3 end
  }

  setMesh(vertPos, texCoords, normalCoords) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

    // update texture coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    this.numTriangles = vertPos.length / 3;

    // @Task2 begin
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(normalCoords),
      gl.STATIC_DRAW
    );
    // @Task2 end
  }

  // This method is called to draw the triangular mesh.
  // The argument is the transformation matrix, the same matrix returned
  // by the GetModelViewProjection function above.
  draw(trans) {
    gl.useProgram(this.prog);

    gl.uniformMatrix4fv(this.mvpLoc, false, trans);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
    gl.enableVertexAttribArray(this.vertPosLoc);
    gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
    gl.enableVertexAttribArray(this.texCoordLoc);
    gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

    // @Task2 begin
    gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
    gl.enableVertexAttribArray(this.normalPosLoc);
    gl.vertexAttribPointer(this.normalPosLoc, 3, gl.FLOAT, false, 0, 0);
    // @Task2 end

    updateLightPos();

    // @Task4 begin
    // Bind texture 1 if available
    if (this.hasTex1) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture1);
        gl.uniform1i(gl.getUniformLocation(this.prog, "tex1"), 0);
        gl.uniform1i(gl.getUniformLocation(this.prog, "hasTex1"), true);
    } else {
        gl.uniform1i(gl.getUniformLocation(this.prog, "hasTex1"), false);
    }

    // Bind texture 2 if available
    if (this.hasTex2) {
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.texture2);
        gl.uniform1i(gl.getUniformLocation(this.prog, "tex2"), 1);
        gl.uniform1i(gl.getUniformLocation(this.prog, "hasTex2"), true);
    } else {
        gl.uniform1i(gl.getUniformLocation(this.prog, "hasTex2"), false);
    }
    // @Task4 end

    // @Task2 begin
    gl.uniform3fv(this.lightPosLoc, new Float32Array([5, lightY, lightX]));

    gl.uniform1f(this.ambientLoc, this.ambient);
    // @Task2 end

    // @Task3 begin
    gl.uniform1f(this.specularPos, this.specular);
    // @Task3 end

    gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
  }

  // This method is called to set the texture of the mesh.
  // The argument is an HTML IMG element containing the texture data.
  setTexture(img) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // You can set the texture image data using the following command.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

    // Set texture parameters
    if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // @Task1 begin
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      // @Task1 end
    }

    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(this.prog, "tex1"), 0);
    gl.uniform1i(gl.getUniformLocation(this.prog, "hasTex1"), true);
    this.texture1 = texture;
    this.hasTex1 = true;
  }

  // @Task4 begin
  setTexture2(img) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // You can set the texture image data using the following command.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

    // Set texture parameters
    if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
      gl.generateMipmap(gl.TEXTURE_2D);
    } else {
      // @Task1 begin
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      // @Task1 end
    }

    gl.useProgram(this.prog);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(this.prog, "tex2"), 1);
    gl.uniform1i(gl.getUniformLocation(this.prog, "hasTex2"), true);

    this.texture2 = texture;
    this.hasTex2 = true;
  }
  // @Task4 end

  showTexture(show) {
    gl.useProgram(this.prog);
    gl.uniform1i(this.showTexLoc, show);
  }

  enableLighting(show) {
    // @Task2 begin
    gl.useProgram(this.prog);
    gl.uniform1f(this.enableLightLoc, show);
    // @Task2 end
  }

  setAmbientLight(ambient) {
    // @Task2 begin
    this.ambient = ambient;
    // @Task1 end
  }

  // @Task3 begin
  setSpecularLight(specular) {
    this.specular = specular;
  }
  // @Task3 end
}

function isPowerOf2(value) {
  return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
  dst = dst || new Float32Array(3);
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // make sure we don't divide by 0.
  if (length > 0.00001) {
    dst[0] = v[0] / length;
    dst[1] = v[1] / length;
    dst[2] = v[2] / length;
  }
  return dst;
}

// Vertex shader source code
const meshVS = `
			attribute vec3 pos; 
			attribute vec2 texCoord; 
			attribute vec3 normal;

			uniform mat4 mvp; 

			varying vec2 v_texCoord; 
			varying vec3 v_normal; 

			void main()
			{
				v_texCoord = texCoord;
				v_normal = normal;

				gl_Position = mvp * vec4(pos,1);
			}`;


// Fragment shader source code
const meshFS = `
            precision mediump float;

            uniform bool showTex;
            uniform bool enableLighting;
            uniform bool hasTex1; // Flag to indicate if tex1 is set
            uniform bool hasTex2; // Flag to indicate if tex2 is set
            uniform sampler2D tex1;
            uniform sampler2D tex2;
            uniform vec3 color; 
            uniform vec3 lightPos;
            uniform float ambient;
            uniform float specular;

            varying vec2 v_texCoord;
            varying vec3 v_normal;

            void main()
            {
                vec4 textureColor;

                if (hasTex1 && hasTex2) {
                    // Blend tex1 and tex2 if both are available
                    textureColor = mix(texture2D(tex1, v_texCoord), texture2D(tex2, v_texCoord), 0.5);
                } else if (hasTex1) {
                    // Use tex1 only
                    textureColor = texture2D(tex1, v_texCoord);
                } else if (hasTex2) {
                    // Use tex2 only
                    textureColor = texture2D(tex2, v_texCoord);
                } else {
                    // Default color if no texture is set
                    textureColor = vec4(color, 1.0);
                }

                if (showTex && enableLighting) {
                    vec3 lightDir = normalize(lightPos);
                    
                    // Ambient light
                    vec3 ambientLight = vec3(ambient);

                    // Diffuse light
                    float light = max(dot(v_normal, lightDir), 0.0);
                    vec3 diffuseLight = vec3(1.0) * light;

                    // Specular light
                    vec3 reflectDir = reflect(-lightDir, v_normal);
                    float spec = pow(max(dot(vec3(0.0), reflectDir), 0.0), specular);
                    vec3 specularLight = vec3(1.0) * spec;

                    gl_FragColor = vec4((ambientLight + diffuseLight + specularLight), 1.0) * textureColor;
                }
                else if (showTex) {
                    gl_FragColor = textureColor;
                }
                else {
                    gl_FragColor = vec4(1.0, 0, 0, 1.0);
                }
            }    
`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
  const translationSpeed = 1;
  if (keys["ArrowUp"]) lightY -= translationSpeed;
  if (keys["ArrowDown"]) lightY += translationSpeed;
  if (keys["ArrowRight"]) lightX -= translationSpeed;
  if (keys["ArrowLeft"]) lightX += translationSpeed;
}
///////////////////////////////////////////////////////////////////////////////////
