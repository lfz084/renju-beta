    const SCRIPT_VERSION = "v2024.23086";
    const home = new Request("./").url;
    const beta = /renju\-beta$|renju\-beta\/$/.test(home) && "beta" || "";
    const VERSION_JSON = new Request("./Version/SOURCE_FILES.json").url;
    const currentCacheKey = "currentCache" + beta;
    const updataCacheKey = "updataCache" + beta;
    const refreshVersionInterval = 3600 * 1000;
    const updateCacheInterval = 6 * 3600 * 1000;
    const CacheStatus = {
    	UPDATE: 1,
    	UPDATING: 2,
    	UPDATED: 3,
    	STOPING: 4,
    };
    Object.freeze(CacheStatus);
    let updateStatus = CacheStatus.UPDATE;
    let updateVersionInfo = null;
    let currentVersionInfo = null;
    let lastRefreshTime = 0;
    
    //------------------------------- Response --------------------------------
    
    const requestInit = {
    	cache: "no-store", //不使用缓存
    	mode: 'cors' //支持跨域访问
    };
    
    const headers_html = { "Content-Type": 'text/html; charset=utf-8' };
    const response_200_init_html = {
    	status: 200,
    	statusText: "OK",
    	headers: headers_html
    };
    const response_404_init_data = {
    	status: 404
    };
    
	const response_err_html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport"content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"><title>404 error</title><style>body{padding:0;margin:0;opacity:0}#mainview{position:fixed;top:0px;left:0px;width:500px;height:500px;border-radius:50px;background:#ddd;text-align:center}#info{position:absolute;top:10px;width:500px;height:250px;text-align:center}#link{position:absolute;top:260px;width:500px;height:250px;text-align:center}#refresh{font-size:70px;border-radius:50%;border:0px}#refresh:hover{color:#885588;opacity:0.38}h1{font-size:25px;font-weight:blod;line-height:1.5}a{color:#663366;font-size:26px;font-weight:blod;text-decoration:underline;line-height:1.8;cursor:pointer}a:link{color:#663366;text-decoration:underline}a:visited{color:#552255;text-decoration:underline}a:hover{color:#885588;text-decoration:underline}a:active{color:blue;text-decoration:underline}</style></head><body><script>try{const HOME=new RegExp("^https\\:\\/\\/[\\.\\:0-9a-z ]*\\/renju\\-beta\\/|^https\\:\\/\\/[\\.\\:0-9a-z ]*\\/renju\\/|^https\\:\\/\\/[\\.\\:0-9a-z ]*\\/|^http\\:\\/\\/[\\.\\:0-9a-z ]*\\/","i").exec(location.href);async function postVersion(){return new Promise(resolve=>{if(navigator.serviceWorker&&navigator.serviceWorker.controller){let timer;const currentCacheKey=localStorage.getItem("RENJU_APP_VERSION");function onmessage(event){const MSG=event.data;if(typeof MSG=="object"&&MSG.cmd=="NEW_VERSION"){rm(MSG.versionChange)}}function rm(rt){navigator.serviceWorker.removeEventListener("message",onmessage);clearTimeout(timer);resolve(rt)}!currentCacheKey&&resolve(false);navigator.serviceWorker.addEventListener("message",onmessage,true);navigator.serviceWorker.controller.postMessage({cmd:"NEW_VERSION",version:currentCacheKey});timer=setTimeout(()=>{rm(false)},1500)}else{resolve(false)}})}async function ping(url){return new Promise(resolve=>{const time=new Date().getTime();setTimeout(()=>resolve(-1),15*1000);fetch(url.split("?=")[0].split("#")[0]+"?cache=onlyNet").then(response=>response.ok?resolve(new Date().getTime()-time):resolve(-1))})}async function checkLink(){document.getElementById("log").innerHTML="正在测试网络链接......";return ping(HOME+"index.html").then(time=>{if(time>=0){document.getElementById("log").innerHTML="没有找到你要打开的页面"}else{document.getElementById("log").innerHTML="❌网络链接异常"}})}function clk(url){window.top.open(url,"_self")}postVersion().then(n=>n&&window.location.reload()).then(()=>{}).catch(()=>{}).then(()=>{document.body.style.opacity=1});document.body.onload=()=>{const gw=Math.min(document.documentElement.clientWidth,document.documentElement.clientHeight);const style=document.getElementById("mainview").style;style.left=(document.documentElement.clientWidth-500)/2+"px";style.top=(document.documentElement.clientHeight-500)/2+"px";style.transform="scale("+gw/600+")";checkLink();document.getElementById("refresh").onclick=async()=>{window.location.reload()};document.getElementById("home").onclick=()=>{clk(HOME+"index.html")};document.getElementById("gitee").onclick=()=>{clk("https://lfz084.gitee.io/renju/")};document.getElementById("github").onclick=()=>{clk("https://lfz084.github.io/")};document.getElementById("renjumap").onclick=()=>{clk("https://renjumap.com/renjutool/index.html")};document.getElementById("url").innerHTML=window.location.href}}catch(e){alert(e.stack)}</script><div id="mainview"><div id="info"><h1 id="url"></h1><h1 id="log"></h1></br><button id="refresh">🔄</button></div><div id="link"><br><a id="home">网站首页</a></br><a id="gitee">国内网站gitee</a></br><a id="github">国外网站github</a></br><a id="renjumap">镜像站renjumap</a></br></div></div></body></html>`;
    const response_err_data = "Error 404, file not found.";
    const response_err_cache = "Error 404, file not found in cache";
    const request_reject = "Failed to fetch. request rejected";
    
    //---------------------------------- loading -----------------------------------
    
    const load = (() => {
    	let urls = [];
    	let timer = null;

    	function pushURL(url) {
    		if (urls.indexOf(url) < 0) {
    			urls.push(url);
    		}
    	}

    	function removeURL(url) {
    		let idx = urls.indexOf(url);
    		if (idx + 1) {
    			urls.splice(idx, 1);
    		}
    	}

    	function interval() {
    		if (urls.length == 0) {
    			clearInterval(timer);
    			timer = null;
    			syncMsg(`load finish`)
    		}
    	}

    	return {
    		loading: (url, client) => {
    			let filename = url.split("/").pop().split("?")[0].split("#")[0];
    			if (/\.css$|\.ttf$|\.woff$|\.html$|\.png$|\.gif$|\.jpg$/i.test(filename)) {
    				if (!timer) {
    					timer = setInterval(interval, 300);
    				}
    				syncMsg(`loading......`, client)
    				pushURL(url);
    			}
    		},
    		finish: (url) => {
    			removeURL(url);
    		}
    	};
    })();
    
    //-------------------------- caches -----------------------------------
    
    Cache.prototype.putJSON = async function (key, value) {
		return this.put(new Request(key), new Response(JSON.stringify(value)))
    }
    
    Cache.prototype.getJSON = async function(key) {
    	return this.match(new Request(key)).then(response => response && response.text()).then(text => text && JSON.parse(text))
    }
    
    caches.setItem = async function(key, value) {
    	return new Promise(resolve => {
    		try {
    			key = key.toString();
    			value = value.toString();
    			caches.open("settings").then(cache => cache.put(new Request(key), new Response(value))).then(() => resolve(value)).catch(() => resolve());
    		} catch (e) { resolve() }
    	});
    }
    
    caches.getItem = async function(key) {
    	return new Promise(resolve => {
    		try {
    			key = key.toString();
    			caches.open("settings").then(cache => cache.match(new Request(key))).then(response => response.text()).then(value => resolve(value)).catch(() => resolve());
    		} catch (e) { resolve() }
    	});
    }
    
    caches.removeItem = async function(key) {
    	return new Promise(resolve => {
    		try {
    			key = key.toString();
    			caches.open("settings").then(cache => cache.delete(new Request(key))).then(() => resolve(true)).catch(() => resolve(false));
    		} catch (e) { resolve(false) }
    	});
    }
    
    //----------------------------------------------------------------------------------------------
    
    function getUrlVersion(version) {
    	return "?v=" + version;
    }

    function formatURL(url, version) {
    	const _msg = `sw.js: formatURL("${url}")`;
    	url = url.split("?")[0].split("#")[0];
    	const URL_VERSION = getUrlVersion(version);
    	const indexHtml = url.split("/").pop().indexOf(".") == -1 ? (url.slice(-1) == "/" ? "" : "/") + "index.html" : "";
    	url = url + indexHtml;
    	//postMsg(`${_msg} "${url}"`)
    	return url;
    }
    
    async function wait(timeout = 1000) {
    	return new Promise(resolve => setTimeout(resolve, timeout));
    }
    
    function setCacheVersion(version) {
    	currentCacheKey !== version && postMsg(`serverWorker currentCacheKey change:\n___Script Version: ${SCRIPT_VERSION}\n___cache Version: ${version}` );
    	return currentCacheKey = version;
    }
    
    async function loadVersionInfo() {
    	return onlyNet(VERSION_JSON)
    		.then(response => (response && response.ok) ? response.json() : unde)
    }
    
    //-------------------------- update Cache -----------------------------------
    
	async function waitCacheReady(version = currentCacheKey) {
    	const url = formatURL(VERSION_JSON, version);
    	return Promise.resolve()
    		.then(() => !currentVersionInfo && loadCache(url, version))
    		.then(response => (response && response.ok) && response.json())
    		.then(json => json && (currentVersionInfo = json))
    		.then(json => json && (json["status"] = json["status"] || CacheStatus.UPDATE, json["createTime"] = json["createTime"] || new Date().getTime()))
    		.then(() => (!updateVersionInfo || (new Date().getTime() - lastRefreshTime > refreshVersionInterval)) && (lastRefreshTime = new Date().getTime() - refreshVersionInterval, onlyNet(url)))
    		.then(response => (response && response.ok) && response.json())
    		.then(json => json && (updateVersionInfo = json))
    		.then(json => json && (json["status"] = json["status"] || CacheStatus.UPDATE, json["createTime"] = json["createTime"] || new Date().getTime()))
    		.then(() => {
    			if (currentVersionInfo && updateVersionInfo) {
    				if ((updateCacheInterval < new Date().getTime() - currentVersionInfo["createTime"]) &&
    					(new Date().getTime() - lastRefreshTime > refreshVersionInterval)
    				) {
    					postMsg("waitCacheReady >> updateCache")
    					lastRefreshTime += refreshVersionInterval;
    					updateCache()
    				}
    			}
    			else if (!currentVersionInfo && updateVersionInfo) {
    				postMsg("waitCacheReady >> resetCache")
    				return resetCache(version, updateVersionInfo)
    					.then(info => currentVersionInfo = info)
    			}
    			else if (currentVersionInfo && !updateVersionInfo) {
    				postMsg("waitCacheReady >> offline?")
    				updateVersionInfo = JSON.parse(JSON.stringify(currentVersionInfo, null, 2))
    			}
    			else {
    				postMsg("waitCacheReady >> error")
    				return Promise.reject("waitCacheReady: 刷新版本信息失败，请检查网络是否正常")
    			}
    		})
    }
    
    async function resetCache(cacheKey, cacheInfo) {
    	const url = formatURL(VERSION_JSON, cacheKey);
    	return caches.delete(cacheKey)
    		.then(() => caches.open(cacheKey))
    		.then(cache => {
    			const newInfo = JSON.parse(JSON.stringify(cacheInfo, null, 2));
    			newInfo["status"] = CacheStatus.UPDATE;
				newInfo["createTime"] = new Date().getTime();
				return cache.putJSON(new Request(url, requestInit), newInfo)
					.then(() => newInfo)
    		})
    }
    
    async function copyToCurrentCache() {
    	postMsg("copyToCurrentCache start")
    	return resetCache(currentCacheKey, updateVersionInfo)
    		.then(info => currentVersionInfo = info)
    		.then(() => Promise.all([caches.open(currentCacheKey), caches.open(updataCacheKey)]))
    		.then(([currentCache, updataCache]) => {
    			const ps = [];
    			updataCache.matchAll().then(response => ps.push(currentCache.put(response.url, response)))
    			return Promise.all(ps);
    		})
    		.then(() => caches.delete(updataCacheKey))
    		.then(() => postMsg("copyToCurrentCache end"))
    }
    
    async function updateFiles(cacheKey, versionInfo) {
    	versionInfo["status"] = CacheStatus.UPDATING;
    	postMsg(`updateFiles: [${Object.keys(versionInfo["files"])}]`);
    	return new Promise(resolve => {
    		async function updateFile() {
    			if (files.length && versionInfo["status"] == CacheStatus.UPDATING) {
    				const url = formatURL(new Request(files.shift()).url);
    				return cacheFirst(url, cacheKey)
    					.then(response => {
    						response.ok && countCacheFiles++;
    						updateFile()
    					})
    			}
    			else {
    				return resolve(countCacheFiles == numAllFiles);
    			}
    		}
    		const files = Object.keys(versionInfo["files"]).map(key=>versionInfo["files"][key]);
    		const numAllFiles = files.length;
    		let countCacheFiles = 0;
    		updateFile()
    	})
    	.then(updated => versionInfo["status"] = (updated ? CacheStatus.UPDATED : CacheStatus.UPDATE))
    	.then(status => status == CacheStatus.UPDATED && cacheKey == updataCacheKey && copyToCurrentCache())
    }
    
    async function updateCache() {
    	if (updateStatus == CacheStatus.UPDATING) return;
    	updateStatus = CacheStatus.UPDATING;
    	const url = formatURL(VERSION_JSON);
    	return onlyNet(url)
    		.then(response => (response && response.ok) ? response.json() : Promise.reject("updateCache: 刷新版本信息失败，跳过后续更新"))
    		.then(versionInfo => versionInfo["version"] == currentVersionInfo["version"] ? { cacheKey: currentCacheKey, oldInfo: currentVersionInfo, newInfo: versionInfo } : { cacheKey: updataCacheKey, oldInfo: updateVersionInfo, newInfo: versionInfo })
    		.then(({cacheKey, oldInfo, newInfo}) => {
    			if (oldInfo["version"] != newInfo["version"]) {
    				return resetCache(cacheKey, newInfo)
    					.then(info => (Object.keys(oldInfo).map(key=>oldInfo[key]=undefined), Object.assign(oldInfo, info)))
    					.then(() => ({versionInfo: oldInfo, cacheKey}))
    			}
    			else {
    				return Promise.resolve()
						.then(() => (oldInfo["files"]={}, Object.assign(oldInfo["files"], newInfo["files"])))
    					.then(() => ({versionInfo: oldInfo, cacheKey}))
    			}
    		})
    		.then(({cacheKey, versionInfo}) => versionInfo["status"] == CacheStatus.UPDATED ? Promise.reject(`${cacheKey} 已经缓存完成，跳过后续更新`) : {cacheKey, versionInfo})
    		.then(({cacheKey, versionInfo}) => updateFiles(cacheKey, versionInfo))
    		.catch(e => postMsg(`updateCache error: ${e && e.stack || e && e.message || e}`))
    		.then(() => updateStatus = CacheStatus.UPDATE)
    }
    
    async function stopUpdating() {
    	return new Promise(resolve => {
    		currentVersionInfo["status"] == CacheStatus.UPDATING && (currentVersionInfo["status"] = CacheStatus.STOPING);
    		updateVersionInfo["status"] == CacheStatus.UPDATING && (updateVersionInfo["status"] = CacheStatus.STOPING);
    		let timer = setInterval(() => {
    			if (updateStatus == CacheStatus.UPDATE) {
    				clearInterval(timer);
    				timer = null;
    				resolve()
    			}
    		}, 500)
    	})
    }
    
    //-------------------------- Request Response -----------------------------------
	
    /**
     * 从网络加载 response，如果没有找到，返回标记为404 错误的response
     */
    function onlyNet(url, version, clientID) {
    	const nRequest = new Request(url.split("?")[0].split("#")[0] + "?v=" + new Date().getTime(), requestInit);
    	clientID && load.loading(url, clientID);
    	return fetch(nRequest)
    		.then(response => {
    			clientID && load.finish(url);
    			return response;
    		})
    		.catch(err => {
    			clientID && load.finish(url);
    			return new Response(request_reject, response_404_init_data)
    		})
    }
	
	/**
	 * 从缓存读取 response，如果没有找到，返回标记为404 错误的response
 	*/
    function loadCache(url, version, clientID) {
    	return caches.open(version)
    		.then(cache => {
    			return cache.match(new Request(url, requestInit))
    		})
    		.then(response => {
    			return (response && response.ok) ? response : Promise.reject();
    		})
    		.catch(err => {
    			return new Response(response_err_cache, response_404_init_data)
    		})
    }
    
    /**
     * 返回标记为404 错误的response, HTML 页面做特殊处理
     */
    function fetchError(err, url, version, clientID) {
    	const type = url.split("?")[0].split("#")[0].split(".").pop();
    	
    	if (["htm", "html"].indexOf(type) + 1) {
    		const request = new Request("./404.html");
    		const _URL = formatURL(request.url, version);
    		postMsg(`fetchError >> loadCache response: 404.html`)
    		return loadCache(_URL, version, clientID)
    			.then(response => {
    				return response.ok ? response : Promise.reject();
    			})
    			.catch(() => {
    				postMsg(`fetchError >> create response: 404.html`);
    				return new Response(response_err_html, response_200_init_html)
    			})
    	}
    	else {
    		return new Response(response_err_data, response_404_init_data)
    	}
    }
    
    /**
     * 从网络加载 response，如果没有找到，返回标记为404 错误的response
     * response.ok 为 true 时，保存在缓存中
     */
    function fetchAndPutCache(url, version, clientID) {
    	return onlyNet(url, version, clientID)
    		.then(response => {
    			if (response.ok && url.indexOf("blob:http") == -1) {
    				let cloneRes = response.clone();
    				caches.open(version).then(cache => cache.put(new Request(url, requestInit), cloneRes))
    			}
    			return response;
    		})
    }
	
	/**
	 * 从缓存优先获取 response，如果没有找到，返回标记为404 错误的response
	 */
    function cacheFirst(url, version, clientID) {
    	return loadCache(url, version, clientID)
    		.then(response => {
    			return response.ok ? response : Promise.reject();
    		})
    		.catch(() => {
    			return fetchAndPutCache(url, version, clientID);
    		})
    		.then(response => {
    			return response.ok ? response : Promise.reject();
    		})
    		.catch(err => {
    			return fetchError(err, url, version, clientID)
    		})
    }
	
	/**
	 * 从网络优先获取 response，如果没有找到，返回标记为404 错误的response
	 */
    function netFirst(url, version, clientID) {
    	return fetchAndPutCache(url, version, clientID)
    		.then(response => {
    			return response.ok ? response : Promise.reject();
    		})
    		.catch(() => {
    			return loadCache(url, version, clientID)
    		})
    		.then(response => {
    			return response.ok ? response : Promise.reject();
    		})
    		.catch(err => {
    			return fetchError(err, url, version, clientID)
    		})
    }
    
    //-------------------- add HTML code -------------------- 

    const tongjihtmlScript = '  <script>\n    var _hmt = _hmt || [];\n    (function(){\n      var hm = document.createElement("script");\n      hm.src = "https://hm.baidu.com/hm.js?c17b8a02edb4aff101e8b42ed01aca1b";\n      var s = document.getElementsByTagName("script")[0];\n      s.parentNode.insertBefore(hm,s)\n    })();\n  </script>'
    async function addHTMLCode(response) {
    	if (/^https\:\/\//.test(home) && /\.html$|\.htm$/i.test(response.url.split("?")[0].split("#")[0])) {
    		return response.text()
    			.then(html => {
    				return html.indexOf(tongjihtmlScript) + 1 ? html : html.replace(new RegExp("\<body\>", "i"), `<body>\n` + tongjihtmlScript)
    			})
    			.then(html => new Response(html, response_200_init_html))
    	}
    	else return response;
    }
    
    //-------------------- addEventListener -------------------- 

    self.addEventListener('install', function(event) {
    	self.skipWaiting();
    	/*
    	event.waitUntil()
    	*/
    	//postMsg({ cmd: "alert", msg: `install, ${currentCacheKey}, ${new Date().getTime()}` });
    });

    self.addEventListener('activate', function(event) {
    	//postMsg({ cmd: "alert", msg: `activate, ${currentCacheKey}, ${new Date().getTime()}` })
    });
    
    self.addEventListener('fetch', function(event) {
    	if (event.request.url.indexOf(home) == 0) {
    		const responsePromise = waitCacheReady()
    			.then(() => {
    				const _URL = formatURL(event.request.url, currentCacheKey);
    				const rt = /\?cache\=onlyNet$|\?cache\=onlyCache$|\?cache\=netFirst$|\?cache\=cacheFirst$/.exec(event.request.url);
    				const key = null == rt ? "default" : rt[0];
    				const waitResponse = {
    					"?cache=onlyNet": onlyNet,
    					"?cache=onlyCache": loadCache,
    					"?cache=netFirst": netFirst,
    					"?cache=cacheFirst": cacheFirst,
    					"default": cacheFirst
    				} [key];
    				postMsg(`fetch Event url: ${decodeURIComponent(_URL)}`, event.clientID);
    				return waitResponse(_URL, currentCacheKey, event.clientID)
    					.then(response => addHTMLCode(response));
    			})
    			.catch(err => {
    				return new Response(err ? JSON.stringify(err, null, 2) : response_err_data, response_404_init_data)
    			})
    			
    		event.respondWith(responsePromise);
    	}
    });
    
    //--------------------------  post message ---------------------------------
	
	const NUM_MAX_MSG = 1000;
	let delay = true;
	let delayMessages = [{
		msg: `serverWorker reboot:\n___url: ${new Request("sw.js").url}\n___Script Version: ${SCRIPT_VERSION}\n___cache Version: ${currentCacheKey}`
	}];
	let lastDelayMessages = new Date().getTime();
	let log2cacheTimer = setInterval(() => {
		if (5000 < new Date().getTime() - lastDelayMessages) {
			clearInterval(log2cacheTimer);
			postDelayMessages();
		}
	}, 1000)
		
	function delayMsg(msg, client) {
		(typeof msg == "object") && (msg = JSON.parse(JSON.stringify(msg)));
		lastDelayMessages = new Date().getTime();
		delayMessages.push({msg, client});
		delayMessages.length >= NUM_MAX_MSG && postDelayMessages();
	}
	
	function syncMsg(msg, client) {
		if (client && typeof client.postMessage == "function") {
			client.postMessage(msg);
		}
		else {
			self.clients.matchAll().then(clients => clients.map(client => client.postMessage(msg)));
		}
	}
	
	function postMsg(msg, client) {
		delay ? delayMsg(msg, client) : syncMsg(msg, client);
	}
	
	function postDelayMessages() {
		let count = 0;
		let logStr = "";
		delay = false;
		while (delayMessages.length && count++ < NUM_MAX_MSG) {
			const { msg, client } = delayMessages.shift();
			postMsg(msg, client);
			logStr += (msg + "\n");
		}
		caches.open("log").then(cache => cache.put("log", new Response(logStr)))
	}
	
	//--------------------------  onmessage ---------------------------------
	
	function getArgs(data) {
		return Array.isArray(data.args) ? data.args : [data.args !== undefined ? data.args : data.arg]
	}
	
	const COMMAND = {
		formatURL: async (data) => {
		 	data["resolve"] = formatURL(...getArgs(data))
		},
		postDelayMessages: async (data) => {
			postDelayMessages();
			data["resolve"] = true
		},
		waitCacheReady: async (data) => {
			return waitCacheReady().then(() => data["resolve"] = true)
		},
		getCacheKeys: async (data) => {
			data["resolve"] = {currentCacheKey, updataCacheKey}
		},
		getVersionInfos: async (data) => {
			data["resolve"] = {currentVersionInfo, updateVersionInfo}
		},
		clearVersionInfos: async (data) => {
			currentVersionInfo = updateVersionInfo = undefined;
			data["resolve"] = true
		},
		refreshVersionInfos: async (data) => {
			currentVersionInfo = updateVersionInfo = undefined;
			return waitCacheReady().then(() => data["resolve"] = true)
		},
	}
    
    self.addEventListener('message', async function(event) {
    	if (typeof event.data == "object") {
    		const fun = COMMAND[event.data.cmd] || async function(){};
    		fun(event.data).then(() => syncMsg(event.data, event.clientID))
    	}
    	else {
    		syncMsg(event.data, event.clientID)
    	}
    });
    