# Functional Materials Interactive Labs

브라우저에서 별도 빌드 없이 실행하는 기능성 재료 교육용 인터랙티브 자료입니다.

## Crystalline Si ALE simulator

`index.html`은 결정질 Si 표면에 Cl이 흡착되고 Ar⁺ 이온의 물리 에너지로 표면 Si가 원자 단위로 제거되는 한 사이클을 3D 형태로 보여 줍니다.

- Cl 표면 피복률: 20–100%
- Ar⁺ 에너지 프리셋: 20 / 50 / 100 eV
- 흡착 → 충돌 → SiClₓ 이탈 애니메이션
- 가상 제거 확률, 제거 원자 수, 예상 EPC 표시

> 이 도구의 수치는 공정 설계를 위한 예측값이 아닌 교육용 정성 지표입니다. 실제 값에는 MD/DFT 계산 및 실험 보정이 필요합니다.

## 실행

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000/`을 엽니다.
