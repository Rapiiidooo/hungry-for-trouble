// Candidate B, constructed from receipts/references/checkout.png.
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

  profile([[-0.81,0],[-0.88,0.13],[-0.88,0.65],[-0.8,0.73],[0,0.73],[0.06,0.65],[0.06,0.13],[0,0]],1.32,red,0,0.04,-0.66);box(0.9,0.1,1.4,cream,-0.4,0.81,0);box(0.74,0.03,1.25,dark,-0.4,0.87,0);
  for(const z of [-0.66,0.66]){const roller=cyl(0.07,0.07,0.85,brass,-0.4,0.82,z);roller.rotation.z=Math.PI/2;}
  for(const x of [-0.82,0.82]){cyl(0.052,0.052,1.5,dark,x,0.79,-0.35);cyl(0.077,0.077,0.11,brass,x,0.87,-0.35);}
  box(1.8,0.27,0.19,red,0,1.52,-0.35);box(1.62,0.2,0.035,cream,0,1.52,-0.235);box(1.43,0.13,0.025,lime,0,1.52,-0.21);
  cyl(0.06,0.09,0.19,brass,-0.41,0.98,-0.40);const till=group("till",-0.41,1.1,-0.39);box(0.34,0.24,0.075,red,0,0,0,till);box(0.27,0.17,0.015,lime,0,0,0.047,till);till.rotation.x=-0.3;
  cyl(0.12,0.13,0.8,cream,0.81,0.4,0.45);for(const y of [0.14,0.41,0.68])cyl(0.123,0.123,0.12,red,0.81,y,0.45);sphere(0.12,red,0.81,0.84,0.45);
  box(0.65,0.32,0.055,cream,0.40,0.60,0.45);for(const x of [0.19,0.42,0.65])box(0.09,0.27,0.017,red,x,0.60,0.49).rotation.z=-0.25;

  const bounds=new THREE.Box3(),v=new THREE.Vector3();g.updateMatrixWorld(true);
  g.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));});
  const c=bounds.getCenter(new THREE.Vector3());for(const child of g.children){child.position.x-=c.x;child.position.y-=bounds.min.y;child.position.z-=c.z;}
  g.scale.setScalar(1.6/(bounds.max.y-bounds.min.y));return g;
}
