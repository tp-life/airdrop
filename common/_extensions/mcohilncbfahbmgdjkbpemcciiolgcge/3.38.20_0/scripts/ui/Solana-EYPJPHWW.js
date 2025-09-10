import{c as w}from"./chunk-OMSBOWDZ.js";import{l as f}from"./chunk-KWSTGWJV.js";import{k as n}from"./chunk-L56XCX6G.js";import{D as u,N as P}from"./chunk-V63HWKAL.js";import{a as i}from"./chunk-B75PPTYD.js";import"./chunk-BMKS7XLD.js";import{f as p,m as t,o as r}from"./chunk-UGZFXKPB.js";t();r();var h=p(i());t();r();var S=p(i());P();var d=()=>{let{accountStore:{computedAccountId:a},walletContractStore:{transactionPayload:o},swapStore:{setSolanaSwapParams:s,sendSolanaTransaction:c,solanaSwapParams:m}}=w();return(0,S.useMemo)(()=>{try{let e=o?.map(l=>l.payload.transaction),y=e.length>1;return{showDappInfo:!1,showSwitchNetwork:!1,walletId:a,method:"signAllTransactions",params:{message:e},source:"dex",onConfirm:async l=>{let[C]=await u(c({signedTransactions:l,txArray:o,enableJito:y,swapParams:m,walletId:a}));C||s(null)},onCancel:()=>{s(null),n.history?.goBack()}}}catch{return null}},[a,c,s,m,o])};var x=()=>{let{SolanaEntry:a}=n.components,o=d();return h.default.createElement(a,{...o})},J=f(x);export{J as default};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=Solana-EYPJPHWW.js.map
