// Candidate c: receipts/references/director.png
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

 for(const s of [-1,1]){box(.32,.35,1.12,dark,s*.59,.23,0);for(const z of [-.4,0,.4]){const w=cyl(.23,.23,.34,dark,s*.6,.25,z);w.rotation.z=Math.PI/2;cyl(.155,.155,.36,cream,s*.6,.25,z).rotation.z=Math.PI/2;cyl(.06,.06,.38,brass,s*.6,.25,z).rotation.z=Math.PI/2;}
 for(let i=0;i<9;i++)for(const y of [.02,.48])box(.38,.045,.065,dark,s*.6,y,-.48+i*.12);}
 box(.95,.57,.96,cream,0,.69,.15);const tower=group("tower",0,1.01,-.2);box(.94,.75,.64,cream,0,.34,0,tower);tower.rotation.x=-.13;
 box(.78,.43,.06,dark,0,1.5,.29);
 for(const s of [-1,1]){const e=profile([[-.13,.08],[-.09,-.06],[.08,-.07],[.14,.02]],.025,teal,s*.21,1.51,.33);e.rotation.z=s*.3;}
 box(.78,.22,.065,dark,0,1.12,.3);for(let i=0;i<9;i++)box(.025+(i%2)*.014,.16,.022,red,-.33+i*.08,1.12,.345);
 box(.73,.035,.51,dark,0,.99,.53);for(let i=0;i<6;i++)box(.72,.02,.02,brass,0,1.015,.31+i*.08);
 const cannons=[];for(const s of [-1,1]){sphere(.25,red,s*.68,1.36,-.04);rod([s*.66,1.34,0],[s*.91,1.07,.21],.105,dark);
 const arm=group("cannon",s*.88,1.05,.2);cyl(.21,.21,.43,cream,0,0,.14,arm).rotation.x=Math.PI/2;ring(.2,.055,red,0,0,.37,arm);cyl(.135,.135,.04,dark,0,0,.39,arm).rotation.x=Math.PI/2;
 box(.19,.36,.022,cream,0,-.14,.42,arm);box(.15,.015,.03,brass,0,-.06,.44,arm);cannons.push(arm);
 cyl(.16,.16,.28,cream,s*.24,1.82,-.2).rotation.z=Math.PI/2;cyl(.05,.05,.3,brass,s*.24,1.82,-.2).rotation.z=Math.PI/2;}
 box(.54,.45,.045,teal,0,.68,.81);box(.3,.045,.02,dark,0,.8,.84);
 cyl(.065,.09,.13,brass,0,1.92,0);sphere(.075,brass,0,1.99,0);
 box(.63,.64,.035,dark,0,1.17,-.41);for(let i=0;i<6;i++)box(.53,.025,.02,brass,0,.95+i*.08,-.44);
 g.userData.joints={cannons};

 const bounds=new THREE.Box3(),v=new THREE.Vector3();g.updateMatrixWorld(true);
 g.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));});
 const c=bounds.getCenter(new THREE.Vector3());for(const o of g.children){o.position.x-=c.x;o.position.y-=bounds.min.y;o.position.z-=c.z;}
 g.scale.setScalar(2.5/(bounds.max.y-bounds.min.y));return g;
}
