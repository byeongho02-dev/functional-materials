/* Learning support and references. No network calls or material-performance predictions. */
(function(scope){
  'use strict';
  const references=[
    {id:'li1999',label:'Li 등 · MOF-5 구조',title:'Design and synthesis of an exceptionally stable and highly porous metal-organic framework',journal:'Nature (1999)',url:'https://doi.org/10.1038/46248'},
    {id:'edda2002',label:'Eddaoudi 등 · IRMOF',title:'Systematic Design of Pore Size and Functionality in Isoreticular Metal-Organic Frameworks and Application in Methane Storage',journal:'Science (2002)',url:'https://doi.org/10.1126/science.1067208'},
    {id:'iupac2015',label:'IUPAC · 흡착·기공 용어',title:'Physisorption of gases, with special reference to the evaluation of surface area and pore size distribution (IUPAC Technical Report)',journal:'Pure and Applied Chemistry (2015)',url:'https://doi.org/10.1515/pac-2014-1117'},
    {id:'water2014',label:'Burtch 등 · 수분 안정성',title:'Water Stability and Adsorption in Metal–Organic Frameworks',journal:'Chemical Reviews (2014)',url:'https://doi.org/10.1021/cr5002589'},
    {id:'stability2016',label:'Howarth 등 · 안정성',title:'Chemical, thermal and mechanical stabilities of metal–organic frameworks',journal:'Nature Reviews Materials (2016)',url:'https://doi.org/10.1038/natrevmats.2015.18'},
    {id:'sensors',label:'Kreno 등 · 화학 센서',title:'Metal–Organic Framework Materials as Chemical Sensors',journal:'Chemical Reviews',url:'https://doi.org/10.1021/cr200324t'}
  ];
  const lessons=[
    {
      analogy:'건물의 연결부와 들보가 빈 방을 둘러싸는 모습을 떠올려 보세요. MOF에서도 연결 부품이 공간의 모양을 잡습니다.',
      boundary:'원자는 실제 건축 부품이 아닙니다. 아래 조립 장면도 합성 반응의 시간 순서를 재현하지 않습니다.',
      sources:['li1999','edda2002'],
      experiment:['조작','마디·링커·기공을 확대하고 원자 모형과 연결 관계를 비교하세요.','이유','규칙적으로 이어진 마디와 링커 사이에 공간이 남습니다.','한계','교육용 원자 배치입니다. 실제 CIF 좌표·기공 크기를 측정한 그림이 아닙니다.'],
    },
    {
      analogy:'함께 사용할 연결 도구를 한 사람이 먼저 꺼내오는 상황을 떠올려 보세요. 배위 결합에서도 결합 전 전자쌍은 한쪽이 제공합니다.',
      boundary:'전자쌍은 실제 도구가 아닙니다. 결합 후 전자 상태가 공유되는 것이며, 전자 두 개가 통째로 금속으로 옮겨 가는 뜻은 아닙니다.',
      sources:['li1999'],
      experiment:['조작','재생하거나 한 장면씩 넘겨 전자쌍이 공유되는 결합 영역을 보세요.','이유','산소의 전자 밀도와 금속의 상호작용이 적절한 배치에서 더 안정한 결합 상태를 만들 수 있습니다.','한계','점과 구름은 전자쌍의 개념 표시입니다. 전자 궤적·전자 밀도나 결합 에너지를 계산하지 않습니다.'],
    },
    {
      analogy:'건물의 연결부가 방향을 잡고 들보가 이웃 연결부를 잇듯, 금속 노드와 유기 링커도 서로 다른 역할을 맡습니다.',
      boundary:'MOF의 노드는 금속 이온 하나일 수도, 여러 원자가 모인 클러스터일 수도 있습니다. Zn₄O·BDC는 MOF-5의 구체적인 사례입니다.',
      sources:['li1999'],
      experiment:['조작','Zn₄O 기반 마디와 BDC를 각각 확대하고, 부품에서 반복 골격으로 이어지는 장면을 보세요.','이유','마디의 연결 부위와 링커의 결합 말단이 이어져 입체 연결망을 만듭니다.','한계','여섯 방향은 마디 전체의 연결도입니다. 단일 Zn 이온의 배위수가 여섯이라는 뜻이 아닙니다.'],
    },
    {
      analogy:'같은 연결부에 더 긴 들보를 끼우면 연결부 사이가 벌어지는 모형을 생각해 보세요.',
      boundary:'같은 연결 방식과 유사한 마디를 유지한 비교의 비유입니다. 모든 MOF가 긴 링커를 쓰면 반드시 더 큰 기공을 갖는 것은 아닙니다.',
      sources:['edda2002'],
      experiment:['변수','고리 수는 BDC·BPDC·TPDC 링커의 구조 차이를 고르는 항목입니다.','변화·이유','이 IRMOF 연결망의 정성 모형에서는 긴 링커가 마디 사이를 벌립니다. 상호관입·구조 변화가 있으면 실제 접근 공간은 달라집니다.','한계','IRMOF-1·10·16의 명칭과 링커는 문헌 사례입니다. 그림 거리비 1·1.4·1.8은 교육용 가정이며 문헌의 측정 길이가 아닙니다.'],
    },
    {
      analogy:'상자의 가로·세로·높이를 같은 비율로 늘리면 길이보다 부피가 빠르게 커집니다.',
      boundary:'이 상자는 기하학적 비교입니다. 골격 원자의 부피와 분자가 실제 통과할 입구를 모두 반영한 기공은 아닙니다.',
      sources:['edda2002','iupac2015'],
      experiment:['변수','마디 사이 거리 슬라이더는 기준 길이에 대한 상대값입니다.','변화·이유','세 방향의 길이가 함께 늘어 부피비가 길이비의 세제곱이 됩니다.','한계','1.8³ = 5.832는 기하 공간 부피비입니다. 실제 기공 부피·비표면적·흡착량의 배수를 산출하지 않습니다.'],
    },
    {
      analogy:'두 개의 독립적인 철골 연결망이 서로의 빈 칸을 통과해 얽힌 모습을 떠올려 보세요.',
      boundary:'완성된 결정에 다른 골격을 끼워 넣는 실제 공정이 아닙니다. 합성 조건에 따라 이런 연결망들이 함께 형성될 수 있다는 구조 비교입니다.',
      sources:['edda2002','water2014','stability2016'],
      experiment:['변수','스위치는 독립 연결망 하나와 두 개를 비교합니다.','변화·이유','두 번째 망이 공간을 함께 차지해 접근 가능한 기공이 줄 수 있으며, 구조 움직임이나 안정성도 달라질 수 있습니다.','한계','두 망을 잇는 결합은 만들지 않습니다. 접근 가능한 기공 감소량과 안정성 향상량은 계산하지 않습니다.'],
      practical:'안정성은 상호관입만으로 정해지지 않습니다. 물이 금속–링커 결합과 경쟁하거나 가수분해를 일으킬 수 있고, 높은 열·산·염기도 골격에 영향을 줄 수 있습니다. MOF-5의 수분 취약성을 모든 MOF에 그대로 적용해서도 안 됩니다.',
    },
    {
      analogy:'책의 겉표지에 더해 펼쳐진 페이지의 면까지 접촉할 수 있다고 생각하면, 내부 표면의 역할을 떠올리기 쉽습니다.',
      boundary:'MOF를 책처럼 펼친다는 뜻이 아닙니다. 실제로 접근 가능한 기공의 골격 표면을 이용한다는 비유입니다.',
      sources:['li1999','iupac2015'],
      experiment:['조작','내부 표면 강조는 분자가 접촉할 수 있는 골격 부분을 읽는 보조 표시입니다.','문헌값','약 2,900 m²/g는 MOF-5의 겉보기 Langmuir 추정값입니다. 농구장 약 7개는 면적 비유입니다.','한계','이 막대 그림에서 표면적을 계산하지 않습니다. Langmuir 값과 BET 값을 동일시하지 않으며 시료·활성화·분석법에 따라 달라집니다.'],
    },
    {
      analogy:'방 안으로 들어오는 것과 벽 가까이에 잠시 머무는 것을 나누어 생각해 보세요. 기공으로의 이동과 표면 흡착도 구분합니다.',
      boundary:'실제 분자가 벽에 기대거나 마찰로 붙는 것은 아닙니다. 열운동과 분자–골격의 물리적 상호작용으로 설명합니다.',
      sources:['iupac2015'],
      experiment:['변수','압력은 기체 공급의 상대 지수, 온도는 발열성 물리흡착의 정성 지수입니다. 크기비는 분자가 입구를 통과할지 비교합니다.','변화·이유','이 단일 기체 Langmuir 예시에서는 압력이 높아지면 점유율이 증가하고, 온도가 높아지면 친화력이 줄어듭니다. A·B는 서로 다른 임의 친화력을 가진 가상 기체입니다.','한계','무차원 교육 모형입니다. 확산계수·실제 흡착량·혼합 기체 선택도를 예측하지 않습니다. 표시 입자 수와 이동 경로는 실제 농도·분자 궤적이 아닙니다.'],
      practical:'흡착은 표면에 머무는 현상, 흡수는 물질의 부피 내부에 들어가 분포하는 현상입니다. 기공을 채운 자유 기체와 표면에 흡착한 분자도 구분합니다.',
    },
    {
      analogy:'구멍 크기와 표면 재질이 다른 필터가 용도에 따라 다르게 쓰이듯, MOF도 구조와 화학을 목적에 맞게 골라야 합니다.',
      boundary:'크기로 거르는 체질만을 뜻하지 않습니다. 친화력·확산·적합한 반응 자리나 신호 변화도 기능에 관여합니다.',
      sources:['edda2002','sensors','water2014','stability2016'],
      experiment:['조작','응용을 고르면 같은 기공에서 어떤 구조 특성을 이용하는지 비교할 수 있습니다.','이유','저장·분리·포집은 접근 공간과 친화력, 촉매는 활성점, 센서는 분자와 만났을 때 달라지는 측정 신호를 활용합니다.','한계','모든 MOF가 모든 응용에 적합하지 않습니다. 여기서는 실제 저장량·반응 속도·센서 감도를 계산하지 않습니다.'],
      practical:'산업 적용에서는 혼합 기체와 수분의 경쟁, 열·화학적 안정성, 흡착·탈착을 반복한 뒤의 성능을 확인해야 합니다. 분말을 성형하는 과정의 기공 손실·압력 손실, 재생 에너지와 제조 비용도 중요합니다.',
    }
  ];
  const api={references,lessons};
  if(typeof module==='object'&&module.exports)module.exports=api;else scope.MOFLearning=api;
})(typeof window==='object'?window:globalThis);
