---
title: "typescript를 지원하지 않는 라이브러리를 추가하는 방법"
draft: false
date: 2023-10-17T14:55:00+0900
layout: "single"
description: "typescript가 엄격하게 사용되는 프로젝트에서 typescript를 지원하지 않는 라이브러리를 추가하는 방법"
categories:
  - "troubleshooting"
tags:
  - "typescript"
  - "환경설정"
---

타입스크립트를 지원하지 않는 라이브러리를 사용하는 경우가 있습니다. 주로 다소 오래된 js 기반 패키지들이 그렇습니다. 경우에 따라 타입이 선언되지 않았다는 오류가 발생할 수 있습니다.

이때, 타입 패키지를 추가로 포함하면 해결이 되는 경우가 있지만 타입이 존재하지 않는 라이브러리일 때가 많습니다. 라이브러리 이름의 `.d.ts` 파일을 생성하면 됩니다.

```ts
declare module "라이브러리명";
```

위의 파일을 `tsconfig`에 포함시켜 타입스크립트가 해당 라이브러리의 존재를 알 수 있게 합니다.

오류가 사라졌습니다.
