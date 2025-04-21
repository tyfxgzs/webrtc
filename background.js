let pubwebrtc=false;
const isFirefox = /Firefox/.test(navigator.userAgent) || typeof InstallTrigger !== 'undefined';

chrome.tabs.onRemoved.addListener((tabId) => {
	chrome.storage.local.get(["refreshTabs"], (data) => {
		let refreshTabs = data.refreshTabs || {};
		if (refreshTabs[tabId]){
			if (refreshTabs[tabId]["timer"])chrome.alarms.clear(refreshTabs[tabId]["timer"]);
			delete refreshTabs[tabId];
			chrome.storage.local.set({ refreshTabs });
		}
	});
});

function setRefreshTimer(tabId, interval) {
    chrome.storage.local.get(["refreshTabs"], (data) => {
        let refreshTabs = data.refreshTabs || {};
		if (!refreshTabs[tabId]) refreshTabs[tabId]={};
		if (refreshTabs[tabId]["timer"])chrome.alarms.clear(refreshTabs[tabId]["timer"]);
		refreshTabs[tabId]["timer"]="auto"+tabId;
		chrome.alarms.create(refreshTabs[tabId]["timer"], {delayInMinutes: 0, periodInMinutes: interval/60});
		refreshTabs[tabId]["interval"] = interval;
        chrome.storage.local.set({ refreshTabs });
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { action, tabId, interval } = request;
    if (action === "start_refresh") {
        setRefreshTimer(tabId, interval);
    } else if (action === "stop_refresh") {
		chrome.storage.local.get(["refreshTabs"], (data) => {
			let refreshTabs = data.refreshTabs || {};
			if(refreshTabs[tabId]){
				if(refreshTabs[tabId]["timer"]){
					chrome.alarms.clear(refreshTabs[tabId]["timer"]);
					delete refreshTabs[tabId]["timer"];
					chrome.storage.local.set({ refreshTabs });
				}
			}
		})
    } else if (action === "start_webrtc") {
		webrtcfunc(true,true);
	} else if (action === "stop_webrtc") {
		webrtcfunc(false,true);
	}
	sendResponse({ success: true });
});

chrome.alarms.onAlarm.addListener((alarm) => {
	if (alarm.name.substr(0,4) == "auto") {
		let tabId=parseInt(alarm.name.substr(4));
		try{chrome.tabs.reload(tabId)}catch(e){}
	}
});

function webrtcaction() {
	chrome.storage.local.get({
		enabled: !pubwebrtc,
		eMode: isFirefox ? 'proxy_only' : 'disable_non_proxied_udp',
		dMode: 'default_public_interface_only'
	}, prefs => {
		const value = prefs.enabled ? prefs.eMode : prefs.dMode;
		chrome.privacy.network.webRTCIPHandlingPolicy.clear({}, () => {chrome.privacy.network.webRTCIPHandlingPolicy.set({value}, () => {chrome.privacy.network.webRTCIPHandlingPolicy.get({}, s => {})})});
	});
}

function webrtcfunc(v,s){
	let webrtc = v; pubwebrtc = webrtc;
	if (s) chrome.storage.local.set({ webrtc });
	webrtcaction();
}

function webrtcinit(){
	chrome.storage.onChanged.addListener(() => {webrtcaction()});
	chrome.storage.local.get(["webrtc"], (data) => {
		let webrtc = data.webrtc || false;
		webrtcfunc(webrtc,false);
	});
}

function clearStoredTabs() {
	let refreshTabs={};
	chrome.storage.local.set({ refreshTabs });
}

chrome.runtime.onStartup.addListener(() => {webrtcinit(); clearStoredTabs()});
chrome.runtime.onInstalled.addListener((details) => {webrtcinit(); if (details.reason === "install") clearStoredTabs()});
