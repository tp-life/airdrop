import{db as x}from"./chunk-7N5UY74L.js";import{b as i,f as d}from"./chunk-ORJUPAX4.js";import{T as p}from"./chunk-O3RSUGZX.js";import{Wd as m}from"./chunk-D7Z6MPRS.js";import{s as n}from"./chunk-27TD4NX4.js";import{Q as l}from"./chunk-TKSJVOQZ.js";import{a as w}from"./chunk-UA6ADLWZ.js";import{f as T,h as a,n as s}from"./chunk-3KENBVE7.js";a();s();var t=T(w());var L=o=>{let{txHash:r}=o,{data:c}=m("solana"),f=r&&c?{id:r,networkID:c}:void 0,{data:e}=p(f),h=(0,t.useCallback)(()=>{e&&self.open(e)},[e]);return t.default.createElement(k,{opacity:r?1:0,onClick:h},o.children)},k=d(x).attrs({size:16,weight:500,color:n.colors.legacy.accentPrimary})`
  margin-top: 18px;
  text-decoration: none;
  ${o=>o.opacity===0?i`
          pointer-events: none;
        `:i`
          &:hover {
            cursor: pointer;
            color: ${l(n.colors.legacy.accentPrimaryLight,.5)};
          }
        `}
  }
`;export{L as a};
//# sourceMappingURL=chunk-RQLATSAD.js.map
