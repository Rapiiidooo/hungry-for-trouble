// Candidate b: receipts/references/audit_drone.png
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

 profile([[-.32,0],[-.41,.12],[-.4,.58],[-.27,.76],[.27,.76],[.4,.58],[.41,.12],[.32,0]],.52,cream,0,.2,-.26);
 const eye=group("eye",0,.76,.3);cyl(.2,.2,.07,dark,0,0,0,eye).rotation.x=Math.PI/2;cyl(.15,.15,.08,teal,0,0,.045,eye).rotation.x=Math.PI/2;
 for(const s of [-1,1])box(.13,.04,.015,dark,s*.065,.035,.092,eye).rotation.z=s*.4;
 for(const s of [-1,1]){cyl(.23,.23,.14,red,s*.49,.48,0).rotation.z=Math.PI/2;
 const fan=group("fan",s*.57,.48,0);ring(.17,.035,cream,0,0,0,fan).rotation.y=Math.PI/2;
 for(let i=0;i<4;i++){const b=box(.02,.28,.035,dark,0,0,0,fan);b.rotation.x=i*Math.PI/4;}sphere(.045,brass,s*.59,.48,0);}
 box(.5,.23,.17,brass,0,.38,.31);box(.43,.14,.19,dark,0,.39,.34);
 const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.18,.39,.45),new THREE.Vector3(-.18,.23,.53),new THREE.Vector3(-.18,.17,.7),new THREE.Vector3(-.18,.24,.76)]);
 const paper=new THREE.Shape([new THREE.Vector2(0,0),new THREE.Vector2(.36,0),new THREE.Vector2(.36,.012),new THREE.Vector2(0,.012)]);
 mesh(new THREE.ExtrudeGeometry(paper,{steps:12,bevelEnabled:false,extrudePath:curve}),cream);
 cyl(.29,.25,.1,dark,0,.18,0);cyl(.24,.24,.025,teal,0,.12,0);
 cyl(.045,.06,.16,brass,-.16,1,0);sphere(.06,red,-.16,1.07,0);
 box(.38,.29,.03,dark,0,.54,-.29);for(let i=0;i<4;i++)box(.32,.018,.02,brass,0,.44+i*.06,-.31);
 g.userData.joints={eye};

 const bounds=new THREE.Box3(),v=new THREE.Vector3();g.updateMatrixWorld(true);
 g.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));});
 const c=bounds.getCenter(new THREE.Vector3());for(const o of g.children){o.position.x-=c.x;o.position.y-=bounds.min.y;o.position.z-=c.z;}
 g.scale.setScalar(1/(bounds.max.y-bounds.min.y));return g;
}
