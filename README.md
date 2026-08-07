# 🌌 Call me Ishmael.

> **Hugo & Notion 기반 개인 기술 블로그 & 독서노트 자동화 시스템**  
> _Seamlessly Synchronized from Notion to Static Hugo Site via GitHub Actions & Bun_

[![Sync Notion Notes & Books](https://github.com/zzoyu/blog/actions/workflows/sync-notion.yml/badge.svg)](https://github.com/zzoyu/blog/actions/workflows/sync-notion.yml)
[![Update Book Progress](https://github.com/zzoyu/blog/actions/workflows/update-book-progress.yml/badge.svg)](https://github.com/zzoyu/blog/actions/workflows/update-book-progress.yml)
[![GitHub Pages](https://github.com/zzoyu/blog/actions/workflows/hugo.yml/badge.svg)](https://github.com/zzoyu/blog/actions/workflows/hugo.yml)

![Hugo](https://img.shields.io/badge/Hugo-v0.161+-FF4088?style=for-the-badge&logo=hugo&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-v1.3+-F9F1E1?style=for-the-badge&logo=bun&logoColor=black)
![Notion](https://img.shields.io/badge/Notion_API-v2022--06--28-000000?style=for-the-badge&logo=notion&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.0+-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-Automation-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)

---

## ✨ Key Features

### 💻 1. Notion 포스트 자동 발행

- JAMstack 계열 SSG 기반 블로그는 작성하기 어려운(귀찮은) 문제가 있음
  - VSCode가 사용 불가한 환경
  - 모바일이라 코드 수정이 어려운 경우
  - 별도의 키 등록이 되지 않은 기기인 경우
  - 그냥 간단한 메모 하나 추가하고 싶을 때
  - 노션이나 옵시디언도 이미 쓰는데? 글을 이중으로 관리하고 있음.
- 따라서 노션을 CMS처럼 사용하고 자동으로 동기화 되도록 워크플로우 구축.
  - Notion 개인적으로 관리하는 개발 주제의 데이터베이스에서 `공개`가 `true` 인 포스트를 `content/posts/development/<slug>.md`로 자동 변환 및 발행하며, 매일 자정에 실행
- 짧은 트러블슈팅 메모와 일반 아티클
  - `memo: true` 트러블슈팅 및 팁 글은 목록에 본문 내용이 바로 펼쳐지는 카드 형태로 렌더링
  - 일반 아티클은 본문의 순수 텍스트(Plain Text) 3줄 발췌 미리보기 + 제목 클릭 상세 이동 링크 제공.

### 📖 2. 독서노트 & 도서 관리 시스템

- 도서 정보 간편 입력 스크립트(`add-book.mjs`): 책 제목/키워드 검색 시 저자, 총 페이지 수, 표지 커버 이미지를 추출하여 `data/books.yml` 및 개인 Notion 도서 DB에 등록. 역공학+크롤링으로 추출한 데이터를 사용
- Hugo 숏코드 & 파티셜 자동 연동: 특정 도서에 대한 포스트인 경우 상단에 관련 도서에 대한 정보를 자동 포함
- 독서 노트 DB에서 특정 도서를 relate하고 게시글을 적으면 이후 cronjob을 통해 자동 발행됨.
- 노션에서 진행도와 상태를 관리하면 cronjob으로 동기화 되는 구조

### 🚀 3. 수정 시간 기반 동기화

- Notion 레코드의 최종 수정시간(`last_edited_time`) 과 로컬 마크다운의 `lastmod` 를 비교
- 내용이 변경되지 않은 포스트는 API 수집 및 본문 렌더링을 생략하여 동기화 시간 단축

## 🔄 GitHub Actions Workflows

| 워크플로우                    |                                                                                    뱃지                                                                                     | 설명                                                                                     |
| :---------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------- |
| **Sync Notion Notes & Books** |            [![Sync](https://github.com/zzoyu/blog/actions/workflows/sync-notion.yml/badge.svg)](https://github.com/zzoyu/blog/actions/workflows/sync-notion.yml)            | Notion DB에서 새로운 개발 포스트와 독서노트를 자동으로 동기화하고 변경사항을 커밋합니다. |
| **Update Book Progress**      | [![Progress](https://github.com/zzoyu/blog/actions/workflows/update-book-progress.yml/badge.svg)](https://github.com/zzoyu/blog/actions/workflows/update-book-progress.yml) | 도서 읽은 페이지 수를 전달받아 `data/books.yml` 의 독서 진행률을 자동으로 갱신합니다.    |
| **Deploy Hugo Site**          |                  [![Pages](https://github.com/zzoyu/blog/actions/workflows/hugo.yml/badge.svg)](https://github.com/zzoyu/blog/actions/workflows/hugo.yml)                   | GitHub Pages로 블로그 빌드 결과를 자동으로 배포합니다.                                   |

## 🛠️ CLI Commands

```bash
# 1. Notion 개발 포스트 & 독서노트 동기화
bun run sync-notion

# 2. 교보문고 검색을 통한 신규 도서 등록
bun run add-book

# 3. 도서 독서 진행률 업데이트
bun run update-progress

# 4. Hugo 로컬 개발 서버 실행
bun run dev

# 5. 로컬 .env 환경변수를 GitHub Secrets로 일괄 등록
gh secret set -f .env
```
