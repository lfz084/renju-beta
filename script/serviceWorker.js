window.serviceWorker = window.top.serviceWorker || (() => {
    "use strict";

    const TEST_SERVER_WORKER = false;
    const scriptURL = './sw.js';
    let serviceWorker_state;
    
    function updatefound() {
    	const registration = event.target;
    }
    
    function onmessage(event) {
    	if (new RegExp("^load finish|^loading\.\.\.").test(event.data.toString())) return;
    	TEST_SERVER_WORKER && window.DEBUG && (window.vConsole || window.parent.vConsole) && console.info(`serviceWorker.message: ${JSON.stringify(event.data).slice(0,100)}`);
    	if (event.data && event.data.cmd == "alert") alert(event.data.msg);
    }
    
    async function postMessage(msg, timeout = 3000) {
    	return new Promise(resolve => {
    		function onmessage() {
    			if (JSON.stringify(event.data.cmd) == JSON.stringify(msg)) {
    				rm(event.data);
    			}
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
            	window.reloadApp();
        	}
        }
    }
    
    async function removeServiceWorker() {
        return new Promise(resolve => {
            if ("serviceWorker" in navigator) {
                const ps = [];
                navigator.serviceWorker.getRegistrations()
                    .then(registrations => {
                        registrations.map(registration => {
                            if (window.location.href.indexOf(registration.scope) + 1) {
                                ps.push(registration.unregister())
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
    
    async function updateServiceWorker() {
        return new Promise(resolve => {
            if ("serviceWorker" in navigator) {
            	const ps = [];
                navigator.serviceWorker.getRegistrations()
                    .then(registrations => {
                        registrations.map(registration => {
                            if (window.location.href.indexOf(registration.scope) + 1) {
                                ps.push(registration.update());
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
