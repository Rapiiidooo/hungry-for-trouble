import { mkdir, writeFile } from "node:fs/promises";

const prelude = `export default function generate(THREE) {
  const g = new THREE.Group();
  const mat = (color, name = "metal", metalness = 0.15) => { const m = new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness }); m.name = name; return m; };
  const cream = mat(0xf5e9c9), red = mat(0xf1533f), dark = mat(0x203f49), brass = mat(0xd99c4b,"metal",0.65), teal = mat(0x52c9c1), lime = mat(0xd5f65b), black = mat(0x10202a);
  const mesh = (geo, material, x=0,y=0,z=0,parent=g) => { const o = new THREE.Mesh(geo,material); o.position.set(x,y,z); o.castShadow=true; o.receiveShadow=true; parent.add(o); return o; };
  const box = (w,h,d,m,x=0,y=0,z=0,parent=g) => mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);
  const sphere = (r,m,x=0,y=0,z=0,parent=g) => mesh(new THREE.SphereGeometry(r,12,8),m,x,y,z,parent);
  const cyl = (a,b,h,m,x=0,y=0,z=0,parent=g,n=20) => mesh(new THREE.CylinderGeometry(a,b,h,n),m,x,y,z,parent);
  const ring = (r,t,m,x=0,y=0,z=0,parent=g) => mesh(new THREE.TorusGeometry(r,t,6,20),m,x,y,z,parent);
  const group = (name,x=0,y=0,z=0,parent=g) => { const o=new THREE.Group();o.name=name;o.position.set(x,y,z);parent.add(o);return o; };
  const profile = (points, depth, m,x=0,y=0,z=0,parent=g,bevel=0.025) => { const shape = new THREE.Shape(points.map(([a,b])=>new THREE.Vector2(a,b)));return mesh(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelSize:bevel,bevelThickness:bevel,bevelSegments:2,steps:1}),m,x,y,z,parent); };
  const lathe = (points,m,x=0,y=0,z=0,parent=g) => mesh(new THREE.LatheGeometry(points.map(([a,b])=>new THREE.Vector2(a,b)),24),m,x,y,z,parent);
  const rod=(a,b,r,m,parent=g)=>{ const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const o=cyl(r,r,av.distanceTo(bv),m,0,0,0,parent,10);o.position.copy(av).add(bv).multiplyScalar(0.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return o; };
  const wheel=(x,z,r=0.19,parent=g)=>{const pivot=group("wheel",x,r,z,parent);const tyre=cyl(r,r,0.13,dark,0,0,0,pivot);tyre.rotation.z=Math.PI/2;const hub=cyl(r*0.65,r*0.65,0.145,red,0,0,0,pivot);hub.rotation.z=Math.PI/2;const cap=cyl(r*0.25,r*0.25,0.16,brass,0,0,0,pivot);cap.rotation.z=Math.PI/2;return pivot;};
`;

const finish = (height) => `
  const bounds=new THREE.Box3(),v=new THREE.Vector3();g.updateMatrixWorld(true);
  g.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));});
  const c=bounds.getCenter(new THREE.Vector3());for(const child of g.children){child.position.x-=c.x;child.position.y-=bounds.min.y;child.position.z-=c.z;}
  g.scale.setScalar(${height}/(bounds.max.y-bounds.min.y));return g;
}\n`;

