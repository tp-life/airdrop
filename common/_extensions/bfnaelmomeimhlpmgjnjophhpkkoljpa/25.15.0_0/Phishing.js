import{a as C}from"./chunk-AK42W2OZ.js";import{a as N}from"./chunk-LXURC6FE.js";import"./chunk-WIQ6K6RU.js";import{a as P}from"./chunk-26VAF3RA.js";import"./chunk-NAWTYQ77.js";import"./chunk-7ZVEM3WY.js";import{a as U}from"./chunk-LEN5VG3M.js";import"./chunk-H7ATUB7C.js";import{d as v,db as l,n as I}from"./chunk-7N5UY74L.js";import{c as L,f as a}from"./chunk-ORJUPAX4.js";import{a as z}from"./chunk-RETFUH4L.js";import{c as T}from"./chunk-GRH4SUWK.js";import{U as w,X as y}from"./chunk-ZTXKK5SN.js";import"./chunk-UCBZOSRF.js";import"./chunk-HIWDTKJJ.js";import"./chunk-3XC45JK7.js";import"./chunk-G7OTLN34.js";import"./chunk-GDBECYVT.js";import"./chunk-US2EC2AF.js";import"./chunk-JOA3PMVO.js";import"./chunk-MWXM4F4N.js";import{a as B}from"./chunk-7F2GBYX5.js";import{a as W}from"./chunk-7XSNALQR.js";import"./chunk-HYOCMEEG.js";import"./chunk-LTDRBNZN.js";import"./chunk-IBEI3NGL.js";import"./chunk-O2N6PUOM.js";import"./chunk-QY3T2P2H.js";import"./chunk-DZ3GQOT6.js";import"./chunk-EIQDOUTB.js";import"./chunk-WFPABEAU.js";import"./chunk-3IV4Y5QP.js";import"./chunk-XJI624TH.js";import"./chunk-NEKSPHVV.js";import"./chunk-O3RSUGZX.js";import"./chunk-65FAE5DM.js";import"./chunk-DBO6DP4Z.js";import"./chunk-5W7YPRT3.js";import"./chunk-D7Z6MPRS.js";import"./chunk-NZAWO25Q.js";import"./chunk-E2H5RB2U.js";import"./chunk-CWJVYWRL.js";import{j as x,s as p}from"./chunk-27TD4NX4.js";import"./chunk-YJV3X2ON.js";import{A as S}from"./chunk-FBDT5S2M.js";import"./chunk-TKSJVOQZ.js";import{a as k}from"./chunk-UA6ADLWZ.js";import"./chunk-TVMPABNZ.js";import"./chunk-4M6V6BRQ.js";import"./chunk-UNDMYLJW.js";import{f as c,h as n,n as s}from"./chunk-3KENBVE7.js";n();s();var O=c(k());var J=c(z());n();s();var e=c(k());n();s();var r=c(k());var m=p.colors.legacy.accentAlert,A=a.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background-color: ${p.colors.brand.white};
  padding: clamp(24px, 16vh, 256px) 24px;
  box-sizing: border-box;
`,K=a.div`
  margin-bottom: 24px;
  padding-bottom: 8vh;
`,G=a.div`
  max-width: 100ch;
  margin: auto;

  * {
    text-align: left;
  }
`,F=a.a`
  text-decoration: underline;
  color: ${m};
`,d=new B,_=({origin:o,subdomain:t})=>{let{t:g}=x(),u=o?y(o):"",M=o??"",f=new URL(M).hostname,h=t==="true"?f:u,$=async()=>{if(t==="true"){let b=await d.get("userWhitelistedSubdomains"),i=JSON.parse(`${b}`);i?i.push(f):i=[f],i=[...new Set(i)],d.set("userWhitelistedSubdomains",JSON.stringify(i))}else{let b=await d.get("userWhitelistedOrigins"),i=JSON.parse(`${b}`);i?i.push(u):i=[u],i=[...new Set(i)],d.set("userWhitelistedOrigins",JSON.stringify(i))}self.location.href=o};return r.default.createElement(A,null,r.default.createElement(G,null,r.default.createElement(K,null,r.default.createElement(I,{width:128,fill:p.colors.brand.white})),r.default.createElement(l,{size:30,color:m,weight:"600"},g("blocklistOriginDomainIsBlocked",{domainName:h||g("blocklistOriginThisDomain")})),r.default.createElement(l,{color:m},g("blocklistOriginSiteIsMalicious")),r.default.createElement(l,{color:m},r.default.createElement(C,{i18nKey:"blocklistOriginCommunityDatabaseInterpolated"},"This site has been flagged as part of a",r.default.createElement(F,{href:w,rel:"noopener",target:"_blank"},"community-maintained database"),"of known phishing websites and scams. If you believe the site has been flagged in error,",r.default.createElement(F,{href:w,rel:"noopener",target:"_blank"},"please file an issue"),".")),h?r.default.createElement(l,{color:m,onClick:$,hoverUnderline:!0},g("blocklistOriginIgnoreWarning",{domainName:o})):r.default.createElement(r.default.Fragment,null)))};var H=()=>{let o;try{o=new URLSearchParams(self.location.search).get("origin")||"",new URL(o)}catch{o=""}return o},j=()=>new URLSearchParams(self.location.search).get("subdomain")||"",E=()=>{let o=(0,e.useMemo)(H,[]),t=(0,e.useMemo)(j,[]);return e.default.createElement(v,{future:{v7_startTransition:!0}},e.default.createElement(P,null,e.default.createElement(_,{origin:o,subdomain:t})))};W();S.init({provider:N});T();var q=document.getElementById("root"),Q=(0,J.createRoot)(q);Q.render(O.default.createElement(L,{theme:U},O.default.createElement(E,null)));
//# sourceMappingURL=Phishing.js.map
