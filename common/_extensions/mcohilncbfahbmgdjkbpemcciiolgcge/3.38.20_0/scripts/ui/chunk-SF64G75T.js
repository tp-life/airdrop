import{k as r,l as s}from"./chunk-ERN756XV.js";import{b as d}from"./chunk-6JGR2L6N.js";import{f as u,m as e,o as i}from"./chunk-UGZFXKPB.js";e();i();var c=u(d());var y={inputs:[{internalType:"bytes",name:"_data",type:"bytes"}],name:"getL1Fee",outputs:[{internalType:"uint256",name:"",type:"uint256"}],stateMutability:"view",type:"function"},E=async t=>{let{Common:a,Hardfork:n,Chain:o}=await r(),m=a.forCustomChain(o.Mainnet,{chainId:10,networkId:10,defaultHardfork:n.SpuriousDragon}),{TransactionFactory:p}=await s();return p.fromTxData(t,{common:m})},D=async t=>{let n=(await E(t)).serialize();return c.default.encodeMethod(y,[n])};export{D as a};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-SF64G75T.js.map
