import{a as s,c as f}from"./chunk-MNWUE4AR.js";import{a as T}from"./chunk-5YDSFBVN.js";import{O as I,W as b}from"./chunk-QY52VKIT.js";import"./chunk-FWNN4T46.js";import"./chunk-6N4LSHMD.js";import"./chunk-RQLATSAD.js";import"./chunk-ZMMJWM5T.js";import"./chunk-TQGXB7FB.js";import"./chunk-UMB7TYLX.js";import"./chunk-5RY5S5F7.js";import"./chunk-H6OI2N7M.js";import"./chunk-TMG2ZPKO.js";import"./chunk-MDZMKEZM.js";import"./chunk-ZJHRYWCW.js";import"./chunk-752G45NS.js";import"./chunk-SQR6EK5U.js";import"./chunk-4HMU6WOI.js";import"./chunk-HV4BNC77.js";import"./chunk-E67GFDH7.js";import"./chunk-NXLKAZNL.js";import"./chunk-ACPUL5BT.js";import"./chunk-YN37DKRO.js";import"./chunk-R2LHCBUO.js";import"./chunk-DLKGATEC.js";import"./chunk-P7AH56UI.js";import"./chunk-C4LAG2JY.js";import"./chunk-ZO4HQTNS.js";import"./chunk-UDB3GXAG.js";import"./chunk-NUJWAPIJ.js";import"./chunk-KQPLPV6X.js";import"./chunk-FOBVHFVM.js";import"./chunk-ZDSEL3RH.js";import"./chunk-PB6PA2EI.js";import"./chunk-RP4HT6XN.js";import"./chunk-AK42W2OZ.js";import"./chunk-WIQ6K6RU.js";import"./chunk-26VAF3RA.js";import"./chunk-NAWTYQ77.js";import"./chunk-7ZVEM3WY.js";import"./chunk-LEN5VG3M.js";import{c as C,d as h}from"./chunk-H7ATUB7C.js";import{db as l}from"./chunk-7N5UY74L.js";import{f as o}from"./chunk-ORJUPAX4.js";import"./chunk-ZTXKK5SN.js";import"./chunk-UCBZOSRF.js";import"./chunk-HIWDTKJJ.js";import"./chunk-3XC45JK7.js";import"./chunk-G7OTLN34.js";import"./chunk-GDBECYVT.js";import"./chunk-US2EC2AF.js";import"./chunk-JOA3PMVO.js";import"./chunk-MWXM4F4N.js";import"./chunk-7F2GBYX5.js";import"./chunk-7XSNALQR.js";import"./chunk-HYOCMEEG.js";import"./chunk-LTDRBNZN.js";import"./chunk-IBEI3NGL.js";import"./chunk-O2N6PUOM.js";import"./chunk-QY3T2P2H.js";import"./chunk-DZ3GQOT6.js";import"./chunk-EIQDOUTB.js";import"./chunk-WFPABEAU.js";import"./chunk-3IV4Y5QP.js";import"./chunk-XJI624TH.js";import"./chunk-NEKSPHVV.js";import"./chunk-O3RSUGZX.js";import"./chunk-65FAE5DM.js";import"./chunk-DBO6DP4Z.js";import"./chunk-5W7YPRT3.js";import{Ya as c,eb as y,tb as x}from"./chunk-D7Z6MPRS.js";import"./chunk-NZAWO25Q.js";import"./chunk-E2H5RB2U.js";import"./chunk-CWJVYWRL.js";import{j as g,s as a,w as B}from"./chunk-27TD4NX4.js";import"./chunk-YJV3X2ON.js";import"./chunk-FBDT5S2M.js";import"./chunk-TKSJVOQZ.js";import{a as M}from"./chunk-UA6ADLWZ.js";import"./chunk-TVMPABNZ.js";import"./chunk-4M6V6BRQ.js";import"./chunk-UNDMYLJW.js";import{f as v,h as u,n as d}from"./chunk-3KENBVE7.js";u();d();var n=v(M());var P=o.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: scroll;
`,D=o.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 90px;
`,S=o(l).attrs({size:28,weight:500,color:a.colors.legacy.textPrimary})`
  margin: 16px;
`,V=o(l).attrs({size:14,weight:400,lineHeight:17,color:a.colors.legacy.textSecondary})`
  max-width: 275px;

  span {
    color: white;
  }
`,$=({networkId:t,token:r})=>{let{t:i}=g(),{handleHideModalVisibility:m}=b(),p=(0,n.useCallback)(()=>{m("insufficientBalance")},[m]),w=t&&y(x(c.getChainID(t))),{canBuy:k,openBuy:F}=I({caip19:w||"",context:"modal",analyticsEvent:"fiatOnrampFromInsufficientBalance"}),e=t?c.getTokenSymbol(t):i("tokens");return n.default.createElement(P,null,n.default.createElement("div",null,n.default.createElement(D,null,n.default.createElement(T,{type:"failure",backgroundWidth:75}),n.default.createElement(S,null,i("insufficientBalancePrimaryText",{tokenSymbol:e})),n.default.createElement(V,null,i("insufficientBalanceSecondaryText",{tokenSymbol:e})),r?n.default.createElement(B,{borderRadius:8,gap:1,marginTop:32,width:"100%"},n.default.createElement(s,{label:i("insufficientBalanceRemaining")},n.default.createElement(f,{color:a.colors.legacy.accentAlert},`${r.balance} ${e}`)),n.default.createElement(s,{label:i("insufficientBalanceRequired")},n.default.createElement(f,null,`${r.required} ${e}`))):null)),k?n.default.createElement(h,{primaryText:i("buyAssetInterpolated",{tokenSymbol:e}),onPrimaryClicked:F,secondaryText:i("commandCancel"),onSecondaryClicked:p}):n.default.createElement(C,{onClick:p},i("commandCancel")))},L=$;export{$ as InsufficientBalance,L as default};
//# sourceMappingURL=InsufficientBalance-L62VLVDT.js.map
