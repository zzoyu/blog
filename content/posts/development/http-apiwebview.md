---
title: "HTTP 통신 시 유의할 점(API/Webview 등)"
date: 2021-06-09
lastmod: 2026-08-07T13:06:00.000Z
categories: ["development"]
memo: true
tags: ["Android","iOS"]
---

> Cleartext HTTP traffic to [www.xxxxxx.com](http://www.xxxxxx.com/) not permitted

위와 같은 에러가 난다면 수정해야 할 것이 있다

Android Pie부터 cleartext HTTP가 비활성화 되어 있으므로 활성화를 시켜주어야 통신이 가능하다

AndroidManifest의 application내부에 `android:usesClreartextTraffic="true"`로 지정하면 된다

그 외 세부 사항은 출처 참고.



iOS의 경우도 HTTP를 기본적으로 지원하지 않는다. .plist파일을 수정하여야 한다.

App Transport Security Settings 항목을 추가하고 하부 아이템에 Allow Arbitary Loads in Web Content를 YES로 지정한다.



