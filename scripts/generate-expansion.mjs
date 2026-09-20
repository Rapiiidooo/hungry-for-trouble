import { readFile, mkdir, writeFile } from "node:fs/promises";

// Reuse the first pack's construction helpers, never its finished object geometry.
const source = await readFile(
  new URL("./generate-candidates.mjs", import.meta.url),
  "utf8",
);
const prelude = source.split("const prelude = `")[1].split("`;\n")[0];
const finish = (height) => `
 const bounds=new THREE.Box3(),v=new THREE.Vector3();g.updateMatrixWorld(true);
 g.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++)bounds.expandByPoint(v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld));});
 const c=bounds.getCenter(new THREE.Vector3());for(const o of g.children){o.position.x-=c.x;o.position.y-=bounds.min.y;o.position.z-=c.z;}
 g.scale.setScalar(${height}/(bounds.max.y-bounds.min.y));return g;
}`;

const drone = (v) => `
 ${v === "a" ? `const shell=sphere(0.43,cream,0,0.52,0);shell.scale.set(1,1.1,0.8);` : v === "b" ? `profile([[-.32,0],[-.41,.12],[-.4,.58],[-.27,.76],[.27,.76],[.4,.58],[.41,.12],[.32,0]],.52,cream,0,.2,-.26);` : `lathe([[0,0],[.25,0],[.37,.1],[.38,.45],[.26,.65],[0,.7]],cream,0,.22,0);`}
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
`;
const visor = (v) => `
 ${v === "a" ? `box(.94,.39,.28,cream,0,.29,0);` : v === "b" ? `for(const s of [-1,1]){const o=lathe([[0,0],[.2,0],[.25,.05],[.25,.22],[.21,.29],[0,.29]],cream,s*.25,.3,-.14);o.rotation.x=Math.PI/2;}` : `profile([[-.49,.1],[-.48,.37],[-.35,.5],[.35,.5],[.48,.37],[.49,.1],[.29,0],[.14,.1],[-.14,.1],[-.29,0]],.27,cream,0,.02,-.14);`}
 for(const s of [-1,1]){ring(.185,.043,dark,s*.25,.3,.17);cyl(.16,.16,.04,teal,s*.25,.3,.19).rotation.x=Math.PI/2;ring(.14,.01,brass,s*.25,.3,.22);sphere(.032,cream,s*.25-.05,.36,.225);
 cyl(.09,.09,.08,brass,s*.49,.29,-.02).rotation.z=Math.PI/2;box(.04,.14,.4,dark,s*.49,.29,-.25);}
 box(.1,.18,.18,dark,0,.19,.15);box(.94,.14,.045,dark,0,.29,-.46);box(.14,.19,.06,brass,0,.29,-.49);
 box(.3,.06,.23,red,0,.53,0);sphere(.067,red,0,.6,0);rod([.35,.46,-.06],[.35,.76,-.06],.025,brass);sphere(.04,brass,.35,.77,-.06);
`;
const director = (v) => `
 for(const s of [-1,1]){box(.32,.35,1.12,dark,s*.59,.23,0);for(const z of [-.4,0,.4]){const w=cyl(.23,.23,.34,dark,s*.6,.25,z);w.rotation.z=Math.PI/2;cyl(.155,.155,.36,cream,s*.6,.25,z).rotation.z=Math.PI/2;cyl(.06,.06,.38,brass,s*.6,.25,z).rotation.z=Math.PI/2;}
 for(let i=0;i<9;i++)for(const y of [.02,.48])box(.38,.045,.065,dark,s*.6,y,-.48+i*.12);}
 ${v === "a" ? `box(.92,1.35,.66,cream,0,1.03,-.08);box(.9,.45,.54,cream,0,.68,.41);` : v === "b" ? `profile([[-.46,0],[-.51,.12],[-.48,1.21],[-.38,1.38],[.38,1.38],[.48,1.21],[.51,.12],[.46,0]],.64,cream,0,.4,-.36);profile([[-.45,0],[-.45,.39],[-.35,.53],[.35,.53],[.45,.39],[.45,0]],.56,cream,0,.4,.25);` : `box(.95,.57,.96,cream,0,.69,.15);const tower=group("tower",0,1.01,-.2);box(.94,.75,.64,cream,0,.34,0,tower);tower.rotation.x=-.13;`}
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
`;
const destination = "receipts/candidates-expansion";
await mkdir(destination, { recursive: true });
for (const [name, build, height] of [
  ["audit_drone", drone, 1],
  ["visor", visor, 0.65],
  ["director", director, 2.5],
]) {
  for (const variant of ["a", "b", "c"]) {
    await writeFile(
      `${destination}/${name}_${variant}.js`,
      `// Candidate ${variant}: receipts/references/${name}.png\n${prelude}${build(variant)}${finish(height)}\n`,
    );
  }
}
console.log("Wrote nine expansion candidates.");
