# ICP ALE V0.9.2 · 검증 결과

2026-11-15 (KST) · `feature/ale-v092-production-style-icp`

Base: `cdf11be7f1273e17ea4d837053580fcce53ee265`.
실행 환경: Linux, Node v24.22.1, Chromium 156.0.8078.79, Playwright 1.58.2,
Three.js 0.182.0, Vite 7.3.8. 실제 브라우저에서 빌드된 HTML을 실행했습니다.

| 검증 | 결과 |
| --- | --- |
| 모델 자동 테스트 | **11/11 통과** |
| 브라우저 자동 테스트 | **11/11 통과**, 실패·건너뛰기·flaky 0 |
| 기존 static-site workflow의 Python/JS 검증 | 통과 |
| 기존 `tests/sim-model.test.js` | 통과 |
| 1366×768 / 1440×900 / 1280×720 | 전역 세로 스크롤 0, 가로 넘침 0 |
| 390×844 / 360×800 | 챔버 → 표면 → 제어부 세로 스택, 가로 넘침 0 |
| 렌더러 | 실제 WebGL2 + 동일 Geometry의 CPU 소프트웨어 3D |
| WebGL 미지원 / context loss | 안내와 상호작용 fallback 복구 통과 |
| JS page exceptions / 원격 자산 요청 | 모두 0 |
| CDN 없이 캐시만 사용한 설치·빌드 | `npm ci --offline` + build 통과 |
| 오프라인 / 일반 빌드 | 번들 바이트 일치 |
| `npm audit --audit-level=low` | 취약점 0 |

브라우저 검증에는 12개 실제 Geometry, Orbit/Front/Top/Wafer, 드래그,
절개·투명·분해·부품 표시, plasma OFF, bias OFF, 4 ALE 단계,
정확한 site ID 연결, 입자 예산 0/240/800, 제외된 측정 패널을 포함합니다.

## 실행 명령

```sh
npm ci
FAB_CHROMIUM_PATH=/usr/bin/chromium npm run test:fab
node tests/sim-model.test.js
```

기존 `.github/workflows/validate-static-site.yml`의 Python 블록과 JS parse checks도
그대로 실행했습니다. 신규 CI는 PR 검증과 artifact 보존만 하며 배포 job은 없습니다.

## 성능 실측과 제한

GPU는 **ANGLE / Vulkan SwiftShader (CPU software rendering)**입니다. 실제 GPU에서의
목표 FPS 달성 여부는 검증하지 않았습니다. 아래 값은 짧은 로컬 샘플이며 하드웨어
성능 보장이나 30/60 FPS 통과 판정이 아닙니다. 이 환경의 낮은 FPS를 제한 사항으로
명시합니다. 원시 기록은 [performance.json](./performance.json)에 있습니다.

| 화면 | 예산 0 FPS | 예산 240 FPS | 예산 800 FPS |
| --- | ---: | ---: | ---: |
| 1366×768 | 3.00 | 2.55 | 2.47 |
| 1440×900 | 2.28 | 2.39 | 2.09 |
| 1280×720 | 2.91 | 3.20 | 3.27 |

`t=1.6 s`, DPR 1에서 예산 0/240/800의 실제 입자는 각각 0/150/500개입니다.
예산은 상한이며, 현재 사건이 없는 site에 임의 입자를 만들지 않습니다.
최종 샘플은 33 draw calls / 42,156 triangles입니다. 프로파일링 중 반복 형상을
batch하고 표면 표시를 instance로 묶었으며, quartz에 알파 합성을 사용해 추가 전체
장면 굴절 패스를 제거했습니다. UI FPS는 실제 redraw 수를 표시합니다.
CPU fallback은 painter 정렬이므로 교차 투명면의 정확도에 한계가 있습니다.
Vite는 단일 JS 번들 약 595 kB (gzip 약 157 kB)에 크기 권고 경고를 출력했습니다.
빌드는 성공했고 모든 자산은 로컬 번들에 포함됩니다.

## 실제 브라우저 캡처

모든 PNG는 이 구현을 브라우저에서 직접 캡처했습니다. VTK 참조 렌더를 WebGL
캡처로 사용하지 않았습니다. Desktop은 전체 viewport, mobile은 전체 페이지입니다.

- PC: [1440×900](./webgl-1440x900.png), [1366×768](./webgl-1366x768.png), [1280×720](./webgl-1280x720.png)
- Mobile: [390×844](./webgl-390x844.png), [360×800](./webgl-360x800.png)
- Cameras: [Front](./camera-front-1440x900.png), [Top](./camera-top-1440x900.png), [Wafer](./camera-wafer-1440x900.png)
- [분해·투명 보기](./assembly-separated-1440x900.png)
- Software 3D: [PC](./software-1440x900.png), [Mobile](./software-390x844.png)

기계 판독용 결과와 검사한 소스 파일의 SHA-256은 [browser-results.json](./browser-results.json)에
기록했습니다. 일반/오프라인 번들 SHA-256:
`3005e62a166d6367425ed5c5bdb8a107873f159efb5b28bf1567347d4cc78590`.

기존 추적 파일은 base와 바이트가 동일합니다. `ale.html`, 홈페이지, 학습 자료는
수정하지 않았고 main 병합·Pages 배포를 수행하지 않았습니다.
지정된 기존 preview 입력 3개는 base에 없어 직접 비교하지 못했습니다.
[모델 경계·공개 문헌·라이선스](../../docs/fab3d/README.md)에 자세히 기록했습니다.
