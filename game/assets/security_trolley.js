// Candidate A, constructed from receipts/references/security_trolley.png.
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

  const wheels=[];for(const x of [-0.37,0.37])for(const z of [-0.32,0.32])wheels.push(wheel(x,z,0.15));
  box(0.73,0.09,0.72,dark,0,0.27,0);for(const x of [-0.31,0.31])rod([x,0.2,0.28],[x,0.66,-0.29],0.035,red);
  box(0.8,0.06,0.75,red,0,0.51,0);for(const y of [0.55,0.93]){for(const x of [-0.4,0.4])box(0.045,0.06,0.8,red,x,y,0);for(const z of [-0.39,0.39])box(0.83,0.06,0.045,red,0,y,z);}for(let i=0;i<7;i++){const t=-0.34+i*0.113;for(const side of [-1,1]){box(0.025,0.37,0.03,red,t,0.74,side*0.39);box(0.03,0.37,0.025,red,side*0.4,0.74,t);}}
  box(0.65,0.38,0.045,red,0,0.73,0.4);for(const side of [-1,1]){ring(0.10,0.016,brass,side*0.17,0.79,0.43);sphere(0.079,cream,side*0.17,0.79,0.44);sphere(0.031,dark,side*0.15,0.79,0.5);box(0.21,0.036,0.04,red,side*0.17,0.87,0.47).rotation.z=side*0.25;}
  for(let i=0;i<5;i++)box(0.025,0.085,0.016,dark,-0.13+i*0.065,0.62,0.427);
  for(const x of [-0.36,0.36])rod([x,0.83,-0.33],[x,1.14,-0.47],0.03,red);rod([-0.36,1.14,-0.47],[0.36,1.14,-0.47],0.035,dark);
  box(0.28,0.32,0.3,cream,-0.1,0.71,-0.08);box(0.22,0.25,0.22,brass,0.18,0.69,0.1);
  const beacon=group("beacon",0.22,0.97,-0.12);cyl(0.09,0.09,0.05,brass,0,0,0,beacon);cyl(0.065,0.08,0.12,lime,0,0.08,0,beacon);sphere(0.057,lime,0,0.14,0,beacon);
  g.userData.joints={wheels,beacon};

  const bounds=new THREE.Box3(),v=new THREE.Vector3();g.updateMatrixWorld(true);
  g.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));});
  const c=bounds.getCenter(new THREE.Vector3());for(const child of g.children){child.position.x-=c.x;child.position.y-=bounds.min.y;child.position.z-=c.z;}
  g.scale.setScalar(1.1/(bounds.max.y-bounds.min.y));return g;
}
