import{o as w}from"./chunk-A3FIPWG3.js";import{b as i,d as o}from"./chunk-45FKVGCF.js";import{N as g,p as c}from"./chunk-V63HWKAL.js";import{f as h,m as r,o as s}from"./chunk-UGZFXKPB.js";r();s();var n=h(w());g();r();s();var f=async t=>{try{return await(await Promise.resolve(o.default_gas)).set(t),!0}catch{return!1}};async function l(t){try{return await(await Promise.resolve(o.default_gas)).get(t)}catch{return{realChainIdHex:""}}}var m=async t=>{try{return await(await Promise.resolve(o.default_gas)).delete(t),!0}catch{return!1}};var b=t=>(0,n.useMemoizedFn)(async e=>await l(e||t)),d=(t,e)=>(t?.realChainIdHex||e)&&(!!t?.gasPrice||!!t?.maxPriorityFeePerGas&&!!t?.maxFeePerGas),p=t=>{let{data:e}=c(i.default_gas,t),u=(0,n.useMemoizedFn)(async(a={})=>d(a,t)?await f(a?.realChainIdHex?a:{...a,realChainIdHex:t}):!1,[t]),D=(0,n.useMemoizedFn)(async a=>await m(a||t),[t]);return[e,u,D]},k=p;export{b as a,k as b};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-6TPN273S.js.map
