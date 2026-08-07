---
title: "Hls.js 이벤트 흐름"
date: 2021-08-19
lastmod: 2026-08-07T13:09:00.000Z
categories: ["development"]


---

## attachMedia 시도 시

1. hlsMediaAttaching
- Object { media: video#video }
1. hlsMediaAttached
- Object { media: video#video }
1. hlsBufferReset
1. hlsManifestLoading
- Object { url: "hls streaming url" }
1. hlsBufferFlushing
- Object { startOffset: 0, endOffset: Infinity, type: null }
1. hlsManifestParsed
  ```json
  {
"levels": [],
"audioTracks": [],
"subtitleTracks": [],
"firstLevel": 0,
"stats": {
"aborted": false,
"loaded": 127,
"retry": 0,
"total": 127,
"chunkCount": 0,
"bwEstimate": 0,
"loading": {
"start": 9191,
"first": 9323,
"end": 9323
},
"parsing": {
"start": 9323,
"end": 0
},
"buffering": {
"start": 0,
"first": 0,
"end": 0
}
},
"audio": true,
"video": true,
"altAudio": false
}
  ```

1. hlsLevelSwitching
  1. Object { attrs: Proxy, audioCodec: "mp4a.40.2", bitrate: 3301111, codecSet: "avc1,mp4a", height: 720, id: 0, name: undefined, videoCodec: "avc1.64001f", width: 1280, unknownCodecs: Proxy, … }
1. hlsLevelLoading
  1. Object { url: "[https://stream-phps-hls.bbidc-cdn.com:8443/phpschool/_definst_/B4e3df084/chunklist.m3u8](https://stream-phps-hls.bbidc-cdn.com:8443/phpschool/_definst_/B4e3df084/chunklist.m3u8)", level: 0, id: 0, deliveryDirectives: null }
1. hlsManifestLoaded
  1. Object { levels: (1) […], audioTracks: [], subtitles: [], captions: [], url: "[https://stream-phps-hls.bbidc-cdn.com:8443/phpschool/_definst_/B4e3df084/playlist.m3u8](https://stream-phps-hls.bbidc-cdn.com:8443/phpschool/_definst_/B4e3df084/playlist.m3u8)", stats: {…}, networkDetails: XMLHttpRequest, sessionData: null }
1. hlsLevelUpdated
  1. Object { details: {…}, level: 0 }
1. hlsFragLoading
  1. Object { frag: Proxy, targetBufferTime: 0 }
1. hlsLevelLoaded
  1. Object { details: {…}, level: 0, id: 0, stats: {…}, networkDetails: XMLHttpRequest, deliveryDirectives: null }
1. hlsFragLoaded
  1. Object { frag: Proxy, part: null, payload: ArrayBuffer, networkDetails: XMLHttpRequest }
1. hlsFragLoading
  1. Object { frag: {…}, targetBufferTime: 0 }
1. hlsFragLoaded
  1. Object { frag: {…}, part: null, payload: ArrayBuffer, networkDetails: XMLHttpRequest }
1. hlsBufferCreated
  1. Object { tracks: {…} }
1. hlsBufferCodecs
  1. Object { audio: {…}, video: {…} }
1. hlsBufferAppending
  1. Object { type: "audio", data: Uint8Array(628), frag: {…}, part: null, chunkMeta: {…}, parent: "main" }
## 영상 종료 시

1. hlsDestroying
1. hlsMediaDetached
1. hlsMediaDetaching


