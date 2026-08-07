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


![image](https://prod-files-secure.s3.us-west-2.amazonaws.com/5a01f05c-ce64-4edc-8ebb-20ed300b7a52/84abfba3-6818-4bd3-b60d-20d9851229af/image.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466XUCIAKBK%2F20260807%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260807T135120Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEI3%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLXdlc3QtMiJHMEUCIBQ81ZqGS5bCars%2Fx2K4jh6n6Lua2ConsSoaTHDvKJXHAiEAx2oJ30x6b0EGOBlR%2BU663HyyXSxzZhQPZT4BywXWXpkq%2FwMIVhAAGgw2Mzc0MjMxODM4MDUiDMDh128GFMOs5dAccyrcAwxjf6dafk9Lg29rsSVLx%2F34v8bWj8n3DkdcNBD2nfFD8eSH0gK3xLhtoAxnLJWOBc8hICj3hkIvE0ANuINpw0wBpkQYRnw4uJZpwIyjDfebeAFKEAb2nsI8R3YQLrtSfND3tEtZwWAxpQFolmjuDWAY2b3I3yJ7PaZOJLZZP8AES2gTRwbNWnKtTdJh8rwtP3lDRf91Obe6tyHz5lNtRAtEmOlRdk6boVPvdkAwwOfyP%2F17E%2BIofgabF7hoP24XUKb2QPGioYREMPiFpB3G6qnagxt23gReWGumPsOeuqiTjJwGp6DoHqDmQJfbYXqEaO1%2B%2Fk3cEByps9MuMxPxANNZ4lXMOqAI6S5KBk80fA6CuEy%2BWZFpFUIiqGHdFmL7jV9Cah98bNpFT2yNbS0V7snYjDvvUE50SnSLeS%2FEYp4ig2hYggaaoWSvtYfJM4GCX5GbTY3P1hxfOwB%2F3QByW9X9vHD2IQX2BYTxBIGT1n45P%2BJy22e0VxaeqSg1t%2BTVvJh4FjOEXUIvkrwjSB%2Bx3hAODBfJGdCQkXDiiklN0NCe26jRKCX2MscXG8%2BzShv1QWVV6Eom68bq2f3gnyqUO9MKKkn5UeKblELU2Tc3WkX00%2F2n%2FG5CmF1OM08MMOKw19MGOqUBOURbg1Dw7WiVXx085fPuBnPgvFmpPbUVO540FCRmp3vN9mcdv5cFOvF1SUlFjWQiM3WLX2RkEUBthPubj7QvpDph8zB3w0jM%2FsWTjk9HxxaV6qvcHJ0kegaIiPY9h8TD0aKtSlVLdptt9XgVVBA1uny%2BPiznttRJu2fQ796LaLiZJzTrrhX3JdHe%2F46dLra%2BIF0o%2F8x7l090NqRZ6q8SHuewg3Xn&X-Amz-Signature=98f472b4a38c54d14e3b0892488a3f4881661bbb121a563b8753ab4e4391aedd&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)



내 IP만 허용하는 예

