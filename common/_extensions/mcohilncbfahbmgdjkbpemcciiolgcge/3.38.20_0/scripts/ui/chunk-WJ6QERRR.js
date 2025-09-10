import{a as c}from"./chunk-ERN756XV.js";import{cb as o}from"./chunk-NTISK7TT.js";import{a as P}from"./chunk-45FKVGCF.js";import{oc as m}from"./chunk-YILNSICT.js";import{f as d,m as s,o as n}from"./chunk-UGZFXKPB.js";s();n();var i=d(P());m();var h=async(t,e,r,a)=>{try{return await a(t,{privateKey:e,hrp:r}),!0}catch{return!1}},x=async(t,e)=>{let r=[],a=o(e),{getNewAddress:f}=await c();return await Promise.all(a.map(({coinType:p,cosmosPrefix:l,baseChain:u})=>h(p,t,l,f).then(y=>{y&&r.push(u)}))),r};var v=async(t,e)=>await x(t,e),C=async(t,e)=>{let r=await v(t,e);return Boolean(r[0])};export{v as a,C as b};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-WJ6QERRR.js.map
