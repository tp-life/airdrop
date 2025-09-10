import{a as V,c as A}from"./chunk-72HNNDKS.js";import{a as O}from"./chunk-SDNWZK3I.js";import{c as F}from"./chunk-H7ATUB7C.js";import{Aa as p,Ba as S,Ca as f,Da as x,Ea as k,Fa as y,Ga as w,Ha as L,Ia as T,Ja as v,Ka as C,La as P,Ma as M,Na as b,Oa as D,Pa as a,Qa as W,db as G,ya as I,za as g}from"./chunk-7N5UY74L.js";import{f as o}from"./chunk-ORJUPAX4.js";import{c as d}from"./chunk-7F2GBYX5.js";import"./chunk-7XSNALQR.js";import"./chunk-HYOCMEEG.js";import"./chunk-3IV4Y5QP.js";import"./chunk-O3RSUGZX.js";import"./chunk-65FAE5DM.js";import"./chunk-D7Z6MPRS.js";import"./chunk-NZAWO25Q.js";import"./chunk-E2H5RB2U.js";import{e as l,s as u}from"./chunk-27TD4NX4.js";import"./chunk-YJV3X2ON.js";import"./chunk-FBDT5S2M.js";import"./chunk-TKSJVOQZ.js";import{a as h}from"./chunk-UA6ADLWZ.js";import"./chunk-TVMPABNZ.js";import"./chunk-4M6V6BRQ.js";import"./chunk-UNDMYLJW.js";import{f as m,h as i,n as c}from"./chunk-3KENBVE7.js";i();c();var t=m(h());i();c();var B=m(h());var E={[O]:a,vote:w,"vote-2":L,stake:T,"stake-2":v,view:C,chat:P,tip:M,mint:b,"mint-2":D,"generic-link":a,"generic-add":W,discord:I,twitter:g,"twitter-2":p,x:p,instagram:S,telegram:f,leaderboard:y,gaming:x,"gaming-2":k};function N({icon:s,...n}){let r=E[s];return B.default.createElement(r,{...n})}var H=o.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: -16px; // compensate for generic screen margins
`,Y=o.footer`
  margin-top: auto;
  flex-shrink: 0;
  min-height: 16px;
`,_=o.div`
  overflow: scroll;
`,j=o.ul`
  flex: 1;
  max-height: 350px;
  padding-top: 16px; // compensate for the override of the generic screen margins
`,q=o.li``,J=o.div`
  display: flex;
  align-items: center;
  padding: 6px 12px;
`,U=o(G)`
  text-align: left;
`;U.defaultProps={margin:"12px 0px"};function K({shortcuts:s,...n}){let r=(0,t.useMemo)(()=>n.hostname.includes("//")?new URL(n.hostname).hostname:n.hostname,[n.hostname]);return t.default.createElement(H,null,t.default.createElement(_,null,t.default.createElement(j,null,s.map(e=>t.default.createElement(q,{key:e.uri},t.default.createElement(F,{type:"button",onClick:()=>{d.capture("walletShortcutsLinkOpenClick",V(n,e)),self.open(e.uri)},theme:"text",paddingY:6},t.default.createElement(J,null,t.default.createElement(N,{icon:A(e.uri,e.icon)})),e.label))))),t.default.createElement(Y,null,r&&t.default.createElement(U,{color:u.colors.legacy.textSecondary,size:14,lineHeight:17},l("shortcutsWarningDescription",{url:r}))))}var pt=K;export{K as ShortcutsModal,pt as default};
//# sourceMappingURL=ShortcutsModal-YP4FIOCX.js.map
