---
title: "Mac OS 업데이트 후 개발자 도구가 정상적으로 동작하지 않을 때"
date: 2023-04-20
lastmod: 2026-08-07T12:55:00.000Z
categories: ["development"]
memo: true
tags: ["Mac"]
---

Ventura업데이트를 했다. 업데이트 후 `git` 명령어를 실행하려고 하니 

```bash
❯ git add .
xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun     exit:1
```

위와 같은  오류가 발생하여 동작을 하지 않았다.

이 때 간단하게 해결하는 방법이 있다.

```bash
xcode-select --install
```

위의 커맨드로 개발자 도구를 다시 설치한다.

