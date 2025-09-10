import{a as A}from"./chunk-ZJHRYWCW.js";import{a as B}from"./chunk-752G45NS.js";import{g as me}from"./chunk-YN37DKRO.js";import{a as O}from"./chunk-R2LHCBUO.js";import{c as se}from"./chunk-ZO4HQTNS.js";import{a as pe}from"./chunk-H7ATUB7C.js";import{db as F,ma as ue,r as ce}from"./chunk-7N5UY74L.js";import{b as le,f as o}from"./chunk-ORJUPAX4.js";import{a as K,b as j}from"./chunk-EIQDOUTB.js";import{Cb as ne}from"./chunk-D7Z6MPRS.js";import{j as N,qa as ae,s}from"./chunk-27TD4NX4.js";import{T as oe,U as ie,e as G,l as re}from"./chunk-TKSJVOQZ.js";import{a as S}from"./chunk-UA6ADLWZ.js";import{c as k,f as _,g as $,h as i,i as f,n}from"./chunk-3KENBVE7.js";var de=k(U=>{"use strict";i();n();Object.defineProperty(U,"__esModule",{value:!0});var Ue=S(),Re=function(e){Ue.useEffect(e,[])};U.default=Re});var ge=k(R=>{"use strict";i();n();Object.defineProperty(R,"__esModule",{value:!0});var Ve=(j(),$(K)),Xe=S(),Je=Ve.__importDefault(de()),Ye=function(e){var r=Xe.useRef(e);r.current=e,Je.default(function(){return function(){return r.current()}})};R.default=Ye});var he=k(X=>{"use strict";i();n();Object.defineProperty(X,"__esModule",{value:!0});var Ze=(j(),$(K)),V=S(),et=Ze.__importDefault(ge()),tt=function(e){var r=V.useRef(0),a=V.useState(e),m=a[0],l=a[1],b=V.useCallback(function(c){cancelAnimationFrame(r.current),r.current=requestAnimationFrame(function(){l(c)})},[]);return et.default(function(){cancelAnimationFrame(r.current)}),[m,b]};X.default=tt});var ye=k(x=>{"use strict";i();n();Object.defineProperty(x,"__esModule",{value:!0});x.isNavigator=x.isBrowser=x.off=x.on=x.noop=void 0;var rt=function(){};x.noop=rt;function ot(e){for(var r=[],a=1;a<arguments.length;a++)r[a-1]=arguments[a];e&&e.addEventListener&&e.addEventListener.apply(e,r)}x.on=ot;function it(e){for(var r=[],a=1;a<arguments.length;a++)r[a-1]=arguments[a];e&&e.removeEventListener&&e.removeEventListener.apply(e,r)}x.off=it;x.isBrowser=typeof self<"u";x.isNavigator=typeof navigator<"u"});var be=k(J=>{"use strict";i();n();Object.defineProperty(J,"__esModule",{value:!0});var nt=(j(),$(K)),at=S(),lt=nt.__importDefault(he()),xe=ye(),st=function(e){f.NODE_ENV==="development"&&(typeof e!="object"||typeof e.current>"u")&&console.error("`useScroll` expects a single ref argument.");var r=lt.default({x:0,y:0}),a=r[0],m=r[1];return at.useEffect(function(){var l=function(){e.current&&m({x:e.current.scrollLeft,y:e.current.scrollTop})};return e.current&&xe.on(e.current,"scroll",l,{capture:!1,passive:!0}),function(){e.current&&xe.off(e.current,"scroll",l)}},[e]),a};J.default=st});i();n();var T=_(S());var We=o(O).attrs({align:"center"})`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
`,qe=o.div`
  width: 48px;
  height: 48px;
  position: relative;
  margin-bottom: 15px;
  border-radius: 100%;
  background: rgba(from ${s.colors.legacy.accentWarning} r g b / 20%);
`,$e=o(B).attrs({align:"center",justify:"center"})`
  height: 100%;
`,Ge=o(F).attrs({size:17,weight:500,lineHeight:22,margin:"0 0 10px 0"})``,Ke=o(F).attrs({size:15,weight:500,lineHeight:21,margin:"0 0 15px 0",color:s.colors.legacy.textSecondary})``,je=o(F).attrs({size:16,weight:500,lineHeight:22,margin:"0",color:s.colors.legacy.accentPrimary})``,Dt=T.default.memo(e=>{let{t:r}=N();return T.default.createElement(We,null,T.default.createElement(qe,null,T.default.createElement($e,null,T.default.createElement(ue,{width:22,exclamationFill:"transparent",circleFill:s.colors.brand.yellowMoon}))),T.default.createElement(Ge,null,e.title),T.default.createElement(Ke,null,e.description),e.refetch?T.default.createElement(je,{onClick:e.refetch},e.buttonText?e.buttonText:r("commandRetry")):null)});i();n();var v=_(S());var Qe=o.div`
  width: 44px;
  height: 44px;
  margin-right: 10px;
`,H=o(A).attrs({height:"8px",backgroundColor:s.colors.legacy.borderPrimary,borderRadius:"8px"})``,fe=({hideTextRight:e})=>v.default.createElement(A,{align:"center",width:"100%",height:"74px",backgroundColor:s.colors.legacy.bgRow,borderRadius:s.radiusRow,margin:"0 0 10px 0",padding:"15px"},v.default.createElement(Qe,null,v.default.createElement(A,{width:"44px",height:"44px",backgroundColor:s.colors.legacy.borderSecondary,borderRadius:"50%"})),v.default.createElement(O,null,v.default.createElement(B,{margin:"0 0 10px",justify:"space-between"},v.default.createElement(H,{width:"120px"}),!e&&v.default.createElement(H,{width:"60px"})),v.default.createElement(B,{justify:"space-between"},v.default.createElement(H,{width:"75px"}),!e&&v.default.createElement(H,{width:"35px"}))));i();n();var t=_(S());i();n();var Q=o(F)`
  margin: 25px 0;
  height: 75%;
  font-weight: 500;
  font-size: 18px;
  line-height: 22px;
  color: ${s.colors.legacy.textTertiary};
  display: flex;
  text-align: center;
  align-items: center;
  justify-content: center;
`;i();n();var D="ALL";i();n();var p=_(S()),Le=_(be());var ct=o.div`
  position: relative;
`,ut=o.div`
  display: flex;
  flex-direction: row;
  overflow: auto;
`,pt=o.div`
  background: ${({active:e})=>e?s.colors.legacy.accentPrimary:s.colors.legacy.bgButton};
  height: 32px;
  border-radius: 32px;
  padding: 0 12px 1px;
  margin-right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  &:hover {
    background: ${({active:e})=>e?s.colors.legacy.accentPrimaryLight:s.colors.legacy.borderPrimary};
  }
`,mt=o(F).attrs({weight:600,size:15,noWrap:!0})``,ft=o.div`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 30px;
  display: flex;
  align-items: center;
  z-index: 2;
`,Se=o(ft)`
  background: linear-gradient(90deg, transparent 0%, ${s.colors.legacy.bgWallet} 30%);
  justify-content: flex-end;
  right: 0;
  padding-right: 5px;
`,dt=o(Se)`
  transform: rotate(180deg);
  right: auto;
  left: 0;
  padding-left: 5px;
`,ve=o(ce).attrs({fill:s.colors.legacy.textPrimary})``,Te=p.default.memo(({onPress:e,filters:r})=>{let[a,m]=p.default.useState(!1),[l,b]=p.default.useState(!1),c=(0,p.useRef)(null),{x:h}=(0,Le.default)(c);(0,p.useEffect)(()=>{c.current&&(m(h>0),b(Math.ceil(h)+c.current.offsetWidth<c.current.scrollWidth))},[h]);let d=(0,p.useCallback)(g=>{if(!c.current)return;let P=g*self.innerWidth*.75;c.current.scrollBy({left:P,behavior:"smooth"})},[]),y=(0,p.useCallback)(()=>d(-1),[d]),I=(0,p.useCallback)(()=>d(1),[d]);return p.default.createElement(ct,null,a?p.default.createElement(dt,{onClick:y},p.default.createElement(ve,null)):null,p.default.createElement(ut,{ref:c},r.map(g=>p.default.createElement(pt,{key:g.id,onClick:()=>e(g.id),active:g.active},p.default.createElement(mt,{color:g.active?s.colors.legacy.bgWallet:s.colors.legacy.textPrimary},g.label)))),l?p.default.createElement(Se,{onClick:I},p.default.createElement(ve,null)):null)});i();n();i();n();var we=gt;function gt(e,r,a){if(!e)return a;var m,l;if(Array.isArray(r)&&(m=r.slice(0)),typeof r=="string"&&(m=r.split(".")),typeof r=="symbol"&&(m=[r]),!Array.isArray(m))throw new Error("props arg must be an array, a string or a symbol");for(;m.length;)if(l=m.shift(),!e||(e=e[l],e===void 0))return a;return e}var Ie=e=>{let{data:r,activeFilterId:a,filterKey:m,filterLabels:l,alwaysShowFilters:b}=e;if(l.length===0)return[];if(b)return l.map(d=>({label:d.label,id:d.id,active:a===d.id}));let c=[],h=l.find(d=>d.id===D);h&&c.push({label:h.label,id:h.id,active:a===h.id});for(let d of r){let y=we(d,m);if(c.some(g=>g.id===y))continue;let I=l.findIndex(g=>g.id===y);if(I!==-1&&(c[I]={label:l[I].label,id:y,active:a===y},c.filter(G).length===l.length))break}return c.filter(G)};var ht=74,yt=10,xt=ht+yt,Ee=o.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`,Ce=o.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`,Fe=o.div`
  margin-bottom: 16px;
`,bt=o.div``,vt=o.div`
  flex: 1 1 auto; // https://github.com/bvaughn/react-virtualized-auto-sizer#can-i-use-this-component-with-flexbox
`,Lt=()=>t.default.createElement(t.default.Fragment,null,t.default.createElement(bt,null,[...Array(4)].map((e,r)=>t.default.createElement(fe,{key:`row-loader-${r}`,hideTextRight:!0})))),St=t.default.memo(e=>t.default.createElement(Ce,null,t.default.createElement(Q,null,e.localizedError.message))),Tt=t.default.memo(e=>t.default.createElement(Ce,null,t.default.createElement(Q,null,e.text))),wt=e=>{let{localizedError:r,isFetching:a,fuseOptions:m,filterKey:l,initialFilterKey:b,filterLabels:c=[],alwaysShowFilters:h=!1,emptyListCopy:d="",data:y,renderItem:I,keyExtractor:g,enableLiveSearch:P,setLiveSearchQuery:W}=e,[Y,Z]=(0,t.useState)(""),Pe=oe(Y)??"",[E,z]=(0,t.useState)(""),ee=(0,t.useRef)(null),te=(0,t.useRef)(null),ke=(0,t.useMemo)(()=>!l||c.length===0||E===D?y:y.filter(u=>re(u,l)===E),[E,y,l,c.length]),M=ie(ke,Pe,m,P),{t:Be}=N(),De=Be("assetListSearch");(0,t.useEffect)(()=>{setTimeout(()=>te.current?.focus(),200)},[]),(0,t.useEffect)(()=>{let u=ee.current;return u&&u.scrollTop!==0&&(u.scrollTop=0),()=>{u?.current&&(u.current=null)}},[Y,E]);let ze=(0,t.useCallback)(u=>{P&&W?W(u.currentTarget.value):Z(u.currentTarget.value)},[Z,P,W]),L=(0,t.useMemo)(()=>!l||c.length===0?[]:Ie({data:y,activeFilterId:E,filterKey:l,filterLabels:c,alwaysShowFilters:h}),[E,c,l,h,y]);(0,t.useEffect)(()=>{if(E||L.length===0)return;let u=b&&L.find(C=>C.id===b);if(u){z(u.id);return}z(L[0].id)},[L,b,z,E]);let Me=(0,t.useMemo)(()=>L.length>2||L.length===2&&!L.find(u=>u.id===D),[L]),Ne=(0,t.useCallback)(({index:u,style:C,data:Ae})=>{let q=Ae[u];if(!q)return null;let He=g(q,u);return t.default.createElement("div",{key:He,style:C},I({item:q,index:u}))},[g,I]),Oe=(0,t.useMemo)(()=>M.length===0?()=>t.default.createElement(Tt,{text:d}):void 0,[d,M.length]);return r?t.default.createElement(Ee,null,t.default.createElement(St,{localizedError:r})):t.default.createElement(Ee,null,t.default.createElement(Fe,null,t.default.createElement(me,{ref:te,tabIndex:0,placeholder:De,onChange:ze,maxLength:ne})),Me?t.default.createElement(Fe,null,t.default.createElement(Te,{onPress:z,filters:L})):null,a?t.default.createElement(Lt,null):t.default.createElement(vt,null,t.default.createElement(ae,null,({height:u,width:C})=>t.default.createElement(se,{outerRef:ee,innerElementType:Oe,height:u,itemSize:xt,itemData:M,itemCount:M.length,width:C},Ne))))},Gr=t.default.memo(wt);i();n();var Vr=o.div`
  background: ${e=>e.isHighlighted?s.colors.legacy.bgButton:s.colors.legacy.bgRow};
  ${e=>e.opacity!==void 0?`opacity: ${e.opacity};`:""}
  border-radius: ${s.radiusRow};
  padding-top: 15px;
  padding-bottom: 15px;
  padding-left: 10px;
  padding-right: 15px;
  display: flex;
  margin-bottom: 10px;
  align-items: center;
  width: 100%;
  cursor: ${e=>e.isDisabled?"auto":"pointer"};
  ${e=>!e.isDisabled&&le`
      &:hover {
        opacity: 1;
        background: ${s.colors.legacy.bgButton};
      }
    `}
`;i();n();var w=_(S());var It=o.div`
  display: flex;
  align-items: center;
  justify-content: center;
`,_e=({className:e,children:r,isLoading:a,spinnerColor:m,showingDelayMs:l=500})=>{let[b,c]=(0,w.useState)(!0);return(0,w.useEffect)(()=>{let h=setTimeout(()=>c(!1),l);return()=>{clearTimeout(h)}},[l]),a?b?null:w.default.createElement(It,{className:e},w.default.createElement(pe,{color:m})):w.default.createElement(w.default.Fragment,null,r)};_e.defaultProps={isLoading:!1};var to=o(_e)`
  height: 100%;
`;export{ge as a,Q as b,Dt as c,D as d,fe as e,Te as f,Ie as g,vt as h,Gr as i,Vr as j,to as k};
//# sourceMappingURL=chunk-FWNN4T46.js.map
