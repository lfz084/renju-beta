// import removeServiceWorker form "serviceWorker.js"
window.upData = window.top.upData || (function() {
    'use strict';
	const DEBUG_UPDATA = false;
    
    function log(param, type = "log") {
    	const print =  self["mlog"] && ((p) => {self["mlog"](p, type)}) || console.log;
    	DEBUG_UPDATA && window.DEBUG && (window.vConsole || window.parent.vConsole) && print(`[CheckerBoard.js]\n>>  ${ param}`);
    }
    
    const keyRenjuVersion = "RENJU_APP_VERSION";
    const elements = document.getElementsByTagName("version");
    const htmlVersion = elements ? elements[0].getAttribute("v") : "";
    const oldVersion = localStorage.getItem(keyRenjuVersion);
	const currentVersion = oldVersion || htmlVersion;
	
    let updataVersion;
    let checkVersion = isCheckVersion();
    let isLogNewVersionInfo = oldVersion != currentVersion;
    
    //-------------------------- caches localStorage -----------------------------------
    
    if ("caches" in self) {
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
    
    }
    
    //-------------------------------------------------------------------------------------
    
    async function wait(time) {
        return new Promise(resolve => {
            setTimeout(resolve, time);
        })
    }
    
    function absoluteURL(url) {
    	return new Request(url).url;
    }
    
    function delayCheckVersion() {
    	checkVersion = false;
    	localStorage.setItem("delayCheckVersion", new Date().getTime());
    }
    
    function isCheckVersion() {
    	const notUpDataTime = parseInt(localStorage.getItem("delayCheckVersion")) || 0;
        return (new Date().getTime() - notUpDataTime) > 24 * 3600 * 1000
    }
    
    async function ping(url) {
    	return new Promise(resolve => {
    		if ("navigator" in self) {
    			if (navigator.onLine === false) resolve(-2);
    		}
    		const time = new Date().getTime();
    		setTimeout(() => resolve(-1), 15 * 1000);
    		fetch(url.split("?=")[0].split("#")[0] + "?cache=onlyNet")
    			.then(response => response.ok ? resolve(new Date().getTime() - time) : resolve(-1))
    	})
    }
    
    async function checkLink() {
    	return ping("index.html").then(time => {
    		return time >= 0;
    	});
    }

    async function removeAppCache(filter = () => true) {
        if ("caches" in window) {
            const cacheNames = await caches.keys();
            cacheNames && cacheNames.map(cacheName => {
            	if(filter(cacheName)) {
            		caches.delete(cacheName)
            		log(`delete cache: ${cacheName}`, "info")
            	}
            })
        }
    }

    async function removeOldAppCache() {
        return removeAppCache(cacheName => cacheName != "settings" && cacheName != currentVersion && cacheName != htmlVersion && cacheName != updataVersion)
    }

    async function resetApp() {
    	if (!(await checkLink())) {
    		alert("网络异常");
    		return;
    	}
        await serviceWorker.updateServiceWorker()
        await postVersion(undefined)
        await removeAppCache()
    }

    function resetUpdataVersion() {
        localStorage.removeItem(keyRenjuVersion);
    }
    
    function saveAppVersion(version) {
    	caches.setItem(keyRenjuVersion, version);
    	localStorage.setItem(keyRenjuVersion, version);
    	localStorage.removeItem("delayCheckVersion");
    }

    function strLen(str, len, char = " ", align = "left") {
        if (align == "left") {
            return (str + new Array(len).join(char)).slice(0, len)
        }
        else {
            return (new Array(len).join(char) + str).slice(-len)
        }
    }

    async function logCache(cacheName, urls = []) {
        if ("caches" in window) {
            let cacheInfo = {};
            let num = 0;
            const cache = await caches.open(cacheName);
            const keys = cache ? await cache.keys() : [];
            urls = urls.map(url => decodeURIComponent(absoluteURL(url)));
    		if (keys.length < urls.length) {
            	typeof self.warn == "function" && warn(`️⚠ ️缓存异常 不能离线运行 刷新一下吧!`);
            	console.error(`upData.js: caches.open(${cacheName}).cache.keys().length == 0`)
            }
            cacheInfo[` [${cacheName}]`] = `${keys.length} / ${urls.length} 个文件 ______`;
            keys.forEach(request => {
            	const url = decodeURIComponent(request.url);
            	const index = urls.indexOf(url.replace(/\?v\=v[0-9]+\.*[0-9]*/i, ""));
            	index + 1 && urls.splice(index, 1);
            	cacheInfo[`000${++num}`.slice(-3)] = `${index + 1?"===":"+++"}\t${url.split("/").pop()}`;
            });
            urls.map(url => cacheInfo[`000${++num}`.slice(-3)] = `---${url}`);
            return cacheInfo;
        }
        return `"caches" in window === false`;
    }

    async function logCaches(urls) {
        if ("caches" in window) {
            let cachesInfo = {};
            let cacheInfo = {};
            const cachesNames = await caches.keys();
            if (cachesNames.length == 0) {
            	typeof self.warn == "function" && warn(`️⚠ ️缓存异常 不能离线运行 刷新一下吧!`);
            	console.error(`upData.js: caches.keys().length == 0`)
            }
            cachesInfo[`离线缓存 ${cachesNames.length} 个`] = cacheInfo;
            for (let index in cachesNames) {
            	const cacheName = cachesNames[index];
            	cacheInfo[cacheName] = await logCache(cacheName, (/v\d+\.*\d*/i).test(cacheName) ? urls : undefined);
            }
            return cachesInfo;
        }
        return `"caches" in window === false`;
    }

    function logVersions() {
        let Msg = ` checkVersion: ${checkVersion}\n`;
        Msg += `_____________________\n\n `;
        Msg += `${strLen("主页  ", 30)}  版本号: ${currentVersion}\n`;
        for (let key in window.SCRIPT_VERSIONS) {
            Msg += `${strLen(key + ".js  ", 20, "-")}  版本号: ${window.SCRIPT_VERSIONS[key]}\n`;
        }
        Msg += `_____________________\n\n `;
        return Msg;
    }

    async function checkScriptVersion(filename) {
        const ver = window.SCRIPT_VERSIONS[filename];
        log(`checkScriptVersion [${[filename, ver || "undefined"]}]`, "info");
        if (ver && (ver != currentVersion)) {
            const ERR = `reload`;
            const ASK = `版本号不一致，可能影响正常运行\n_____________________\n\n${strLen("主页", 25)}版本号: ${currentVersion} \n${strLen(filename + ".js", 25)}版本号: ${window.SCRIPT_VERSIONS[filename]} \n_____________________\n\n`;
            const PS = `是否更新？\n\n${strLen("",15)}[取消] = 不更新${strLen("",10)}[确定] = 更新`;
            if (checkVersion && confirm(ASK + PS)) {
                await resetApp()
                resetUpdataVersion();
                window.reloadApp();
            }
            else {
                checkVersion && delayCheckVersion();
            }
        }
    }

    async function checkAppVersion() {
        log(`checkAppVersion {currentVersion: ${currentVersion}, htmlVersion: ${htmlVersion}}`, "info")
        if ("localStorage" in window) {
            const ASK = `有新的更新\n\n 当前版本号: ${currentVersion} \n 新的版本号: ${htmlVersion}\n${logVersionInfo(htmlVersion)}\n`;
            const PS = `是否更新？\n\n${strLen("",15)}[取消] = 不更新${strLen("",10)}[确定] = 更新`;
            if (currentVersion != htmlVersion) {
                if (checkVersion && confirm(ASK + PS)) {
                    if (!(await checkLink())) {
                    	alert("网络异常");
                    	return;
                    }
                    await serviceWorker.updateServiceWorker();
                    await postVersion(undefined)
                    await removeAppCache();
                    resetUpdataVersion();
                    window.reloadApp()
                }
                else {
                    checkVersion && delayCheckVersion();
                }
            }
        }
    }
    
    async function resetAndUpData() {
    	if (!(await checkLink())) {
    		alert("网络异常");
    		return;
    	}
    	await serviceWorker.updateServiceWorker();
    	await postVersion(undefined)
        await removeAppCache();
        resetUpdataVersion();
        window.reloadApp();
    }

    async function postVersion(newVersion) {
        return new Promise(resolve => {
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                let timer;
                
                function onmessage(event) {
                	const MSG = event.data;
                	if (typeof MSG == "object" && MSG.cmd == "NEW_VERSION" && MSG.version == newVersion) {
                		log(`serviceWorker.onmessage: NEW_VERSION = ${MSG.version}, oldVersion: ${MSG.oldVersion}`, "info");
                		rm();
                	}
                	else {
                		log(`serviceWorker.onmessage: ${JSON.stringify(MSG)}`, "info");
                	}
                }

                function rm() {
                	navigator.serviceWorker.removeEventListener("message", onmessage);
                	clearTimeout(timer);
                    resolve();
                }
            	navigator.serviceWorker.addEventListener("message", onmessage);
                navigator.serviceWorker.controller.postMessage({ cmd: "NEW_VERSION", version: newVersion });
                log(`upData.postVersion: ${newVersion}`, "info");
                timer = setTimeout(() => {
                    log("postVersion Timeout", "error");
                    rm();
                }, 3 * 1000);
            }
            else {
                resolve();
            }
        })
    }

    async function fetchTXT(url, timeout = 30 * 1000) {
        url = absoluteURL(url);
        return new Promise(resolve => {
            let text = "";
            let timer;
            const cmd = "fetchTXT";
            const time = new Date().getTime();

            function onmessage(event) {
            	if (typeof event.data == "object" &&
            		event.data.type == "text" &&
            		event.data.cmd == cmd &&
            		event.data.time == time &&
            		event.data.url == url
            	){
            		text = event.data.text;
            		rm();
            	}
            }
            
            function rm() {
                navigator.serviceWorker.removeEventListener("message", onmessage);
                clearTimeout(timer);
                resolve(text);
            }

            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            	navigator.serviceWorker.addEventListener("message", onmessage);
                navigator.serviceWorker.controller.postMessage({ cmd, url, time });
                timer = setTimeout(rm, timeout);
            }
            else {
                resolve(text);
            }
        })
    }

    async function getUpDataVersion() {
        const txt = await fetchTXT("sw.js");
        const versionCode = (/\"v\d+\.*\d*\"/i).exec(txt);
        const version = versionCode ? String(versionCode).split(/[\"\;]/)[1] : undefined;
        updataVersion = version;
        return {
            version: version,
            isNewVersion: version && version != currentVersion
        }
    }

    async function upData() { // find UpData open msg
        return new Promise(async (resolve) => {
            async function upEnd(e) {
                if (typeof e.data == "object" && e.data.cmd == "upData") {
                    if (e.data.ok) {
                        console.info(`更新完成 ${e.data.version}`)
                        resetUpdataVersion();
                        await removeOldAppCache();
                        resolve(true);
                    }
                    else {
                        console.error(`更新失败 ${e.data.version} : ${e.data.error}`);
                        resolve(false);
                    }
                    navigator.serviceWorker.removeEventListener("message", upEnd);
                }
            }

            function postUpData(version) {
                console.info(`upData ${version}`);
                const MSG = {
                    cmd: "upData",
                    version: version,
                    files: Object.keys(window.SOURCE_FILES).map(key => absoluteURL(window.SOURCE_FILES[key]))
                }
                navigator.serviceWorker.addEventListener("message", upEnd);
                navigator.serviceWorker.controller.postMessage(MSG);
            }

            if ("caches" in self && "serviceWorker" in navigator && navigator.serviceWorker.controller) {
                const version = await getUpDataVersion();
                if (version.isNewVersion) postUpData(version.version)
                else resolve(true)
            }
            else resolve(true)
        })
    }

    async function autoUpData() {
        if ("serviceWorker" in navigator) {
            let count = 0;
            await wait(5 * 1000);
            while (!(await upData()) && 5 > count++) {
                await wait(30 * 1000);
            }
        }
        console.info("结束更新");
    }

    function logVersionInfo(version = currentVersion, UPDATA_INFO = window.UPDATA_INFO) {
    	function lineWrap(str) {
    		return str.split(/\\n|<br>/).join("\n")
    	}
    	
    	let infoArr = UPDATA_INFO[version],
    		Msg = "";
    	if (infoArr) {
    		Msg += `\n _____________________ `;
    		Msg += `\n 版本： ${version}\n`;
    		for (let i = 0; i < infoArr.length; i++)
    			Msg += `\n${strLen(i+1, 2)}. ${lineWrap(infoArr[i])}`
    		Msg += `\n _____________________ `;
    	}
    	return Msg;
    }
    
    function logUpDataCompleted() {
    	if ("localStorage" in window) {
    		if (isLogNewVersionInfo && checkVersion) {
    			let Msg = "";
    			Msg += `摆棋小工具 更新完毕`
    			Msg += logVersionInfo();
    			isLogNewVersionInfo = false;
    			return Msg;
    		}
    	}
    	return "";
    }
    
    const myInit = {cache: "no-store", mode: 'cors'};
    
    function getUrlVersion(version) {
    	return "?v=" + version;
    }
    
    function formatURL(url, version) {
    	url = (absoluteURL(url).split("?")[0]).split("#")[0];
    	const URL_VERSION = getUrlVersion(version);
    	const indexHtml = url.split("/").pop().indexOf(".") == -1 ? (url.slice(-1) == "/" ? "" : "/") + "index.html" : "";
    	return url + indexHtml + URL_VERSION
    }
    
    function checkServiceWorkerAndCaches() {
    	if (!('serviceWorker' in navigator)) {
    		console.warn(`upData.js: checkServiceWorkerAndCaches 'serviceWorker' in navigator = false`)
    		return false;
    	}
    	if(!navigator.serviceWorker.controller) {
    		console.warn(`upData.js: checkServiceWorkerAndCaches navigator.serviceWorker.controller = ${navigator.serviceWorker.controller}`)
    		return false;
    	}
    	if(!("caches" in window)) {
    		console.warn(`upData.js: checkServiceWorkerAndCaches "caches" in window = false`)
    		return false;
    	}
    	return true;
    }
    
    async function isFinally(promise) {
    	let isF = true,
    		t = {};
    	await Promise.race([promise, t])
    		.then(v => v === t && (isF = false))
    	return isF;
    }
    
	async function removeFinallyPromise(promiseArray) {
		for (let j = promiseArray.length - 1; j >= 0; j--) {
			if (await isFinally(promiseArray[j])) {
				promiseArray.splice(j, 1);
			}
		}
	} 
    
    async function openCache(version) {
    	return await caches.open(version)
    }
    
    async function loadCache(cache, url) {
    	log(`upData.js: loadCache ${url}`)
    	return await cache.match(new Request(url, myInit));
    }
    
    async function putCache(cache, url, response) {
    	log(`upData.js: putCache ${url}`)
    	return await cache.put(new Request(url, myInit), response)
    }
    
    async function downloadToCache(url, cache) {
    	try{
			const response = await fetch(new Request(url.split("?")[0] + "?v=" + new Date().getTime(), myInit));
    		if (response.ok) {
    			await putCache(cache, url, response);
    			return await loadCache(cache, url)
    		}
    		else throw new Error(`response.ok = ${response.ok}`)
    	}catch(e){
    		console.error(`upData.js: downloadToCache ${e.stack}, url = ${url}`);
    		return false
    	}
    }
    
    async function saveCacheFile(url, cache, version = currentVersion) {
    	if(!checkServiceWorkerAndCaches()) return;
    	const response = await loadCache(cache, url);
    	if (response) {
    		log(`upData.js: saveCacheFile loaded "${url}" in cache ${version}`, "info")
    		return 2;
    	}
    	else {
    		return !!await downloadToCache(url, cache) ? 1 : 0;
    	}
    }
    
    async function saveCacheFiles(urls, version = currentVersion) {
    	if(!checkServiceWorkerAndCaches()) return;
    	urls = urls.map(url => formatURL(absoluteURL(url), version));
    	
    	window.loadAnimation && (loadAnimation.open(), loadAnimation.lock(true));
    	const cache = await openCache(version);
    	
    	const numFiles = urls.length;
    	const errUrls = [];
    	const ps = [];
    	let countFiles = 0;
    	
    	const waitSaveCacheFile = async () => { 
    			const url = urls.shift();
    			const rt = await saveCacheFile(url, cache);
    			rt == 0 && errUrls.push(url);
    			rt === 1 && window.loadAnimation && loadAnimation.text(`下载离线资源<br> ${++countFiles} / ${numFiles}`)
    		}
    		
    	while (urls.length) {
    		if (ps.length < 6) {
    			ps.push(waitSaveCacheFile());
    		}
    		else {
    			await Promise.race(ps);
    			await removeFinallyPromise(ps);
    		}
    	}
    	await Promise.all(ps);
    	
    	console[errUrls.length ? "error" : "info"](`upData.js: saveCacheFiles finish ${errUrls.length} error in ${numFiles} urls \n${errUrls.join("\n")}`)
    	window.loadAnimation && (loadAnimation.lock(false),loadAnimation.close());
    }

    return {
        get isCheckVersion() { return isCheckVersion },
        get delayCheckVersion() { return delayCheckVersion },
    	
        get removeAppCache() { return removeAppCache },
        get removeOldAppCache() { return removeOldAppCache },
        get resetAndUpData() { return resetAndUpData },
        get getUpDataVersion() { return getUpDataVersion },
        get upData() { return upData },
        get autoUpData() { return autoUpData },
        get postVersion() { return postVersion },
        get checkAppVersion() { return checkAppVersion },
        get checkScriptVersion() { return checkScriptVersion },
        get resetApp() { return resetApp },
        get fetchTXT() { return fetchTXT },
        get currentVersion() { return currentVersion},
        get saveAppVersion() { return saveAppVersion },
        get saveCacheFiles() { return saveCacheFiles },
        
        get logCache() { return logCache },
        get logCaches() { return logCaches },
        get logVersions() { return logVersions },
        get logVersionInfo() { return logVersionInfo },
        get logUpDataCompleted() { return logUpDataCompleted }
    }
})()
