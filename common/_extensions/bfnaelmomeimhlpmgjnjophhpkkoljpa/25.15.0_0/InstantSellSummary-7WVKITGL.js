import{a as He}from"./chunk-5YDSFBVN.js";import{a as fo,b as Co}from"./chunk-ZDNYM3HY.js";import{a as Oe}from"./chunk-YQDBMSRB.js";import{W as Ge}from"./chunk-QY52VKIT.js";import"./chunk-FWNN4T46.js";import"./chunk-6N4LSHMD.js";import"./chunk-RQLATSAD.js";import"./chunk-ZMMJWM5T.js";import"./chunk-TQGXB7FB.js";import"./chunk-UMB7TYLX.js";import"./chunk-5RY5S5F7.js";import"./chunk-H6OI2N7M.js";import"./chunk-TMG2ZPKO.js";import"./chunk-MDZMKEZM.js";import{a as So}from"./chunk-ZJHRYWCW.js";import{a as h}from"./chunk-752G45NS.js";import{a as We,e as je}from"./chunk-SQR6EK5U.js";import{e as Ve,f as ze,g as Ue}from"./chunk-4HMU6WOI.js";import"./chunk-HV4BNC77.js";import"./chunk-E67GFDH7.js";import"./chunk-NXLKAZNL.js";import"./chunk-ACPUL5BT.js";import"./chunk-YN37DKRO.js";import{a as u}from"./chunk-R2LHCBUO.js";import"./chunk-DLKGATEC.js";import"./chunk-P7AH56UI.js";import"./chunk-C4LAG2JY.js";import"./chunk-ZO4HQTNS.js";import"./chunk-UDB3GXAG.js";import"./chunk-NUJWAPIJ.js";import"./chunk-KQPLPV6X.js";import"./chunk-FOBVHFVM.js";import"./chunk-ZDSEL3RH.js";import"./chunk-PB6PA2EI.js";import"./chunk-RP4HT6XN.js";import"./chunk-AK42W2OZ.js";import"./chunk-WIQ6K6RU.js";import"./chunk-26VAF3RA.js";import"./chunk-NAWTYQ77.js";import"./chunk-7ZVEM3WY.js";import"./chunk-LEN5VG3M.js";import{a as bo,c as Ne,d as yo}from"./chunk-H7ATUB7C.js";import{c as Be,db as d}from"./chunk-7N5UY74L.js";import{f as i}from"./chunk-ORJUPAX4.js";import"./chunk-ZTXKK5SN.js";import"./chunk-UCBZOSRF.js";import"./chunk-HIWDTKJJ.js";import"./chunk-3XC45JK7.js";import{J as ao,K as ee,L as Me,M as De,N as co,O as po,Q as mo,R as uo,a as $e,g as no,h as so}from"./chunk-G7OTLN34.js";import"./chunk-GDBECYVT.js";import{ba as go}from"./chunk-US2EC2AF.js";import"./chunk-JOA3PMVO.js";import"./chunk-MWXM4F4N.js";import{c as M}from"./chunk-7F2GBYX5.js";import"./chunk-7XSNALQR.js";import"./chunk-HYOCMEEG.js";import"./chunk-LTDRBNZN.js";import"./chunk-IBEI3NGL.js";import"./chunk-O2N6PUOM.js";import"./chunk-QY3T2P2H.js";import"./chunk-DZ3GQOT6.js";import{Ed as io,Sb as Ae,od as ro,tc as Le}from"./chunk-EIQDOUTB.js";import"./chunk-WFPABEAU.js";import"./chunk-3IV4Y5QP.js";import"./chunk-XJI624TH.js";import"./chunk-NEKSPHVV.js";import{U as Pe,j as Ie}from"./chunk-O3RSUGZX.js";import"./chunk-65FAE5DM.js";import"./chunk-DBO6DP4Z.js";import"./chunk-5W7YPRT3.js";import{Vd as eo,Ya as Re}from"./chunk-D7Z6MPRS.js";import"./chunk-NZAWO25Q.js";import"./chunk-E2H5RB2U.js";import"./chunk-CWJVYWRL.js";import{C as oo,H as to,I as lo,j as Ee,s as l}from"./chunk-27TD4NX4.js";import"./chunk-YJV3X2ON.js";import"./chunk-FBDT5S2M.js";import{Q as ve,a as q,ea as P}from"./chunk-TKSJVOQZ.js";import{a as ke}from"./chunk-UA6ADLWZ.js";import"./chunk-TVMPABNZ.js";import"./chunk-4M6V6BRQ.js";import"./chunk-UNDMYLJW.js";import{f as we,h as V,n as z}from"./chunk-3KENBVE7.js";V();z();var e=we(ke());V();z();var b=we(ke());var $o=i(oo.img)`
  width: 44px;
  height: 44px;
  border-radius: 4px;
  object-fit: cover;
  margin-right: 12px;
`,Mo=i.div`
  width: 44px;
  height: 44px;
  border-radius: 4px;
  background-color: ${l.colors.legacy.bgRow};
  margin-right: 12px;
`,ho=({src:o,alt:r,mediaType:t})=>{let[n,c]=(0,b.useState)(!1),[p,a]=(0,b.useState)(!1),f={hidden:{opacity:0,display:"none"},visible:{opacity:1,display:"block"}},T=()=>{a(!0)},A=()=>{c(!0)};return n?b.default.createElement(Mo,null,b.default.createElement(fo,null,b.default.createElement(Co,{type:t}))):b.default.createElement(b.Fragment,null,b.default.createElement($o,{src:o,alt:r,onError:A,onLoad:T,variants:f,animate:p?"visible":"hidden"}),p?null:b.default.createElement(So,{aspectRatio:1,width:"44px",height:"44px",backgroundColor:l.colors.legacy.borderSecondary,borderRadius:"4px",margin:"0 12px 0 0"}))};V();z();var U=we(ke()),Do=(o,r,t)=>Math.abs((o-r)/o)*100<=t,To=({from:o,to:r,currencySymbol:t})=>{let n=(0,U.useRef)(null),c=lo(n,{once:!0});return(0,U.useEffect)(()=>{if(!c||!n||!r)return;let p=to(o,r,{duration:.4,delay:.2,ease:"easeOut",onUpdate(a){n.current&&(n.current.textContent=Do(a,r,2.5)?a===r?`${a} ${t}`:`${a.toFixed(5)} ${t}`:`${Math.trunc(a)} ${t}`)}});return()=>p.stop()},[c,o,r,t]),U.default.createElement("p",{style:{color:l.colors.legacy.accentSuccess,fontSize:"28px",minHeight:"41px",fontWeight:500,lineHeight:"41px"},ref:n})};var Bo=i(u)`
  overflow-y: scroll;
  padding-bottom: 50px;
`,No=i(u)`
  margin-bottom: 24px;
`,Fo=i.div`
  box-shadow: 0px -4px 6px rgba(0, 0, 0, 0.2);
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 14px;
  display: flex;
  width: 100%;
  background-color: ${l.colors.legacy.bgWallet};
  border: 1px solid ${l.colors.legacy.borderSecondary};
`,wo=i(yo)`
  box-shadow: 0px -4px 6px rgba(0, 0, 0, 0.2);
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 14px;
  background-color: ${l.colors.legacy.bgWallet};
  border: 1px solid ${l.colors.legacy.borderSecondary};
`,Vo=i(u)`
  margin-bottom: 10px;
  padding: 14px;
  border-radius: 6px;
  background-color: ${l.colors.legacy.bgRow};
`,zo=i(h)`
  margin-bottom: 14px;
`,Uo=i(u)`
  gap: 6px;
`,qe=i.div`
  width: calc(100% + 28px);
  height: 1px;
  position: relative;
  left: -14px;
  right: -14px;
  background-color: ${l.colors.legacy.bgWallet};
`,Wo=i(u)`
  gap: 4px;
  margin-top: 12px;
`,jo=i(h)`
  justify-content: space-between;
`,Ho=i(u)`
  border-radius: 6px;
  margin-bottom: 10px;
  padding: 14px 14px 10px 14px;
  background-color: ${l.colors.legacy.bgRow};
`,Oo=i.img`
  width: 16px;
  height: 16px;
  object-fit: cover;
  border-radius: 50%;
  margin-right: 4px;
`,Go=i(u)`
  border-radius: 6px;
  padding: 14px 14px 10px 14px;
  background-color: ${l.colors.legacy.bgRow};
`,Ke=i(u)`
  position: relative;
  height: 100%;
  align-items: center;
  justify-content: space-between;
`,Ye=i(u).attrs({align:"center",justify:"center"})`
  height: 100%;
  position: relative;
  padding-bottom: 50px;
`,_e=i(d).attrs({size:22,weight:700,color:l.colors.legacy.textPrimary,margin:"0 0 8px 0"})``,oe=i(d).attrs({size:15,weight:400,color:l.colors.legacy.textPrimary})``,Je=i(d).attrs({size:15,weight:400,color:l.colors.legacy.textSecondary})`
  margin: 0 3px;
`,Qe=i(u)`
  margin: 24px 0;
  align-items: center;
  justify-content: center;
`,Xe=i(h)`
  gap: 1px;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: center;
`,qo=i(u).attrs({align:"center",justify:"center",margin:"0 0 24px 0"})`
  width: 44px;
  height: 44px;
  position: relative;
  border-radius: 50%;
  background-color: ${ve(l.colors.legacy.accentPrimary,.2)};
  box-shadow: 0 0 0 20px ${ve(l.colors.legacy.accentPrimary,.2)};
`,ko=i.div`
  margin-bottom: 24px;
`,vo=i(u)`
  gap: 4px;
`,W=i(h)`
  gap: 4px;
  justify-content: space-between;
`,Eo=({collectionFloor:o,currencySymbol:r})=>{let t=o?`${P(o)} ${r}`:"-",n=o?l.colors.legacy.textPrimary:l.colors.legacy.textSecondary;return{collectionFloorFormatted:t,collectionFloorColor:n}},Io=({lastSale:o,currencySymbol:r})=>{let t=o?`${P(o)} ${r}`:"-",n=o?l.colors.legacy.textPrimary:l.colors.legacy.textSecondary;return{lastSaleFormatted:t,lastSaleColor:n}},Po=({pnl:o,gasFee:r,currencySymbol:t})=>{let n=`${P(o.minus(r))} ${t}`,c=o.isGreaterThan(0)?l.colors.legacy.accentSuccess:o.isLessThan(0)?l.colors.legacy.accentAlert:l.colors.legacy.textSecondary;return{pnlFormatted:n,pnlColor:c}},Ao=(o,r,t,n)=>r.map(c=>{let p=ao(c.bps);return{label:c.kind==="royalty"?o("collectiblesSellEstimatedRoyaltiesFeesTooltipTitle",{royaltiesPercentage:p}):o("collectiblesSellEstimatedMarketplaceFeesTooltipTitle",{marketplaceFeePercentage:p}),value:`${P(ee(c.bps,t))} ${n}`}}),Ko=e.default.memo(({collectible:o,bidSummary:r})=>{let{t}=Ee(),n=Be(),[c,p]=(0,e.useState)(!1),{handleHideModalVisibility:a}=Ge(),{sellSteps:f,refetchSellSteps:T,sellStepsError:A,isSellErrorCode:k,isLoadingSellSteps:v}=Me({collectible:o}),{fungible:L}=ro({key:io(r.collectibleChainId,void 0)}),y=Le({query:{data:r.caip19}}).data?.price,F=co(r.marketplace,r.collectibleChainId,f.steps,L?.data?.balance),{reset:D,status:$,isLedger:E,executeSellEvmSteps:w,result:S,error:g}=po(f.orderId,f.steps,F.gasEstimation,T,r,o,y),{data:s}=Pe(),{collectibleImage:K,collectibleChainId:j,collectibleName:te,collectionFloor:Y,collectionName:le,currencySymbol:C,lastSale:re,marketplace:ie,marketplaceLogoURL:ne,offerAmount:m,pnl:se,fees:ae,totalFeeBps:_,receiveAmount:J,receiveAmountFormatted:ce,collectibleChainSymbol:Q}=r,H=q(F?.gasEvm??0),{collectionFloorFormatted:pe,collectionFloorColor:me}=Eo({collectionFloor:Y,currencySymbol:C}),{lastSaleFormatted:de,lastSaleColor:ue}=Io({lastSale:re,currencySymbol:C}),{pnlFormatted:ge,pnlColor:be}=Po({pnl:q(se),gasFee:H,currencySymbol:C}),X=Ao(t,ae,m,C),Z=X.length>0,ye=[{label:t("collectiblesSellMarketplace"),value:ie,url:ne,color:l.colors.legacy.textPrimary},{label:t("collectiblesSellOffer"),value:`${P(m)} ${C}`,color:l.colors.legacy.textPrimary},{label:t("collectiblesSellCollectionFloor"),value:pe,color:me,tooltipContent:t("collectiblesSellCollectionFloorTooltip"),withDivider:!1}],Se=[{label:t("collectiblesSellLastSalePrice"),value:de,color:ue},{label:t("collectiblesSellEstimatedFees"),value:`${De({gasFee:H,totalFeeBps:_,offerAmount:m}).formatted} ${Q}`,withDivider:!0,color:l.colors.legacy.textPrimary,tooltipContent:e.default.createElement(vo,null,Z?X.map(({label:I,value:x})=>e.default.createElement(W,{key:I},e.default.createElement("p",null,I),e.default.createElement("p",null,x))):e.default.createElement(W,null,e.default.createElement("p",null,t("collectiblesSellEstimatedMarketplaceFeeTooltipTitle")),e.default.createElement("p",null,P(ee(_,m))," ",C)),e.default.createElement(W,null,e.default.createElement("p",null,t("collectiblesSellEstimatedChainFeesTooltipTitle",{chainName:Re.getNetworkName(j)})),e.default.createElement("p",null,t("collectiblesSellEstimatedChainFeesTooltipValue",{chainFeeValue:F?.ethFeeUI??`0 ${Q}}`}))))},{label:t("collectiblesSellEstimatedProfitAndLoss"),value:ge,color:be,tooltipContent:t("collectiblesSellProfitLossTooltip")}],fe={sellStepsError:A,isSellErrorCode:k},Ze={hasEnoughGas:F.hasEnoughGas,executeSellError:g},Ce=Oe({t,apiErrors:fe,clientErrors:Ze}),R=o.media?.type??$e.enum.image,xe=y?`$${Ae(J,y)}`:"-",O=(0,e.useCallback)(()=>{D(),T(),p(!1)},[D,p,T]),G=()=>{p(!0),M.capture("collectibleSellAcceptClick"),!Ce&&!E&&w()},he=()=>{M.capture("collectibleSellCancelClick"),a("instantSell")},B=(0,e.useCallback)(()=>{M.capture("collectibleSellCancelClick"),a("instantSell"),n("/notifications")},[a,n]),N=()=>{if(!s||!S)return;let I=s?.explorers[j],x=Ie({param:S,explorerType:I,endpoint:"transaction",networkID:j});self.open(x)},Te=(0,e.useMemo)(()=>{let I=g?Ve(g):!1;return g&&I?e.default.createElement(Ue,{onRetryClick:O,onCancelClick:B,ledgerActionError:g}):E?e.default.createElement(ze,{ledgerApp:"EVM",ledgerAction:()=>w(),cancel:B}):null},[g,E,w,O,B]);return e.default.createElement(Lo,{t,error:Ce,status:$,ledgerUI:Te,hasAcceptedOffer:c,collectionName:le,collectibleName:te,collectibleImage:K,collectibleMediaType:R,receiveAmount:J,receiveAmountFormatted:ce,currencySymbol:C,receivedFiatValue:xe,handleCancel:he,handleClose:B,handleTxLinkClick:N,handleAccept:G,primaryRows:ye,secondaryRows:Se,handleRetry:O,isPrimaryButtonEnabled:!v})}),Yo=e.default.memo(({collectible:o,bidSummary:r})=>{let{t}=Ee(),n=Be(),[c,p]=(0,e.useState)(!1),{handleHideModalVisibility:a}=Ge(),{sellSteps:f,sellStepsError:T,isSellErrorCode:A,isLoadingSellSteps:k,refetchSellSteps:v}=Me({collectible:o}),L=Le({query:{data:r.caip19}}).data?.price,{gas:y,reset:F,status:D,isLedger:$,result:E,executeSellSolanaSteps:w,error:S}=mo(f.orderId,f.steps,r,L),g=y??q(0),{offerAmount:s,totalFeeBps:K}=r,j=De({gasFee:g,totalFeeBps:K,offerAmount:s}),{hasEnoughGas:te}=uo(r),{data:Y}=Pe(),{collectibleImage:le,collectibleChainId:C,collectibleName:re,collectionFloor:ie,collectionName:ne,currencySymbol:m,lastSale:se,marketplace:ae,marketplaceLogoURL:_,offerAmountFormatted:J,pnl:ce,fees:Q,receiveAmount:H,receiveAmountFormatted:pe}=r,{collectionFloorFormatted:me,collectionFloorColor:de}=Eo({collectionFloor:ie,currencySymbol:m}),{lastSaleFormatted:ue,lastSaleColor:ge}=Io({lastSale:se,currencySymbol:m}),{pnlFormatted:be,pnlColor:X}=Po({pnl:q(ce),gasFee:g,currencySymbol:m}),Z=Ao(t,Q,s,m),ye=Z.length>0,Se=[{label:t("collectiblesSellMarketplace"),value:ae,url:_,color:l.colors.legacy.textPrimary},{label:t("collectiblesSellOffer"),value:`${J} ${m}`,color:l.colors.legacy.textPrimary},{label:t("collectiblesSellCollectionFloor"),value:me,color:de,tooltipContent:t("collectiblesSellCollectionFloorTooltip"),withDivider:!1}],fe=[{label:t("collectiblesSellLastSalePrice"),value:ue,color:ge},{label:t("collectiblesSellEstimatedFees"),value:`${j.formatted} ${m}`,withDivider:!0,color:l.colors.legacy.textPrimary,tooltipContent:e.default.createElement(vo,null,ye?Z.map(({label:x,value:Fe})=>e.default.createElement(W,{key:x},e.default.createElement("p",null,x),e.default.createElement("p",null,Fe))):e.default.createElement(W,null,e.default.createElement("p",null,t("collectiblesSellEstimatedMarketplaceFeeTooltipTitle")),e.default.createElement("p",null,P(ee(K,s))," ",m)),e.default.createElement(W,null,e.default.createElement("p",null,t("collectiblesSellTransactionFeeTooltipTitle")),e.default.createElement("p",null,y!==void 0?`${y} ${m}`:"-")))},{label:t("collectiblesSellEstimatedProfitAndLoss"),value:be,color:X,tooltipContent:t("collectiblesSellProfitLossTooltip")}],R=Oe({t,apiErrors:{sellStepsError:T,isSellErrorCode:A},clientErrors:{hasEnoughGas:te,executeSellError:S}}),xe=o.media?.type??$e.enum.image,O=L?`$${Ae(H,L)}`:"-",G=(0,e.useCallback)(()=>{F(),v(),p(!1)},[F,p,v]),he=()=>{p(!0),M.capture("collectibleSellAcceptClick"),!R&&!$&&w()},B=()=>{M.capture("collectibleSellCancelClick"),a("instantSell")},N=(0,e.useCallback)(()=>{M.capture("collectibleSellCancelClick"),a("instantSell"),n("/notifications")},[a,n]),Te=()=>{if(!Y||!E)return;let x=Y?.explorers[C],Fe=Ie({param:E,explorerType:x,endpoint:"transaction",networkID:C});self.open(Fe)},I=(0,e.useMemo)(()=>{let x=S?Ve(S):!1;return S&&x?e.default.createElement(Ue,{onRetryClick:G,onCancelClick:N,ledgerActionError:S}):$?e.default.createElement(ze,{ledgerAction:()=>w(),cancel:N}):null},[S,$,w,G,N]);return e.default.createElement(Lo,{t,error:R,status:D,ledgerUI:I,hasAcceptedOffer:c,collectionName:ne,collectibleName:re,collectibleImage:le,collectibleMediaType:xe,receiveAmount:H,receiveAmountFormatted:pe,currencySymbol:m,receivedFiatValue:O,handleCancel:B,handleClose:N,handleTxLinkClick:Te,handleAccept:he,handleRetry:G,primaryRows:Se,secondaryRows:fe,isPrimaryButtonEnabled:!k})}),Lo=({t:o,error:r,status:t,ledgerUI:n,hasAcceptedOffer:c,collectionName:p,collectibleName:a,collectibleImage:f,collectibleMediaType:T,receiveAmount:A,receiveAmountFormatted:k,currencySymbol:v,receivedFiatValue:L,handleCancel:y,handleClose:F,handleRetry:D,handleAccept:$,handleTxLinkClick:E,primaryRows:w,secondaryRows:S,isPrimaryButtonEnabled:g})=>n&&c&&!r&&t!=="success"?e.default.createElement(e.default.Fragment,null,n):c&&r?e.default.createElement(Ke,null,e.default.createElement(Ye,null,e.default.createElement(ko,null,e.default.createElement(He,{type:"failure"})),e.default.createElement(Qe,null,e.default.createElement(_e,null,r.title),e.default.createElement(Xe,null,e.default.createElement(Je,null,r.subtitle)))),e.default.createElement(wo,{primaryText:o("commandRetry"),secondaryText:o("commandClose"),onPrimaryClicked:D,onSecondaryClicked:y,primaryTheme:"primary"})):t==="loading"?e.default.createElement(Ke,null,e.default.createElement(Ye,null,e.default.createElement(qo,null,e.default.createElement(bo,{diameter:54,color:l.colors.legacy.accentPrimaryLight,trackColor:l.colors.legacy.bgArea})),e.default.createElement(Qe,null,e.default.createElement(_e,null,o("collectiblesSellStatusLoadingTitle")),e.default.createElement(Xe,null,e.default.createElement(oe,null,a),e.default.createElement(Je,null,o("collectiblesSellStatusLoadingIsSellingFor")),e.default.createElement(oe,null,`${k} ${v}`)))),e.default.createElement(Fo,null,e.default.createElement(Ne,{onClick:y},o("commandClose")))):t==="success"?e.default.createElement(Ke,null,e.default.createElement(Ye,null,e.default.createElement(ko,null,e.default.createElement(He,{type:"success"})),e.default.createElement(Qe,null,e.default.createElement(_e,null,o("collectiblesSellStatusSuccessTitle",{collectibleName:a})),e.default.createElement(Xe,null,e.default.createElement(oe,null,a),e.default.createElement(Je,null,o("collectiblesSellStatusSuccessWasSold")),e.default.createElement(oe,null,`${k} ${v}`)),e.default.createElement(d,{size:16,weight:500,color:l.colors.legacy.accentPrimary,margin:"37px 0 0 0",onClick:E},o("collectiblesSellStatusViewTransaction")))),e.default.createElement(Fo,null,e.default.createElement(Ne,{onClick:F},o("commandClose")))):e.default.createElement(Bo,null,e.default.createElement(No,null,e.default.createElement(Vo,null,e.default.createElement(d,{color:l.colors.legacy.borderAccent,size:14,margin:"0 0 13px 0"},o("collectiblesSellYouSell")),e.default.createElement(zo,null,e.default.createElement(ho,{src:f,alt:a,mediaType:T}),e.default.createElement(Uo,null,e.default.createElement(d,{color:l.colors.legacy.textPrimary,size:16,weight:600,lineHeight:19},a??o("collectiblesUnknownCollectible")),e.default.createElement(d,{color:l.colors.legacy.textSecondary,size:14,lineHeight:17},p??o("collectiblesUnknownCollection")))),e.default.createElement(qe,null),e.default.createElement(Wo,null,e.default.createElement(jo,null,e.default.createElement(d,{color:l.colors.legacy.borderAccent,size:14},o("collectiblesSellYouReceive")),e.default.createElement(d,{color:l.colors.legacy.borderAccent,size:14},L)),e.default.createElement(To,{from:0,to:k.includes("<")?A:Number(k),currencySymbol:v}))),e.default.createElement(Ho,null,w.map(s=>e.default.createElement(e.Fragment,{key:s.label},e.default.createElement(h,{style:{justifyContent:"space-between"}},e.default.createElement(h,{style:{width:"auto",gap:"2px"}},e.default.createElement(d,{color:l.colors.legacy.borderAccent,size:14},s.label),e.default.createElement(je,{tooltipAlignment:"topLeft",iconSize:12,lineHeight:17,fontSize:14,fontWeight:500,info:s.tooltipContent?e.default.createElement(We,null,s.tooltipContent):null})),e.default.createElement(h,{style:{width:"auto"}},s.url?e.default.createElement(Oo,{src:s.url,alt:s.value}):null,e.default.createElement(d,{color:s.color,size:14,weight:500},s.value))),s?.withDivider?e.default.createElement(qe,{style:{margin:"8px 0"}}):null))),e.default.createElement(Go,null,S.map(s=>e.default.createElement(e.Fragment,{key:s.label},e.default.createElement(h,{style:{justifyContent:"space-between"}},e.default.createElement(h,{style:{width:"auto",gap:"2px"}},e.default.createElement(d,{color:l.colors.legacy.borderAccent,size:14},s.label),e.default.createElement(je,{tooltipAlignment:"topLeft",iconSize:12,lineHeight:17,fontSize:14,fontWeight:500,info:s.tooltipContent?e.default.createElement(We,null,s.tooltipContent):null})),e.default.createElement(d,{color:s.color,size:14,weight:500},s.value)),s?.withDivider?e.default.createElement(qe,{style:{margin:"8px 0"}}):null)))),e.default.createElement(wo,{primaryText:o("commandAccept"),secondaryText:o("commandCancel"),onPrimaryClicked:$,onSecondaryClicked:y,primaryDisabled:!g,primaryTheme:g?"primary":"default"})),_o=({collectible:o,bidSummary:r})=>{let t=so(o?.chainData),n=no(o?.chainData),{data:c}=eo({address:o.owner,networkID:o.chain.id});if(go(c,"INSTANT_SELL"),t)return e.default.createElement(Ko,{collectible:o,bidSummary:r});if(n)return e.default.createElement(Yo,{collectible:o,bidSummary:r});throw new Error("Unsupported collectible chain")},qt=_o;export{Ko as EvmInstantSellSummary,_o as InstantSellSummary,Yo as SolanaInstantSellSummary,qt as default};
//# sourceMappingURL=InstantSellSummary-7WVKITGL.js.map
