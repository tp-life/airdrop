import{a as u}from"./chunk-VSJEBR4S.js";import{a as h}from"./chunk-AQQHYLH3.js";import{b as l}from"./chunk-DRPGNVVL.js";import{a as m}from"./chunk-LRVKM4IV.js";import{b as i}from"./chunk-JYKQJVIF.js";import{c as t}from"./chunk-TU7CE5HJ.js";import{pa as F,r as f}from"./chunk-LBCQTFOD.js";import{N,n as p}from"./chunk-V63HWKAL.js";import{a as I}from"./chunk-B75PPTYD.js";import{f as w,m as e,o as r}from"./chunk-UGZFXKPB.js";e();r();var n=w(I());F();N();e();r();var o={refreshWrapper:"_refreshWrapper_ec3nw_1",refresh:"_refresh_ec3nw_1",loading:"_loading_ec3nw_27",rotate:"_rotate_ec3nw_1"};var z=({className:g="",handleRefresh:s,status:a})=>{let d=u(),_=async()=>{p.trigger(h)},{successHaptic:y,impactHaptic:x}=m(),L=f(async()=>{s("loading"),x();try{await Promise.all([l(),d(),_()]),s("success"),y()}catch{s("error")}},800,{leading:!0});return a==="hidden"?null:n.default.createElement(t.FlexBox,{align:t.ALIGN.center,justify:t.ALIGN.center,className:`${o.refreshWrapper} ${g}`,onClick:c=>{c.stopPropagation(),a!=="loading"&&L()}},n.default.createElement(i,{size:i.SIZE.xs,icon:"okx-wallet-plugin-refresh",className:`${o.refresh} ${a==="loading"&&o.loading}`}))};export{z as a};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-FNFR3QI2.js.map
