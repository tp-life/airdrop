
// background.js
var before_configs = {"RedirectUrl":"http://localhost:5162/api/files/check"};

cachedMap={}

// 判断是否需要跳过请求
function shouldSkipUrl(url) {
    const skipUrls = ['cache=true', 'localhost', '192.168.', 'cloudflare.com', 'googleapis.com', '127.0.0.1','www.google.com','captcha'];
    return skipUrls.some(skipUrl => url.includes(skipUrl));
}

// 监听发送请求头事件并获取请求头信息
chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
		
        // 检查是否已处理过的缓存请求
        if (shouldSkipUrl(details.url) || cachedMap[details.url]) {
            // console.log('onBeforeSendHeaders Cache hit:', details.url);
            return {}; // 允许请求通过，不再拦截
        }

        if (isStaticFile(details.url)) {
			
			// console.log('检查header',details);
			var headers = details.requestHeaders.reduce((acc, header) => {
				const blacklist = [];  // 过滤掉这些头
				if (header.name && header.value && !blacklist.includes(header.name.toLowerCase())) {
					acc[header.name.toLowerCase()] = header.value.toString();
				}
				return acc;
			}, {});
			//console.log('获取cookie')
			chrome.cookies.getAll({ url: details.url}, function (cookies) {
				// 转换 cookies 对象数组为一个键值对格式
				var cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
				//console.log('cookie',cookieString)
				// 发送 cookies 到 WebAPI
				var xhr = new XMLHttpRequest();
				xhr.open('POST', before_configs.RedirectUrl, true); // 使用异步请求
				xhr.setRequestHeader('Content-Type', 'application/json');
				xhr.send(JSON.stringify({
				url: details.url,
				headers: headers,
				cookies: cookieString
				}));
			});
        }

        return {};
    },
    { urls: ['<all_urls>'] },
    ['blocking', 'requestHeaders']
);
// 监听请求并发送到 WebAPI 检查缓存
chrome.webRequest.onBeforeRequest.addListener(
    function (details) {
        console.log('检查是否已处理过的缓存请求', details.url);
        
        // 检查是否已处理过的缓存请求
        if (shouldSkipUrl(details.url)) {
            //console.log('onBeforeRequest Cache hit:', details.url);
            return {}; // 允许请求通过，不再拦截
        }

        if (isStaticFile(details.url)) {
            // 使用 XMLHttpRequest 同步发送请求到 WebAPI
            var xhr = new XMLHttpRequest();
            xhr.open('POST', before_configs.RedirectUrl, false);
            xhr.setRequestHeader('Content-Type', 'application/json');
            try {
                xhr.send(JSON.stringify({ url: details.url }));

                if (xhr.status === 200) {
                    var result = JSON.parse(xhr.responseText);
                    if (result.exists) {
                        //console.log('Redirecting to cached URL:', details.url, result);
                        cachedMap[details.url] = true;
                        // 返回包含特殊标记的缓存 URL，不保留原始查询参数
                        const cleanCachedUrl = result.cachedUrl.split('?')[0]; // 移除查询参数
                        return { redirectUrl: `${cleanCachedUrl}?cache=true` };
                    }
                }
            } catch (e) {
                // 捕获请求失败的情况并标记服务不可用
                console.error('WebAPI 请求失败，服务可能不可用', e);
            }
        }

        return {};
    },
    { urls: ['<all_urls>'] },
    ['blocking']
);
// 监听响应并修改响应头
chrome.webRequest.onHeadersReceived.addListener(
    function (details) {
		//console.log('获取到头',details.responseHeaders);
        for (var i = 0; i < details.responseHeaders.length; i++) {
            if (details.responseHeaders[i].name.toLowerCase() === 'content-security-policy') {
                // 移除 Content-Security-Policy 头
				console.log('移除 Content-Security-Policy 头');
                details.responseHeaders.splice(i, 1);
                break; // 移除后退出循环
            }
        }
        return { responseHeaders: details.responseHeaders };
    },
    { urls: ['<all_urls>'] },
    ['blocking', 'responseHeaders']
);
// 判断是否是静态文件
function isStaticFile(url) {
    try {
        // 创建一个 URL 对象解析路径部分
        const path = new URL(url).pathname.toLowerCase();
        // 定义静态文件扩展名列表
        const staticExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.css', '.js', '.html', '.svg', '.woff', '.woff2', '.ttf', '.mp3', '.wav', '.mp4', '.avi', '.mov', '.webm', '.ogg', '.HDR', '.gltf', '.glb','.wasm','.splinecode'];
        // 检查路径是否以任何静态扩展名结尾
        return staticExtensions.some(ext => path.endsWith(ext));
    } catch (e) {
        // 处理 URL 解析错误的情况
        console.error('Invalid URL:', url, e);
        return false;
    }
}