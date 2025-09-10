import{a as U}from"./chunk-TNSJV7VC.js";import{c as S,h as P,j as H,k as W}from"./chunk-FWNN4T46.js";import"./chunk-ZMMJWM5T.js";import{a as F}from"./chunk-TQGXB7FB.js";import{A as L,d as k}from"./chunk-UMB7TYLX.js";import"./chunk-H6OI2N7M.js";import{a as b}from"./chunk-TMG2ZPKO.js";import"./chunk-ZJHRYWCW.js";import"./chunk-752G45NS.js";import{a as p,b as f,e as z}from"./chunk-SQR6EK5U.js";import"./chunk-E67GFDH7.js";import{g as V}from"./chunk-YN37DKRO.js";import"./chunk-R2LHCBUO.js";import{b as I}from"./chunk-DLKGATEC.js";import"./chunk-P7AH56UI.js";import{a as T}from"./chunk-C4LAG2JY.js";import{c as w}from"./chunk-ZO4HQTNS.js";import"./chunk-UDB3GXAG.js";import"./chunk-ZDSEL3RH.js";import"./chunk-PB6PA2EI.js";import"./chunk-AK42W2OZ.js";import"./chunk-26VAF3RA.js";import"./chunk-NAWTYQ77.js";import"./chunk-7ZVEM3WY.js";import{c as x}from"./chunk-H7ATUB7C.js";import{db as l}from"./chunk-7N5UY74L.js";import{f as i}from"./chunk-ORJUPAX4.js";import"./chunk-HIWDTKJJ.js";import"./chunk-3XC45JK7.js";import"./chunk-US2EC2AF.js";import"./chunk-MWXM4F4N.js";import"./chunk-7F2GBYX5.js";import"./chunk-7XSNALQR.js";import"./chunk-HYOCMEEG.js";import"./chunk-EIQDOUTB.js";import"./chunk-WFPABEAU.js";import"./chunk-3IV4Y5QP.js";import"./chunk-NEKSPHVV.js";import"./chunk-O3RSUGZX.js";import{h as A}from"./chunk-65FAE5DM.js";import"./chunk-D7Z6MPRS.js";import"./chunk-NZAWO25Q.js";import"./chunk-E2H5RB2U.js";import{j as s,qa as v,s as d,w as C}from"./chunk-27TD4NX4.js";import"./chunk-YJV3X2ON.js";import"./chunk-FBDT5S2M.js";import{Y as y,v as h}from"./chunk-TKSJVOQZ.js";import{a as O}from"./chunk-UA6ADLWZ.js";import"./chunk-TVMPABNZ.js";import"./chunk-4M6V6BRQ.js";import"./chunk-UNDMYLJW.js";import{f as j,h as u,n as g}from"./chunk-3KENBVE7.js";u();g();var t=j(O());var G=o=>{let{t:e}=s(),{searchResults:r,isLoading:n,hasError:a,isSuccess:m,showApy:D,onRefetch:B,setSearchTerm:M}=L(),c=(0,t.useRef)();return(0,t.useEffect)(()=>{setTimeout(()=>c.current?.focus(),200)},[]),t.default.createElement(W,{isLoading:n},a?t.default.createElement(S,{title:e("errorAndOfflineSomethingWentWrong"),description:e("validatorListErrorFetching"),refetch:B}):t.default.createElement(Q,null,t.default.createElement(X,null,t.default.createElement(V,{ref:c,tabIndex:0,placeholder:e("commandSearch"),onChange:_=>M(_.currentTarget.value),maxLength:50})),m&&r.length?t.default.createElement(q,{data:r,showApy:D}):t.default.createElement(K,null)),t.default.createElement(T,null,t.default.createElement(x,{onClick:o.onClose},e("commandCancel"))))},kt=G,K=()=>{let{t:o}=s();return t.default.createElement(C,{padding:"screen"},t.default.createElement(l,{size:16,color:d.colors.legacy.textSecondary},o("validatorListNoResults")))},N=84,q=o=>{let{data:e,showApy:r}=o;return t.default.createElement(t.default.Fragment,null,t.default.createElement(Z,{showApy:r}),t.default.createElement(P,null,t.default.createElement(v,null,({height:n,width:a})=>t.default.createElement(w,{height:n,itemCount:e.length,itemData:e,itemSize:N,width:a},J))))},J=({index:o,style:e,data:r})=>{let n=r[o];return t.default.createElement("div",{key:n.identityPubkey,style:e},t.default.createElement($,{voteAccountPubkey:n.voteAccountPubkey,formattedPercentValue:n.totalApy?y(n.totalApy/100,{format:"0.00%"}):"",activatedStake:n.activatedStake,name:n.info?.name,keybaseUsername:n.info?.keybaseUsername,iconUrl:n.info?.iconUrl}))},Q=i.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
`,X=i.div`
  position: relative;
`,Y=i.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
`,E=i(z).attrs(()=>({iconSize:12,lineHeight:19,fontWeight:500,fontSize:16}))``,Z=({showApy:o})=>{let{t:e}=s();return t.default.createElement(Y,null,t.default.createElement(E,{tooltipAlignment:"bottomLeft",info:t.default.createElement(f,null,t.default.createElement(p,null,e("validatorInfoDescription")))},e("validatorInfoTooltip")),o?t.default.createElement(E,{tooltipAlignment:"bottomRight",info:t.default.createElement(f,null,t.default.createElement(p,null,e("validatorApyInfoDescription")))},e("validatorApyInfoTooltip")):null)},$=o=>{let{pushDetailView:e,popDetailView:r}=I(),n=(0,t.useRef)(null),{data:a}=k(o.keybaseUsername),m=o.name??o.keybaseUsername??A(o.voteAccountPubkey);return t.default.createElement(R,{ref:n,onClick:()=>{e(t.default.createElement(U,{voteAccountPubkey:o.voteAccountPubkey,onClose:r}))}},t.default.createElement(tt,{iconUrl:o.iconUrl??a}),t.default.createElement(ot,null,t.default.createElement(et,null,t.default.createElement(l,{size:16,weight:600,lineHeight:19,textAlign:"left",noWrap:!0},h(m,20)),t.default.createElement(l,{size:14,color:d.colors.legacy.textSecondary,lineHeight:19,textAlign:"left",noWrap:!0},t.default.createElement(F,{format:"0,0"},o.activatedStake))),t.default.createElement(l,{size:14,weight:400,lineHeight:19,textAlign:"left",noWrap:!0},o.formattedPercentValue)))},R=i(H)`
  display: grid;
  grid-template-columns: 44px auto;
  column-gap: 10px;
`,tt=i(b).attrs({width:44})``,ot=i.div`
  overflow: hidden;
  width: 100%;
  display: flex;
  justify-content: space-between;
`,et=i.div`
  display: flex;
  flex-direction: column;
`;export{G as ValidatorListPage,kt as default};
//# sourceMappingURL=ValidatorListPage-N3G2SJEN.js.map
