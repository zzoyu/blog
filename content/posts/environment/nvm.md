---
title: NVM
draft: false
date: 2025-01-07T09:37:00+0900
description: 노드 버전을 쉽게 바꿔봅시다.
layout: single
categories:
  - environment
tags:
  - node
  - shell
  - 환경설정
slug: nvm
---

`nvm`을 설치하여 Node의 버전을 자유롭게 관리해봅시다.

`nvm`은 노드 버전 매니저의 줄임말로, <https://github.com/nvm-sh/nvm>에서 관리되고 있습니다. Installing and Updating 항목을 참고하여 설치하면 됩니다.

```bash
nvm install --lts
nvm use --lts
```

위의 명령을 실행하면 LTS 버전(Long-Term Support)을 설치하며, 설치된 버전을 사용하도록 지정합니다.

대부분의 경우 LTS버전을 사용하면 되므로, 별도로 버전을 지정할 필요는 없습니다. 그러나 레거시 환경 등으로 인해 노드 버전을 낮추어야 할 때가 생각보다 종종 있습니다. 사용하는 라이브러리나 프레임워크 등에 따라 필요한 노드 버전이 다른데, 이럴 때 `nvm`을 사용하면 편리합니다.

```bash
nvm install 16
nvm use 16
```

위의 명령은 16 버전을 사용하는 예시입니다.
