---
title: "HttpURLConnection에서 GET이 POST로 강제되는 현상"
date: 2021-10-13
lastmod: 2026-08-07T13:00:00.000Z
categories: ["development"]
memo: true
tags: ["Kotlin","Android"]
---

커넥션 설정에 `urlConnection.doOutput = true`가 지정되어 있으면 method를 GET으로 해두어도 자동으로 POST로 변환된다.

그러므로 해당 부분을 주석처리한다. 기본적으로는 GET이 설정되어있다.

