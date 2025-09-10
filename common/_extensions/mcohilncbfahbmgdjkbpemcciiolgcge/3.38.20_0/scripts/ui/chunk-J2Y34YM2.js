import{va as i,ya as n}from"./chunk-KSCBZ3RY.js";import{d as s,f as c}from"./chunk-37O7OMRA.js";import{G as o}from"./chunk-L4N7WJIQ.js";import{m as a,o as d}from"./chunk-UGZFXKPB.js";a();d();c();n();async function p(e){try{return await s().addAddressBook(e)}catch(r){throw r?.message!==i&&o.error({title:r?.message}),r}}async function A(e,r){try{return await s().updateAddressBook(e,r)}catch(t){return o.error({title:t?.message}),t}}async function g(e){try{return await s().removeAddressBook(e)}catch(r){throw o.error({title:r?.message}),r}}async function k(e,r){try{return await s().addRecentlyAddress(e,r)}catch(t){return o.error({title:t?.message}),t}}export{p as a,A as b,g as c,k as d};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-J2Y34YM2.js.map
