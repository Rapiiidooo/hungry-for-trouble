// Candidate B, constructed from receipts/references/polisher.png.
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

  const brushes=[];for(const x of [-0.22,0.22]){const p=group("brush",x,0.075,0.16);cyl(0.225,0.24,0.08,cream,0,0,0,p);cyl(0.22,0.22,0.035,brass,0,0.055,0,p);for(let i=0;i<16;i++){const a=i*Math.PI*2/16;rod([Math.sin(a)*0.18,0,Math.cos(a)*0.18],[Math.sin(a)*0.23,-0.04,Math.cos(a)*0.23],0.007,cream,p);}brushes.push(p);}
  lathe([[0,0],[0.42,0],[0.47,0.035],[0.46,0.12],[0.36,0.17],[0,0.17]],teal,0,0.13,0);lathe([[0,0],[0.25,0],[0.27,0.07],[0.19,0.26],[0,0.3]],cream,0,0.28,-0.035);
  box(0.36,0.045,0.05,red,0,0.4,0.18);box(0.3,0.02,0.018,red,0,0.4,0.214);
  for(const side of [-1,1]){wheel(side*0.38,-0.3,0.14);rod([side*0.28,0.25,-0.25],[side*0.32,0.63,-0.42],0.028,dark);rod([side*0.32,0.63,-0.42],[side*0.32,0.94,-0.63],0.028,dark);sphere(0.045,brass,side*0.29,0.37,-0.31);}
  rod([-0.32,0.94,-0.63],[0.32,0.94,-0.63],0.038,dark);sphere(0.055,lime,0,0.60,-0.02);
  for(let i=0;i<3;i++)box(0.025,0.07,0.02,dark,-0.08+i*0.08,0.42,-0.22);
  g.userData.joints={brushes};

  const bounds=new THREE.Box3(),v=new THREE.Vector3();g.updateMatrixWorld(true);
  g.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));});
  const c=bounds.getCenter(new THREE.Vector3());for(const child of g.children){child.position.x-=c.x;child.position.y-=bounds.min.y;child.position.z-=c.z;}
  g.scale.setScalar(0.9/(bounds.max.y-bounds.min.y));return g;
}
