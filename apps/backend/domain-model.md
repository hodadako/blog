# Blog Project Domain Model

이 문서는 블로그 프로젝트의 주요 도메인 모델과 그 관계를 정리한 문서이다.

## 공통 모델

### `BaseEntity`

모든 엔티티가 공통으로 상속받는 추상 클래스.

- **속성:**
    - `createdAt`: 생성 일시
    - `updatedAt`: 수정 일시

### `Translatable` (인터페이스)

다국어 콘텐츠를 지원하는 엔티티가 구현하는 공통 인터페이스.

- **구조:**
    - `language: Language;`

### `Language` (Enum)

지원하는 언어를 정의하는 enum.

- **종류:**
    - `KR`: Korean
    - `EN`: English
    - `JP`: Japanese

## 주요 엔티티

### `Post` (글)

블로그의 핵심 엔티티. 하나의 글은 여러 언어의 `PostContent`를 가질 수 있다.

- **속성:**
    - `id`: 고유 식별자 (PK)
    - `isPublished`: 공개 여부 (boolean, 기본값 `false`)
    - `slug`: URL 경로를 위한 식별자 (string, nullable)
- **관계:**
    - `Post` ↔ `PostContent`: 1:N (하나의 글은 여러 `PostContent`를 가짐)
    - `Post` ↔ `PostTag` ↔ `Tag`: N:M (`PostTag` 중간 엔티티를 통해 `Tag`와 다대다 관계)

### `PostContent` (글 내용)

다국어 지원을 위해 분리된 엔티티.

- **구현:** `Translatable`
- **속성:**
    - `id`: 고유 식별자 (PK)
    - `title`: 글 제목 (string)
    - `content`: 글 본문 (text)
    - `language`: 작성 언어 (`Language` enum)
- **관계:**
    - `PostContent` → `Post`: N:1

### `Tag` (태그)

글을 분류하는 데 사용되는 키워드.

- **속성:**
    - `id`: 고유 식별자 (PK)
    - `name`: 태그명 (string)
- **관계:**
    - `Tag` ↔ `PostTag` ↔ `Post`: N:M (`PostTag` 중간 엔티티를 통해 `Post`와 다대다 관계)

### `PostTag` (글-태그 중간 엔티티)

`Post`와 `Tag`의 N:M 관계를 구현하기 위한 중간 테이블.

- **속성:**
    - `id`: 고유 식별자 (PK)
- **관계:**
    - `PostTag` → `Post`: N:1
    - `PostTag` → `Tag`: N:1

### `Author` (작성자)

> **참고:** 아직 코드로 구현되지 않은 모델입니다.

글을 작성하는 주체.

- **속성:**
    - `id`: 고유 식별자 (PK)
    - `name`: 작성자명 (string)
- **관계:**
    - `Author` → `Post`: 1:N

## ERD (Entity-Relationship Diagram)

```
+-----------------+      +------------------+
| Post            |      | PostContent      |
|-----------------|      |------------------|
| id (PK)         |--(1) | id (PK)          |
| isPublished     |      | title            |
| slug            |      | content          |
+-----------------+      | language         |
        | (N)            | post_id (FK)     |
        |                +------------------+
        |
+-----------------+      +------------------+
| PostTag         |      | Tag              |
|-----------------|      |------------------|
| id (PK)         |--(N) | id (PK)          |
| post_id (FK)    |      | name             |
| tag_id (FK)     |      +------------------+
+-----------------+
        | (1)
        |
+-------+---------+
| Tag             |
+-----------------+
```

## TODO

- 댓글(Comment) 기능 여부
- 좋아요/조회수 등 메타데이터 처리
- 권한(Role) 관련 정의 (Admin, User 등)
- `Author` 엔티티 구체화 및 `Post`와의 관계 연결
