import{b as a,f as r}from"./chunk-ORJUPAX4.js";import{s as t}from"./chunk-27TD4NX4.js";import{a as F}from"./chunk-UA6ADLWZ.js";import{f as h,h as s,n as i}from"./chunk-3KENBVE7.js";s();i();var e=h(F());var c=r.div`
  box-shadow: 0px -4px 6px rgba(0, 0, 0, 0.2);
  background: ${t.colors.legacy.bgWallet};
  padding: 14px 20px;
  border-top: 1px solid ${t.colors.legacy.borderSecondary};
  position: absolute;

  left: -16px;
  right: -16px;
  bottom: -10px;

  ${o=>o.removeFooterExpansion&&a`
      left: 0;
      right: 0;
      bottom: 0;
    `}

  ${o=>o.cssOverride}
`,m=r.div`
  height: ${o=>o.height?`${o.height}px`:"auto"};
`,v=e.default.memo(({children:o,removeShadowFooter:l,removeFooterExpansion:n,cssOverride:p})=>{let d=75+(n?0:-10);return e.default.createElement(e.default.Fragment,null,e.default.createElement(c,{removeFooterExpansion:n,cssOverride:p},o),l?null:e.default.createElement(m,{height:d}))});export{v as a};
//# sourceMappingURL=chunk-C4LAG2JY.js.map
