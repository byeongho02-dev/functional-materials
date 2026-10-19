# Functional Materials Interactive Labs

브라우저에서 별도 빌드 없이 실행하는 기능성 재료 교육용 인터랙티브 자료입니다.

## Crystalline Si ALE simulator

`index.html`은 결정질 Si 표면에 Cl이 흡착되고 Ar⁺ 이온의 물리 에너지로 표면 Si가 원자 단위로 제거되는 여러 ALE 사이클을 3D 형태로 보여 줍니다.

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

## 배포 준비 상태

저장소는 GitHub Pages에서 별도 빌드 없이 게시할 수 있도록 준비되어 있습니다.

- 사이트 진입점: 저장소 루트의 `index.html`
- Jekyll 처리 비활성화: `.nojekyll`
- 자동 검증: `.github/workflows/validate-static-site.yml`
- 실제 Pages 배포: 아직 활성화하지 않음

PR을 `main`에 병합한 뒤 실제로 게시할 때만 GitHub의 **Settings → Pages**에서
`Deploy from a branch`, `main`, `/(root)`를 선택합니다.
