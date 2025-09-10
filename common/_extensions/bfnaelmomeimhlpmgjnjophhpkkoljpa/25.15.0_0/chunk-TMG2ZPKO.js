import{a as b}from"./chunk-P7AH56UI.js";import{E as I}from"./chunk-7N5UY74L.js";import{f as s}from"./chunk-ORJUPAX4.js";import{N as h,s as f}from"./chunk-27TD4NX4.js";import{a as C}from"./chunk-UA6ADLWZ.js";import{f as E,h as u,n as g}from"./chunk-3KENBVE7.js";u();g();var e=E(C());var L=s.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${r=>r.color};
  height: ${r=>r.width}px;
  min-width: ${r=>r.width}px;
  border-radius: 6px;
`,S=s.img`
  border-radius: ${r=>r.shape==="square"?"0":"50%"};
  height: ${r=>r.width}px;
  width: ${r=>r.width}px;
`,z=e.default.memo(({alt:r,backgroundColor:k=f.colors.legacy.bgWallet,className:n,defaultIcon:x,iconUrl:a,localImageSource:i,questionMarkWidth:q,shape:c="circle",width:o})=>{let[w,P]=(0,e.useState)(!1),[l,W]=(0,e.useState)(!1),$=()=>{P(!0)},y=()=>{W(!0)},t=a;a&&o?t=h(a,o,o):i&&(t=i);let d=w?"clear":k,m=t?e.default.createElement(S,{src:t,alt:r,width:o,shape:c,loading:"lazy",onLoad:$,onError:y}):null,p=x||e.default.createElement(I,{width:q});return c==="square"?e.default.createElement(L,{className:n,color:d,width:o},t&&!l?m:p):e.default.createElement(b,{className:n,color:d,diameter:o},t&&!l?m:p)});export{z as a};
//# sourceMappingURL=chunk-TMG2ZPKO.js.map
