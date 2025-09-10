import{e as A}from"./chunk-UDB3GXAG.js";import{z as I}from"./chunk-ZDSEL3RH.js";import{c as N}from"./chunk-PB6PA2EI.js";import{$ as B,P as C,ba as b,db as P}from"./chunk-7N5UY74L.js";import{f as d}from"./chunk-ORJUPAX4.js";import{d as S}from"./chunk-MWXM4F4N.js";import{a as z}from"./chunk-WFPABEAU.js";import{Lc as D,vd as y}from"./chunk-D7Z6MPRS.js";import{C as L,D as M,s as w}from"./chunk-27TD4NX4.js";import{d as H,ka as p}from"./chunk-TKSJVOQZ.js";import{a as V}from"./chunk-UA6ADLWZ.js";import{f as h,h as f,n as g}from"./chunk-3KENBVE7.js";f();g();var T=h(z()),i=h(V());var E=(0,i.createContext)({pushDetailViewCallback:()=>p,pushDetailView:p,popDetailView:p,resetDetailView:p,detailViewStackLength:0}),U=d(L.div)`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: ${e=>e.theme?.detailViewMaxHeight??"100%"};
  min-height: ${e=>e.theme?.detailViewMinHeight??"initial"};
`,se=i.default.memo(({children:e,shouldResetOnAccountChange:t,shouldPushDetailView:o})=>{let{detailViewStack:r,setDetailViewStack:l,pushDetailView:a,...s}=G(),{data:c}=y();return(0,i.useEffect)(()=>{t&&l([])},[c,l,t]),(0,i.useEffect)(()=>{o&&a(e)},[e,o,a]),i.default.createElement(E.Provider,{value:{...s,pushDetailView:a,detailViewStackLength:r.length}},i.default.createElement(X,{stack:r},e))}),_=navigator.webdriver?0:500,G=()=>{let[e,t]=(0,i.useState)([]),o=(0,i.useMemo)(()=>(0,T.default)(s=>{t(c=>D(c,u=>{u.push(s)}))},_,{leading:!0,trailing:!1}),[t]),r=(0,i.useCallback)(()=>{t(s=>D(s,c=>{c.pop()}))},[t]),l=(0,i.useCallback)(s=>()=>{o(s)},[o]),a=(0,i.useCallback)(()=>()=>{t([])},[t]);return(0,i.useMemo)(()=>({detailViewStack:e,setDetailViewStack:t,pushDetailView:o,popDetailView:r,resetDetailView:a,pushDetailViewCallback:l}),[e,r,o,a,l])},J=.15,X=({children:e,stack:t})=>{let o=A(t,(u,m)=>u?.length===m.length),r=H(t),l=t.length>(o??[]).length,a=o===void 0,s=a?0:l?10:-10,c=a?1:0;return i.default.createElement(M,{mode:"wait"},i.default.createElement(U,{key:`${t.length}_${o?.length}`,initial:{x:s,opacity:c},animate:{x:0,opacity:1},exit:{opacity:0},transition:{duration:J},ref:q},r||e))},v=()=>{let e=(0,i.useContext)(E);if(!e)throw new Error("Missing detail view context");return e},q=e=>{e&&e.parentElement&&(e.parentElement.scrollTop=0)};f();g();var x=h(V()),K=(0,x.createContext)({isOpen:!1,showSettingsMenu:p,hideSettingsMenu:p}),W=()=>(0,x.useContext)(K);f();g();var n=h(V());var $=d.section`
  z-index: 1;
  background-color: ${w.colors.legacy.bgWallet};
  padding: 10px 16px;
  display: flex;
  flex-shrink: 0;
  flex-direction: row;
  align-items: center;
  justify-content: ${e=>e.justifyContent};
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${w.colors.legacy.borderSecondary};
  height: ${e=>e.height}px;
  width: 100%;
`;$.defaultProps={justifyContent:"center",height:S};var R=d(P).attrs({size:16,weight:500,lineHeight:25})``;R.defaultProps={maxWidth:"280px",noWrap:!0};var Q=d.div`
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  padding-bottom: 17px;
  position: relative;
  width: 100%;
`,j=d(I)`
  position: absolute;
  right: 0;
`,k=d(N)`
  position: absolute;
  left: 0;
`,Pe=({children:e,items:t,sections:o,icon:r,shouldWrap:l,onIconClick:a,onLeftButtonClick:s,useCloseButton:c})=>{let u=Z({withCloseButton:c??!1,onLeftButtonClick:s}),m=o&&o.length>0||t&&t.length>0;return n.default.createElement(Q,null,u,n.default.createElement(P,{weight:500,size:22,noWrap:!l,maxWidth:"280px"},e),m||a?n.default.createElement(j,{sections:o,items:t,icon:r||n.default.createElement(B,null),onIconClick:a}):n.default.createElement("div",null))},F=d($)`
  position: relative;
  border-bottom: none;

  &:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: -20px;
    width: calc(100% + 40px);
    border-bottom: 1px solid ${w.colors.legacy.borderSecondary};
  }
`,Y=d.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
`,ve=({children:e,sections:t,items:o,icon:r,shouldWrap:l,onIconClick:a,onLeftButtonClick:s,disableIconBackground:c})=>{let u=ee(s),m=t&&t.length>0||o&&o.length>0;return n.default.createElement(F,null,u,n.default.createElement(Y,null,typeof e=="string"?n.default.createElement(R,{noWrap:!l},e):e),m||a?n.default.createElement(j,{sections:t,items:o,icon:r,onIconClick:a,disableIconBackground:c}):n.default.createElement("div",null))};F.defaultProps={justifyContent:"center",height:S};var Z=({withCloseButton:e,onLeftButtonClick:t})=>{let{popDetailView:o,detailViewStackLength:r}=v();return(0,n.useMemo)(()=>r===0?n.default.createElement("div",null):n.default.createElement(k,{onClick:()=>{t?.(),o()},"data-testid":"header--back"},e?n.default.createElement(C,null):n.default.createElement(b,null)),[e])},ee=e=>{let{hideSettingsMenu:t}=W(),{popDetailView:o,detailViewStackLength:r}=v();return(0,n.useMemo)(()=>r>0?n.default.createElement(k,{onClick:()=>{o()},"data-testid":"header--back"},n.default.createElement(b,null)):n.default.createElement(k,{"data-testid":"settings-menu-close-button",onClick:e??t},n.default.createElement(C,null)),[])};export{se as a,v as b,K as c,W as d,$ as e,Pe as f,ve as g};
//# sourceMappingURL=chunk-DLKGATEC.js.map