const vacuum = (variant) => `
  const wheels=[wheel(-0.38,-0.05,0.25),wheel(0.38,-0.05,0.25)];
  cyl(0.08,0.08,0.1,dark,0,0.11,0.33).rotation.z=Math.PI/2;
  ${variant === "a" ? `cyl(0.33,0.29,0.49,cream,0,0.5,0);cyl(0.345,0.345,0.08,red,0,0.7,0);cyl(0.32,0.3,0.08,dark,0,0.25,0);` : variant === "b" ? `lathe([[0,0],[0.24,0],[0.31,0.06],[0.34,0.17],[0.34,0.47],[0.3,0.52],[0,0.52]],cream,0,0.23,0);cyl(0.35,0.35,0.07,red,0,0.7,0);` : `profile([[-0.28,0],[-0.34,0.12],[-0.31,0.48],[-0.2,0.54],[0.2,0.54],[0.31,0.48],[0.34,0.12],[0.28,0]],0.48,cream,0,0.23,-0.24);box(0.66,0.07,0.52,red,0,0.73,0);`}
  const lid=group("lid",0,0.81,-0.15);box(0.67,0.09,0.48,cream,0,0,0.13,lid);lid.rotation.x=-0.12;
  rod([-0.18,0.92,-0.07],[-0.18,1.02,-0.07],0.035,red);rod([0.18,0.92,-0.07],[0.18,1.02,-0.07],0.035,red);rod([-0.18,1.02,-0.07],[0.18,1.02,-0.07],0.035,red);
  for(const side of [-1,1]) {sphere(0.11,dark,side*0.16,0.77,0.235);const eye=ring(0.076,0.013,brass,side*0.16,0.77,0.32);sphere(0.06,teal,side*0.16,0.77,0.325);box(0.19,0.04,0.035,cream,side*0.16,0.855,0.35).rotation.z=side*0.16;}
  const nozzle=group("nozzle",0,0.44,0.29);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(0,0.05,0.16),new THREE.Vector3(0,-0.1,0.36),new THREE.Vector3(0,-0.27,0.45)]);
  mesh(new THREE.TubeGeometry(curve,16,0.073,8,false),dark,0,0,0,nozzle);
  for(let i=0;i<9;i++){const t=i/9;const p=curve.getPoint(t);const r=ring(0.078,0.012,black,p.x,p.y,p.z,nozzle);r.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),curve.getTangent(t));}
  box(0.58,0.1,0.2,cream,0,-0.31,0.48,nozzle);box(0.59,0.04,0.08,dark,0,-0.34,0.56,nozzle);box(0.47,0.027,0.11,red,0,-0.25,0.48,nozzle);
  for(let i=0;i<4;i++)box(0.046,0.035,0.018,lime,-0.19,0.43+i*0.051,0.3);
  for(let i=0;i<4;i++)box(0.11,0.019,0.02,dark,0.14,0.39+i*0.032,0.31);
  box(0.3,0.24,0.05,dark,0,0.47,-0.32);for(let i=0;i<4;i++)box(0.24,0.013,0.018,brass,0,0.4+i*0.044,-0.355);
  g.userData.joints={lid,nozzle,wheels};
`;

