attribute vec3 vertexPosition;

uniform mat4 mv;
uniform mat4 mv_it;
uniform mat4 mvp;

vec3 newPosition;
varying vec4 gradient;
varying vec3 v_normal;
varying vec3 v_pos;

void main(){
	//значения функции в вершинах
	float newX = vertexPosition[0];// * 10.0;
	float newY = vertexPosition[1];// * 10.0;
	float newZ = sin(newX) * cos(newY);
	newPosition = vec3(newX, newY, newZ);

	//нормаль через градиент
	//df/dx = cos(x)*sin(y)		df/dy = -sin(x)*sin(y)
	float dfdx = cos(newX) * sin(newY);
	float dfdy = -sin(newX) * sin(newY);
	gradient = normalize(mv * vec4(-dfdx, -dfdy, -1, 1));		//лекции по преобразованию нормалей
	v_pos = (mv * vec4(newPosition, 1.0)).xyz;
	v_normal = normalize(mv_it * gradient).xyz;

	gl_Position = mvp * vec4(newPosition, 1);
}
