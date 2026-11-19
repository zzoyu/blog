---
title: "특이한 개발용 파일과 명령"
date: 2026-11-17
lastmod: 2026-11-18T23:30:00.000Z
categories: ["development"]
tags: ["Linux","Mac"]
---

### /dev/null

쓰는 건 전부 사라지고, 읽으면 바로 끝. 유닉스에 원래 있는 특수 파일.

그 외 흔한 쓰임

```bash
명령어 > /dev/null          # 출력 안 보기
명령어 2> /dev/null         # 에러만 안 보기  (2 = 표준 에러)
명령어 > /dev/null 2>&1     # 둘 다 안 보기
```



### /dev/zero

읽으면 0이 무한정. 더미 파일 만들 때 사용할 수 있다:

```bash
dd if=/dev/zero of=test.bin bs=1m count=100   # 100MB 빈 파일
```

### /dev/urandom

난수. 비밀키 만들 때 사용 가능.

```bash
head -c 32 /dev/urandom | base64      # DEPLOY_SECRET 같은 거
```

### /dev/tty

파이프를 무시하고 터미널에 직접 쏠 수 있다.

비밀번호 입력 프롬프트가 리다이렉트해도 보이는 이유

```bash
./script.sh > log.txt     # 안에서 /dev/tty 로 쓴 건 log.txt 안 가고 화면에 뜸
```

### /dev/fd

파일 디스크립터를 경로처럼 접근하게 해줌. `/dev/fd/N` 은 `/proc/self/fd/N` 과 동일하다.

fd 0은 stdin, 1은 stdout, 2는 stderr.

```bash
cat /proc/self/status      # 현재 프로세스 상태
ls -l /proc/self/fd/       # 현재 프로세스의 fd 목록
cat /proc/sys/kernel/random/entropy_avail
```

따라서 이런 응용이 가능하다.

```bash
./app 2> >(tee error.log)    # 에러만 따로 갈라서 저장
```

### /dev/full          ← 리눅스에만 있음

쓰면 항상 "디스크 꽉 참" 에러. 디스크 부족 상황 테스트용

### /proc              ← 리눅스에만 있음 (macOS)

커널이 프로세스와 시스템 상태를 파일/디렉터리 형태로 노출하는 procfs 가상 파일시스템.

프로세스가 사용중인 파일 디스크립터나 마운트된 정보 등을 확인할 수 있다.

### /dev/tcp

파일처럼 보이는 네트워크. bash에만 있는 가짜 경로. 실제 파일이 아니라 bash가 문법으로 가로채서 TCP 연결을 연다.

```bash
bash -c 'exec 3<>/dev/tcp/127.0.0.1/8050 && echo "포트 열림"'
```

nc가 없는 서버에서 포트 확인할 때 유용합니다.

zsh에선 안 된다고 한다.

### 명명 파이프 (FIFO)

디스크에 실제로 있는 파이프

```bash
mkfifo demo.fifo
(echo "보낸 값" > demo.fifo &)
cat demo.fifo        # → 보낸 값
```

```bash
prw-r--r--  demo.fifo     ← 크기 0, 영원히 0
```

데이터가 디스크에 쌓이지 않는다. 쓰는 쪽은 읽는 쪽이 나타날 때까지 멈춰 있다.

서로 다른 터미널과 프로세스를 잇는 데에 쓴다.

### yes

yes | ./설치스크립트           # 모든 확인에 y 자동 입력
yes "아니오" | head -3         # 원하는 문자열도 가능

### :

아무것도 안 하는 명령

```bash
:           # 성공만 하고 끝 (true 의 별칭)
while :; do ...; done        # 무한 루프
: > log.txt                  # 파일 비우기 (truncate)
```

rm 후 재생성과 달리 파일 핸들이 유지되어 로그를 쓰고 있는 프로세스를 안 죽이고 비울 수 있다.

### 그 외 리눅스 전용

```bash
cat /proc/self/cmdline       # 내 실행 인자
ls -l /proc/<PID>/fd         # 그 프로세스가 연 파일 전부
cat /proc/<PID>/environ      # 그 프로세스의 환경변수
```

