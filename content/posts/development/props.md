---
title: "props를 전부 바인딩 하기"
date: 2022-03-03
lastmod: 2026-08-07T12:57:00.000Z
categories: ["development"]
memo: true
tags: ["Vue.js","Nuxt.js","프론트엔드"]
---

문득 든 생각인데, `<MyComponent className/>`형태로 스타일 클래스를 주는 방법이 있지 않을까 고민했다.

그러니까 만약 컴포넌트 내에서 선언된 prop이 불리언 타입인 경우, 컴포넌트 사용 시 해당 prop의 이름만 적어도 true로 간주된다. 그리고 스타일 클래스 바인딩의 경우 `:class=”{className: true|false}”`형태로 선언된다. 그러므로 `:class=”{propName}”` 과 같이 선언한다면, `{’propName’: propName(true|false)}` 형태로 취급이 된다. 이걸 전체 props에 일괄 적용시킨다면, `$props` 변수를 사용하면 된다.

⇒ `:class=”{...$props}”`

props를 스타일 지정 용도로만 사용하는 UI 요소에서 잘 써먹을 수 있을 것으로 생각된다.

