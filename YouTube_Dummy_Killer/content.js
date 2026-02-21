(function(){"use strict";async function $(e){return new Promise((t,n)=>{chrome.runtime.sendMessage(e,o=>{chrome.runtime.lastError?n(new Error(chrome.runtime.lastError.message)):o!=null&&o.success?t(o.data):n(new Error((o==null?void 0:o.error)||"Unknown error"))})})}function F(e){return typeof e=="string"?e:e instanceof Date&&!isNaN(e.getTime())?e.toISOString():new Date().toISOString()}function M(e){return e instanceof Date?e:typeof e=="string"?new Date(e):new Date}async function W(e){try{const t={...e,publishedAt:F(e.publishedAt)},n=await $({type:"FIND_ORIGINAL",currentVideo:t});return n?{...n,publishedAt:M(n.publishedAt)}:null}catch{return null}}function H(){try{const t=new URLSearchParams(window.location.search).get("v");if(!t)return null;const n=G(t);return n||J(t)}catch{return null}}function G(e){var t,n,o,a;try{const i=document.querySelector("h1.ytd-video-primary-info-renderer yt-formatted-string")||document.querySelector("h1.ytd-watch-metadata yt-formatted-string"),c=((t=i==null?void 0:i.textContent)==null?void 0:t.trim())||document.title.replace(" - YouTube",""),d=document.querySelector("#owner #channel-name a")||document.querySelector("ytd-channel-name a"),s=((n=d==null?void 0:d.textContent)==null?void 0:n.trim())||"",l=(d==null?void 0:d.getAttribute("href"))||"",y=((o=l.match(/\/channel\/([^/?]+)/))==null?void 0:o[1])||((a=l.match(/\/@([^/?]+)/))==null?void 0:a[1])||"",h=document.querySelectorAll("#info-strings yt-formatted-string");let k=new Date;for(const f of h){const b=f.textContent||"",p=L(b);if(p.getTime()!==new Date().getTime()){k=p;break}}return c&&s?{videoId:e,title:c,channelId:y,channelName:s,publishedAt:k,thumbnailUrl:`https://i.ytimg.com/vi/${e}/hqdefault.jpg`}:null}catch{return null}}function J(e){var t,n,o,a,i,c,d,s,l,y,h,k,f,b,p,x,C,B,z,U,Y,q,j;try{const g=window.ytInitialData;if(!g)return null;const w=(c=(i=(a=(o=(n=(t=g==null?void 0:g.contents)==null?void 0:t.twoColumnWatchNextResults)==null?void 0:n.results)==null?void 0:o.results)==null?void 0:a.contents)==null?void 0:i[0])==null?void 0:c.videoPrimaryInfoRenderer,v=(b=(f=(k=(h=(y=(l=(s=(d=g==null?void 0:g.contents)==null?void 0:d.twoColumnWatchNextResults)==null?void 0:s.results)==null?void 0:l.results)==null?void 0:y.contents)==null?void 0:h[1])==null?void 0:k.videoSecondaryInfoRenderer)==null?void 0:f.owner)==null?void 0:b.videoOwnerRenderer,ue=((C=(x=(p=w==null?void 0:w.title)==null?void 0:p.runs)==null?void 0:x[0])==null?void 0:C.text)||document.title,he=((z=(B=v==null?void 0:v.navigationEndpoint)==null?void 0:B.browseEndpoint)==null?void 0:z.browseId)||"",fe=((q=(Y=(U=v==null?void 0:v.title)==null?void 0:U.runs)==null?void 0:Y[0])==null?void 0:q.text)||"",ye=((j=w==null?void 0:w.dateText)==null?void 0:j.simpleText)||"",pe=L(ye);return{videoId:e,title:ue,channelId:he,channelName:fe,publishedAt:pe,thumbnailUrl:`https://i.ytimg.com/vi/${e}/hqdefault.jpg`}}catch{return null}}function L(e){if(!e)return new Date;const t=e.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);if(t)return new Date(parseInt(t[1],10),parseInt(t[2],10)-1,parseInt(t[3],10));const n=e.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);return n?new Date(parseInt(n[1],10),parseInt(n[2],10)-1,parseInt(n[3],10)):new Date}const K={enabled:!0,autoBlock:!1,showNotification:!0,minDateDifferenceHours:24};async function A(){const e=await chrome.storage.local.get(["blockedChannels","settings"]);return{blockedChannels:e.blockedChannels||[],settings:{...K,...e.settings}}}async function R(){const{blockedChannels:e}=await A();return e}async function X(e){const t=await R();t.some(n=>n.channelId===e.channelId)||(t.push(e),await chrome.storage.local.set({blockedChannels:t}))}async function Z(e){return(await R()).some(n=>n.channelId===e)}async function Q(){const{settings:e}=await A();return e}function ee(e){try{const t=new URL(e);if(t.protocol==="https:"||t.protocol==="http:")return t.href}catch{}return""}function D(e){return/^[a-zA-Z0-9_-]{11}$/.test(e)}function te(e){const t=typeof e=="string"?new Date(e):e;return isNaN(t.getTime())?"日付不明":t.toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric"})}function ne(e,t){let n=null;return()=>{n&&clearTimeout(n),n=setTimeout(e,t)}}function oe(e){return new Promise(t=>setTimeout(t,e))}function r(e,t={},n=[]){const o=document.createElement(e);for(const[a,i]of Object.entries(t))a==="class"?o.className=i:o.setAttribute(a,i);for(const a of n)o.appendChild(typeof a=="string"?document.createTextNode(a):a);return o}const u={PLAYER_CONTAINER:"#player-container-outer",VIDEO_RENDERERS:"ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer",CHANNEL_LINK:'a[href*="/channel/"], a[href*="/@"]',OVERLAY_ID:"yt-dummy-killer-overlay",STYLE_ID:"yt-dummy-killer-styles"};function ae(...e){}const re=`
#yt-dummy-killer-overlay {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 9999;
  font-family: 'Roboto', 'Noto Sans JP', sans-serif;
}
.ydk-container {
  background: #1a1a1a;
  border: 1px solid #ff4444;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  width: 360px;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
.ydk-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #ff4444, #cc0000);
  color: white;
}
.ydk-icon { font-size: 20px; }
.ydk-title { flex: 1; font-weight: 600; font-size: 14px; }
.ydk-close {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.8;
}
.ydk-close:hover { opacity: 1; }
.ydk-content { padding: 16px; }
.ydk-section { margin-bottom: 16px; }
.ydk-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.ydk-video-link {
  display: flex;
  gap: 12px;
  text-decoration: none;
  color: inherit;
  padding: 8px;
  background: #2a2a2a;
  border-radius: 8px;
  transition: background 0.2s;
}
.ydk-video-link:hover { background: #3a3a3a; }
.ydk-thumbnail {
  width: 120px;
  height: 68px;
  object-fit: cover;
  border-radius: 4px;
}
.ydk-video-info { flex: 1; min-width: 0; }
.ydk-video-title {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 4px;
}
.ydk-channel { font-size: 12px; color: #aaa; margin-bottom: 2px; }
.ydk-date { font-size: 11px; color: #888; }
.ydk-actions { display: flex; flex-direction: column; gap: 8px; }
.ydk-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.ydk-btn-primary { background: #3ea6ff; color: #000; }
.ydk-btn-primary:hover { background: #65b8ff; }
.ydk-btn-danger { background: #ff4444; color: white; }
.ydk-btn-danger:hover { background: #ff6666; }
.ydk-btn-secondary { background: #3a3a3a; color: #fff; }
.ydk-btn-secondary:hover { background: #4a4a4a; }
.ydk-blocked .ydk-container { border-color: #666; }
.ydk-blocked .ydk-header { background: linear-gradient(135deg, #666, #444); }
.ydk-blocked-container { text-align: center; }
.ydk-blocked-container p { color: #ccc; margin: 0 0 16px; font-size: 14px; }
.ydk-blocked-container .ydk-actions { flex-direction: row; justify-content: center; }
`;let E=null,O=location.href,T=null,S=new Set,I=null;function ie(){if(document.getElementById(u.STYLE_ID))return;const e=document.createElement("style");e.id=u.STYLE_ID,e.textContent=re,document.head.appendChild(e)}async function ce(){ie(),(await Q()).enabled&&(await V(),de(),document.addEventListener("yt-navigate-finish",()=>{N()}),window.addEventListener("popstate",()=>{N()}),await _())}async function V(){const t=(await chrome.storage.local.get("blockedChannels")).blockedChannels||[];S=new Set(t.map(n=>n.channelId))}function de(){I&&I.disconnect();const e=ne(()=>{location.href!==O&&(O=location.href,N()),se()},300);I=new MutationObserver(e),I.observe(document.body,{childList:!0,subtree:!0})}function N(){const e=new URLSearchParams(location.search).get("v");e!==T&&(T=e,E=null,setTimeout(()=>_(),1e3)),location.pathname.startsWith("/watch")||m()}function se(){if(S.size===0)return;document.querySelectorAll(u.VIDEO_RENDERERS).forEach(t=>{var i,c;const n=t.querySelector(u.CHANNEL_LINK);if(!n)return;const o=n.getAttribute("href")||"",a=((i=o.match(/\/channel\/([^/?]+)/))==null?void 0:i[1])||((c=o.match(/\/@([^/?]+)/))==null?void 0:c[1]);a&&S.has(a)&&(t.style.display="none")})}async function _(){if(!location.pathname.startsWith("/watch")){m();return}const t=new URLSearchParams(location.search).get("v");if(t===E)return;E=t,await oe(1500);const n=H();if(!n)return;if(await Z(n.channelId)){P(n);return}const a=await W(n);a?(ae("Found potential original:",a.videoId),le(n,a)):m()}function le(e,t){m();const n=D(t.videoId)?`https://www.youtube.com/watch?v=${t.videoId}`:"#",o=ee(t.thumbnailUrl),a=document.createElement("div");a.id=u.OVERLAY_ID;const i=r("div",{class:"ydk-container"}),c=r("div",{class:"ydk-header"},[r("span",{class:"ydk-icon"},["⚠"]),r("span",{class:"ydk-title"},["パクリ動画の可能性があります"])]),d=r("button",{class:"ydk-close"},["×"]);d.addEventListener("click",m,{once:!0}),c.appendChild(d);const s=r("div",{class:"ydk-content"}),l=r("div",{class:"ydk-section"},[r("div",{class:"ydk-label"},["オリジナル（推定）"])]),y=r("a",{href:n,class:"ydk-video-link"}),h=document.createElement("img");h.className="ydk-thumbnail",h.alt="",o&&(h.src=o),y.appendChild(h);const k=r("div",{class:"ydk-video-info"},[r("div",{class:"ydk-video-title"},[t.title]),r("div",{class:"ydk-channel"},[t.channelName]),r("div",{class:"ydk-date"},[te(t.publishedAt)])]);y.appendChild(k),l.appendChild(y),s.appendChild(l);const f=r("div",{class:"ydk-actions"}),b=r("button",{class:"ydk-btn ydk-btn-primary"},["オリジナルを見る"]);b.addEventListener("click",()=>{D(t.videoId)&&(window.location.href=`https://www.youtube.com/watch?v=${t.videoId}`)},{once:!0});const p=r("button",{class:"ydk-btn ydk-btn-danger"},["このチャンネルをブロック"]);p.addEventListener("click",async()=>{const C={channelId:e.channelId,channelName:e.channelName,blockedAt:new Date,reason:`パクリ動画: ${e.title}`};await X(C),await V(),P(e)},{once:!0});const x=r("button",{class:"ydk-btn ydk-btn-secondary"},["閉じる"]);x.addEventListener("click",m,{once:!0}),f.appendChild(b),f.appendChild(p),f.appendChild(x),s.appendChild(f),i.appendChild(c),i.appendChild(s),a.appendChild(i),document.body.appendChild(a)}function P(e){m();const t=document.createElement("div");t.id=u.OVERLAY_ID,t.className="ydk-blocked";const n=r("div",{class:"ydk-container ydk-blocked-container"}),o=r("div",{class:"ydk-header"},[r("span",{class:"ydk-icon"},["🚫"]),r("span",{class:"ydk-title"},["ブロック済みチャンネル"])]),a=r("div",{class:"ydk-content"}),i=r("p",{},[`「${e.channelName}」はブロックされています。`]);a.appendChild(i);const c=r("div",{class:"ydk-actions"}),d=r("button",{class:"ydk-btn ydk-btn-secondary"},["前のページに戻る"]);d.addEventListener("click",()=>history.back(),{once:!0});const s=r("button",{class:"ydk-btn ydk-btn-secondary"},["ホームに戻る"]);s.addEventListener("click",()=>{window.location.href="https://www.youtube.com/"},{once:!0}),c.appendChild(d),c.appendChild(s),a.appendChild(c),n.appendChild(o),n.appendChild(a),t.appendChild(n),document.body.appendChild(t);const l=document.querySelector(u.PLAYER_CONTAINER);l&&(l.style.display="none")}function m(){const e=document.getElementById(u.OVERLAY_ID);e&&e.remove();const t=document.querySelector(u.PLAYER_CONTAINER);t&&(t.style.display="")}ce()})();