const trolley = (variant) => `
  const wheels=[];for(const x of [-0.37,0.37])for(const z of [-0.32,0.32])wheels.push(wheel(x,z,0.15));
  box(0.73,0.09,0.72,dark,0,0.27,0);for(const x of [-0.31,0.31])rod([x,0.2,0.28],[x,0.66,-0.29],0.035,red);
  ${variant === "a" ? `box(0.8,0.06,0.75,red,0,0.51,0);for(const y of [0.55,0.93]){for(const x of [-0.4,0.4])box(0.045,0.06,0.8,red,x,y,0);for(const z of [-0.39,0.39])box(0.83,0.06,0.045,red,0,y,z);}for(let i=0;i<7;i++){const t=-0.34+i*0.113;for(const side of [-1,1]){box(0.025,0.37,0.03,red,t,0.74,side*0.39);box(0.03,0.37,0.025,red,side*0.4,0.74,t);}}` : variant === "b" ? `for(const side of [-1,1]){profile([[-0.33,0],[-0.4,0.38],[0.4,0.38],[0.33,0]],0.03,red,0,0.53,side*0.38);for(let i=0;i<5;i++)box(0.04,0.27,0.01,dark,-0.24+i*0.12,0.74,side*0.405);}for(const x of [-0.4,0.4])box(0.035,0.4,0.74,red,x,0.74,0);box(0.73,0.045,0.75,red,0,0.53,0);` : `for(const y of [0.52,0.68,0.84,0.97]){for(const x of [-0.4,0.4])rod([x,y,-0.39],[x,y,0.39],0.025,red);for(const z of [-0.39,0.39])rod([-0.4,y,z],[0.4,y,z],0.025,red);}for(const x of [-0.38,0.38])for(const z of [-0.37,0.37])rod([x,0.5,z],[x,0.99,z],0.035,cream);box(0.73,0.04,0.75,dark,0,0.53,0);`}
  box(0.65,0.38,0.045,red,0,0.73,0.4);for(const side of [-1,1]){ring(0.10,0.016,brass,side*0.17,0.79,0.43);sphere(0.079,cream,side*0.17,0.79,0.44);sphere(0.031,dark,side*0.15,0.79,0.5);box(0.21,0.036,0.04,red,side*0.17,0.87,0.47).rotation.z=side*0.25;}
  for(let i=0;i<5;i++)box(0.025,0.085,0.016,dark,-0.13+i*0.065,0.62,0.427);
  for(const x of [-0.36,0.36])rod([x,0.83,-0.33],[x,1.14,-0.47],0.03,red);rod([-0.36,1.14,-0.47],[0.36,1.14,-0.47],0.035,dark);
  box(0.28,0.32,0.3,cream,-0.1,0.71,-0.08);box(0.22,0.25,0.22,brass,0.18,0.69,0.1);
  const beacon=group("beacon",0.22,0.97,-0.12);cyl(0.09,0.09,0.05,brass,0,0,0,beacon);cyl(0.065,0.08,0.12,lime,0,0.08,0,beacon);sphere(0.057,lime,0,0.14,0,beacon);
  g.userData.joints={wheels,beacon};
`;

const shelf = (variant) => `
  ${variant === "a" ? `for(const x of [-0.94,0.94])for(const z of [-0.72,0.72])box(0.1,1.3,0.1,cream,x,0.67,z);for(const y of [0.13,0.52,0.91,1.33])box(2,0.065,1.56,cream,0,y,0);` : variant === "b" ? `for(const x of [-0.96,0.96]){const o=profile([[-0.78,0],[-0.78,1.36],[0.78,1.36],[0.78,0],[0.68,0],[0.68,1.26],[-0.68,1.26],[-0.68,0]],0.07,cream,0,0,0);o.rotation.y=Math.PI/2;o.position.x=x;}for(const y of [0.13,0.52,0.91,1.33])box(1.95,0.06,1.52,cream,0,y,0);` : `box(1.96,1.27,0.08,cream,0,0.72,0);for(const side of [-1,1])for(const y of [0.13,0.54,0.95]){box(2,0.055,0.74,cream,0,y,side*0.39);for(const x of [-0.95,0.95])rod([x,y,side*0.7],[x,y+0.27,side*0.13],0.028,brass);}for(const x of [-0.96,0.96])box(0.07,1.33,1.55,cream,x,0.73,0);`}
  for(const z of [-0.77,0.77])for(const y of [0.1,1.34])box(2.02,0.12,0.075,red,0,y,z);
  for(const x of [-0.92,0.92])for(const z of [-0.67,0.67])cyl(0.09,0.11,0.08,dark,x,0.04,z);
  const paints=[brass,teal,lime,cream,red];
  for(const side of [-1,1])for(let tier=0;tier<3;tier++)for(let i=0;i<6;i++){
    const x=-0.79+i*0.31,y=0.18+tier*0.39,h=0.23+(i%3)*0.022,z=side*0.5;
    box(0.26,h,0.29,paints[(i+tier)%paints.length],x,y+h/2,z);
    const dot=cyl(0.055,0.055,0.008,cream,x,y+h*0.57,z+side*0.15);dot.rotation.x=Math.PI/2;
    box(0.16,0.022,0.009,cream,x,y+0.04,z+side*0.152);
  }
  for(const side of [-1,1])for(const y of [0.23,0.62,1.01])rod([-0.95,y,side*0.72],[0.95,y,side*0.72],0.012,brass);
`;

