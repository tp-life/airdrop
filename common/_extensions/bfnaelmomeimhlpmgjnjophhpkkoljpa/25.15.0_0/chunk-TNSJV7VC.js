import{a as K}from"./chunk-ZMMJWM5T.js";import{a as q}from"./chunk-TQGXB7FB.js";import{b as U,c as O,f as W,i as G}from"./chunk-UMB7TYLX.js";import{a as _}from"./chunk-H6OI2N7M.js";import{b as H}from"./chunk-E67GFDH7.js";import{f}from"./chunk-DLKGATEC.js";import{a as N}from"./chunk-AK42W2OZ.js";import{a as D,d as z}from"./chunk-H7ATUB7C.js";import{db as n}from"./chunk-7N5UY74L.js";import{f as r}from"./chunk-ORJUPAX4.js";import{b as M,p as B,y as F}from"./chunk-HIWDTKJJ.js";import{G as E,ba as I}from"./chunk-US2EC2AF.js";import{Fc as L,tc as V}from"./chunk-EIQDOUTB.js";import{h as w}from"./chunk-65FAE5DM.js";import{H as h,I as b,L as yo,Vd as P,tb as k}from"./chunk-D7Z6MPRS.js";import{j as g,s as a}from"./chunk-27TD4NX4.js";import{b as v}from"./chunk-TKSJVOQZ.js";import{a as So}from"./chunk-UA6ADLWZ.js";import{f as fo,h as T,n as A}from"./chunk-3KENBVE7.js";T();A();var o=fo(So());var xo=i=>{let{t}=g(),{voteAccountPubkey:l}=i,{showStakeAccountCreateAndDelegateStatusModal:Y,closeAllModals:j}=H(),J=()=>{i.onClose(),j()},{data:X}=P("solana"),{data:Z}=E(),R=Z?.totalQuantityString??"";I(X,"STAKE_FUNGIBLE");let{cluster:oo,connection:u}=L(),s=F(u),to=k("solana"),{data:eo}=V({query:{data:to}}),no=eo?.usd,e=(0,o.useMemo)(()=>s.results?.find(go=>go.voteAccountPubkey===l),[s.results,l]),ao=e?.info?.name??e?.info?.keybaseUsername??w(l),ro=U(u),[m,S]=(0,o.useState)(""),c=v(m),p=h(1+(W(u).data??0)),y=O({balance:R,cluster:oo,rentExemptionMinimum:p}),io=()=>S(y.toString()),so=c.isLessThan(p),lo=c.isGreaterThan(y),mo=c.isFinite(),d=m&&so?t("validatorViewAmountSOLRequiredToStakeInterpolated",{amount:p}):m&&lo?t("validatorViewInsufficientBalance"):"",co=ro.isPending,x=mo&&!d&&!co,uo=()=>{Y({lamports:b(c).toNumber(),votePubkey:l,usdPerSol:no,onClose:J,validatorName:ao})},{data:C=null}=G(),po=C?B(C,e?.commission??0):null;return o.default.createElement(Co,null,s.isPending?o.default.createElement(D,null):s.isError||!e?o.default.createElement(o.default.Fragment,null,o.default.createElement(f,null,t("validatorViewPrimaryText")),o.default.createElement(Q,null,o.default.createElement(n,{size:16,color:a.colors.legacy.textSecondary,lineHeight:20},t("validatorViewErrorFetching")," ",s.error?.message??""))):o.default.createElement(o.default.Fragment,null,o.default.createElement(f,null,t("validatorViewPrimaryText")),o.default.createElement(Q,null,o.default.createElement(n,{size:16,color:a.colors.legacy.textSecondary,lineHeight:20,margin:"0 0 20px 0"},o.default.createElement(N,{i18nKey:"validatorViewDescriptionInterpolated"},"Choose how much SOL you\u2019d like to ",o.default.createElement("br",null),"stake with this validator. ",o.default.createElement($,{href:M},"Learn more"))),o.default.createElement(_,{value:m,symbol:"SOL",alignSymbol:"right",buttonText:t("maxInputMax"),width:47,warning:!!d,onSetTarget:io,onUserInput:S}),o.default.createElement(Ao,null,o.default.createElement(n,{color:d?a.colors.legacy.accentAlert:"transparent",size:16,textAlign:"left"},d)),o.default.createElement(ho,{onEdit:i.onClose}),o.default.createElement(K,{identifier:e.voteAccountPubkey,name:e.info?.name,keybaseUsername:e.info?.keybaseUsername,iconUrl:e.info?.iconUrl,website:e.info?.website,data:[{label:t("validatorCardEstimatedApy"),value:o.default.createElement(n,{textAlign:"right",weight:500,size:14,noWrap:!0},po,"%")},{label:t("validatorCardCommission"),value:o.default.createElement(n,{textAlign:"right",weight:500,size:14,noWrap:!0},e.commission,"%")},{label:t("validatorCardTotalStake"),value:o.default.createElement(n,{textAlign:"right",weight:500,size:14,noWrap:!0},o.default.createElement(q,null,e.activatedStake))}]})),o.default.createElement(To,null,o.default.createElement(z,{primaryText:t("validatorViewActionButtonStake"),secondaryText:t("commandClose"),onPrimaryClicked:uo,onSecondaryClicked:i.onClose,primaryTheme:x?"primary":"default",primaryDisabled:!x}))))},Ro=xo,Co=r.div`
  display: grid;
  grid-template-rows: 42px auto 47px;
  height: 100%;
`,Q=r.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`,$=r.a.attrs({target:"_blank",rel:"noopener noreferrer"})`
  color: ${a.colors.legacy.accentPrimary};
  text-decoration: none;
  cursor: pointer;
`,To=r.section`
  display: flex;
  gap: 15px;
`,Ao=r.div`
  width: 100%;
`,vo=r(n)`
  width: 100%;
  margin-top: 15px;
  > a {
    color: ${a.colors.legacy.accentPrimary};
    cursor: pointer;
  }
`,ho=i=>{let{t}=g();return o.default.createElement(vo,{size:16,color:a.colors.legacy.textSecondary,lineHeight:20,textAlign:"left"},t("validatorViewValidator")," \u2022 ",o.default.createElement($,{onClick:i.onEdit},t("commandEdit")))};export{xo as a,Ro as b};
//# sourceMappingURL=chunk-TNSJV7VC.js.map
