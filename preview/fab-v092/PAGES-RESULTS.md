# Homepage / GitHub Pages integration

홈페이지의 ALE 메뉴와 대표 카드는 `ale-v092-fab.html`을 엽니다.
기존 `ale.html`은 보조 링크로 유지하며 강의·학습 파일은 변경하지 않았습니다.
대표 이미지는 이 앱을 WebGL로 실행해 캡처한 실제 브라우저 화면입니다.

## 실행과 검증

```sh
npm ci
npm run build:fab:static
npm run test:pages
npm run test:fab
```

- 정적 게시 파일 검사: **2/2 통과**. JavaScript 문법·CSS 포함·MIT 라이선스·개발 import 제거 확인.
- PC 1440×900 / 모바일 390×844 홈페이지 경로: **2/2 통과**.
- 게시 파일의 WebGL 미지원 대체 화면: **1/1 통과**.
- 같은 검사에서 페이지 예외·외부 자산 요청·가로 넘침: 모두 0.
- 기존 11개 모델 테스트, 기존 ALE 모델과 static-site workflow 검증: 통과.
- 새 게시 파일은 같은 소스로 반복 생성했을 때 바이트가 동일합니다.
- CI는 기존 챔버 브라우저 테스트 11개도 실행하고, 커밋된 게시 파일이 소스와 일치하는지 검사합니다.

게시 파일에는 Three.js 0.182.0과 CSS가 모두 포함되어 있습니다.
GitHub Pages는 기존 `main` / `/(root)` 설정을 유지하고 별도 CDN·호스팅 서비스를 추가하지 않습니다.
공정·공간분포의 가정과 SwiftShader 성능 한계는 [모델 설명](../../docs/fab3d/README.md)과
[초기 챔버 검증 결과](TEST-RESULTS.md)에 기록했습니다.

[PC 홈페이지](homepage-1440x900.png) · [모바일 홈페이지](homepage-390x844.png) · [검증 원시 기록](pages-results.json)
