import{f as s}from"./chunk-4NCQWC2K.js";import{o as d}from"./chunk-A3FIPWG3.js";import{ac as M}from"./chunk-NTISK7TT.js";import{d as a,f as B}from"./chunk-37O7OMRA.js";import{f as c,m as n,o as i}from"./chunk-UGZFXKPB.js";n();i();var p=c(M()),m=c(d());B();var S=({metamask:t})=>t?.createdMap||{},g=(t,e,u={})=>{let r=s(t,e,{...u,withBalanceStatus:!0})||{},{requestBalance:f}=r,l=!(0,p.useSelector)(S)[e];return(0,m.useMount)(async()=>{if(l)try{let o=await a().getWalletTypeCreated(e);await a().createWalletToServer({walletId:e,walletType:o,noticeBackend:!0}),f()}catch{}}),r},C=g;export{C as a};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-TEHSOGCP.js.map
