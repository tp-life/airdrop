import{m as _,r as O}from"./chunk-H5C3PAJB.js";import{W as N}from"./chunk-QY52VKIT.js";import{b as L,d as H}from"./chunk-DLKGATEC.js";import{c as w}from"./chunk-PB6PA2EI.js";import{b as C}from"./chunk-RP4HT6XN.js";import{ba as T,c as $,ca as I}from"./chunk-7N5UY74L.js";import{b as d,f as o}from"./chunk-ORJUPAX4.js";import{s as D}from"./chunk-27TD4NX4.js";import{a as v}from"./chunk-UA6ADLWZ.js";import{f as k,h as l,n as m}from"./chunk-3KENBVE7.js";l();m();var i=k(v());l();m();var f=k(v());var M=5,A=5,p=2,U=A+2*p,S=14,X=S+2*p,V=A+2*p,G=o.div`
  display: flex;
  justify-content: ${t=>t.shouldCenter?"center":"flex-start"};
  align-items: center;
  position: relative;
  overflow: hidden;
  width: ${t=>(t.maxVisible-1)*U+X}px;
`,J=o.div`
  align-items: center;
  display: flex;
  ${t=>t.shouldShift&&d`
      transform: translateX(calc(-${V}px * ${t.shiftAmount}));
      transition: transform 0.3s ease-in-out;
    `}
`,q=o.div`
  align-items: center;
  background-color: ${D.colors.legacy.textSecondary};
  border-radius: 95px;
  display: flex;
  height: ${M}px;
  justify-content: center;
  margin: 0 ${p}px;
  min-width: ${A}px;
  transition: all 0.3s ease-in-out;
  ${t=>t.isActive&&d`
      min-width: ${S}px;
    `}
  ${t=>t.isSmall&&d`
      min-width: 3px;
      margin: 0 ${p}px;
      height: 3px;
    `}
`,z=o.div`
  width: ${S}px;
  height: ${M}px;
  border-radius: 95px;
  position: absolute;
  margin: 0 ${p}px;
  background-color: ${D.colors.legacy.accentPrimary};
  transition: transform 0.3s ease-in-out;
  ${t=>t.position&&d`
      transform: translateX(${t.position*V}px);
    `}
`,F=({numOfItems:t,currentIndex:e,maxVisible:a=5})=>{let n=t>a?e>a-3:!1,c=n?e-(a-3):0;return f.default.createElement(G,{shouldCenter:a>t,maxVisible:a},f.default.createElement(J,{shouldShift:n,shiftAmount:c},Array.from({length:t}).map((b,s)=>{let u=(s===e-2||s===e+2)&&n;return f.default.createElement(q,{key:`pagination-dot-${s}`,isActive:e===s,isSmall:u})}),f.default.createElement(z,{position:e})))},B=F;var K=o.div`
  height: 0;
  transition: height 0.2s ease-in-out;
  width: 100%;
  ${t=>t.animate?`height: ${t.shouldCollapse?t.itemHeight+26:t.itemHeight+46}px`:""}
`,Q=o.div`
  transition: transform 0.5s ease;
  width: 100%;
`,E=o(w)``,W=o.div`
  visibility: ${t=>t.isVisible?"visible":"hidden"};
`,Y=o.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
`,Z=o.ul`
  align-items: center;
  display: flex;
  margin-bottom: 8px;
  transition: transform 0.5s ease;
  transform: ${t=>`translateX(${t.currentIndex*-100}%)`};
`,R=o.li`
  align-items: center;
  display: flex;
  flex: 0 0 100%;
  padding: ${t=>t.isActive?"0":t.isNext||t.isPrevious?"0 6px":"0"};
  height: ${t=>t.isActive?t.itemHeight:.9*t.itemHeight}px; /* 0.9 is taken from parallaxAdjacentItemScale from the carousel on mobile */
`,ut=({items:t,onIndexChange:e,itemHeight:a})=>{let[n,c]=(0,i.useState)(0),b=(0,i.useCallback)(()=>{c(r=>r+1)},[]),s=(0,i.useCallback)(()=>{c(r=>r-1)},[]),u=n<t.length-1,x=n>0;(0,i.useEffect)(()=>{!t.length||n>t.length-1||e(n)},[t,e,n]),(0,i.useEffect)(()=>{t.length>0&&n>=t.length&&c(t.length-1)},[n,t]);let h=t.length<=1;return i.default.createElement(K,{animate:t.length>0,shouldCollapse:h,itemHeight:a},i.default.createElement(Q,null,i.default.createElement(Z,{currentIndex:n},t.map((r,y)=>i.default.createElement(R,{key:r.key,isActive:n===y,isNext:n+1===y,isPrevious:n-1===y,itemHeight:a},r.node))),!h&&i.default.createElement(Y,null,i.default.createElement(W,{isVisible:x},i.default.createElement(E,{onClick:s},i.default.createElement(T,null))),i.default.createElement(B,{numOfItems:t.length,currentIndex:n,maxVisible:5}),i.default.createElement(W,{isVisible:u},i.default.createElement(E,{onClick:b},i.default.createElement(I,null))))))};l();m();var g=k(v());l();m();var j=t=>{if(t==="Settings: Security & Privacy")return O;if(t==="Settings: Currency")return _};var nt=g.default.lazy(()=>import("./FungibleDetailPage-SJDBWBP6.js")),wt=()=>{let{showSettingsMenu:t}=H(),{handleShowModalVisibility:e}=N(),{pushDetailView:a}=L(),n=$();return(0,g.useCallback)((b,s)=>{let{destinationType:u,url:x,caip19:h}=s;switch(u){case"External Link":C({url:x});break;case"Buy":e("onramp");break;case"Collectibles":n("/collectibles");break;case"Explore":n("/explore");break;case"Swapper":n("/swap");break;case"Settings: Claim Username":e("quickClaimUsername");break;case"Settings: Import Seed Phrase":C({url:"onboarding.html?append=true"});break;case"Connect Hardware Wallet":C({url:"connect_hardware.html"});break;case"Convert to Jito":e("convertJitoInfo",{skipDismissRouting:!0});break;case"Token":{if(!h)return;a(g.default.createElement(nt,{caip19:h,title:void 0,entryPoint:"actionBanner"}));break}default:{let r=j(u);if(!r)return;t(b,g.default.createElement(r,null))}}},[n,t,e,a])};export{wt as a,ut as b};
//# sourceMappingURL=chunk-YAO7REK7.js.map
