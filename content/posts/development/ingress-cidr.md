---
title: "오라클 클라우드 Ingress 방화벽 CIDR(사이더) 설정하기"
date: 2023-05-07
lastmod: 2026-08-07T13:08:00.000Z
categories: ["development"]
tags: ["인프라","Linux","OCI"]
---

## 필요한 경우

- 특정 IP 대역 허용
- 특정 port ingress 허용


## 들어가야하는 메뉴

네트워킹 → 가상 클라우드 네트워크 → 구획명 → 보안 목록 세부정보



## Ingress 추가할 때

Ingress 설정 시에 CIDR 범위를 제공할 수 있음.

- `0.0.0.0/0` : 제한이 없다
    - 여기서 `0.0.0.0`은 IP주소를 표시
    - 슬래시 옆의 `0`은 0, 16, 32 등의 값을 가지며 허용 IP대역을 말한다
    - 32인 경우 모든 영역을 필터링하겠다는 뜻


![image](/img/notion/3b53a95e-2726-80e4-9d3e-e0e40c0bb166.png)



내 IP만 허용하는 예

