    const SCRIPT_VERSION = "v2024.23068";
    var cacheVersion;
    
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
    
	const response_err_html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport"content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"><title>404 error</title><style>body{padding:0;margin:0;opacity:0}#mainview{position:fixed;top:0px;left:0px;width:500px;height:500px;border-radius:50px;background:#ddd;text-align:center}#info{position:absolute;top:10px;width:500px;height:250px;text-align:center}#link{position:absolute;top:260px;width:500px;height:250px;text-align:center}#refresh{font-size:70px;border-radius:50%;border:0px}#refresh:hover{color:#885588;opacity:0.38}h1{font-size:25px;font-weight:blod;line-height:1.5}a{color:#663366;font-size:26px;font-weight:blod;text-decoration:underline;line-height:1.8;cursor:pointer}a:link{color:#663366;text-decoration:underline}a:visited{color:#552255;text-decoration:underline}a:hover{color:#885588;text-decoration:underline}a:active{color:blue;text-decoration:underline}</style></head><body><script>try{const HOME=new RegExp("^https\\:\\/\\/[\\.\\:0-9a-z ]*\\/renju\\-beta\\/|^https\\:\\/\\/[\\.\\:0-9a-z ]*\\/renju\\/|^https\\:\\/\\/[\\.\\:0-9a-z ]*\\/|^http\\:\\/\\/[\\.\\:0-9a-z ]*\\/","i").exec(location.href);async function postVersion(){return new Promise(resolve=>{if(navigator.serviceWorker&&navigator.serviceWorker.controller){let timer;const cacheVersion=localStorage.getItem("RENJU_APP_VERSION");function onmessage(event){const MSG=event.data;if(typeof MSG=="object"&&MSG.cmd=="NEW_VERSION"){rm(MSG.versionChange)}}function rm(rt){navigator.serviceWorker.removeEventListener("message",onmessage);clearTimeout(timer);resolve(rt)}!cacheVersion&&resolve(false);navigator.serviceWorker.addEventListener("message",onmessage,true);navigator.serviceWorker.controller.postMessage({cmd:"NEW_VERSION",version:cacheVersion});timer=setTimeout(()=>{rm(false)},1500)}else{resolve(false)}})}async function ping(url){return new Promise(resolve=>{const time=new Date().getTime();setTimeout(()=>resolve(-1),15*1000);fetch(url.split("?=")[0].split("#")[0]+"?cache=onlyNet").then(response=>response.ok?resolve(new Date().getTime()-time):resolve(-1))})}async function checkLink(){document.getElementById("log").innerHTML="正在测试网络链接......";return ping(HOME+"index.html").then(time=>{if(time>=0){document.getElementById("log").innerHTML="没有找到你要打开的页面"}else{document.getElementById("log").innerHTML="❌网络链接异常"}})}function clk(url){window.top.open(url,"_self")}postVersion().then(n=>n&&window.location.reload()).then(()=>{}).catch(()=>{}).then(()=>{document.body.style.opacity=1});document.body.onload=()=>{const gw=Math.min(document.documentElement.clientWidth,document.documentElement.clientHeight);const style=document.getElementById("mainview").style;style.left=(document.documentElement.clientWidth-500)/2+"px";style.top=(document.documentElement.clientHeight-500)/2+"px";style.transform="scale("+gw/600+")";checkLink();document.getElementById("refresh").onclick=async()=>{window.location.reload()};document.getElementById("home").onclick=()=>{clk(HOME+"index.html")};document.getElementById("gitee").onclick=()=>{clk("https://lfz084.gitee.io/renju/")};document.getElementById("github").onclick=()=>{clk("https://lfz084.github.io/")};document.getElementById("renjumap").onclick=()=>{clk("https://renjumap.com/renjutool/index.html")};document.getElementById("url").innerHTML=window.location.href}}catch(e){alert(e.stack)}</script><div id="mainview"><div id="info"><h1 id="url"></h1><h1 id="log"></h1></br><button id="refresh">🔄</button></div><div id="link"><br><a id="home">网站首页</a></br><a id="gitee">国内网站gitee</a></br><a id="github">国外网站github</a></br><a id="renjumap">镜像站renjumap</a></br></div></div></body></html>`;
    const response_err_data = "Error 404, file not found.";
    const response_err_cache = "Error 404, file not found in cache";
    const request_reject = "Failed to fetch. request rejected";
    
    /** 加载进度功能, 通过监视 fetch 事件，与窗口通信 */
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
    
    //-------------------------- caches localStorage -----------------------------------
    
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
    	const _msg = `sw.js: formatURL("${url}")` //如果url是域名系统会自动加上"/"
    	url = url.split("?")[0].split("#")[0];
    	const URL_VERSION = getUrlVersion(version);
    	const indexHtml = url.split("/").pop().indexOf(".") == -1 ? (url.slice(-1) == "/" ? "" : "/") + "index.html" : "";
    	url = url + indexHtml + URL_VERSION
    	//postMsg(`${_msg} "${url}"`)
    	return url;
    }
    
    async function wait(timeout = 1000) {
    	return new Promise(resolve => setTimeout(resolve, timeout));
    }
    
    function setCacheVersion(version) {
    	cacheVersion !== version && postMsg(`serverWorker cacheVersion change:\n___Script Version: ${SCRIPT_VERSION}\n___cache Version: ${version}` );
    	return cacheVersion = version;
    }
    
    async function waitCurrentVersion() {
    	if (cacheVersion) return cacheVersion;
    	return caches.getItem("RENJU_APP_VERSION")
    		.then(newVersion => setCacheVersion(newVersion || SCRIPT_VERSION))
    }
    
    //-------------------------- change Version -----------------------------------
    
    /** reset App cache Version */
    waitCurrentVersion();
    
    /*
    function initCaches() {
    	return caches.open(cacheVersion)
    		.then(cache => cache.addAll(['./404.html']))
    }

    function deleteOldCaches() {
    	return caches.keys().then(cacheNames =>
    		Promise.all(
    			cacheNames.map(cacheName =>
    				// 如果当前版本和缓存版本不一致
    				cacheName !== cacheVersion && caches.delete(cacheName)
    			)
    		)
    	)
    }
    */
    
    //-------------------------- Request Response -----------------------------------
	
    /**
     * 从网络加载 response，如果没有找到，返回标记为404 错误的response
     */
    function onlyNet(url, version, clientID) {
    	const nRequest = new Request(url.split("?")[0].split("#")[0] + "?v=" + new Date().getTime(), requestInit);
    	load.loading(url, clientID);
    	return fetch(nRequest)
    		.then(response => {
    			load.finish(url);
    			return response;
    		})
    		.catch(err => {
    			load.finish(url);
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
    			return (response.constructor.name == "Response" && response.ok) ? response : Promise.reject();
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
    		postMsg(`fetchError >> caches.open`)
    		return loadCache(_URL, version, clientID)
    			.then(response => {
    				return response.ok ? response : Promise.reject();
    			})
    			.catch(() => {
    				postMsg(`fetchError >> new Response`);
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
    
    //-------------------------- upData Caches -----------------------------------

    function upData(files, version, clientID) {
    	return new Promise((resolve, reject) => {
    		let count = 0,
    			maxCount = 10;

    		function nextFile() {
    			if (files.length) {
    				let url = files.shift();
    				postMsg(`upData file: ${url}`)
    				cacheFirst(url, version, clientID)
    					.then(() => setTimeout(nextFile, 100))
    					.catch(() => {
    						if (count++ < maxCount) {
    							files.push(url);
    							setTimeout(nextFile, 100)
    						}
    						else reject()
    					})
    			}
    			else {
    				resolve()
    			}
    		}

    		caches.open(version)
    			.then(cache => cache.keys())
    			.then(keys => {
    				for (let i = 0; i < keys.length; i++) {
    					let index = files.indexOf(keys[i].url)
    					if (index + 1) files.splice(index, 1)
    				}
    			})
    			.then(nextFile)
    	})
    }
    
    //-------------------- add HTML code -------------------- 

    const tongjihtmlScript = '  <script>\n    var _hmt = _hmt || [];\n    (function(){\n      var hm = document.createElement("script");\n      hm.src = "https://hm.baidu.com/hm.js?c17b8a02edb4aff101e8b42ed01aca1b";\n      var s = document.getElementsByTagName("script")[0];\n      s.parentNode.insertBefore(hm,s)\n    })();\n  </script>'
    async function addHTMLCode(response) {
    	if (/\.html$|\.htm$/i.test(response.url.split("?")[0].split("#")[0])) {
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
    	//postMsg({ cmd: "alert", msg: `install, ${cacheVersion}, ${new Date().getTime()}` });
    });

    self.addEventListener('activate', function(event) {
    	//postMsg({ cmd: "alert", msg: `activate, ${cacheVersion}, ${new Date().getTime()}` })
    });
    
    self.addEventListener('fetch', function(event) {
    	event.respondWith(waitCurrentVersion().then(() => {
    		const _URL = formatURL(event.request.url, cacheVersion);
    		
    		postMsg(`请求资源 url=${_URL}`, event.clientID);
    		const rt = /\?cache\=onlyNet$|\?cache\=onlyCache$|\?cache\=netFirst$|\?cache\=cacheFirst$/.exec(event.request.url);
    		const key = null == rt ? "default" : rt[0];
    		const waitResponse = {
    			"?cache=onlyNet": onlyNet,
    			"?cache=onlyCache": loadCache,
    			"?cache=netFirst": netFirst,
    			"?cache=cacheFirst": cacheFirst,
    			"default": cacheFirst
    		}[key];
    		return waitResponse(_URL, cacheVersion, event.clientID)
    			.then(response => addHTMLCode(response));
    	}));
    });
    
    //--------------------------  message ---------------------------------
	
	const NUM_MAX_MSG = 1000;
	let delay = true;
	let delayMessages = [{
		msg: `serverWorker reboot:\n___url: ${new Request("sw.js").url}\n___Script Version: ${SCRIPT_VERSION}\n___cache Version: ${cacheVersion}`
	}];
	
	function delayMsg(msg, client) {
		(typeof msg == "object") && (msg = JSON.parse(JSON.stringify(msg)));
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
		delay = false;
		while (delayMessages.length && count++ < NUM_MAX_MSG) {
			const { msg, client } = delayMessages.shift();
			postMsg(msg, client);
		}
	}
    
    self.addEventListener('message', function(event) {
    	if (typeof event.data == "object") {
    		if (event.data.cmd == "postDelayMessages") {
    			postDelayMessages();
    			syncMsg(event.data, event.clientID)
    		}
    		else if (event.data.cmd == "NEW_VERSION") {
    			event.data["oldVersion"] = cacheVersion;
    			if (event.data.version != cacheVersion) {
    				event.data["versionChange"] = true;
    				cacheVersion = event.data.version;
    			}
    			syncMsg(event.data, event.clientID)
    		}
    		else if (event.data.cmd == "fetchTXT") {
    			let url = event.data.url.split("?")[0].split("#")[0];
    			fetch(new Request(url + "?v=" + new Date().getTime(), requestInit))
    				.then(response => {
    					return response.ok ? response.text() : Promise.reject(`response.ok = ${response.ok}`)
    				})
    				.then(text => {
    					Object.assign(event.data, {
    						type: "text",
    						text: text
    					});
    					syncMsg(event.data, event.clientID)
    				})
    				.catch(err => {
    					Object.assign(event.data, {
    						type: "text",
    						text: ""
    					});
    					syncMsg(event.data, event.clientID)
    				})
    		}
    		else if (event.data.cmd == "upData") {
    			let version = event.data.version;
    			let files = event.data.files.map(url => formatURL(url, version));
    			upData(files, version, event.clientID)
    				.then(() => {
    					syncMsg({ cmd: "upData", ok: true, version: version }, event.clientID)
    				})
    				.catch(err => {
    					syncMsg({ cmd: "upData", ok: false, version: version, error: err }, event.clientID)
    				})
    		}
    	}
    	else {
    		syncMsg(`serverWorker post: ${event.data}`, event.clientID)
    	}
    });
    
    