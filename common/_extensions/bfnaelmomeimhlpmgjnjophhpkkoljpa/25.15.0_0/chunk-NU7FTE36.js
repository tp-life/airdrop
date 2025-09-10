import{a as d,b as D,c as p}from"./chunk-MNWUE4AR.js";import{j as z}from"./chunk-QY52VKIT.js";import{a as x,e as K}from"./chunk-SQR6EK5U.js";import{a as _}from"./chunk-C4LAG2JY.js";import{a as N}from"./chunk-NUJWAPIJ.js";import{b as O}from"./chunk-KQPLPV6X.js";import{a as s}from"./chunk-AK42W2OZ.js";import{a as E}from"./chunk-LEN5VG3M.js";import{cb as U,db as b}from"./chunk-7N5UY74L.js";import{f as i}from"./chunk-ORJUPAX4.js";import{h as q,i as V}from"./chunk-HIWDTKJJ.js";import{h as v}from"./chunk-65FAE5DM.js";import{Q as I,q as l,s as m,w as C,x as F}from"./chunk-27TD4NX4.js";import{a as P}from"./chunk-UA6ADLWZ.js";import{f as L,h as f,n as u}from"./chunk-3KENBVE7.js";f();u();var o=L(P());f();u();var n=L(P());var oo=i.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  height: 83px;
  padding: 16px;
`,eo=i.div`
  margin-left: 12px;
  width: 100%;
`,to=i(b).attrs({size:14,weight:400,color:m.colors.legacy.textSecondary,textAlign:"left"})``,io=i.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`,no=i(b).attrs({size:28,lineHeight:32,weight:600,color:m.colors.legacy.textPrimary,textAlign:"left"})`
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`,T=({title:r,network:w,tokenType:k,symbol:g,logoUri:y,tokenAddress:t,amount:e,amountUsd:h})=>n.default.createElement(oo,null,n.default.createElement(O,{image:{type:"fungible",src:y,fallback:g||t},size:44,tokenType:k,chainMeta:w}),n.default.createElement(eo,null,n.default.createElement(io,null,n.default.createElement(to,null,r),n.default.createElement(N,{value:h,font:"caption",color:"textSecondary"})),n.default.createElement(no,null,e)));var a={screen:l({overflow:"auto"}),body:l({display:"flex",flexDirection:"column",justifyContent:"space-between"}),content:l({display:"flex",flexDirection:"column",width:"100%"}),assets:l({backgroundColor:"bgRow",borderRadius:6,width:"100%"}),line:l({backgroundColor:"bgWallet",width:"100%",height:1}),button:l({width:"100%",height:48})},c=i(U).attrs({color:E.grayLight,size:14})`
  text-align: left;
  line-height: normal;
  max-width: 100%;
  margin: 16px 0 32px;
`,J=i.a.attrs({target:"_blank",rel:"noopener noreferrer"})`
  color: ${r=>r.theme.purple};
  text-decoration: none;
  cursor: pointer;
`,ro=({isJitoSOL:r})=>r?o.default.createElement(c,null,o.default.createElement(s,{i18nKey:"liquidStakeReviewConversionFootnote"},"When you stake Solana tokens in exchange for JitoSOL you'll receive a slightly lesser amount of JitoSOL.",o.default.createElement(J,{href:q},"Learn more"))):o.default.createElement(c,null,o.default.createElement(K,{tooltipAlignment:"topLeft",iconSize:12,lineHeight:17,fontWeight:400,info:o.default.createElement(D,{tooltipContent:o.default.createElement(x,null,o.default.createElement(s,{i18nKey:"liquidStakeReviewPhantomFeeFootnoteTooltip"},"A fee of 8% is automatically factored into this quote. While staked, a percentage of earned rewards is taken as a fee"))}),textColor:m.colors.legacy.textSecondary},o.default.createElement(s,{i18nKey:"liquidStakeReviewPhantomFeeFootnote"},"Est. APY includes an 8% Phantom fee"))),lo=()=>o.default.createElement(c,null,o.default.createElement(s,{i18nKey:"liquidStakeDepositStakeDisclaimer"},"You'll receive JitoSOL in 10 hours.",o.default.createElement(J,{href:V},"Learn more"))),Io=o.default.memo(({process:r,headerTitle:w,onBack:k,onPrimaryButtonPress:g,canSubmit:y,payAsset:t,receiveAsset:e,accountLabelText:h,account:H,providerLabelText:B,providerName:W,apyLabelText:A,apyLabelTextTooltip:j,apy:M,networkFeeLabelText:Y,networkFee:$,isLoading:S,networkFeeErrorMsg:G,primaryButtonText:Q,isJitoSOL:X})=>{let Z=[e?o.default.createElement(d,{key:"account-row",label:h},o.default.createElement(p,null,o.default.createElement(F,{font:"body",children:v(H,4)}))):null,o.default.createElement(d,{key:"provider-row",label:B},o.default.createElement(p,null,W)),o.default.createElement(d,{key:"apy-row",label:A,tooltipContent:o.default.createElement(x,null,j)},o.default.createElement(p,null,M)),o.default.createElement(d,{key:"network-fee-row",label:Y,isLoading:S,error:G},o.default.createElement(p,null,$))];return o.default.createElement("div",{className:a.screen},o.default.createElement(z,{leftButton:{type:"back",onClick:k},titleSize:"regular"},w),o.default.createElement("div",{className:a.body},o.default.createElement("div",{className:a.content},o.default.createElement("div",{className:a.assets},t?o.default.createElement(T,{title:t.title,amount:t.amount+" "+t.symbol,amountUsd:t.amountUsd,logoUri:t.logoUri,symbol:t.symbol,tokenType:t.tokenType,tokenAddress:t.tokenAddress,network:t.network}):null,o.default.createElement("div",{className:a.line}),e?o.default.createElement(T,{title:e.title,amount:e.amount+" "+e.symbol,amountUsd:e.amountUsd,logoUri:e.logoUri,symbol:e.symbol,tokenType:e.tokenType,tokenAddress:e.tokenAddress,network:e.network}):null),o.default.createElement(C,{borderRadius:8,gap:1,overflow:"hidden",marginTop:"base"},Z),r==="mint"?o.default.createElement(ro,{isJitoSOL:X}):o.default.createElement(lo,null)),o.default.createElement(_,null,o.default.createElement(I,{className:a.button,theme:"primary",disabled:!y||S,onClick:g},Q))))});export{Io as a};
//# sourceMappingURL=chunk-NU7FTE36.js.map
