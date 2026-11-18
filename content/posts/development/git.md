---
title: "Git 계정을 분리하는 몇가지 방법들"
date: 2026-11-18
lastmod: 2026-11-18T19:47:00.000Z
categories: ["development"]
tags: ["Git","환경설정"]
---

## 현재 위치에서 계정 확인하기

```bash
git var GIT_AUTHOR_IDENT
```

## Global 설정

`~/.gitconfig` 와 `~/.config/git/config` 에 전역 설정이 들어간다. 기본적으로 별도 지정이 없으면 이 값을 참조하게 된다.

## 디렉터리별 설정

전역 설정에 경로 조건을 걸 수 있다.

### `~/.gitconfig`에 아래의 내용 추가

경로는 `**/dir/**` 형태로도 작성할 수 있다.

```bash
[includeIf "gitdir:~/<path>/"]
path = ~/.gitconfig-personal
```

### `~/.gitconfig-personal` (파일명은 알아서)

```bash
[user]
name = <name>
email = <mail>
```

## Repository별 설정

레포 내에 `.git/config` 설정이 있으면 이를 우선시한다.

파일로 작성하거나, 명령줄로 설정할 수 있다.

```bash
# 이 저장소에만 적용
git config --local user.name <name>
git config --local user.email <email>

# 해제하기
git config --local --unset user.name
git config --local --unset user.email
```





