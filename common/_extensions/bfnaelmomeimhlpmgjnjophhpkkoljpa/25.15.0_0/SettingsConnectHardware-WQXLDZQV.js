import{a as N,c as D,d as F,g as G}from"./chunk-4KJFFQYZ.js";import{a as f}from"./chunk-S2JPCUSO.js";import"./chunk-5YDSFBVN.js";import"./chunk-TPKRW5MZ.js";import"./chunk-E23MFJQO.js";import"./chunk-Q7MRFUYH.js";import{a as _}from"./chunk-UW7SGJP2.js";import"./chunk-JB6B3MIH.js";import"./chunk-QY52VKIT.js";import"./chunk-FWNN4T46.js";import"./chunk-6N4LSHMD.js";import"./chunk-RQLATSAD.js";import"./chunk-ZMMJWM5T.js";import"./chunk-TQGXB7FB.js";import"./chunk-UMB7TYLX.js";import"./chunk-5RY5S5F7.js";import"./chunk-H6OI2N7M.js";import"./chunk-TMG2ZPKO.js";import"./chunk-MDZMKEZM.js";import"./chunk-ZJHRYWCW.js";import{a as L}from"./chunk-752G45NS.js";import"./chunk-SQR6EK5U.js";import"./chunk-4HMU6WOI.js";import"./chunk-HV4BNC77.js";import"./chunk-E67GFDH7.js";import"./chunk-NXLKAZNL.js";import"./chunk-ACPUL5BT.js";import"./chunk-YN37DKRO.js";import"./chunk-R2LHCBUO.js";import"./chunk-DLKGATEC.js";import{a as u}from"./chunk-P7AH56UI.js";import"./chunk-C4LAG2JY.js";import"./chunk-ZO4HQTNS.js";import{e as O}from"./chunk-UDB3GXAG.js";import"./chunk-NUJWAPIJ.js";import"./chunk-KQPLPV6X.js";import"./chunk-HQQ2X3KD.js";import{a as S}from"./chunk-BXRBLD4H.js";import"./chunk-FOBVHFVM.js";import"./chunk-ZDSEL3RH.js";import"./chunk-PB6PA2EI.js";import"./chunk-SYHI4WMU.js";import"./chunk-RP4HT6XN.js";import"./chunk-AK42W2OZ.js";import"./chunk-WIQ6K6RU.js";import"./chunk-26VAF3RA.js";import"./chunk-NAWTYQ77.js";import"./chunk-7ZVEM3WY.js";import"./chunk-LEN5VG3M.js";import"./chunk-H7ATUB7C.js";import{q as T}from"./chunk-7N5UY74L.js";import{f as s}from"./chunk-ORJUPAX4.js";import"./chunk-ZTXKK5SN.js";import"./chunk-UCBZOSRF.js";import"./chunk-HIWDTKJJ.js";import"./chunk-3XC45JK7.js";import"./chunk-G7OTLN34.js";import"./chunk-GDBECYVT.js";import"./chunk-US2EC2AF.js";import"./chunk-JOA3PMVO.js";import"./chunk-MWXM4F4N.js";import"./chunk-7F2GBYX5.js";import"./chunk-7XSNALQR.js";import"./chunk-HYOCMEEG.js";import"./chunk-LTDRBNZN.js";import"./chunk-IBEI3NGL.js";import"./chunk-O2N6PUOM.js";import"./chunk-QY3T2P2H.js";import"./chunk-DZ3GQOT6.js";import"./chunk-EIQDOUTB.js";import"./chunk-WFPABEAU.js";import"./chunk-3IV4Y5QP.js";import"./chunk-XJI624TH.js";import"./chunk-NEKSPHVV.js";import"./chunk-O3RSUGZX.js";import"./chunk-65FAE5DM.js";import"./chunk-DBO6DP4Z.js";import"./chunk-5W7YPRT3.js";import{fd as B,md as E}from"./chunk-D7Z6MPRS.js";import"./chunk-NZAWO25Q.js";import"./chunk-E2H5RB2U.js";import"./chunk-CWJVYWRL.js";import{C as P,D as $,s as e}from"./chunk-27TD4NX4.js";import"./chunk-YJV3X2ON.js";import"./chunk-FBDT5S2M.js";import{f as v}from"./chunk-TKSJVOQZ.js";import{a as H}from"./chunk-UA6ADLWZ.js";import"./chunk-TVMPABNZ.js";import"./chunk-4M6V6BRQ.js";import"./chunk-UNDMYLJW.js";import{f as A,h as n,n as i}from"./chunk-3KENBVE7.js";n();i();var t=A(H());n();i();var a=A(H());n();i();var I=s(u)`
  cursor: pointer;
  width: 24px;
  height: 24px;
  transition: background-color 200ms ease;
  background-color: ${o=>o.$isExpanded?e.colors.legacy.black:e.colors.legacy.bgButton} !important;
  :hover {
    background-color: ${e.colors.legacy.gray};
    svg {
      fill: white;
    }
  }
  svg {
    fill: ${o=>o.$isExpanded?"white":e.colors.legacy.textSecondary};
    transition: fill 200ms ease;
    position: relative;
    ${o=>o.top?`top: ${o.top}px;`:""}
    ${o=>o.right?`right: ${o.right}px;`:""}
  }
`;var V=s(L).attrs({justify:"space-between"})`
  background-color: ${e.colors.legacy.bgWallet};
  padding: 10px 16px;
  border-bottom: 1px solid ${e.colors.legacy.borderSecondary};
  height: 46px;
  opacity: ${o=>o.opacity??"1"};
`,q=s.div`
  display: flex;
  margin-left: 10px;
  > * {
    margin-right: 10px;
  }
`,M=s.div`
  width: 24px;
  height: 24px;
`,W=({onBackClick:o,totalSteps:c,currentStepIndex:l,isHidden:d,showBackButtonOnFirstStep:r,showBackButton:g=!0})=>a.default.createElement(V,{opacity:d?0:1},g&&(r||l!==0)?a.default.createElement(I,{right:1,onClick:o},a.default.createElement(T,null)):a.default.createElement(M,null),a.default.createElement(q,null,v(c).map(p=>{let m=p<=l?e.colors.legacy.accentPrimary:e.colors.legacy.bgButton;return a.default.createElement(u,{key:p,diameter:12,color:m})})),a.default.createElement(M,null));n();i();var K=()=>{let{mutateAsync:o}=E(),{hardwareStepStack:c,pushStep:l,popStep:d,currentStep:r,setOnConnectHardwareAccounts:g,setOnConnectHardwareDone:y,setExistingAccounts:p}=N(),{data:m=[],isFetched:x,isError:k}=B(),C=O(c,(h,U)=>h?.length===U.length),X=c.length>(C??[]).length,b=C?.length===0,j={initial:{x:b?0:X?150:-150,opacity:b?1:0},animate:{x:0,opacity:1},exit:{opacity:0},transition:{duration:.2}},J=(0,t.useCallback)(()=>{r()?.props.preventBack||(r()?.props.onBackCallback&&r()?.props.onBackCallback?.(),d())},[r,d]);return _(()=>{g(async h=>{await o(h),await S.set(f,!await S.get(f))}),y(()=>self.close()),l(t.default.createElement(G,null))},c.length===0),(0,t.useEffect)(()=>{p({data:m,isFetched:x,isError:k})},[m,x,k,p]),t.default.createElement(D,null,t.default.createElement(W,{totalSteps:3,onBackClick:J,showBackButton:!r()?.props.preventBack,currentStepIndex:c.length-1}),t.default.createElement($,{mode:"wait"},t.default.createElement(P.div,{style:{display:"flex",flexGrow:1},key:`${c.length}_${C?.length}`,...j},t.default.createElement(F,null,r()))))},Po=K;export{Po as default};
//# sourceMappingURL=SettingsConnectHardware-WQXLDZQV.js.map
