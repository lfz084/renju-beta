window.serviceWorker = window.parent.serviceWorker || (() => {
    "use strict";

    const TEST_SERVER_WORKER = true;
    const scriptURL = './sw.js';
    let serviceWorker_state;
    
    const COMMAND = {
    	alert: (data) => {
    		alert(data.msg)
    	},
    	log: (data) => {
    		console.log(data.msg)
    	},
    	info: (data) => {
    		console.info(data.msg)
    	},
    	error: (data) => {
    		console.error(data.msg)
    	},
    	copyToCurrentCache: async (data) => {
    		const up = await upData.searchUpdate();
    		if (up && up.action == "copyToCurrentCache") {
    			const msg = window.msg || window["fullscreenUI"] && fullscreenUI.contentWindow.msg;
    			const title = up.title + up.warn;
    			msg && msg({
    				title,
    				butNum: 2,
    				lineNum: title.split("\n").length + 2,
    				textAlign: "left",
    				enterTXT: "取消",
    				cancelTXT: "更新",
    				callEnter: () => { upData.delayCheckVersion() },
    				callCancel: () => { upData.copyToCurrentCache() }
    			})
    		}
    	},
    }
    
    function updatefound() {
    	/*
    	function search() {
    		if (window["upData"]) {
    			upData.searchUpdate();
    		}
    		else {
    			if (count++ < 5) setTimeout(search, 500);
    		}
    	}
    	let count = 0;
    	setTimeout(search, 0);
    	*/
    }
    
    function onmessage(event) {
    	if (new RegExp("^load finish|^loading\.\.\.").test(event.data.toString())) {
    		return;
    	}
    	else if (typeof event.data == "object") {
    		COMMAND[event.data.cmd] && COMMAND[event.data.cmd](event.data);
    	}
    	else {
    		TEST_SERVER_WORKER && window.DEBUG && (window.vConsole || window.parent.vConsole) && console.info(`serviceWorker.message: ${JSON.stringify(event.data).slice(0,200)}`);
    	}
    }
    
    function messageerror() {
    	console.error("Receive message from service worker failed!");
    }
    
    async function postMessage(msg, timeout = 5000) {
    	return new Promise(resolve => {
    		function onmessage() {
    			if (typeof msg == "object") {
    				if (event.data.cmd == msg.cmd && event.data.time == msg.time && JSON.stringify(event.data.args) == JSON.stringify(msg.args)) {
    					rm(event.data.resolve)
    				}
    			}
    			else rm(event.data.resolve)
    		}
    		function rm(rt) {
    			navigator.serviceWorker.removeEventListener("message", onmessage, true);
            	clearTimeout(timer);
            	resolve(rt);
    		}
    		let timer = null;
    		const time = new Date().getTime();
    		if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    			(typeof msg == "object") && (msg.time = time);
    			navigator.serviceWorker.addEventListener("message", onmessage, true);
            	navigator.serviceWorker.controller.postMessage(msg);
    			setTimeout(() => rm(), timeout);
    		}
    		else resolve()
    	})
    }

    async function registerServiceWorker() {
        const sWorker = await new Promise(resolve => {
            if ('serviceWorker' in navigator) {
            	let serviceWorker;
                
                function statechange(state) {
                    serviceWorker_state = state;
                    if (serviceWorker_state == "activated" ||
                        serviceWorker_state == "waiting" ||
                        serviceWorker_state == "redundant") 
                        resolve(serviceWorker)
                	console.warn(`serviceWorker.statechange: ${state}`)
                }

                function registerError(err) {
                    resolve()
                }
                
				navigator.serviceWorker.addEventListener("message", onmessage, true);
            	navigator.serviceWorker.addEventListener("messageerror", messageerror, true);
				navigator.serviceWorker.getRegistrations()
            		.then(registrations => {
            			registrations.map(registration => {
            				if (window.location.href.indexOf(registration.scope) + 1) {
            					registration.addEventListener("updatefound", updatefound, true);
            				}
            			})
            		})
            	if (navigator.serviceWorker.controller) {
            		resolve(navigator.serviceWorker.controller);
            		return;
            	}
                // 开始注册service workers
                navigator.serviceWorker.register(scriptURL, { scope: './', updateViaCache: `all` })
                    .then(registration => {
                    	    
                        if (registration.installing) {
                            serviceWorker = registration.installing;
                        } else if (registration.waiting) {
                            serviceWorker = registration.waiting;
                        } else if (registration.active) {
                            serviceWorker = registration.active;
                        }
                        if (serviceWorker) {
                            statechange(serviceWorker.state)
                            serviceWorker.addEventListener('statechange', e => statechange(e.target.state));
                            setTimeout(() => registerError("timeout"), 15 * 1000);
                        }
                        else registerError("serviceWorker: undefined")
                    })
                    .catch(registerError);
            }
            else resolve()
        })
        if (sWorker) {
			/** 首次使用 ServiceWorker 没有正常工作就刷新 */
        	if (!navigator.serviceWorker.controller) {
            	console.warn(`ServiceWorker 没有正常工作,刷新网页...`)
            	await window.reloadApp();
        	}
        }
    }
    
    async function removeServiceWorker(callback = ()=>{}) {
        return new Promise(resolve => {
            if ("serviceWorker" in navigator) {
                const ps = [];
                navigator.serviceWorker.getRegistrations()
                    .then(registrations => {
                        registrations.map(registration => {
                            if (window.location.href.indexOf(registration.scope) + 1) {
                                ps.push(registration.unregister());
                                callback(registration)
                            }
                        })
                    })
                    .then(() => Promise.all(ps))
                    .then(() => resolve())
                    .catch(() => {
                        resolve();
                        alert("删除serviceWorker失败")
                    })
            }
            else resolve()
        })
    }
    
    async function updateServiceWorker(callback = ()=>{}) {
        return new Promise(resolve => {
            if ("serviceWorker" in navigator) {
            	const ps = [];
                navigator.serviceWorker.getRegistrations()
                    .then(registrations => {
                        registrations.map(registration => {
                            if (window.location.href.indexOf(registration.scope) + 1) {
                                ps.push(registration.update());
                                callback(registration)
                            }
                        })
                    })
                    .then(() => Promise.all(ps))
                	.then(() => resolve(ps[0]))
                    .catch(() => {
                        resolve();
                    })
            }
            else resolve()
        })
    }
    
    return{
        get registerServiceWorker() {return registerServiceWorker},
        get removeServiceWorker() {return removeServiceWorker},
        get updateServiceWorker() {return updateServiceWorker},
        get postMessage() {return postMessage}
    }

})()
