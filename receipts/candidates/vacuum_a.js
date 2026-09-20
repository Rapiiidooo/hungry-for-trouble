// Candidate A, constructed from receipts/references/vacuum.png.
export default function generate(THREE) {
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

  const wheels=[wheel(-0.38,-0.05,0.25),wheel(0.38,-0.05,0.25)];
  cyl(0.08,0.08,0.1,dark,0,0.11,0.33).rotation.z=Math.PI/2;
  cyl(0.33,0.29,0.49,cream,0,0.5,0);cyl(0.345,0.345,0.08,red,0,0.7,0);cyl(0.32,0.3,0.08,dark,0,0.25,0);
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

  const bounds=new THREE.Box3(),v=new THREE.Vector3();g.updateMatrixWorld(true);
  g.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));});
  const c=bounds.getCenter(new THREE.Vector3());for(const child of g.children){child.position.x-=c.x;child.position.y-=bounds.min.y;child.position.z-=c.z;}
  g.scale.setScalar(0.85/(bounds.max.y-bounds.min.y));return g;
}
