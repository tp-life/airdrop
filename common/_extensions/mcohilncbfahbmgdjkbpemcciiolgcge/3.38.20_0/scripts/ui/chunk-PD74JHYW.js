import{f as w}from"./chunk-ERN756XV.js";import{J as g}from"./chunk-NTISK7TT.js";import{ga as m,ha as f}from"./chunk-CU7RFE6B.js";import{d as l,f as _}from"./chunk-37O7OMRA.js";import{m as e,o as i}from"./chunk-UGZFXKPB.js";e();i();_();var h=async({nonce:t=0,localType:a="",fromAddr:n="",walletId:r="",messages:o="",network:p,validUntil:d})=>{if(a){let{TonWallet:y}=await w(),P=new y,W=await l().getPublicKeyByWalletId(r,a),T={workChain:f,publicKey:W,walletVersion:m},c=await P.getWalletInformation(T),u={messages:o,seqno:t||0,network:p,valid_until:d},{transaction:k}=await l().simulateMultiTransaction(n,r,u),s={address:n,body:k,ignore_chksig:!0};return t===0&&(s.init_code=c.initCode,s.init_data=c.initData),{transactionParams:u,stringInputParams:s}}return{}},B=h;e();i();var x=async({fromAddr:t,chainId:a,coinId:n,inputData:r=""})=>{if(r&&t&&a&&n)try{return await g({address:t,chainId:a,coinId:n,value:"0",inputData:r})}catch(o){return{error:!0,...o}}return{}},q=x;export{B as a,q as b};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-PD74JHYW.js.map
