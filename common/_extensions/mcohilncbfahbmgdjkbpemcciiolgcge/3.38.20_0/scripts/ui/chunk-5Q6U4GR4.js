import{a as b}from"./chunk-ERN756XV.js";import{g}from"./chunk-DHNKVM4B.js";import{p as u,q as h}from"./chunk-VL5VJIZ7.js";import{W as f,Y as m,Ya as T}from"./chunk-YILNSICT.js";import{pa as A,x as d}from"./chunk-LBCQTFOD.js";import{b as K}from"./chunk-XFAFBXWC.js";import{m as w,o as l}from"./chunk-UGZFXKPB.js";w();l();K();T();A();var P=(o,t)=>async(a,e,c)=>{let r=`0/${a}`,{extendedPublicKey:s}=d(c,{path:t})||{},{hardwareDerivePubKey:i,getAddressByPublicKey:p}=await b(),n=await i(s,r),y=await p(0,{publicKey:n,addressType:g[o]});e[m][o]={path:`${t}/${r}`,publicKey:n,address:y}},D=async(o,t,a)=>{t[m]={};for(let e=0;e<h.length;e++){let{type:c,basePath:r}=h[e];await P(c,r)(o,t,a)}},M=(o,t)=>async(a,e,c)=>{let r=t+a,{extendedPublicKey:s}=d(c,{path:u})||{},{hardwareDerivePubKey:i,getAddressByPublicKey:p}=await b(),n=await i(s,r),y=await p(60,{publicKey:n});e[f][o]={path:`${u}/${r}`,address:y}};export{D as a,M as b};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-5Q6U4GR4.js.map
