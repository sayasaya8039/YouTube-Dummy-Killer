(function(){"use strict";async function z(e){return new Promise((t,n)=>{chrome.runtime.sendMessage(e,o=>{chrome.runtime.lastError?n(new Error(chrome.runtime.lastError.message)):o!=null&&o.success?t(o.data):n(new Error((o==null?void 0:o.error)||"Unknown error"))})})}function R(e){return typeof e=="string"?e:e instanceof Date&&!isNaN(e.getTime())?e.toISOString():new Date().toISOString()}function V(e){return e instanceof Date?e:typeof e=="string"?new Date(e):new Date}async function Y(e){try{const t={...e,publishedAt:R(e.publishedAt)},n=await z({type:"FIND_ORIGINAL",currentVideo:t});return n?{...n,publishedAt:V(n.publishedAt)}:null}catch(t){return console.error("findOriginalVideo failed:",t),null}}function q(){try{const t=new URLSearchParams(window.location.search).get("v");if(!t)return null;const n=U(t);return n||$(t)}catch(e){return console.error("Failed to get current video info:",e),null}}function U(e){var t,n,o,r;try{const a=document.querySelector("h1.ytd-video-primary-info-renderer yt-formatted-string")||document.querySelector("h1.ytd-watch-metadata yt-formatted-string"),c=((t=a==null?void 0:a.textContent)==null?void 0:t.trim())||document.title.replace(" - YouTube",""),i=document.querySelector("#owner #channel-name a")||document.querySelector("ytd-channel-name a"),d=((n=i==null?void 0:i.textContent)==null?void 0:n.trim())||"",s=(i==null?void 0:i.getAttribute("href"))||"",l=((o=s.match(/\/channel\/([^/?]+)/))==null?void 0:o[1])||((r=s.match(/\/@([^/?]+)/))==null?void 0:r[1])||"",p=document.querySelectorAll("#info-strings yt-formatted-string");let k=new Date;for(const v of p){const w=v.textContent||"",b=I(w);if(b.getTime()!==new Date().getTime()){k=b;break}}return c&&d?{videoId:e,title:c,channelId:l,channelName:d,publishedAt:k,thumbnailUrl:`https://i.ytimg.com/vi/${e}/hqdefault.jpg`}:null}catch{return null}}function $(e){var t,n,o,r,a,c,i,d,s,l,p,k,v,w,b,D,E,L,N,O,B,A,P;try{const u=window.ytInitialData;if(!u)return null;const m=(c=(a=(r=(o=(n=(t=u==null?void 0:u.contents)==null?void 0:t.twoColumnWatchNextResults)==null?void 0:n.results)==null?void 0:o.results)==null?void 0:r.contents)==null?void 0:a[0])==null?void 0:c.videoPrimaryInfoRenderer,h=(w=(v=(k=(p=(l=(s=(d=(i=u==null?void 0:u.contents)==null?void 0:i.twoColumnWatchNextResults)==null?void 0:d.results)==null?void 0:s.results)==null?void 0:l.contents)==null?void 0:p[1])==null?void 0:k.videoSecondaryInfoRenderer)==null?void 0:v.owner)==null?void 0:w.videoOwnerRenderer,ee=((E=(D=(b=m==null?void 0:m.title)==null?void 0:b.runs)==null?void 0:D[0])==null?void 0:E.text)||document.title,te=((N=(L=h==null?void 0:h.navigationEndpoint)==null?void 0:L.browseEndpoint)==null?void 0:N.browseId)||"",ne=((A=(B=(O=h==null?void 0:h.title)==null?void 0:O.runs)==null?void 0:B[0])==null?void 0:A.text)||"",oe=((P=m==null?void 0:m.dateText)==null?void 0:P.simpleText)||"",re=I(oe);return{videoId:e,title:ee,channelId:te,channelName:ne,publishedAt:re,thumbnailUrl:`https://i.ytimg.com/vi/${e}/hqdefault.jpg`}}catch{return null}}function I(e){if(!e)return new Date;const t=e.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);if(t)return new Date(parseInt(t[1],10),parseInt(t[2],10)-1,parseInt(t[3],10));const n=e.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);return n?new Date(parseInt(n[1],10),parseInt(n[2],10)-1,parseInt(n[3],10)):new Date}const K={enabled:!0,autoBlock:!1,showNotification:!0,minDateDifferenceHours:24};async function S(){const e=await chrome.storage.local.get(["blockedChannels","settings"]);return{blockedChannels:e.blockedChannels||[],settings:{...K,...e.settings}}}async function T(){const{blockedChannels:e}=await S();return e}async function M(e){const t=await T();t.some(n=>n.channelId===e.channelId)||(t.push(e),await chrome.storage.local.set({blockedChannels:t}))}async function j(e){return(await T()).some(n=>n.channelId===e)}async function F(){const{settings:e}=await S();return e}const H=`
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
`;let f=null;function W(){const e="yt-dummy-killer-styles";if(document.getElementById(e))return;const t=document.createElement("style");t.id=e,t.textContent=H,document.head.appendChild(t)}async function G(){if(console.log("[YouTube Dummy Killer] Initializing..."),W(),!(await F()).enabled){console.log("[YouTube Dummy Killer] Disabled");return}J(),await g()}function J(){let e=location.href,t=null;document.addEventListener("yt-navigate-finish",()=>{console.log("[YouTube Dummy Killer] yt-navigate-finish detected");const o=new URLSearchParams(location.search).get("v");o!==t&&(t=o,f=null,setTimeout(()=>g(),1e3))}),window.addEventListener("popstate",()=>{console.log("[YouTube Dummy Killer] popstate detected"),f=null,setTimeout(()=>g(),500)}),new MutationObserver(()=>{if(location.href!==e){e=location.href;const o=new URLSearchParams(location.search).get("v");o!==t&&(t=o,f=null,setTimeout(()=>g(),1500))}}).observe(document.body,{childList:!0,subtree:!0})}async function g(){if(!location.pathname.startsWith("/watch")){y();return}const t=new URLSearchParams(location.search).get("v");if(t===f)return;f=t,console.log("[YouTube Dummy Killer] Checking video:",t),await Q(1500);const n=q();if(!n){console.log("[YouTube Dummy Killer] Could not get video info");return}if(await j(n.channelId)){console.log("[YouTube Dummy Killer] Channel is blocked"),C(n);return}const r=await Y(n);r?(console.log("[YouTube Dummy Killer] Found potential original:",r),X(n,r)):(console.log("[YouTube Dummy Killer] No older video found"),y())}function X(e,t){var o,r,a,c;y();const n=document.createElement("div");n.id="yt-dummy-killer-overlay",n.innerHTML=`
    <div class="ydk-container">
      <div class="ydk-header">
        <span class="ydk-icon">&#9888;</span>
        <span class="ydk-title">パクリ動画の可能性があります</span>
        <button class="ydk-close" id="ydk-close">&times;</button>
      </div>
      <div class="ydk-content">
        <div class="ydk-section">
          <div class="ydk-label">オリジナル（推定）</div>
          <a href="https://www.youtube.com/watch?v=${t.videoId}" class="ydk-video-link">
            <img src="${t.thumbnailUrl}" class="ydk-thumbnail" alt="">
            <div class="ydk-video-info">
              <div class="ydk-video-title">${x(t.title)}</div>
              <div class="ydk-channel">${x(t.channelName)}</div>
              <div class="ydk-date">${_(t.publishedAt)}</div>
            </div>
          </a>
        </div>
        <div class="ydk-actions">
          <button class="ydk-btn ydk-btn-primary" id="ydk-goto-original">
            オリジナルを見る
          </button>
          <button class="ydk-btn ydk-btn-danger" id="ydk-block-channel">
            このチャンネルをブロック
          </button>
          <button class="ydk-btn ydk-btn-secondary" id="ydk-dismiss">
            閉じる
          </button>
        </div>
      </div>
    </div>
  `,document.body.appendChild(n),(o=document.getElementById("ydk-close"))==null||o.addEventListener("click",y),(r=document.getElementById("ydk-dismiss"))==null||r.addEventListener("click",y),(a=document.getElementById("ydk-goto-original"))==null||a.addEventListener("click",()=>{window.location.href=`https://www.youtube.com/watch?v=${t.videoId}`}),(c=document.getElementById("ydk-block-channel"))==null||c.addEventListener("click",async()=>{const i={channelId:e.channelId,channelName:e.channelName,blockedAt:new Date,reason:`パクリ動画: ${e.title}`};await M(i),C(e)})}function C(e){var o,r;y();const t=document.createElement("div");t.id="yt-dummy-killer-overlay",t.className="ydk-blocked",t.innerHTML=`
    <div class="ydk-container ydk-blocked-container">
      <div class="ydk-header">
        <span class="ydk-icon">&#128683;</span>
        <span class="ydk-title">ブロック済みチャンネル</span>
      </div>
      <div class="ydk-content">
        <p>「${x(e.channelName)}」はブロックされています。</p>
        <div class="ydk-actions">
          <button class="ydk-btn ydk-btn-secondary" id="ydk-go-back">
            前のページに戻る
          </button>
          <button class="ydk-btn ydk-btn-secondary" id="ydk-go-home">
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  `,document.body.appendChild(t),(o=document.getElementById("ydk-go-back"))==null||o.addEventListener("click",()=>{history.back()}),(r=document.getElementById("ydk-go-home"))==null||r.addEventListener("click",()=>{window.location.href="https://www.youtube.com/"});const n=document.querySelector("#player-container-outer");n&&(n.style.display="none")}function y(){const e=document.getElementById("yt-dummy-killer-overlay");e&&e.remove();const t=document.querySelector("#player-container-outer");t&&(t.style.display="")}function x(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function _(e){const t=typeof e=="string"?new Date(e):e;return isNaN(t.getTime())?"日付不明":t.toLocaleDateString("ja-JP",{year:"numeric",month:"long",day:"numeric"})}function Q(e){return new Promise(t=>setTimeout(t,e))}async function Z(){const t=(await chrome.storage.local.get("blockedChannels")).blockedChannels||[],n=new Set(t.map(r=>r.channelId));new MutationObserver(()=>{document.querySelectorAll("ytd-compact-video-renderer, ytd-video-renderer, ytd-grid-video-renderer").forEach(a=>{var s,l;const c=a.querySelector('a[href*="/channel/"], a[href*="/@"]');if(!c)return;const i=c.getAttribute("href")||"",d=((s=i.match(/\/channel\/([^/?]+)/))==null?void 0:s[1])||((l=i.match(/\/@([^/?]+)/))==null?void 0:l[1]);d&&n.has(d)&&(a.style.display="none")})}).observe(document.body,{childList:!0,subtree:!0})}G(),Z()})();
