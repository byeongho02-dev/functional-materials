# Production-style ICP ALE V0.9.2 · review preview

교육용 범용 ICP 챔버를 **Three.js 0.182.0 / r182**의 실제 Mesh, LatheGeometry,
TubeGeometry, ExtrudeGeometry로 구성합니다. 특정 제조사의 장비나 OEM 치수를
재현하지 않습니다. 독립 entry는 `ale-v092-fab-preview.html`이고 구현은
`src/fab3d/`에 격리했습니다. 기존 홈페이지, `ale.html`, 강의 파일은 수정하지 않습니다.

## 로컬 실행과 빌드

Node.js 20.19+ 또는 22.12+ / npm이 필요합니다. 의존성 버전과 무결성은
`package-lock.json`에 고정했습니다.

```sh
npm ci
npm run dev:fab
# http://localhost:4173/ale-v092-fab-preview.html

npm run build:fab
npm run preview:fab
# http://localhost:4173/ale-v092-fab-preview.html
```

`dist-fab/`에는 별도 preview HTML, 번들, 모델 문서만 생성됩니다. CDN, 외부 폰트,
원격 환경맵, 외부 이미지 요청이 없습니다. 최초 `npm ci` 이후에는 캐시된 의존성으로
네트워크 없이 빌드하고 실행할 수 있습니다. preview의 홈 링크는 기존 저장소의
`index.html`을 대상으로 하므로, 독립 `dist-fab/` 서버에서는 학습 홈이 포함되지 않습니다.
이 변경은 배포 설정을 추가하거나 GitHub Pages를 활성화하지 않습니다.

## 구조와 조작

12개의 독립 Group: aluminum body, removable liner, planar RF coil, quartz window,
gas-feed manifold, ESC assembly, focus ring, wafer, transfer slit, exhaust annulus,
throttle/pumping line, RF bias feed. 본체에는 슬롯 개구부가 있고 이송 포트는 중공이며,
통로 폭은 기준 웨이퍼 직경보다 큽니다.
분해 슬라이더로 부품을 이동하고 체크박스로 각각 숨길 수 있습니다.

- 드래그: 자유 회전. 휠/핀치: 확대. Shift + 드래그: 이동.
- 카메라: Orbit / Front cutaway / Top / Wafer. 약 0.75초 보간 전환.
- 뷰포트에 키보드 포커스 후 방향키: 회전. `+` / `-`: 확대/축소.
- 절개: 본체·라이너·플랜지에 공통 월드 공간 평면 적용.
- 투명: 외벽 opacity와 depthWrite를 함께 전환. 투명 창은 별도 정렬.
- PBR 금속·유전체, 코드로 만든 RoomEnvironment/PMREM, AA, 제한된 DPR,
  약한 glow를 사용합니다. 외부 텍스처나 제조사 CAD를 사용하지 않습니다.
  같은 부품·재질의 반복 형상은 batch하고 표면 표시는 instance로 묶습니다.
  quartz는 PBR 유전체 하이라이트와 알파 합성을 사용해 전체 장면을 추가로
  굴절 렌더링하는 비용을 피합니다.
- particle budget 0–800은 시각적 샘플 수의 상한입니다. 반응 사건 수를 바꾸지 않습니다.
  분해 보기에서는 구조에 집중하도록 입자 경로가 표시되지 않습니다.
- FPS는 실제 챔버 redraw 횟수입니다. 보장된 하드웨어 성능 수치가 아닙니다.

## 공정 모델의 경계

`process.js`의 **한 ProcessClock과 현재 cycle의 surface-event 배열**이 챔버 입자,
표면 확대, 타임라인, 사건 목록을 구동합니다. 별도 반응 시계나 무작위 제거는 없습니다.
16개 site는 결정론적 좌표와 `S01`–`S16` ID를 가집니다.
사건 ID는 `C{cycle}-{siteId}-{type}`이며 모든 입자에 `siteId`와 `eventId`가 있습니다.

| 단계 | 공정 시계 | 사건 |
| --- | --- | --- |
| 표면 흡착 | 0–4 s | Cl-containing 입사 → 같은 site의 흡착 |
| 1차 퍼지 | 4–6 s | 기상 공급 종료, 흡착 상태 유지 |
| 활성화·제거 | 6–10 s | Ar⁺ 입사 → 활성화 → 흡착 site 제거 |
| 2차 퍼지 | 10–12 s | 같은 site에서 생성된 SiClₓ 개념종 배기 |

`arrival → adsorption → ion-arrival → activation → removal → exhaust`의 직전 사건이
성공해야 다음 사건이 적용됩니다. Source OFF는 새 Cl 입사·흡착 및 이온 활성화·제거를
막고, bias OFF는 흡착을 유지하되 방향성 이온 충돌·활성화·제거를 막습니다.
이미 제거된 부산물의 배기는 전원 OFF 후에도 진행됩니다. 이미 건너뛴 사건은 전원을
다시 켜도 소급해 발생하지 않습니다. 단계 버튼은 현재 전원 조건으로 해당 cycle을
시작부터 재생해 단계 시작점으로 이동합니다. 초기화는 모든 cycle 기록을 재설정합니다.

