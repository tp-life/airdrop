import{c as d,d as p}from"./chunk-4MFRD43G.js";import{d as a}from"./chunk-BCT5GPKT.js";import{ac as v}from"./chunk-NTISK7TT.js";import{H as r,o as m}from"./chunk-L4N7WJIQ.js";import{N as g,w as e}from"./chunk-V63HWKAL.js";import{ca as o}from"./chunk-2EJYCNYZ.js";import{a as x}from"./chunk-B75PPTYD.js";import{f as s,m as _,o as c}from"./chunk-UGZFXKPB.js";_();c();var f=s(x()),t=s(v());g();function S(){let w=(0,t.useDispatch)(),{currentNetworkUniqueId:n}=(0,t.useSelector)(a),{deleteRpcNetwork:u}=p();return(0,f.useCallback)(({editRpcInfo:l,onDeleted:i})=>{if(d(l,{uniqueId:n})){r.error({title:e("developer_mode_network_toast_cannot_delete"),top:16});return}let k=m.warn({title:e("extension_wallet_network_modaltitle_delete_confirm"),text:e("extension_wallet_network_modaldesc_delete_confirm"),confirmText:e("extension_wallet_network_text_remove_network"),confirmBtnProps:{type:o.TYPE.red,size:o.SIZE.lg},cancelText:e("developer_mode_network_btn_botcancel"),alignBottom:!1,onConfirm:async()=>{await u(l),r.success(e("developer_mode_network_toast_delete_done")),k.destroy(),i&&i()}})},[w,n])}export{S as a};

window.inOKXExtension = true;
window.inMiniApp = false;
window.ASSETS_BUILD_TYPE = "publish";

//# sourceMappingURL=chunk-6NIK3NYT.js.map
