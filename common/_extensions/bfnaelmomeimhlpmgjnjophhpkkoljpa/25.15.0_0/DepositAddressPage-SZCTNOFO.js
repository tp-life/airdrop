import{a as w,b as N}from"./chunk-5HKWLYN4.js";import{a as k}from"./chunk-6N4LSHMD.js";import{a as C}from"./chunk-752G45NS.js";import"./chunk-ACPUL5BT.js";import{a as u}from"./chunk-R2LHCBUO.js";import{f as P}from"./chunk-DLKGATEC.js";import"./chunk-UDB3GXAG.js";import"./chunk-ZDSEL3RH.js";import"./chunk-PB6PA2EI.js";import{c as g}from"./chunk-H7ATUB7C.js";import{db as S}from"./chunk-7N5UY74L.js";import{f as t}from"./chunk-ORJUPAX4.js";import"./chunk-MWXM4F4N.js";import"./chunk-WFPABEAU.js";import{k as b}from"./chunk-65FAE5DM.js";import"./chunk-D7Z6MPRS.js";import"./chunk-NZAWO25Q.js";import"./chunk-E2H5RB2U.js";import{j as h,s as p,x as y}from"./chunk-27TD4NX4.js";import"./chunk-YJV3X2ON.js";import"./chunk-FBDT5S2M.js";import"./chunk-TKSJVOQZ.js";import{a as A}from"./chunk-UA6ADLWZ.js";import"./chunk-TVMPABNZ.js";import"./chunk-4M6V6BRQ.js";import"./chunk-UNDMYLJW.js";import{f as x,h as l,n as c}from"./chunk-3KENBVE7.js";l();c();var D=x(N()),o=x(A());l();c();var a=x(A());var v=t(g).attrs({borderRadius:"100px",theme:"primary",width:"auto",fontSize:14,fontWeight:600})`
  flex-shrink: 0;
  padding: 5px 12px;
`,T=a.default.memo(s=>{let{copyText:e,className:d}=s,{buttonText:r,copy:n}=w(e),f=(0,a.useCallback)(m=>{m.stopPropagation(),n()},[n]);return a.default.createElement(v,{className:d,onClick:f},r)});var B=t(u).attrs({align:"center",justify:"space-between"})`
  height: 100%;
`,F=t(D.default)`
  padding: 8px;
  background: ${p.colors.legacy.white};
  border-radius: 6px;
`,E=t(C).attrs({align:"center",justify:"space-between"})`
  box-shadow: inset 0px 0px 4px rgba(0, 0, 0, 0.25);
  padding: 12px 15px;
  background: ${p.colors.legacy.bgArea};
  border: 1px solid ${p.colors.legacy.borderSecondary};
  border-radius: 6px;
`,z=t(u).attrs({align:"center"})`
  ${E} {
    margin-top: 32px;
    margin-bottom: 11px;
  }
`,H=t(C)`
  p:first-child {
    margin-right: 6px;
  }
`,M=s=>{let{accountName:e,walletAddress:d,address:r,symbol:n,onClose:f}=s,m=n||(r?b(r):void 0),{t:i}=h();return{i18nStrings:(0,o.useMemo)(()=>({depositAssetInterpolated:i("depositAssetDepositInterpolated",{tokenSymbol:m}),secondaryText:i("depositAssetSecondaryText"),transferFromExchange:i("depositAssetTransferFromExchange"),depositAssetShareAddressError1:i("sendInvalidQRCodeLoadingError1"),depositAssetShareAddressError2:i("sendInvalidQRCodeLoadingError2"),close:i("commandClose")}),[i,m]),accountName:e,walletAddress:d,onClose:f}},Q=o.default.memo(s=>{let{i18nStrings:e,accountName:d,walletAddress:r,onClose:n}=s;return o.default.createElement(B,null,o.default.createElement(P,null,e.depositAssetInterpolated),o.default.createElement(z,null,r?o.default.createElement(o.default.Fragment,null,o.default.createElement(F,{value:r,size:160}),o.default.createElement(E,null,o.default.createElement(H,null,o.default.createElement(k,{name:d,publicKey:r})),o.default.createElement(T,{copyText:r})),o.default.createElement(S,{size:14,color:p.colors.legacy.textSecondary,lineHeight:20},e.secondaryText)):o.default.createElement(o.default.Fragment,null,o.default.createElement(y,{align:"center",font:"labelSemibold",children:e.depositAssetShareAddressError1}),o.default.createElement(y,{align:"center",font:"body",children:e.depositAssetShareAddressError2}))),o.default.createElement(u,null,o.default.createElement(g,{onClick:n},e.close)))}),$=o.default.memo(s=>{let e=M(s);return o.default.createElement(Q,{...e})}),to=$;export{$ as DepositAddressPage,to as default};
//# sourceMappingURL=DepositAddressPage-SZCTNOFO.js.map