시계는 렌더링 프레임 간 실제 경과시간으로 전진하고 탭이 숨겨진 동안은 정지합니다.
FPS, particle budget, 원자 확대는 독립된 물리 해석을 수행하지 않습니다.
공간분포, 종 비율, 시간, 궤적, 표면 제거는 **교육용 가정**입니다.
검증된 plasma/transport/chemical kinetics solver 또는 공정 예측값이 아닙니다.
200 mm는 웨이퍼 직경의 기준이며, 다른 부품의 크기·위치·배관은 실측값이 아닙니다.
표면 확대는 독립된 원자 개념 스케일로, 챔버의 공간 스케일과 이어지지 않습니다.

## WebGL 대체 화면

WebGL2가 없거나 context가 소실되면 `software.js`가 **동일한 Three.js Geometry의
삼각형을 CPU에서 투영**합니다. 월드 평면 절개, 깊이 순서 정렬, 단순 조명,
카메라 전환, 자유 회전, 부품 분해·숨김을 지원합니다. 정적 이미지로 대체하지 않습니다.
성능을 위해 공정 중 약 2 Hz로 재투영하고, 정지 중에는 조작할 때 갱신합니다.
fallback의 투명면은 painter 정렬이므로 교차 투명면의 정확도는 제한됩니다.
`?software`로 대체 화면을 수동 확인할 수 있습니다.

## 테스트

```sh
npm run test:fab:model
npx playwright install chromium
npm run build:fab
npm run test:fab:browser
# 시스템 Chromium 사용 시:
FAB_CHROMIUM_PATH=/usr/bin/chromium npm run test:fab:browser

# 기존 모델 회귀 검증
node tests/sim-model.test.js
```

geometry existence, 카메라 보간, 절개·투명·분해, 단일 시계/ID 인과관계,
plasma OFF / bias OFF, 4단계, 입자 상한·반응 독립성, 제외 패널,
페이지 예외, 외부 요청 부재, WebGL 미지원/context-loss 복구를 검사합니다.
1366×768, 1440×900, 1280×720에서는 문서 전체 스크롤을 검사하고,
390×844 / 360×800에서는 세로 스택과 가로 넘침을 검사합니다.
브라우저 캡처는 `preview/fab-v092/`에 생성합니다.

## 공개 문헌과 자산 출처

아래 자료에서 일반적인 ICP 구성 관계만 참고했습니다. 도면의 치수·형상을
추적하거나 이미지/스크린샷/CAD를 복사하지 않았습니다.

- [Lam Research Kiyo product family](https://www.lamresearch.com/product/kiyo-product-family/):
  산업용 conductor etch / ICP 계열의 맥락. 이 preview를 Kiyo 복제 모델로 취급하지 않습니다.
- [Lam Research Reliant etch products](https://www.lamresearch.com/product/reliant-etch-products/):
  대칭 챔버·ESC 및 독립 tuning의 일반적인 장비 맥락.
- [US6155203A, apparatus for control of deposit build-up](https://patents.google.com/patent/US6155203A/en):
  flat spiral antenna, planar dielectric window, ESC/bias, focus ring, liner의 일반적인 연결.
- [US9941097B2, plasma processing apparatus](https://patents.google.com/patent/US9941097B2/en):
  금속 진공 챔버, dielectric window 외부의 평면 코일, 가스 공급 및 기판 지지대 관계.
- [US6184158B1, inductively coupled plasma CVD](https://patents.google.com/patent/US6184158B1/en):
  planar coil, gas ring 및 pumping/throttle 경로의 범용 배치 참고. ALE 전용 구조를 뜻하지 않습니다.

의뢰에 명시된 `preview/ALE_V0.9.2_ProductionStyle_ICP_Review.html`,
`preview/ALE_V092_Fab_Industrial_3D_Concept.png`,
`preview/ALE_V092_Fab_1440x900.png`는 작업 시작 base
`cdf11be7f1273e17ea4d837053580fcce53ee265`에 없었습니다.
따라서 그 파일을 실행·검토한 것으로 주장하지 않으며, 여기의 새 캡처는 이 구현을
브라우저에서 직접 실행해 생성합니다. VTK concept image를 WebGL 캡처로 표시하지 않습니다.

Three.js는 MIT 라이선스이며 전문은 [THREE-LICENSE.txt](./THREE-LICENSE.txt)에 보존했습니다.
VTK와 gl-matrix는 이 구현의 의존성이 아니며 저장소에 포함하지 않았습니다.
