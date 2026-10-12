# 로컬 렌더링 검증

여러 Next.js 서버를 사용할 때 개발 서버와 production build가 같은 `.next`를 덮어쓰지 않도록 `NEXT_DIST_DIR`로 산출물 경로를 지정한다. 기본값은 기존 `.next`다.

```sh
NEXT_DIST_DIR=.next-p0-review pnpm --filter web build
NEXT_DIST_DIR=.next-p0-review pnpm --filter web start --port 3121
```

빌드와 start에는 같은 값을 사용한다. 실행 중인 서버의 경로에 다시 빌드하지 않는다. 다른 서버를 추가할 때는 별도의 경로와 포트를 선택한다. Next.js가 사용자 지정 경로의 타입을 `tsconfig.json`에 추가할 수 있으므로 검증용 빌드는 저장소의 임시 복사본에서 수행한다.

HTML이 참조하는 CSS 파일이 산출물 경로에 없으면 정상 렌더링을 판정하지 않는다. 현재 서버를 종료하거나 `.next`를 삭제하기 전에 사용 중인 작업을 확인한다.
