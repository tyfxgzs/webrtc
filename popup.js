const strs=["start", "stop", "<font color=green>no WebRTC</font>", "<font color=red>have WebRTC</font>"]

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("onebutton");
	const wtn = document.getElementById("webrtc");
    const intervalInput = document.getElementById("interval");
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length === 0) return;
        const tabId = tabs[0].id;
		btn.innerHTML=strs[0];
		intervalInput.focus();intervalInput.select();
        chrome.storage.local.get(["refreshTabs"], (data) => {
            let refreshTabs = data.refreshTabs || {};
			if (refreshTabs[tabId]){
				if (refreshTabs[tabId]["interval"]){
					intervalInput.value = refreshTabs[tabId]["interval"];
					intervalInput.select();
				}
				if (refreshTabs[tabId]["timer"]) {
					btn.innerHTML=strs[1];btn.setAttribute("func","stop");
				}
			}
        });
        btn.addEventListener("click", () => {
			if (btn.getAttribute("func")){
				chrome.runtime.sendMessage({ action: "stop_refresh", tabId }, (response) => {
					btn.innerHTML=strs[0];btn.removeAttribute("func");
				});
			}else{
				if (isNaN(intervalInput.value) || intervalInput.value < 1) intervalInput.value=60;
				let interval = parseFloat(intervalInput.value);
				chrome.runtime.sendMessage({ action: "start_refresh", tabId, interval }, (response) => {
					btn.innerHTML=strs[1];btn.setAttribute("func","stop");
				});
			}
        });
        chrome.storage.local.get(["webrtc"], (data) => {
            let webrtc = data.webrtc || false;
			if (webrtc){
				wtn.innerHTML=strs[3];wtn.setAttribute("func","true");
			}else wtn.innerHTML=strs[2];
        });
        wtn.addEventListener("click", () => {
			if (wtn.getAttribute("func")){
				chrome.runtime.sendMessage({ action: "stop_webrtc", tabId }, (response) => {
					wtn.innerHTML=strs[2];wtn.removeAttribute("func");
				});
			}else{
				chrome.runtime.sendMessage({ action: "start_webrtc", tabId }, (response) => {
					wtn.innerHTML=strs[3];wtn.setAttribute("func","true");
				});
			}
        });
    });
});