const battery = (variant) => `
  ${variant === "a" ? `cyl(0.2,0.2,0.48,lime,0,0.29,0);` : variant === "b" ? `lathe([[0,0],[0.15,0],[0.21,0.07],[0.21,0.42],[0.17,0.48],[0,0.48]],lime,0,0.05,0);` : `profile([[-0.14,0],[-0.2,0.08],[-0.2,0.4],[-0.12,0.48],[0.12,0.48],[0.2,0.4],[0.2,0.08],[0.14,0]],0.28,lime,0,0.05,-0.14);`}
  cyl(0.21,0.21,0.07,brass,0,0.055,0);cyl(0.21,0.18,0.07,cream,0,0.54,0);cyl(0.10,0.10,0.06,red,0,0.60,0);
  for(const side of [-1,1]){box(0.07,0.42,0.16,dark,side*0.2,0.3,0);for(let i=0;i<5;i++)box(0.08,0.025,0.18,black,side*0.2,0.14+i*0.07,0);}
  for(const side of [-1,1])profile([[0.02,0.18],[-0.07,0.02],[0,0.02],[-0.03,-0.16],[0.09,0.04],[0.025,0.04]],0.008,dark,0,0.3,side*0.202,g,0);
`;

const polisher = (variant) => `
  const brushes=[];for(const x of [-0.22,0.22]){const p=group("brush",x,0.075,0.16);cyl(0.225,0.24,0.08,cream,0,0,0,p);cyl(0.22,0.22,0.035,brass,0,0.055,0,p);for(let i=0;i<16;i++){const a=i*Math.PI*2/16;rod([Math.sin(a)*0.18,0,Math.cos(a)*0.18],[Math.sin(a)*0.23,-0.04,Math.cos(a)*0.23],0.007,cream,p);}brushes.push(p);}
  ${variant === "a" ? `const base=cyl(0.44,0.47,0.13,teal,0,0.20,0);base.scale.z=1.12;const bumper=cyl(0.46,0.47,0.055,dark,0,0.15,0);bumper.scale.z=1.12;cyl(0.19,0.26,0.27,cream,0,0.39,-0.03);` : variant === "b" ? `lathe([[0,0],[0.42,0],[0.47,0.035],[0.46,0.12],[0.36,0.17],[0,0.17]],teal,0,0.13,0);lathe([[0,0],[0.25,0],[0.27,0.07],[0.19,0.26],[0,0.3]],cream,0,0.28,-0.035);` : `const p=profile([[-0.4,-0.33],[-0.47,-0.15],[-0.47,0.22],[-0.28,0.5],[0.28,0.5],[0.47,0.22],[0.47,-0.15],[0.4,-0.33]],0.12,teal,0,0.24,0);p.rotation.x=Math.PI/2;profile([[-0.25,0],[-0.18,0.28],[0.18,0.28],[0.25,0]],0.37,cream,0,0.28,-0.22);`}
  box(0.36,0.045,0.05,red,0,0.4,0.18);box(0.3,0.02,0.018,red,0,0.4,0.214);
  for(const side of [-1,1]){wheel(side*0.38,-0.3,0.14);rod([side*0.28,0.25,-0.25],[side*0.32,0.63,-0.42],0.028,dark);rod([side*0.32,0.63,-0.42],[side*0.32,0.94,-0.63],0.028,dark);sphere(0.045,brass,side*0.29,0.37,-0.31);}
  rod([-0.32,0.94,-0.63],[0.32,0.94,-0.63],0.038,dark);sphere(0.055,lime,0,0.60,-0.02);
  for(let i=0;i<3;i++)box(0.025,0.07,0.02,dark,-0.08+i*0.08,0.42,-0.22);
  g.userData.joints={brushes};
`;

