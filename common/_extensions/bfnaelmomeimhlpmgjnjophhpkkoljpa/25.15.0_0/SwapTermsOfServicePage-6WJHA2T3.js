import{W as g}from"./chunk-QY52VKIT.js";import"./chunk-FWNN4T46.js";import"./chunk-6N4LSHMD.js";import"./chunk-RQLATSAD.js";import"./chunk-ZMMJWM5T.js";import"./chunk-TQGXB7FB.js";import"./chunk-UMB7TYLX.js";import"./chunk-5RY5S5F7.js";import"./chunk-H6OI2N7M.js";import"./chunk-TMG2ZPKO.js";import"./chunk-MDZMKEZM.js";import"./chunk-ZJHRYWCW.js";import"./chunk-752G45NS.js";import"./chunk-SQR6EK5U.js";import"./chunk-4HMU6WOI.js";import"./chunk-HV4BNC77.js";import"./chunk-E67GFDH7.js";import"./chunk-NXLKAZNL.js";import"./chunk-ACPUL5BT.js";import"./chunk-YN37DKRO.js";import"./chunk-R2LHCBUO.js";import"./chunk-DLKGATEC.js";import"./chunk-P7AH56UI.js";import"./chunk-C4LAG2JY.js";import"./chunk-ZO4HQTNS.js";import"./chunk-UDB3GXAG.js";import"./chunk-NUJWAPIJ.js";import"./chunk-KQPLPV6X.js";import"./chunk-FOBVHFVM.js";import"./chunk-ZDSEL3RH.js";import"./chunk-PB6PA2EI.js";import"./chunk-RP4HT6XN.js";import{a as w}from"./chunk-AK42W2OZ.js";import"./chunk-WIQ6K6RU.js";import"./chunk-26VAF3RA.js";import"./chunk-NAWTYQ77.js";import"./chunk-7ZVEM3WY.js";import"./chunk-LEN5VG3M.js";import{d as T}from"./chunk-H7ATUB7C.js";import{da as u,db as a}from"./chunk-7N5UY74L.js";import{f as o}from"./chunk-ORJUPAX4.js";import{Ra as S,ob as y}from"./chunk-ZTXKK5SN.js";import"./chunk-UCBZOSRF.js";import"./chunk-HIWDTKJJ.js";import"./chunk-3XC45JK7.js";import"./chunk-G7OTLN34.js";import"./chunk-GDBECYVT.js";import"./chunk-US2EC2AF.js";import"./chunk-JOA3PMVO.js";import"./chunk-MWXM4F4N.js";import"./chunk-7F2GBYX5.js";import"./chunk-7XSNALQR.js";import"./chunk-HYOCMEEG.js";import"./chunk-LTDRBNZN.js";import"./chunk-IBEI3NGL.js";import"./chunk-O2N6PUOM.js";import"./chunk-QY3T2P2H.js";import"./chunk-DZ3GQOT6.js";import"./chunk-EIQDOUTB.js";import"./chunk-WFPABEAU.js";import"./chunk-3IV4Y5QP.js";import"./chunk-XJI624TH.js";import"./chunk-NEKSPHVV.js";import"./chunk-O3RSUGZX.js";import"./chunk-65FAE5DM.js";import"./chunk-DBO6DP4Z.js";import"./chunk-5W7YPRT3.js";import"./chunk-D7Z6MPRS.js";import"./chunk-NZAWO25Q.js";import"./chunk-E2H5RB2U.js";import"./chunk-CWJVYWRL.js";import{j as f,s as i}from"./chunk-27TD4NX4.js";import"./chunk-YJV3X2ON.js";import"./chunk-FBDT5S2M.js";import"./chunk-TKSJVOQZ.js";import{a as x,t as p,u as d}from"./chunk-UA6ADLWZ.js";import"./chunk-TVMPABNZ.js";import"./chunk-4M6V6BRQ.js";import"./chunk-UNDMYLJW.js";import{f as C,h as l,n as m}from"./chunk-3KENBVE7.js";l();m();var e=C(x());var O=o.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  height: 100%;
  width: 100%;
  overflow-y: scroll;
  padding: 16px;
`,k=o.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: -20px;
`,h=o(a).attrs({size:28,weight:500,color:i.colors.legacy.textPrimary})`
  margin-top: 24px;
`,P=o(a).attrs({size:16,weight:500,color:i.colors.legacy.textSecondary})`
  padding: 0px 5px;
  margin-top: 9px;
  span {
    color: ${i.colors.legacy.textPrimary};
  }
  label {
    color: ${i.colors.legacy.accentPrimary};
    cursor: pointer;
  }
`,b=o.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: fit-content;
`,A=o.div`
  margin-top: auto;
  width: 100%;
`,B=()=>{let{t:n}=f(),{mutateAsync:t}=y(),{handleHideModalVisibility:r,handleShowModalVisibility:s}=g(),v=(0,e.useCallback)(()=>{s("swapConfirmation",void 0,{event:"showSwapModal",payload:{data:{uiContext:"SwapConfirmation"}}}),r("swapTermsOfService")},[s,r]),c=S({goToConfirmation:v});return{onAgreeClick:(0,e.useCallback)(()=>{t(!0),c()},[t,c]),onCancelClick:()=>{r("swapTermsOfService")},t:n}},M=()=>{self.open(p,"_blank")},F=()=>{self.open(d,"_blank")},L=e.default.memo(({onAgreeClick:n,onCancelClick:t,t:r})=>e.default.createElement(O,null,e.default.createElement(k,null,e.default.createElement(b,null,e.default.createElement(u,null),e.default.createElement(h,null,r("termsOfServicePrimaryText")),e.default.createElement(P,null,e.default.createElement(w,{i18nKey:"termsOfServiceDiscliamerFeesEnabledInterpolated"},"We have revised our Terms of Service. By clicking ",e.default.createElement("span",null,'"I Agree"')," you agree to our new",e.default.createElement("label",{onClick:M},"Terms of Service"),".",e.default.createElement("br",null),e.default.createElement("br",null),"Our new Terms of Service include a new ",e.default.createElement("label",{onClick:F},"fee structure")," for certain products.")))),e.default.createElement(A,null,e.default.createElement(T,{primaryText:r("termsOfServiceActionButtonAgree"),secondaryText:r("commandCancel"),onPrimaryClicked:n,onSecondaryClicked:t})))),_=()=>{let n=B();return e.default.createElement(L,{...n})},X=_;export{_ as SwapTermsOfServicePage,X as default};
//# sourceMappingURL=SwapTermsOfServicePage-6WJHA2T3.js.map
