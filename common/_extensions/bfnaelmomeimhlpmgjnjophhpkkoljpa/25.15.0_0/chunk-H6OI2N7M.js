import{h as s}from"./chunk-YN37DKRO.js";import{c as m}from"./chunk-H7ATUB7C.js";import{db as r}from"./chunk-7N5UY74L.js";import{f as o}from"./chunk-ORJUPAX4.js";import{j as l,s as e}from"./chunk-27TD4NX4.js";import{a as S}from"./chunk-UA6ADLWZ.js";import{f as T,h as a,n as p}from"./chunk-3KENBVE7.js";a();p();var t=T(S());var v=o.div`
  position: relative;
  width: 100%;
`,B=o.div`
  position: absolute;
  right: 12px;
  top: calc(50% - 27px / 2);
  display: flex;
  align-items: center;
`,w=o(r)`
  margin-right: ${n=>`calc(120px - (${n.textLength}px * 5))`};
`,C=o(r)`
  margin-right: 10px;
`,I=o(m)`
  height: 27px;
`,L=o.div`
  position: relative;
  width: 100%;
  padding: 0px 8px;
  overflow: hidden;
  text-overflow: ellipsis;
`,W=({symbol:n,alignSymbol:g,buttonText:d,width:u,borderRadius:x,onSetTarget:c,targetButtonDisabled:h,placeholder:f,...i})=>{let{t:b}=l(),y=i.value.toString().length;return t.default.createElement(v,null,t.default.createElement(s,{placeholder:f??b("maxInputAmount"),borderRadius:x,...i}),t.default.createElement(B,null,g==="left"?t.default.createElement(w,{size:16,textLength:y,color:e.colors.legacy.textSecondary},n):t.default.createElement(C,{size:16,color:e.colors.legacy.textSecondary},n),t.default.createElement(I,{disabled:h,fontSize:13,width:`${u}px`,borderRadius:"100px",paddingY:4,onClick:c},t.default.createElement(L,null,d))))};export{W as a};
//# sourceMappingURL=chunk-H6OI2N7M.js.map