const freezer = (variant) => `
  ${variant === "a" ? `box(1.94,0.82,1.52,teal,0,0.52,0);box(1.84,0.03,1.42,dark,0,0.945,0);` : variant === "b" ? `profile([[-0.94,0],[-1,0.12],[-1,0.7],[-0.88,0.84],[0.88,0.84],[1,0.7],[1,0.12],[0.94,0]],1.45,teal,0,0.1,-0.725);box(1.78,0.03,1.3,dark,0,0.96,0);` : `for(const side of [-1,1]){box(0.94,0.83,1.5,teal,side*0.49,0.53,0);box(0.84,0.04,1.36,dark,side*0.49,0.97,0);}box(0.045,0.89,1.51,cream,0,0.55,0);`}
  const glass=mat(0x86cbd9,"metal",0.25);glass.roughness=0.14;
  for(const side of [-1,1]){box(0.88,0.045,1.32,glass,side*0.47,1.005,0);box(0.045,0.08,1.45,cream,side*0.93,1.02,0);for(const z of [-0.7,0.7])box(0.89,0.055,0.05,cream,side*0.47,1.035,z);box(0.26,0.045,0.04,brass,side*0.48,1.055,0.60);for(const z of [-0.59,0.59])box(0.13,0.045,0.08,brass,side*0.57,1.04,z);}
  box(0.05,0.065,1.43,cream,0,1.03,0);for(const x of [-0.89,0.89])for(const z of [-0.65,0.65])cyl(0.075,0.09,0.12,dark,x,0.06,z);
  for(const side of [-1,1]){sphere(0.035,lime,side*0.78,0.80,0.77);box(1.7,0.025,0.014,brass,0,0.2,side*0.77);for(let i=0;i<5;i++)box(0.012,0.025,0.42,dark,side*0.98,0.30+i*0.067,0);}
`;

const checkout = (variant) => `
  ${variant === "a" ? `box(0.88,0.69,1.37,red,-0.40,0.38,0);box(0.92,0.10,1.45,cream,-0.4,0.78,0);box(0.74,0.03,1.26,dark,-0.4,0.845,0);` : variant === "b" ? `profile([[-0.81,0],[-0.88,0.13],[-0.88,0.65],[-0.8,0.73],[0,0.73],[0.06,0.65],[0.06,0.13],[0,0]],1.32,red,0,0.04,-0.66);box(0.9,0.1,1.4,cream,-0.4,0.81,0);box(0.74,0.03,1.25,dark,-0.4,0.87,0);` : `for(const z of [-0.48,0.48])box(0.78,0.67,0.28,red,-0.4,0.37,z);for(const x of [-0.85,0.03])box(0.075,0.08,1.4,cream,x,0.78,0);for(let i=0;i<12;i++){const roller=cyl(0.053,0.053,0.76,dark,-0.4,0.79,-0.59+i*0.106);roller.rotation.z=Math.PI/2;}`}
  for(const z of [-0.66,0.66]){const roller=cyl(0.07,0.07,0.85,brass,-0.4,0.82,z);roller.rotation.z=Math.PI/2;}
  for(const x of [-0.82,0.82]){cyl(0.052,0.052,1.5,dark,x,0.79,-0.35);cyl(0.077,0.077,0.11,brass,x,0.87,-0.35);}
  box(1.8,0.27,0.19,red,0,1.52,-0.35);box(1.62,0.2,0.035,cream,0,1.52,-0.235);box(1.43,0.13,0.025,lime,0,1.52,-0.21);
  cyl(0.06,0.09,0.19,brass,-0.41,0.98,-0.40);const till=group("till",-0.41,1.1,-0.39);box(0.34,0.24,0.075,red,0,0,0,till);box(0.27,0.17,0.015,lime,0,0,0.047,till);till.rotation.x=-0.3;
  cyl(0.12,0.13,0.8,cream,0.81,0.4,0.45);for(const y of [0.14,0.41,0.68])cyl(0.123,0.123,0.12,red,0.81,y,0.45);sphere(0.12,red,0.81,0.84,0.45);
  box(0.65,0.32,0.055,cream,0.40,0.60,0.45);for(const x of [0.19,0.42,0.65])box(0.09,0.27,0.017,red,x,0.60,0.49).rotation.z=-0.25;
`;

