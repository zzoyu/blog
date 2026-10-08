---
title: "slot값이 있을 때만 특정 엘레먼트 보여주기"
date: 2022-03-02
lastmod: 2026-08-07T12:57:00.000Z
categories: ["development"]
memo: true
tags: ["Vue.js","Nuxt.js","프론트엔드"]
---

slot 값들은 `this.$slots`내에 들어있다. name이 없는 기본 슬롯의 경우 `this.$slots.default`가 된다.

따라서, **<p *****v-if=”$slots.default”*****><slot></slot></p>** 형태로 선언하면 기본 슬롯 값이 설정될 때에만 컴포넌트를 렌더링 할 수 있다.

![image](/img/notion/c7a5f5d9-82b3-41cc-b3f7-a3109e2b0580.png)

그러면 위와 같은 결과를 얻을 수 있다.

위의 것은 `<component />` 형태이고, 아래 것은 `<component>어쩌구저쩌구</component>`로 지정한 예시이다.

