// Объявление глобальных переменных
var gl, program;

var cameraPosition = [0.0, 0.0, -1.0];
var lookAtPoint = [0.0, 0.0, 0.0];
var topPoint = [0.0, 1.0, 0.0];

var vertices = []; 				//используется x, y, z 		 (сетка)
var indices = [];				//индексы соединяемых вершин (буфер индексов)

var m = [];						//матрица модели
var v = [];						//матрица вида
var p = [];						//матрица проекции
var mv = [];					//модель * вид
var mvp = [];					//модель * вид * проекция

var rotationM4 = [];			//матрица поворота (для нахождения позиции камеры и верхней точки)


//загрузка шейдеров
var InitWebGL = function() {
	var VSText, FSText;
	loadTextResource('/shaders/vertexShader.glsl')
	.then(function(result) {
		VSText = result;
		return loadTextResource('/shaders/fragmentShader.glsl');
	})
	.then(function(result){
		FSText = result;
		return StartWebGL(VSText, FSText);
	})
	.catch(function(error) {
		alert('Error with loading resources. See console.');
		console.error(error);
	})
}


//запуск webgl
var StartWebGL = function(vertexShaderText, fragmentShaderText) {

	var canvas = document.getElementById('example-canvas');
	gl = canvas.getContext('webgl');

	if (!gl) {
		alert('Your browser does not support WebGL');
		return;
	}

	program = gl.createProgram();

	canvas.height = gl.canvas.clientHeight;
	canvas.width = gl.canvas.clientWidth;

	// Создание обработчика события на клик
	window.addEventListener('keydown', function(event){
		OnButtonPressed(event);
	})

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	//матрицы m v p
	//инициализация матрицы модели
	mat4.identity(m);
	mat4.scale(m, [0.03, 0.03, 0.03]);
	//инициализация матрицы вида
	v = mat4.lookAt(cameraPosition, lookAtPoint, topPoint);
	//заготовка для матрицы перспективной проекции
	mat4.identity(p);
	p = mat4.perspective(35, canvas.width / canvas.height, 0.1, 20);

	//сетка
	var n = 100;
	var t = n / 2.0;
	for (var i = 0; i < n; i++){
		for (var j = 0; j < n; j++){
			vertices.push((j - t) / t * 10);
			vertices.push((i - t) / t * 10);
			vertices.push(0);
		}
	}

	//индексы соединяемых вершин
	var index = 0;
	var vertex = 0;
	for (var i = 0; i < n - 1; i++)
	{
		for (var j = 0; j < n - 1; j++)
		{
			indices[index] = vertex;
			indices[index + 1] = vertex + 1;
			indices[index + 2] = vertex + n + 1;
			indices[index + 3] = vertex;
			indices[index + 4] = vertex + n;
			indices[index + 5] = vertex + n + 1;
			index += 6;
			vertex++;
		}
		vertex++;
	}

	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	
	gl.shaderSource(vertexShader, vertexShaderText);
	gl.shaderSource(fragmentShader, fragmentShaderText);

	gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		alert('Error compiling vertex shader!');
		console.error('Shader error info: ', gl.getShaderInfoLog(vertexShader));
	}
	gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		alert('Error compiling fragment shader!');
		console.error('Shader error info: ', gl.getShaderInfoLog(fragmentShader));
	}

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);

	gl.linkProgram(program);
	gl.validateProgram(program);

	if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
		console.error('Error validating program ', gl.getProgramInfoLog(program));

		return;
	}

	Draw();
};


//функция отрисовки
var Draw = function() {
	v = mat4.lookAt(cameraPosition, lookAtPoint, topPoint);
	//mat4.identity(mvp);
	mv = Multiply4x4Matrices(m, v);
	mvp = Multiply4x4Matrices(mv, p);

	var mv_it = [];
	mat4.set(mv, mv_it);
	mat4.inverse(mv_it);
	mat4.transpose(mv_it);

	var vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    // указываем число линий. это число равно числу индексов
    indexBuffer.numberOfItems = indices.length;

	var positionAttribLocation = gl.getAttribLocation(program, 'vertexPosition');
	gl.vertexAttribPointer(
		positionAttribLocation, 				// ссылка на атрибут
		3, 										// кол-во элементов на 1 итерацию
		gl.FLOAT, 								// тип данных
		gl.FALSE, 								// нормализация
		3 * Float32Array.BYTES_PER_ELEMENT, 	// элементов массива на одну вершину
		0 * Float32Array.BYTES_PER_ELEMENT 		// отступ для каждой вершины
	);
	gl.enableVertexAttribArray(positionAttribLocation);
	
	var mvpLocation = gl.getUniformLocation(program, "mvp");
	gl.uniformMatrix4fv(mvpLocation, false, mvp);

	var mvLocation = gl.getUniformLocation(program, "mv");
	gl.uniformMatrix4fv(mvLocation, false, mv);

	var mvitLocation = gl.getUniformLocation(program, "mv_it");
	gl.uniformMatrix4fv(mvitLocation, false, mv_it);

	gl.clearColor(0.75, 0.9, 1.0, 1.0);										//цвет фона
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.enable(gl.DEPTH_TEST);
	gl.useProgram(program);
	//gl.drawArrays(gl.TRIANGLES, 0, defaultPositionMatrix.length / 3);	//треугольники, количество элементов
	gl.drawElements(gl.TRIANGLES, indexBuffer.numberOfItems, gl.UNSIGNED_SHORT, 0);
};

//TODO: перемещение, шейдеры и освещение


//при нажатии кнопки
function OnButtonPressed(event) {
	mat4.identity(rotationM4);

	switch (event.code){
		case 'KeyA':
			mat4.rotateY(rotationM4, DegreesToRadians(3));
			cameraPosition = mat4.multiplyVec3(rotationM4, cameraPosition);
			topPoint = mat4.multiplyVec3(rotationM4, topPoint);
			break;
		
		case 'KeyD':
			mat4.rotateY(rotationM4, -DegreesToRadians(3));
			cameraPosition = mat4.multiplyVec3(rotationM4, cameraPosition);
			topPoint = mat4.multiplyVec3(rotationM4, topPoint);
			break;

		case 'KeyW':
			mat4.rotateX(rotationM4, DegreesToRadians(3));
			cameraPosition = mat4.multiplyVec3(rotationM4, cameraPosition);
			topPoint = mat4.multiplyVec3(rotationM4, topPoint);
			break;
		
		case 'KeyS':
			mat4.rotateX(rotationM4, -DegreesToRadians(3));
			cameraPosition = mat4.multiplyVec3(rotationM4, cameraPosition);
			topPoint = mat4.multiplyVec3(rotationM4, topPoint);
			break;
		
		case 'KeyQ':
			mat4.rotateZ(rotationM4, DegreesToRadians(3));
			cameraPosition = mat4.multiplyVec3(rotationM4, cameraPosition);
			topPoint = mat4.multiplyVec3(rotationM4, topPoint);
			break;
		
		case 'KeyE':
			mat4.rotateZ(rotationM4, -DegreesToRadians(3));
			cameraPosition = mat4.multiplyVec3(rotationM4, cameraPosition);
			topPoint = mat4.multiplyVec3(rotationM4, topPoint);
			break;

		default:
			break;
	}
	Draw();
};

//запуск после прогрузки webgl
document.addEventListener('DOMContentLoaded', function() {
	InitWebGL();
});

