---
title: "form 안에 있는 button이 화면을 갱신시킬 때"
draft: false
date: 2024-06-22T20:08:00+0900
layout: "single"
description: "submit 버튼이 아닌데도 submit 버튼으로 동작하는 경우"
categories:
  - "troubleshooting"
tags:
  - "HTML"
  - "Next.js"
  - "form"
---

`form` 내에서 `button` 태그를 사용하면 `type=submit`이 아님에도 화면이 갱신될 때가 있습니다. submit처리가 되는 것으로 추정됩니다.

이를 방지하기 위해서는 `button`의 속성에 `type=”button”`을 추가하면 됩니다.

간단하죠?
