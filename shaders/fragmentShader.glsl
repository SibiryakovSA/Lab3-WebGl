precision highp float;

varying vec4 gradient;
varying vec3 v_normal;
varying vec3 v_pos;

void main(){
	//vec3 color = vec3(0.5, 0.0, 1.0);
	vec3 color = gradient.xyz;
	vec3 n = normalize(v_normal);
	vec3 l = normalize(vec3(-1.0, 1.0, 1.0) - v_pos);	//положение источника света
	vec3 e = normalize(-v_pos);
	float d = max(dot(l, n), 0.1);
	vec3 h = normalize(l + e);
	float s = pow(max(dot(h, n), 0.0), 60.0);

	gl_FragColor = vec4(color * d + vec3(s), 1.0);
}