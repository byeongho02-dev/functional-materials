# Third-party notices · 기능성재료 학습

## Three.js 0.160.1 (r160) — MIT

Copyright © 2010–2023 three.js authors. 기존 [learning-electromagnetic/vendor/three.min.js](learning-electromagnetic/vendor/three.min.js)를 재사용합니다. [라이선스 전문](learning-electromagnetic/vendor/THREE-LICENSE.txt)의 저작권·허가·면책 고지를 유지합니다.

- [정확한 소스 커밋](https://github.com/mrdoob/three.js/tree/02d4c5aa091ea8b6137db5bf1ad38819308246e3).
- 파일 669,884 bytes, SHA-256: 170c6789f43217c96b3170f4b42fafe135de7f7cd48497a4218f9757ee1d49fa.
- npm three@0.160.1 파일과 byte-for-byte 대조하고 GitHub 커밋의 package.json·LICENSE를 확인했습니다.
- learning-shared/scene-core.js의 회전·줌·선택·SVG 투영 코드는 자체 작성했습니다. OrbitControls를 복사하거나 r182 컨트롤과 혼합하지 않았습니다.
- 기존 ALE의 three@0.182.0 빌드는 별개입니다. [기존 라이선스](docs/fab3d/THREE-LICENSE.txt)를 보존하며 새 강의에는 r160만 로드합니다.

## 기존 개발·검증 도구

@playwright/test 1.58.2는 [Apache-2.0](https://github.com/microsoft/playwright/blob/v1.58.2/LICENSE)입니다. 기존 개발 의존성을 재사용하며 브라우저 바이너리를 사이트에 배포하지 않습니다. Vite/esbuild 의존성을 바꾸지 않았습니다.

## 조사했으나 추가하지 않은 후보

GitHub의 해당 버전 LICENSE를 실제 확인했습니다. 최신 버전 목록이라는 뜻이 아니며 아래 코드들은 새 사이트 자산에 포함하지 않았습니다.

| 후보·확인 버전 | 라이선스 | 미채택 이유 |
| --- | --- | --- |
| [OrbitControls · 동일 r160 커밋](https://github.com/mrdoob/three.js/blob/02d4c5aa091ea8b6137db5bf1ad38819308246e3/examples/jsm/controls/OrbitControls.js) | Three.js MIT | ES 모듈 배포를 추가하지 않고 필요한 조작을 자체 구현 |
| [Chart.js 4.4.8](https://github.com/chartjs/Chart.js/blob/v4.4.8/LICENSE.md) | MIT · Chart.js Contributors | 작은 동기화 그래프는 SVG로 충분 |
| [3Dmol.js 2.4.2](https://github.com/3dmol/3Dmol.js/blob/2.4.2/LICENSE) | BSD-3-Clause 및 번들 고지 | 검증 PDB/SDF 뷰어가 필요한 범위가 아니며 중복 엔진을 피함 |
| [KaTeX 0.16.22](https://github.com/KaTeX/KaTeX/blob/v0.16.22/LICENSE) | MIT · Khan Academy/contributors | 기초 식은 HTML·Unicode로 표현 |
| [Lucide 0.468.0](https://github.com/lucide-icons/lucide/blob/0.468.0/LICENSE) | ISC · Feather 일부 MIT | 텍스트 버튼과 자체 도식을 사용 |

## 그림·모형·원본 자료

새 1~3강의 기하·3D·벡터 도식은 자체 제작했습니다. 교수 PDF·논문·제품 사진·X선을 복제하지 않았습니다. 출처가 불명확한 기존 3강 base64 사진과 기존 2강 외부 사진은 새 페이지에서 사용하지 않습니다. 사용자 제공 PDF는 로컬 검토에만 사용하며 저장소·배포 파일에 추가하지 않았습니다.

학술 링크는 사실·정의·범위를 확인하는 참고문헌입니다. 공개 링크를 도판 재배포 허가로 해석하지 않습니다. 원본 그림이 필요해지면 정확한 라이선스·허가를 별도로 확인해야 합니다.
