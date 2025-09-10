import{a as G,b as J}from"./chunk-YAO7REK7.js";import{a as sn}from"./chunk-GYMVMXJW.js";import{W as P}from"./chunk-QY52VKIT.js";import{a as F}from"./chunk-R2LHCBUO.js";import{d as $}from"./chunk-H7ATUB7C.js";import{P as j,db as q}from"./chunk-7N5UY74L.js";import{f as y}from"./chunk-ORJUPAX4.js";import{e as L,f as B,g as U,h as z,i as E}from"./chunk-ZTXKK5SN.js";import{c as C}from"./chunk-7F2GBYX5.js";import{dd as H,vd as V,wd as N}from"./chunk-D7Z6MPRS.js";import{C as f,D as Z,j as v,s as b,x as g}from"./chunk-27TD4NX4.js";import{L as A}from"./chunk-YJV3X2ON.js";import{a as S}from"./chunk-UA6ADLWZ.js";import{f as x,h as c,n as l}from"./chunk-3KENBVE7.js";c();l();var a=x(S()),O=x(sn());c();l();var r=x(S());c();l();var p=new L(C);var cn=y(f.button)`
  background-color: ${b.colors.legacy.bgRow};
  &:hover {
    background-color: ${b.colors.legacy.bgButton};
  }
  border: none;
  appearance: none;
  transition: background-color 0.2s ease-in-out;
  border-radius: 16px;
  cursor: pointer;
  height: 100%;
  padding: 10px 12px;
  width: 100%;
`,ln=y(f.div)`
  align-items: center;
  display: flex;
`,mn=y.img`
  margin-right: 12px;
  width: 44px;
`,pn=y(q).attrs({lineHeight:17,size:14})`
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  display: -webkit-box;
  flex: 1;
  overflow: hidden;
  text-align: left;
`,dn=y.div`
  position: relative;
  top: -15px;
  right: -3px;
  background-color: ${b.colors.legacy.bgButton};
  border-radius: 50%;
  display: flex;
  height: 20px;
  justify-content: center;
  width: 20px;
`,un=({banner:n})=>{let{t:o}=v(),t=G(),{mutateAsync:i}=E(),{handleShowModalVisibility:s,handleHideModalVisibility:m}=P(),d=(0,r.useCallback)(u=>{let T=B(n);switch(p.onBannerClick(T),n.bannerType){case"Deep Link":{let{destinationType:I,url:w,caip19:D}=n;t(u,{destinationType:I,url:w,caip19:D});break}case"Modal":{let{interstitial:I,destinationType:w,url:D}=n,{title:nn,lineItems:on=[],imageUrl:en,primaryButtonText:tn=o("commandContinue"),secondaryButtonText:rn=o("commandDismiss")}=I,k=U(n),an=on.map(M=>({icon:M.imageUrl,subtitle:M.description,title:M.title}));s("interstitial",{bodyTitle:nn,details:an,icon:en,onDismiss:()=>{p.onInterstitialDismiss(k)},FooterComponent:()=>r.default.createElement($,{primaryText:tn,secondaryText:rn,onPrimaryClicked:()=>{t(u,{destinationType:w,url:D}),p.onInterstitialPrimaryClick(k),m("interstitial")},onSecondaryClicked:()=>{p.onInterstitialSecondaryClick(k),m("interstitial")}})}),p.onInterstitialSeen(k);break}}},[n,s,m,o,t]),h=(0,r.useCallback)(u=>{u.stopPropagation(),i({actionBannerId:n.id});let T=B(n);p.onBannerDismiss(T)},[n,i]);return(0,r.useMemo)(()=>({banner:n,onClickBanner:d,onCloseBanner:h}),[n,d,h])},gn=r.default.memo(({banner:n,onClickBanner:o,onCloseBanner:t})=>r.default.createElement(cn,{layout:!0,onClick:o},r.default.createElement(ln,{layout:!0},r.default.createElement(mn,{src:n.imageUrl}),r.default.createElement(pn,{weight:600},n.description),r.default.createElement(dn,{onClick:t},r.default.createElement(j,{fill:b.colors.legacy.textPrimary,width:8}))))),K=n=>{let o=un(n);return r.default.createElement(gn,{...o})};var yn=()=>{let{data:n={banners:[]}}=z(),{data:o}=V(),{banners:t}=n,i=(0,O.default)(o),s=(0,a.useCallback)(d=>{if(!o||i!==o)return;let h=t[d],u=B(h);p.onBannerSeen(u)},[t,o,i]),m=(0,a.useMemo)(()=>t.map(d=>({key:d.id,node:a.default.createElement(K,{banner:d})})),[t]);return(0,a.useMemo)(()=>({identifier:o??"",items:m,itemHeight:74,onIndexChange:s}),[m,o,s])},Bn=a.default.memo(({identifier:n,items:o,onIndexChange:t,itemHeight:i})=>a.default.createElement(J,{items:o,onIndexChange:t,key:n,itemHeight:i})),bn=()=>{let n=yn();return a.default.createElement(Bn,{...n})},Qn=()=>{let{data:[n]}=A(["kill-action-banners"]);return n?null:a.default.createElement(bn,null)};c();l();var e=x(S());c();l();var Q={bannersStack:"_51gazn1kj _51gazn1nq _51gazn1c8 _51gaznkx _51gazng7 _51gaznhz",bannersStackHeading:"_51gazno _51gazn42s",banner:"_1lb45bv2",bannerTitle:"_51gazn15 _51gazn437 _51gazn7",bannerDescription:"_51gaznv _51gazn42s _51gaznel _51gazn1c7",bannerImage:"_51gazn1b9 _51gazn1cv"};var Go=()=>{let{data:n}=N(),{data:o}=H(n?.identifier),t=o?.value===0,{data:[i]}=A(["enable-zero-balance-nux"]),{data:s}=z();return s&&s.banners.length>0||i?null:e.default.createElement(Z,null,t&&e.default.createElement(f.div,{key:"zero-balance-banners",initial:{opacity:0,height:0},animate:{opacity:1,height:"auto"},style:{width:"100%"}},e.default.createElement(fn,null)))},fn=()=>{let{t:n}=v(),{handleShowModalVisibility:o,handleHideModalVisibility:t}=P(),{data:i}=N(),s=(0,e.useCallback)(()=>{C.capture("zeroBalanceBannerBuyCryptoClickedByUser"),o("onramp")},[o]),m=(0,e.useCallback)(()=>{C.capture("zeroBalanceBannerDepositCryptoClickedByUser"),i&&o("receive",{account:i,onCloseClick:()=>t("receive")})},[t,o,i]);return e.default.createElement("div",{className:Cn},e.default.createElement(g,{className:hn,children:n("zeroBalanceHeading")}),e.default.createElement("div",{className:W,onClick:s},e.default.createElement(F,null,e.default.createElement(g,{className:X,color:"textSecondary",children:n("zeroBalanceBuyCryptoTitle")}),e.default.createElement(g,{className:Y,children:n("zeroBalanceBuyCryptoDescription")})),e.default.createElement("img",{className:R,src:"/images/zero-balance/buy-crypto.svg"})),e.default.createElement("div",{className:W,onClick:m},e.default.createElement(F,null,e.default.createElement(g,{className:X,color:"textSecondary",children:n("zeroBalanceDepositTitle")}),e.default.createElement(g,{className:Y,children:n("zeroBalanceDepositDescription")})),e.default.createElement("img",{className:R,src:"/images/zero-balance/transfer-crypto.svg"})))},{bannersStack:Cn,bannersStackHeading:hn,banner:W,bannerTitle:X,bannerDescription:Y,bannerImage:R}=Q;export{Qn as a,Go as b};
//# sourceMappingURL=chunk-EGRGBQB7.js.map
