# Functional Materials Interactive Labs

브라우저에서 별도 빌드 없이 실행하는 기능성 재료 교육용 인터랙티브 자료입니다.

## Materials Learning · 6개 테마

학습 메뉴는 재료과학 기초·금속재료, 생체재료, 형상기억합금, 수소저장합금, 나노전자재료·전자파 차폐, MOF의 순서입니다. ALE는 별도 시뮬레이터입니다. 항균·나노촉매를 별도 메인 테마로 연결하지 않으며, 기존 강의 내용과 파일은 보존합니다.

4강은 [learning-hydrogen/index.html](learning-hydrogen/index.html)에서 실행합니다. H₂의 해리·원자 H의 내부 흡수·수소화물·재결합 방출, 온도/압력과 PCT를 조작합니다. 수소 원자 수를 보존하는 정성 모형이며 실측 성능을 예측하지 않습니다. **4강 PDF가 제공되지 않아 첨부 작업지시서의 페이지별 개요를 사용했습니다. 원본 직접 대조는 미완료입니다.**

공유 디자인은 [assets/learning-common.css](assets/learning-common.css)의 선택적 토큰을 사용합니다. 1~3강은 learning-shared/와 learning-scenes/의 독립 모듈로 실제 3D·도표·설명을 연결하며, MOF와 전자기 자료의 네이비·시안 기준을 따릅니다. ALE 인터페이스는 별도로 유지합니다.

- [4강의 모형·조작·참고자료](learning-hydrogen/README.md)
- [통합 변경과 검증 범위](docs/integration/VALIDATION.md)
- 모델/DOM: `npm run test:learning:model`
- 빌드·브라우저 회귀: `npm run test:pages`

## Production-style ICP ALE V0.9.2

홈페이지 `index.html`의 ALE Simulator 메뉴와 대표 카드에서
`ale-v092-fab.html`을 바로 엽니다. 별도 설치 없이 Three.js 0.182.0의 실제
3D 챔버를 회전·확대하고, 절개·투명·분해 및 같은 site에 연결된 ALE 사건을 탐색합니다.
기존 `ale.html`과 학습 자료는 유지하며 카드의 보조 링크에서 기존 시뮬레이터를 엽니다.

- 홈페이지: <https://byeongho02-dev.github.io/functional-materials/>
- ICP ALE: <https://byeongho02-dev.github.io/functional-materials/ale-v092-fab.html>
- 모델 범위·공개 문헌·라이선스: [docs/fab3d/README.md](docs/fab3d/README.md)

게시용 파일은 모든 JavaScript와 CSS를 포함하므로 CDN이나 브라우저의 npm import에
의존하지 않습니다. 소스 수정 후 아래 명령으로 다시 생성하고 함께 커밋합니다.

```sh
npm ci
npm run build:fab:static
npm run test:pages
```

CI는 게시 파일과 소스가 일치하는지, 홈페이지 → 새 챔버 → 홈/학습 경로,
기존 ALE 링크와 WebGL 대체 화면이 동작하는지 확인합니다.

## 기존 Crystalline Si ALE simulator

`ale.html`은 결정질 Si 표면에 Cl이 흡착되고 Ar⁺ 이온의 물리 에너지로 표면 Si가
원자 단위로 제거되는 여러 ALE 사이클을 3D 형태로 보여 줍니다.

- Cl 표면 피복률: 0–100%
- Ar⁺ 에너지 프리셋: 20 / 50 / 100 eV
- ICP Source Power: 0–600 W (독립 입력 및 정성 플럭스 인터페이스)
- Cycle: 1–100회, Pause/Resume, 속도 제어 및 누적 표면 상태
- 흡착 → Purge → 충돌 → SiClₓ 이탈 애니메이션
- 제거 원자 수, 기하 기반 EPC, 누적 식각 깊이 및 Cycle별 그래프

> 이 도구의 수치는 공정 설계를 위한 예측값이 아닌 교육용 정성 지표입니다. 실제 값에는 MD/DFT 계산 및 실험 보정이 필요합니다.

### 모델 경계

- `sim-model.js`의 `ConceptualPlasmaModel`은 Source Power를 무차원 radical/ion flux 지수로 전달하는 교체 가능한 인터페이스입니다.
- Source Power는 Ar⁺ Ion Energy를 직접 변경하지 않습니다.
- 원자 제거 수는 정성 이벤트 모델의 결과이며 실제 etch rate 예측값이 아닙니다.
- EPC는 제거된 Si 원자 수 × Si 원자 부피를 모델 표면적으로 나눈 기하 계산값입니다.
- 향후 OES, QMS, IEDF 및 250/300/350 W 실험 데이터로 Plasma Model을 교체·보정할 수 있습니다.

## 검증

```bash
node tests/sim-model.test.js
node --check app.js
```

테스트는 0 W와 1/10/50/100 Cycle 누적 실행, Source Power–Ion Energy 독립성, 제거 상태 동기화 및 EPC 계산을 검사합니다.

## 실행

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000/`을 엽니다.

## GitHub Pages 게시

저장소는 GitHub Pages에서 별도 빌드 없이 게시할 수 있도록 준비되어 있습니다.

- 사이트 진입점: 저장소 루트의 `index.html`
- Jekyll 처리 비활성화: `.nojekyll`
- 자동 검증: `.github/workflows/validate-static-site.yml`
- 게시 방식: `main` 브랜치의 `/(root)`를 사용하는 기존 GitHub Pages
- 새 ICP 페이지: 소스에서 생성해 커밋한 `ale-v092-fab.html`

검증을 통과한 변경을 `main`에 반영하면 기존 Pages 게시가 갱신됩니다.
Three.js 파일을 가져오기 위해 별도 CDN이나 새 호스팅 서비스를 설정할 필요가 없습니다.

## 1~3강 3D 학습 업그레이드

각 8단원과 기존 HTML/해시 진입점을 유지합니다. 원자·NaCl/CH₄·CNT·센서, 뼈와 장치·병렬 하중·인장·다공체, NiTi의 B2/B19′ 개념·열/기계 이력·실제 형태 응용을 조작할 수 있습니다. 2D 그래프는 같은 모델 상태를 사용합니다.

- learning-shared/: 공통 토큰·레이아웃·접근성 UI·렌더/카메라·선택·SVG 대체.
- learning-scenes/: 강의별 순수 모델과 장면·관찰·조작 정의.
- [24단원 PDF 대응·과학 모형·검증 범위](docs/learning-visual-audit.md).
- [오픈소스 버전·실제 LICENSE 확인·채택/미채택 이유](THIRD_PARTY_NOTICES.md).

첨부 PDF 1강31쪽·2강43쪽·3강30쪽을 직접 확인했습니다. 그림은 자체 제작하며 원본 도판을 복제하지 않습니다. 자료값·계산·정성 가정을 구분합니다. 4강 PDF의 이전 미제공 기록과 혼동하지 않습니다.

검증 명령: npm run test:learning:model, npm run test:pages. 개별 모형은 node tests/learning-models.test.cjs, 선택적 UI DOM 검사는 node tests/learning-dom.test.cjs입니다. 브라우저 증거는 강의/desktop·mobile별 Actions artifact에 저장합니다.