const snack = (variant) => `
  const toast=mat(0xd99c4b,"ground"),crumb=mat(0xf9d969,"ground");
  ${variant === "a" ? `for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const o=sphere(0.069,crumb,Math.sin(a)*0.043,0.064,Math.cos(a)*0.043);o.scale.y=0.8;}sphere(0.06,crumb,0,0.072,0);` : variant === "b" ? `const o=profile([[-0.086,-0.048],[-0.088,-0.002],[-0.025,0.092],[0.025,0.09],[0.087,-0.014],[0.074,-0.058],[0,-0.081]],0.074,crumb,0,0.046,0,g,0.018);o.rotation.x=-Math.PI/2;for(const x of [-0.036,0.033])sphere(0.019,toast,x,0.115,-0.019);` : `const geo=new THREE.IcosahedronGeometry(0.095,2);const p=geo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),scale=1+0.15*Math.cos(a*3);p.setXYZ(i,x*scale,y*0.64,z*scale);}geo.computeVertexNormals();mesh(geo,crumb,0,0.062,0);`}
`;

const floor = (variant) => `
  const tile=mat(0xf5e9c9,"tile"),grout=mat(0x203f49,"stone");
  ${variant === "a" ? `box(2,0.1,2,grout,0,0.05,0);mesh(new THREE.BoxGeometry(1.96,0.035,1.96,3,1,3),tile,0,0.117,0);` : variant === "b" ? `const o=profile([[-0.97,-1],[-1,-0.97],[-1,0.97],[-0.97,1],[0.97,1],[1,0.97],[1,-0.97],[0.97,-1]],0.09,tile,0,0.09,0,g,0.012);o.rotation.x=Math.PI/2;box(2.01,0.03,2.01,grout,0,0.015,0);` : `box(2,0.065,2,grout,0,0.0325,0);for(const x of [-0.49,0.49])for(const z of [-0.49,0.49])mesh(new THREE.BoxGeometry(0.97,0.045,0.97,2,1,2),tile,x,0.087,z);`}
  const inset=profile([[0,0],[0.54,0],[0,0.54]],0.007,dark,0.43,0.14,0.43,g,0);inset.rotation.x=-Math.PI/2;
  for(const x of [-0.985,0.985])box(0.008,0.015,1.94,brass,x,0.13,0);for(const z of [-0.985,0.985])box(1.94,0.015,0.008,brass,0,0.13,z);
`;

const generators = {
  vacuum: [vacuum, 0.85],
  security_trolley: [trolley, 1.1],
  shelf: [shelf, 1.35],
  battery: [battery, 0.6],
  polisher: [polisher, 0.9],
  freezer: [freezer, 1.1],
  checkout: [checkout, 1.6],
  snack: [snack, 0.14],
  floor: [floor, 0.12],
};
const destination = process.env.CANDIDATE_OUT || "receipts/candidates";
await mkdir(destination, { recursive: true });
let written = 0;
for (const [name, [generate, height]] of Object.entries(generators)) {
  if (process.argv.length > 2 && !process.argv.slice(2).includes(name))
    continue;
  for (const variant of ["a", "b", "c"])
    await writeFile(
      `${destination}/${name}_${variant}.js`,
      `// Candidate ${variant.toUpperCase()}, constructed from receipts/references/${name}.png.\n` +
        prelude +
        generate(variant) +
        finish(height),
    );
  written += 3;
}
console.log(`Wrote ${written} candidates to ${destination}.`);
