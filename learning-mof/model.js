/* Educational schematic, not CIF coordinates or a fitted material model. No runtime dependencies. */
(function (scope) {
  'use strict';
  const colors = { blue:'#65b5ff', green:'#68dfa3', yellow:'#f5d77a', purple:'#bd9aff', orange:'#ffae69', white:'#e5eff9', gray:'#7a91a6', cyan:'#82dfec' };
  const families = [
    { rings:1, name:'IRMOF-1 · MOF-5', linker:'BDC', ratio:1 },
    { rings:2, name:'IRMOF-10', linker:'BPDC', ratio:1.4 },
    { rings:3, name:'IRMOF-16', linker:'TPDC', ratio:1.8 }
  ];
  const chapters = [
    { short:'MOF란?', title:'MOF란 무엇인가요?', key:'금속과 유기 분자를 이어, 내부에 작은 빈 공간을 만든 다공성 결정 재료입니다.',
      storyTitle:'단단한 물질 속, 비어 있는 길',
      explanation:'<p>건물의 비유를 원자 크기로 줄여 생각해 봅니다. <strong>MOF(금속–유기 골격체)</strong>는 <strong>금속 노드(연결 마디)</strong>와 <strong>유기 링커(탄소 골격을 가진 연결 분자)</strong>가 배위 결합으로 이어진 골격입니다.</p><p>배위 결합은 한쪽이 제공한 전자쌍을 공유하는 결합입니다. 같은 연결이 규칙적으로 반복되는 <strong>결정성</strong>과, 골격 사이에 남는 <strong>기공(빈 공간)</strong>이 이 재료를 이해하는 출발점입니다. 금속과 유기물을 섞어 놓았다는 것만으로 MOF가 되는 것은 아닙니다.</p>',
      bridge:'빈 공간이 보이기 시작했습니다. 그렇다면 그 공간을 둘러싸고 모양을 잡아 주는 것은 무엇일까요? 다음 이야기에서 골격을 이루는 두 부품을 만나 봅니다.',
      guide:'마디와 링커를 각각 확대하고 전체 골격으로 돌아와 보세요.', note:'원자 배치는 원리를 설명하기 위해 조절한 모형이며 실제 CIF 구조가 아닙니다.',
      theory:'<p><strong>MOF(금속–유기 골격체)</strong>는 금속 마디와 유기 분자가 배위 결합으로 연결된 다공성 결정 재료입니다.</p><p>건물에 비유하면 <strong>마디는 연결부, 링커는 철골, 기공은 빈 방</strong>입니다. 치밀한 재료와 달리 골격 사이의 내부 공간까지 분자가 접근할 수 있습니다.</p><p><strong>금속 마디(node)</strong>는 금속 이온 하나일 수도, 여러 이온이 모인 클러스터일 수도 있습니다. <strong>유기 링커(linker)</strong>는 여러 마디를 연결하고, 그 반복 전체가 <strong>골격(framework)</strong>입니다.</p><p>노란 영역은 <strong>기공(pore)</strong>의 위치입니다. 벽으로 둘러싸인 상자가 아니라 연결망 사이의 빈 공간입니다. 분자가 실제로 접근하려면 입구가 충분히 열려 있고 용매 등이 제거되어야 합니다.</p>',
      caution:'건물 비유와 입방 연결망은 구조를 이해하기 위한 모식도입니다. 실제 MOF 기공은 다양한 형태와 입구를 가집니다.',
      scenes:[['빈 공간을 가진 결정','먼저 골격 전체를 바라봅니다. 금속 부분과 유기 분자가 연결된 사이로 빈 공간이 이어집니다.'],['마디와 링커 연결','조금 가까이 다가가면 연결부인 마디와, 그 사이를 이어 주는 링커를 구별할 수 있습니다.'],['기공을 이용하는 재료','그 연결이 남긴 열린 기공으로 분자가 드나들 수 있습니다. 빈 공간도 재료의 기능에 참여합니다.']] },
    { short:'결합의 이유',title:'마디와 링커는 어떻게 붙을까요?',key:'산소가 낸 전자쌍을 금속과 함께 써서 배위 결합을 만듭니다.',
      storyTitle:'두 부품이 만나는 자리',
      explanation:'<p>두 부품의 접점을 들여다봅니다. MOF-5에서는 링커 산소의 <strong>비공유 전자쌍(아직 결합에 쓰이지 않은 전자 두 개)</strong>이 마디의 <strong>Zn²⁺(양전하 두 개를 띤 아연 이온)</strong>와 상호작용합니다.</p><p>전자쌍이 결합 영역에서 공유되어 적절한 배치에서 더 안정해질 수 있습니다. 이것이 <strong>배위 결합</strong>입니다. 전자쌍을 제공하는 쪽을 <strong>루이스 염기</strong>, 받아 결합하는 쪽을 <strong>루이스 산</strong>이라 부릅니다. 이 연결이 반복되어 입체 골격으로 이어집니다.</p>',
      bridge:'이제 처음의 빈 공간으로 돌아옵니다. 금속 마디와 유기 링커가 전자쌍을 공유하며 연결되고, 그 연결이 반복되어 열린 골격이 된 것이었습니다. 여기까지가 MOF의 기본 이야기입니다.',
      guide:'흰 점 두 개가 결합 영역에서 공유되는 모습을 보세요.', note:'전자쌍을 함께 쓰는 것이며, 완전히 옮기는 과정은 아닙니다.',
      theory:'<p>금속 이온은 리간드의 전자쌍을 받아 결합할 수 있는 <strong>루이스 산</strong>입니다. 산소의 비공유 전자쌍을 제공하는 리간드는 <strong>루이스 염기</strong>입니다.</p><p>MOF-5에서는 카복실레이트기의 산소가 Zn²⁺에 배위합니다. 전자쌍을 공유하면 적절한 배치에서 전체 에너지가 낮아져 결합이 안정해질 수 있습니다.</p><p>배위 결합은 <strong>공유 결합의 한 표현</strong>입니다. 결합 전 전자쌍을 한쪽이 제공했다는 점에 주목하는 이름이며, 결합 후에는 전자 밀도가 두 원자 사이에 공유됩니다. 전자 두 개가 완전히 금속으로 넘어가는 산화·환원 과정과 다릅니다.</p><p>양전하를 띤 Zn²⁺는 전자 밀도를 끌어당기며 리간드 궤도와 상호작용해 전자쌍을 수용할 수 있습니다. 산소에는 결합에 쓰이지 않은 비공유 전자쌍이 있습니다. 실제 결합은 정전기적 성분과 궤도 상호작용을 함께 가지며, 화면의 점 두 개는 전자 궤적이 아닙니다.</p><p>산·염기는 여기서 수소 이온이나 pH가 아니라 <strong>전자쌍의 받음·제공</strong>을 뜻합니다.</p>',
      caution:'Zn²⁺와 산소 한 쌍을 확대해 그린 국소 결합 모식도입니다. 전자쌍 점은 개념 기호이며 실제 전자 이동 경로가 아닙니다.',
      scenes:[['전자쌍의 제공자와 수용자','이번에는 두 부품의 접점을 봅니다. 산소 쪽 비공유 전자쌍과 이를 받아 결합할 수 있는 Zn²⁺가 보입니다.'],['리간드의 산소가 접근','두 부분이 가까워지며 산소의 전자 밀도와 금속이 상호작용합니다. 결합이 만들어지는 이유를 볼 차례입니다.'],['공유되는 배위 결합','전자쌍이 Zn–O 결합 영역에서 공유되는 상태에 이릅니다. 이 연결이 골격을 이루는 배위 결합입니다.']] },
    { short:'무엇으로?',title:'MOF-5는 어떤 부품으로 이루어질까요?',key:'Zn₄O 기반 금속 마디와 BDC 유기 링커가 반복 연결됩니다.',
      storyTitle:'빈 공간을 지탱하는 두 부품',
      explanation:'<p>빈 공간의 모양을 지탱하는 골격에는 서로 다른 두 부품이 있습니다. <strong>금속 노드</strong>는 금속 이온 하나 또는 여러 원자가 모인 <strong>클러스터(원자들의 묶음)</strong>로 된 연결부입니다. <strong>유기 링커</strong>는 이웃 노드를 잇는 분자입니다.</p><p>MOF-5에서는 <strong>Zn₄O 기반 노드</strong>와 <strong>BDC 링커</strong>가 그 역할을 합니다. BDC는 벤젠 고리 양끝에 <strong>카복실레이트(–COO⁻ 결합 말단)</strong>를 가지며, 말단 산소가 금속에 배위합니다.</p>',
      bridge:'두 부품의 모습과 역할을 알게 되었습니다. 이제 연결 자체가 궁금해집니다. 마디와 링커는 어떤 원리로 결합해 골격을 유지할까요?',
      guide:'원자 색과 연결 위치를 보고, 재생으로 부품에서 전체 골격까지 살펴보세요.', note:'구조를 이해하는 순서이며, 실제 합성 과정을 재현하지 않습니다.',
      theory:'<p><strong>MOF-5 = IRMOF-1, Zn₄O(BDC)₃.</strong> Zn₄O 기반 마디를 BDC 링커가 연결합니다. BDC의 벤젠 고리는 비교적 단단한 간격재, 양끝 카복실레이트는 금속에 결합하는 손잡이 역할을 합니다.</p><p>마디의 여섯 연결 방향을 반복하면 3차원 연결망이 됩니다. <strong>활성화</strong>는 이미 존재하는 기공의 용매를 제거해 분자가 사용할 공간을 여는 과정입니다.</p><p>마디 중심에는 산소 하나와 네 Zn이 이루는 <strong>Zn₄O 클러스터</strong>가 있습니다. 여섯 카복실레이트가 그 주위를 연결하는 Zn₄O(COO)₆ 기반 이차 구성 단위(SBU)를 이룹니다. 이는 벌크 산화아연 <strong>ZnO 결정과 다릅니다.</strong></p><p>BDC²⁻는 1,4-benzenedicarboxylate입니다. 산 형태 H₂BDC에서 양끝 카복실기가 탈양성자화된 연결체로, 각 끝의 산소가 마디에 배위합니다. 여섯 방향은 단일 Zn 이온의 배위수 6이라는 뜻이 아니라 <strong>마디 전체의 연결도</strong>입니다.</p><p>하나의 마디에 연결된 링커는 이웃 마디와 공유됩니다. 마디당 6개 연결의 절반을 세어 화학식의 BDC 3개가 됩니다.</p>',
      caution:'6장면은 구조를 조립해 이해하는 교육 순서입니다. 실제 합성의 중간체·반응 경로·속도나 결정 성장의 시간 순서를 재현하지 않습니다.',
      scenes:[['마디와 링커를 따로 보기','앞에서 본 골격을 두 부품으로 나누어 봅니다. 왼쪽은 Zn₄O 기반 마디, 오른쪽은 BDC 링커입니다.'],['Zn₄O 기반 마디 확대','먼저 마디를 확대합니다. 분홍 중심 O와 파란 Zn 네 개, 그리고 그 주위의 연결 부위가 보입니다.'],['BDC 링커 확대','이제 마디 사이를 잇는 BDC를 봅니다. 벤젠 고리 양끝에 금속과 만나는 카복실레이트가 있습니다.'],['연결 방식의 반복','두 부품의 연결을 이웃으로 이어 가 봅니다. 마디 전체의 여섯 연결 방향으로 골격이 확장됩니다.'],['3차원 골격과 기공','시야를 넓히면 연결이 입체적으로 반복됩니다. 골격 사이에는 이미 기공이 있고, 그 안에 용매가 남아 있을 수 있습니다.'],['활성화로 용매 제거','마지막으로 회색 용매가 빠져나갑니다. 골격과 기공은 남고, 다른 분자가 접근할 공간이 열립니다.']] },
    { short:'링커 바꾸기',title:'연결재를 길게 바꾸면?',key:'같은 연결망의 비교에서는 긴 링커가 공간을 벌릴 수 있으며, 다른 구조 조건도 함께 봐야 합니다.',
      storyTitle:'연결재 하나를 바꾸어 보면',
      explanation:'<p>결합이 골격을 잇는 원리를 알았으니, 마디는 유지하고 링커를 바꾸어 봅니다. <strong>IRMOF</strong>는 기본 연결 방식을 유지하며 링커를 바꾼 계열입니다. IRMOF-1·10·16은 각각 BDC·BPDC·TPDC를 사용하는 문헌 사례입니다.</p><p>이 비교 모형에서는 긴 링커가 마디 사이를 벌립니다. 이런 구조 설계 접근을 <strong>망상 화학</strong>이라 합니다. 다만 실제로는 연결망 변화·상호관입·구조 수축 등이 생길 수 있어, 모든 MOF의 접근 가능한 기공이 반드시 커진다고 말할 수는 없습니다.</p>',
      bridge:'링커를 바꾸자 골격의 크기도 달라졌습니다. 길이가 조금 늘었을 뿐인데, 내부 공간의 부피는 얼마나 커질까요?',
      guide:'고리 1·2·3개를 번갈아 선택해 보세요.', note:'그림의 상대 길이는 교육용 가정이며 측정값이 아닙니다.',
      theory:'<p><strong>망상 화학(reticular chemistry)</strong>은 분자 구성요소와 그 연결 방식을 바탕으로 확장된 구조를 설계하는 접근입니다.</p><p>IRMOF-1·10·16은 같은 Zn₄O 기반 마디와 연결 형태를 유지하면서 BDC·BPDC·TPDC로 링커를 늘립니다. <strong>마디가 커지는 것이 아니라 마디 사이가 벌어집니다.</strong></p><p>BDC는 벤젠 고리 1개, BPDC(biphenyl dicarboxylate)는 2개, TPDC(terphenyl dicarboxylate)는 3개의 고리를 가진 연결체입니다. 길이뿐 아니라 작용기를 바꾸어 기공 내부의 화학적 친화력도 조절할 수 있습니다.</p><p><strong>Isoreticular</strong>는 기본 연결망의 위상을 유지한다는 뜻입니다. 링커 교체가 언제나 같은 결정이나 안정성을 보장하는 것은 아닙니다. 실제 합성에서는 용매·농도 등 조건과 상호관입 여부도 중요합니다.</p>',
      caution:'세 구조는 동일한 그림 배율에서 비교합니다. 마디 반지름은 고정됩니다. 상대 길이 1·1.4·1.8은 교육용이며 실측 격자 상수가 아닙니다.',
      scenes:[['같은 Zn₄O 마디','파란 마디의 크기와 연결 방향은 그대로입니다.'],['고리 수를 바꾸기','고리 선택 버튼으로 1·2·3개 링커와 구조 명칭을 비교하세요.'],['같은 연결망의 확장','비교 보기를 켜면 같은 배율에서 마디 간 거리와 내부 공간을 볼 수 있습니다.']] },
    { short:'공간의 크기',title:'길이는 조금, 부피는 많이 커져요',key:'길이가 1.8배면, 공간은 1.8 × 1.8 × 1.8 ≈ 6배입니다.',
      storyTitle:'작은 길이 변화가 넓히는 공간',
      explanation:'<p>앞에서 본 길이 변화를 가로·세로·높이에서 함께 살펴봅니다. 입방형 기하 모형의 부피비는 <strong>길이비를 세 번 곱한 값</strong>입니다. 따라서 1.8³ = 5.832가 됩니다.</p><p>여기서 얻은 것은 마디 사이 거리로 그린 <strong>기하 공간의 부피비</strong>입니다. 골격 원자가 차지하는 공간과 분자의 입구 통과 여부를 더 고려해야 실제 접근 가능한 기공을 논할 수 있습니다. 기공 직경·기공 부피·비표면적·흡착량은 각각 다른 물리량입니다.</p>',
      bridge:'길이가 공간을 크게 바꾼다는 것을 보았습니다. 그런데 합성 과정에서 이 넓은 자리를 다른 골격이 함께 차지한다면 어떤 모습이 될까요?',
      guide:'슬라이더를 움직여 길이비와 부피비를 비교하세요.', note:'기하 모형의 공간 부피비이며, 실제 유효 기공 부피와 다릅니다.',
      theory:'<p>입방형 기하 모형에서 한 변이 L이면 <strong>V = L³</strong>입니다. 세 방향이 모두 r배 늘면 부피는 r³배입니다.</p><p class="formula">V₂ / V₁ = (L₂ / L₁)³<br>1.8³ = 5.832 ≈ 6</p><p>슬라이더를 움직여 노란 공간과 기준 윤곽을 비교하세요. <strong>이 값은 측정한 유효 기공 부피가 아닙니다.</strong></p><p>여기서 L은 모식도에서 이웃 마디 중심 사이 거리입니다. 고정 크기의 마디와 링커가 차지하는 부피를 빼지 않고 L³을 계산합니다. 따라서 노란 윤곽은 비교용 공간이며 실제 기공 경계가 아닙니다.</p><p><strong>격자 상수 ≠ 마디 간 거리 ≠ 기공 직경.</strong> 기공 부피는 골격 원자가 차지하는 공간을 제외해야 하며, 분자가 접근 가능한 공간에는 입구 크기와 잔류 용매까지 영향을 줍니다.</p><p>제작 지시서의 고리 1개 대비 3개 거리비 1.8을 사용합니다. 중간 슬라이더 값에 대응하는 실제 MOF가 존재한다는 뜻은 아닙니다.</p>',
      caution:'약 6배는 교육용 기하학적 부피비입니다. 실험 기공 부피, 비표면적, 기체 저장량을 6배로 예측하지 않습니다.',
      scenes:[['세 방향을 함께 늘리기','마디 크기는 그대로 두고 가로·세로·높이의 마디 간 거리를 조절합니다.'],['기준 공간과 비교','회색 기준 윤곽은 L₁, 노란 윤곽은 현재 L₂를 표시합니다.'],['세제곱으로 커지는 공간','결과판의 길이비와 부피비는 서로 다른 값입니다. 실제 유효 기공 부피와도 구분하세요.']] },
    { short:'골격의 겹침',title:'빈 공간에 또 다른 골격이 생기면?',key:'서로 결합하지 않은 두 골격이 얽히는 것이 상호관입입니다.',
      storyTitle:'하나의 공간을 함께 쓰는 골격',
      explanation:'<p>넓어진 빈 공간을 통과하는 다른 골격이 합성 조건에 따라 함께 형성될 수 있습니다. 서로 직접 결합하지 않은 독립 연결망이 얽힌 구조를 <strong>상호관입</strong>이라 합니다.</p><p>IRMOF-15와 IRMOF-16은 TPDC를 쓰는 상호관입·비상호관입 비교 사례입니다. 공간을 나눠 쓰면 분자가 접근할 자리가 줄 수 있지만, 골격 움직임·안정성·선택성에 유리할 때도 있습니다. 안정성은 수분·열·화학적 환경과도 따로 비교해야 합니다.</p>',
      bridge:'같은 빈 공간도 골격이 얽히는 방식에 따라 달라졌습니다. 이제 시선을 기공의 안쪽으로 옮겨, 분자가 만나는 표면을 살펴봅니다.',
      guide:'두 번째 골격을 켜고 남는 공간을 살펴보세요.', note:'긴 링커라고 반드시 겹치지는 않으며, 성능에 유리할 수도 있습니다.',
      theory:'<p>링커가 길어지면 큰 빈 공간이 생길 수 있습니다. 합성 중 그 공간을 통과하는 <strong>또 다른 독립 골격</strong>이 형성될 수 있는데, 이를 <strong>상호관입(interpenetration)</strong>이라 합니다.</p><p>TPDC를 사용하는 <strong>IRMOF-15는 상호관입, IRMOF-16은 비상호관입</strong> 사례입니다. 보라색 골격을 켜서 비교해 보세요.</p><p>두 골격 사이에는 이 그림에서 새로운 배위 결합을 만들지 않습니다. 공간을 함께 차지하므로 분자가 접근 가능한 공간이 줄 수 있지만, 골격의 움직임을 제약해 안정성이 높아지거나 특정 분자와의 상호작용에 유리할 수도 있습니다.</p><p>긴 링커라고 반드시 상호관입이 생기는 것은 아닙니다. Eddaoudi 등의 연구에서는 농도를 낮추는 등 합성 조건 조절로 비상호관입 구조를 얻었습니다. <strong>상호관입은 항상 성능 저하를 뜻하지 않습니다.</strong></p>',
      caution:'보라색 골격이 들어오는 동작은 구조 비교를 위한 전환입니다. 완성된 결정에 골격을 끼워 넣는 실제 공정을 뜻하지 않습니다. 유효 기공 감소량은 계산하지 않습니다.',
      scenes:[['하나의 독립 골격','TPDC 연결망 하나만 있으면 IRMOF-16의 비상호관입 연결 형태에 대응합니다.'],['두 번째 골격이 공간을 통과','ON을 켜면 보라색 연결망을 함께 볼 수 있습니다. 파란 망과 보라 망 사이에는 연결선이 없습니다.'],['공간과 안정성의 균형','독립적인 두 망이 공간을 함께 차지합니다. 기공과 성능 변화는 실제 구조·조건에 따라 달라집니다.']] },
    { short:'넓은 표면',title:'작은 MOF에 표면이 왜 많을까요?',key:'기공 안쪽의 표면까지 이용하므로, 1 g으로도 넓은 면적을 얻습니다.',
      storyTitle:'안쪽으로 이어지는 넓은 표면',
      explanation:'<p>기공으로 들어간 분자는 재료의 겉면에 더해 <strong>안쪽 골격 표면</strong>에도 닿습니다. 표면적을 질량으로 나눈 값이 <strong>비표면적</strong>이며, 보통 m²/g로 나타냅니다.</p><p>MOF-5의 약 2,900 m²/g는 질소 흡착에 <strong>Langmuir 모형(흡착으로 표면적을 추정하는 방법)</strong>을 적용한 겉보기 값입니다. BET 분석값과 같지 않습니다. 기공이 커진다는 사실 하나로 비표면적이나 흡착량의 증가를 보장하지는 못합니다.</p>',
      bridge:'작은 질량 안에 넓은 접촉면이 담겨 있었습니다. 그런데 그 표면에 닿은 분자는 왜 그곳에 머물게 될까요?',
      guide:'재생 후 내부 표면 강조를 껐다 켜 보세요.', note:'문헌의 Langmuir 추정값이며 시료와 측정법에 따라 달라집니다.',
      theory:'<p><strong>비표면적 S = A / m</strong>은 질량 1 g당 표면적입니다. 치밀한 재료는 주로 겉면을 이용하지만, 활성화된 MOF는 내부 표면까지 기체와 만날 수 있습니다.</p><p>MOF-5의 원문 보고값은 <strong>겉보기 Langmuir 표면적 약 2,900 m²/g</strong>입니다. 1 g의 면적을 비유하면 28 × 15 m 농구장 약 7개에 해당합니다.</p><p>가벼운 골격이 공간을 유지하면서 내부에 많은 접촉 면적을 제공하므로 A/m이 커질 수 있습니다. 이 화면의 단순 막대 구조에서 실제 비표면적을 산출하지는 않습니다.</p><p><strong>기공이 커진다고 비표면적도 반드시 커지지는 않습니다.</strong> 표면의 곡률·구조, 골격 질량, 상호관입, 접근 가능한 공간 등이 함께 달라집니다.</p><p>2,900 m²/g는 Li 등(1999)의 질소 흡착 기반 <strong>겉보기 Langmuir 추정값</strong>입니다. 원문은 큰 공동에 단분자층 가정이 엄밀하지 않을 수 있다고 설명합니다. BET 값과 동일시하지 않으며 합성·활성화·측정 방법에 따라 값이 달라집니다.</p>',
      caution:'2,900 m²/g는 문헌의 대표 추정값입니다. 모든 MOF-5 시료의 보장값이 아닙니다. 농구장 1개 = 420 m², 2,900 / 420 ≈ 6.90입니다.',
      scenes:[['치밀한 재료의 외부 표면','분자는 주로 바깥 표면과 접촉합니다.'],['MOF의 내부 표면','내부 표면 보기를 켜면 기체가 만나는 골격 표면을 강조합니다. 기공 자체가 고체 표면은 아닙니다.'],['질량당 면적으로 비교','면적 A를 질량 m으로 나눈 값이 비표면적입니다. 농구장 비교는 면적의 크기를 느끼는 비유입니다.']] },
    { short:'기체 붙잡기',title:'기체는 왜 표면에 머무를까요?',key:'기체와 골격 사이의 끌림으로, 기체가 표면에 머무는 것이 흡착입니다.',
      storyTitle:'표면에 머물다가 다시 떠나는 분자',
      explanation:'<p>분자는 열운동으로 움직이며 열린 입구를 통해 기공 안에 <strong>확산</strong>할 수 있습니다. 확산은 이동 과정이고, 표면에 머무는 <strong>흡착</strong>과는 구분합니다.</p><p>분자 사이의 약한 끌림인 <strong>반데르발스 힘</strong>과 전하에 따른 힘인 <strong>정전기적 상호작용</strong>이 기체를 골격 표면에 머무르게 할 수 있습니다. 이것이 이 예시의 <strong>물리흡착</strong>입니다. 분자는 다시 떠나는 <strong>탈착</strong>도 합니다. <strong>친화력(표면과 잘 상호작용하는 정도)</strong>, 온도·압력과 기공 접근성이 함께 작용합니다.</p>',
      bridge:'분자가 들어오고, 표면에 머물다가, 다시 떠나는 과정을 살펴보았습니다. 이제 이 차이를 이용해 무엇을 할 수 있는지로 이야기를 이어갑니다.',
      guide:'재생으로 흡착·탈착을 보고, 압력을 바꿔 보세요.', note:'가상 기체의 정성 모형이며 실제 흡착량을 예측하지 않습니다.',
      theory:'<p>분자와 골격 사이의 <strong>반데르발스 힘·정전기적 상호작용</strong>이 표면에 머무는 것을 유리하게 만듭니다. 표면에 머물면 <strong>흡착</strong>, 떠나면 <strong>탈착</strong>입니다.</p><p>크기가 입구에 맞는 것만으로 선택성이 정해지지 않습니다. 들어갈 수 있는 분자끼리도 <strong>화학적 친화력</strong>이 다르면 머무는 정도가 달라집니다.</p><p><strong>흡착(adsorption)</strong>은 표면에 머무는 현상입니다. <strong>흡수(absorption)</strong>는 물질 부피 내부로 들어가 분포하는 현상입니다. 기체가 기공 안으로 이동했다고 모두 표면에 흡착한 것은 아닙니다.</p><p>이 정성 모형은 단일 기체 Langmuir 식 <strong>θ = bP / (1 + bP)</strong>을 씁니다. θ는 평형 점유율, P는 상대 압력, b는 친화력을 나타내는 임의 계수입니다. 균일한 독립 자리·단분자층을 가정하므로 실제 미세기공 충전 전체를 재현하지 않습니다.</p><p>선택한 발열성 물리흡착 모형에서는 압력이 높아질수록 점유율이 증가하다 포화되고, 온도가 올라가면 친화력이 감소합니다. 모든 재료의 모든 온도 범위에 보편적인 수치는 아닙니다.</p><p>A·B는 실제 기체명이 아닌 가상 예시입니다. 각 기체를 따로 넣은 단일 성분 비교이며 <strong>혼합 기체 선택도는 아닙니다.</strong> 분자/입구 크기비 1 초과의 진입 제한도 강체 입구 근사입니다. 실제 유연성·확산 속도는 생략합니다.</p>',
      caution:'압력·온도·친화력과 점유율은 무차원 모형값입니다. 실제 MOF의 흡착량·가스 저장량·혼합 기체 분리 성능을 예측하지 않습니다.',
      scenes:[['기공으로 이동하는 확산','주황색 기체가 열린 입구를 통해 기공으로 이동합니다. 그림의 경로는 확산을 설명하는 모식도이며 실제 분자 궤적이 아닙니다.'],['내부 골격 표면에 머묾','흡착은 빈 공간을 채우는 것과 구분됩니다. 입구를 통과한 분자가 골격 표면과 상호작용합니다.'],['다시 떠나는 탈착','평형에서도 흡착과 탈착은 함께 일어납니다. 온도·압력을 바꾸면 평형 점유율이 달라집니다.']] },
    { short:'어디에 쓸까',title:'빈 공간을 어디에 활용할까요?',key:'기공 크기와 표면 성질을 조절해, 원하는 분자를 다루는 데 씁니다.',
      storyTitle:'빈 공간이 기능으로 이어질 때',
      explanation:'<p>기공으로 들어오고, 표면에 머물다가, 다시 떠나는 분자를 보았습니다. 이 차이를 설계하면 <strong>CO₂ 포집·기체 저장·분리</strong>에 활용할 수 있습니다. 적합한 반응 자리로 <strong>촉매</strong>, 분자와 만났을 때의 신호 변화로 <strong>센서</strong>를 설계할 수도 있습니다.</p><p>실제 장치에서는 혼합 기체와 수분, 재료 안정성, 반복 재생, 분말 성형과 제조 비용까지 고려해야 합니다. 가장 큰 기공이나 가장 높은 비표면적 하나만으로 산업 성능을 판단할 수 없습니다.</p>',
      bridge:'빈 공간에서 시작한 이야기가 분자를 다루는 재료로 이어졌습니다. 구조와 표면을 설계하면 기능도 달라집니다. 실제 성능은 대상 기체와 사용 조건에 맞춰 확인해야 합니다.',
      guide:'용도를 하나 선택해 필요한 성질을 보세요.', note:'모든 MOF가 모든 용도에 적합한 것은 아닙니다.',
      theory:'<p><strong>기체 저장</strong>은 내부 표면에 분자를 모으는 능력, <strong>분리</strong>는 분자마다 다른 크기·친화력·이동성 차이를 활용합니다.</p><p><strong>CO₂ 포집</strong>에는 CO₂와 잘 상호작용하는 기공 환경, <strong>촉매</strong>에는 반응을 돕는 적합한 활성점과 분자의 접근 경로가 필요합니다.</p><p>높은 비표면적만으로 성능이 결정되지 않습니다. 실제 저장에는 작동 압력에서 넣고 뺄 수 있는 양, 분리에는 혼합물·수분·반복 안정성, 촉매에는 활성점·확산·안정성이 함께 중요합니다.</p><p>모든 MOF가 모든 응용에 적합한 것은 아닙니다. 특히 <strong>MOF-5가 본래 모든 촉매 반응에 활성이라는 뜻은 아닙니다.</strong> 촉매용 MOF는 적절한 금속 자리나 작용기 등을 설계해야 합니다.</p>',
      caution:'응용 그림은 구조–기능의 연결을 설명합니다. 특정 MOF 제품의 실측 성능이나 MOF-5의 모든 가스·촉매 반응 적합성을 주장하지 않습니다.',
      scenes:[['분자가 들어갈 공간','열린 입구와 접근 가능한 내부 공간이 출발점입니다.'],['분자와 상호작용하는 표면','표면 친화력과 활성점이 기능을 바꿉니다.'],['목적에 맞는 구조 설계','응용을 선택해 필요한 구조 특성과 한계를 함께 확인하세요.']] }
  ];
  // Explain each observed scene beside the model, without opening the full theory.
  const sceneReasons = [
    [
      '치밀한 재료와 달리, MOF의 마디와 링커는 사이에 공간을 남기는 방식으로 연결됩니다.',
      '연결재가 마디 사이의 간격과 방향을 잡아 주므로, 빈 공간이 반복되는 골격이 만들어집니다.',
      '입구가 열려 있고 분자가 통과할 수 있으면, 겉면뿐 아니라 기공 안쪽 표면에도 닿을 수 있습니다.'
    ],
    [
      '산소에는 공유에 쓸 수 있는 비공유 전자쌍이 있고, 금속 이온은 이를 받아 결합할 수 있습니다.',
      '산소의 전자 밀도와 금속이 상호작용합니다. 적절한 배치에서 전체 에너지가 낮아지면 결합이 안정해집니다.',
      '산소가 제공한 전자쌍이 결합 영역에서 공유됩니다. 전자가 완전히 금속으로 넘어간다는 뜻은 아닙니다.'
    ],
    [
      '금속은 연결 마디를 이루고, 유기 분자는 마디를 이어 주는 역할을 합니다. 여기서는 부품을 나눠 보는 것입니다.',
      '네 Zn과 중심 O가 이루는 클러스터를 하나의 연결 마디로 봅니다. 일반적인 ZnO 결정과는 다릅니다.',
      'BDC는 벤젠 고리와 양끝 카복실레이트로 이루어집니다. 벤젠 부분은 간격을 유지하고 양끝 산소는 금속에 결합합니다.',
      '마디 전체의 여섯 연결 방향이 이웃으로 반복되면서, 작은 구성요소에서 넓은 골격으로 확장합니다.',
      '골격이 입체적으로 이어지면서 그 사이에 기공이 남습니다. 나중에 구멍을 뚫어 만드는 것이 아닙니다.',
      '이미 있던 기공에서 용매를 빼면 다른 분자가 접근할 공간이 열립니다. 이 용매 제거를 활성화라 합니다.'
    ],
    [
      '같은 금속 마디를 사용하므로 연결 방향은 유지됩니다. 설계에서 바꾸는 부품은 초록 링커입니다.',
      '고리가 더 많은 링커는 마디 사이를 더 벌릴 수 있습니다. 파란 마디 자체가 커지는 것은 아닙니다.',
      '같은 배율로 나란히 놓으면 마디 크기는 같고, 마디 사이 거리와 빈 공간이 달라지는 것을 비교할 수 있습니다.'
    ],
    [
      '한 방향만 늘리는 것이 아니라 가로·세로·높이가 함께 늘어나는 입방형 기하 모형입니다.',
      '회색 기준과 노란 현재 공간을 비교하면 세 방향에서 늘어난 길이가 부피에 함께 반영됨을 볼 수 있습니다.',
      '길이비를 세 번 곱하므로 1.8배의 길이는 5.832배의 기하 공간이 됩니다. 실제 기공 부피비는 아닙니다.'
    ],
    [
      '하나의 연결망만 있을 때는 다른 골격이 차지하는 공간이 없습니다. 비교 모형에서는 IRMOF-16에 대응합니다.',
      '큰 공간을 통과하는 독립 골격이 합성 조건에 따라 함께 형성될 수 있습니다. 두 망 사이에 연결 결합은 없습니다.',
      '공간을 나눠 써 접근 가능한 기공이 줄 수 있지만, 골격 움직임을 제한해 안정성이나 특정 기능에 유리할 수도 있습니다.'
    ],
    [
      '내부로 통하는 열린 기공이 적은 치밀한 재료에서는 기체가 주로 바깥 표면에 접촉합니다.',
      'MOF는 내부로 통하는 기공을 통해 골격의 안쪽 표면까지 이용합니다. 빈 공간 자체가 고체 표면은 아닙니다.',
      '비표면적은 표면적을 질량으로 나눈 값입니다. 가벼운 골격이 많은 내부 접촉 면적을 제공하면 이 값이 커집니다.'
    ],
    [
      '먼저 분자가 입구를 통과할 수 있어야 합니다. 여기서는 분자가 입구보다 크면 들어가지 못하는 단순 모형을 씁니다.',
      '골격과 분자 사이의 반데르발스 힘·정전기적 상호작용이 표면에 머무는 것을 유리하게 만듭니다.',
      '표면에 붙은 분자도 열운동으로 다시 떠날 수 있습니다. 평형에서도 흡착과 탈착은 함께 일어납니다.'
    ],
    [
      '입구가 열려 있고 분자가 내부 공간에 접근할 수 있어야 저장·분리·반응에 이용할 수 있습니다.',
      '분자마다 골격 표면과의 친화력이 다릅니다. 표면의 화학을 바꾸면 잘 붙는 분자도 달라질 수 있습니다.',
      '저장에는 가역적 흡착, 분리에는 크기·친화력 차이, 촉매에는 적합한 활성점이 필요합니다.'
    ]
  ];
  chapters.forEach((chapter,i)=>{chapter.reasons=sceneReasons[i];});
  const applications = [
    {name:'기체 저장',why:'넓은 내부 표면에 분자를 모으고 필요할 때 탈착시킵니다. 실제 사용에서는 저장량뿐 아니라 방출 가능한 양도 중요합니다.',metric:'내부 표면 + 가역적 흡착'},
    {name:'기체 분리',why:'입구 크기, 분자별 친화력과 확산 속도의 차이로 분리를 설계합니다. 단순한 크기 체만으로 설명되지 않습니다.',metric:'크기 + 친화력 + 이동성'},
    {name:'CO₂ 포집',why:'CO₂와 잘 상호작용하는 작용기·금속 환경을 설계합니다. 수분의 경쟁 흡착과 재생 에너지까지 고려해야 합니다.',metric:'CO₂ 친화력 + 재생 가능성'},
    {name:'촉매',why:'적합한 활성점이 반응을 돕고 기공은 반응물이 그 자리에 접근하는 통로가 됩니다. 모든 MOF가 촉매인 것은 아닙니다.',metric:'활성점 + 접근 경로'},
    {name:'센서',why:'분자가 흡착했을 때 빛이나 전기적 응답 등이 달라지도록 설계한 MOF로 신호를 읽을 수 있습니다. 모든 MOF가 같은 센서 특성을 보이는 것은 아닙니다.',metric:'선택적 상호작용 + 측정 신호'}
  ];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number(v)||0));
  function defaults(chapter=0){return {chapter,step:0,phase:0,rings:1,ratio:1.8,compare:false,interpenetrate:false,internal:true,pressure:1,temperature:1,size:.65,species:'A',application:0,playing:false,speed:1};}
  function family(rings){return families[clamp(rings,1,3)-1];}
  function volume(ratio){const length=clamp(ratio,1,1.8);return {length,volume:length**3};}
  function adsorption(s){const p=clamp(s.pressure,0,5),t=clamp(s.temperature,.6,1.8),accessible=clamp(s.size,.2,1.4)<=1;const b=(s.species==='B'?.5:2)*Math.exp(1.6*(1/t-1));return {b,accessible,coverage:accessible?b*p/(1+b*p):0};}
  function network(cells=1,L=2.5,offset=[0,0,0],name='a'){
    const nodes=[],edges=[];const at=(x,y,z)=>[offset[0]+(x-cells/2)*L,offset[1]+(y-cells/2)*L,offset[2]+(z-cells/2)*L];
    for(let x=0;x<=cells;x++)for(let y=0;y<=cells;y++)for(let z=0;z<=cells;z++){
      const id=`${name}-${x}-${y}-${z}`;nodes.push({id,p:at(x,y,z),network:name});
      for(const [dx,dy,dz] of [[1,0,0],[0,1,0],[0,0,1]])if(x+dx<=cells&&y+dy<=cells&&z+dz<=cells)edges.push({id:`${id}-${dx}${dy}${dz}`,a:at(x,y,z),b:at(x+dx,y+dy,z+dz),from:id,to:`${name}-${x+dx}-${y+dy}-${z+dz}`,network:name});
    }return {nodes,edges};
  }
  const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  function scene(s,time=0){
    const parts=[],labels=[];const c=s.chapter,step=s.step;const motion=clamp(time,0,1);
    const ball=(id,p,r,color,opacity=1)=>parts.push({id,kind:'sphere',p,r,color,opacity});
    const bar=(id,a,b,color,r=.045,opacity=1)=>parts.push({id,kind:'bar',a,b,r,color,opacity});
    const box=(id,p,size,color,opacity=.13)=>parts.push({id,kind:'box',p,size,color,opacity});
    const label=(id,p,text)=>labels.push({id,p,text});
    function wire(id,L,offset=[0,0,0],color=colors.yellow){for(const e of network(1,L,offset,id).edges)bar(e.id,e.a,e.b,color,.015,.65);}
    function linker(id,a,b,rings=1,color=colors.green,detailed=true){
      bar(id+'-spine',a,b,color,.035);if(!detailed)return;
      const d=b.map((v,i)=>v-a[i]),len=Math.hypot(...d),u=d.map(v=>v/len);const v=Math.abs(u[1])<.9?[0,1,0]:[1,0,0];
      const w=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];const n=Math.hypot(...w);for(let i=0;i<3;i++)w[i]/=n;
      for(let j=0;j<rings;j++){const center=mix(a,b,.5+(j-(rings-1)/2)*.54/len);const pts=[];for(let k=0;k<6;k++){const ang=k*Math.PI/3;pts.push(center.map((x,i)=>x+.27*(Math.cos(ang)*u[i]+Math.sin(ang)*w[i])));}for(let k=0;k<6;k++)bar(`${id}-ring${j}-${k}`,pts[k],pts[(k+1)%6],color,.025);}
      for(const [j,t] of [[0,.16],[1,.84]]){const o=mix(a,b,t);ball(id+'-oxygen'+j,o,.065,color);}
    }
    function drawNet(id,L=2.5,offset=[0,0,0],rings=1,color=colors.blue,cells=1,detailed=true,edgeFraction=1){
      const g=network(cells,L,offset,id);for(const n of g.nodes)ball(n.id,n.p,.17,color);for(const e of g.edges.slice(0,Math.ceil(g.edges.length*edgeFraction)))linker(e.id,e.a,e.b,rings,color===colors.purple?color:colors.green,detailed);return g;
    }
    function gases(id,positions,r=.085){positions.forEach((p,i)=>ball(`${id}-${i}`,p,r,colors.orange));}
    function surfaceSites(L,offset=[0,0,0],count=12){const edges=network(1,L,offset,'sites').edges;return Array.from({length:count},(_,i)=>{const e=edges[i%edges.length],p=mix(e.a,e.b,.35+.3*(i%3)/2);const d=p.map((v,j)=>v-offset[j]),n=Math.hypot(...d);return p.map((v,j)=>v-.15*d[j]/n);});}
    function cluster(offset=[0,0,0]){ball('centralO',offset,.17,colors.white);const spread=step===1?1+(1-motion)*1.7:1;const tet=[[.46,.46,.46],[.46,-.46,-.46],[-.46,.46,-.46],[-.46,-.46,.46]];tet.forEach((p,i)=>{const q=p.map((v,j)=>v*spread+offset[j]);ball('zn'+i,q,.23,colors.blue);bar('znO'+i,offset,q,colors.white,.04);});label('cluster',[-.6,1.65,0],'Zn₄O · 중심 O + 네 Zn');}
    let name='MOF-5 · 연결망 모식도';
    if(c===1){
      name='Zn²⁺ · 카복실레이트 산소의 배위';const shift=step===0?0:step===1?motion*.9:.9;const zn=[-1.2,0,0],o=[1.6-shift,0,0];ball('zn',zn,.38,colors.blue);ball('donorO',o,.28,colors.green);bar('co',o,[o[0]+.65,.4,0],colors.green,.07);ball('carbon',[o[0]+.65,.4,0],.16,colors.green);bar('co2',[o[0]+.65,.4,0],[o[0]+1.1,.03,0],colors.green,.045);ball('otherO',[o[0]+1.1,.03,0],.22,colors.green);
      if(step===2)bar('coordinate',zn,o,colors.cyan,.065);
      const pair=step===2?mix(zn,o,.58):[o[0]-.38,0,0];ball('electron1',[pair[0],pair[1]+.12,.13],.06,colors.white);ball('electron2',[pair[0],pair[1]-.12,.13],.06,colors.white);
      label('znlabel',[-1.2,-.75,0],'Zn²⁺ · 전자쌍 받음');label('olabel',[1.2,.95,0],'산소 · 전자쌍 제공');label('pair',[pair[0],-.52,.1],step===2?'함께 쓰는 전자쌍':'비공유 전자쌍');
    }else if(c===2){
      name='MOF-5 · Zn₄O(BDC)₃';
      if(step===0){[[-1.4,.6,0],[-1.4,-.6,0],[-.6,.6,0],[-.6,-.6,0]].forEach((p,i)=>ball('freeZn'+i,p,.23,colors.blue));linker('freeBDC',[.65,-1.2,0],[.65,1.2,0]);label('free',[-1.1,1.25,0],'Zn²⁺');label('bdc',[1.6,0,0],'BDC²⁻');}
      else if(step<=2){cluster();if(step===2){for(const [i,d] of [[0,[1,0,0]],[1,[-1,0,0]],[2,[0,1,0]],[3,[0,-1,0]],[4,[0,0,1]],[5,[0,0,-1]]]){const a=d.map(v=>v*.72),b=d.map(v=>v*2.2);linker('six'+i,a,b,1);ball('carboxylate'+i,a,.1,colors.green);}}}
      else {const cells=step===3?1:2;drawNet('formation',2.3,[0,0,0],1,colors.blue,cells,cells===1,step===3?.55:1);wire('pore',2.05,cells===2?[-1.15,-1.15,-1.15]:[0,0,0]);if(step<5||motion<1){for(let i=0;i<14;i++){const exit=step===5?motion:0;ball('solvent'+i,[Math.sin(i*2.3)*1.5+exit*2,Math.cos(i*1.7)*1.6+exit*2,Math.sin(i*.8)*1.6+exit*2],.11*(1-exit),colors.gray,.8);}}label('forming',[-.5,3,0],step===5?'용매 제거 · 골격 유지':'기공 안 회색 용매');}
    }else if(c===3){
      const f=family(s.rings);name=f.name+' · '+f.linker;
      if(s.compare){for(const [i,fm] of families.entries()){const off=[(i-1)*5,0,0];drawNet('compare'+i,2*fm.ratio,off,fm.rings);wire('comparePore'+i,2*fm.ratio-.45,off);label('family'+i,[off[0],2.35,0],`${fm.name} · ${fm.rings}고리`);}}
      else {drawNet('family',2.5*f.ratio,[0,0,0],f.rings,colors.blue,1,true,step===0?.25:1);if(step>0)wire('familyPore',2.5*f.ratio-.45);if(step===2)wire('originalSize',2.05,[0,0,0],colors.gray);label('current',[0,2.75,0],f.linker+' · '+f.rings+'고리');}
    }else if(c===4){
      name='L³ · 상대 길이와 기하 공간';const L=2.5*volume(s.ratio).length;drawNet('volume',L,[0,0,0],3);if(step>0)wire('baseline',2.5,[0,0,0],colors.gray);wire('expanded',L);label('length',[L/2+.3,0,0],`L₂/L₁ = ${Number(s.ratio).toFixed(2)}`);if(step===2)label('space',[0,0,0],`기하 부피비 ${volume(s.ratio).volume.toFixed(3)} · 실측 아님`);
    }else if(c===5){
      name=s.interpenetrate?'IRMOF-15 · 두 독립 망':'IRMOF-16 · 하나의 망';drawNet('first',2.8,[0,0,0],3,colors.blue,2,false);
      if(s.interpenetrate){const enter=step===0?0:step===1?(1-motion)*2.8:0;drawNet('second',2.8,[1.4+enter,1.4,1.4],3,colors.purple,2,false);label('second',[2.8,4.9,1.4],'보라：독립 연결망 2');}wire('interPore',2.5,[1.4,1.4,1.4]);label('first',[-2.6,-3.6,0],'파랑/초록：연결망 1');if(step===2){gases('spaceProbe',[[.5,.5,.5],[1,1,1],[1.9,1.9,1.9]],.1);label('probe',[0,4.4,0],'분자가 쓸 공간 · 접근성 계산은 생략');}
    }else if(c===7){
      const a=adsorption(s);name=`기체 ${s.species} · 정성적 흡착 모형`;drawNet('adsorption',3.4,[0,0,0],2);wire('adsorptionPore',2.9);const points=[],sites=surfaceSites(3.4);
      for(let i=0;i<(s.pressure<=0?0:12);i++){
        const angle=i*2.4;const outside=[Math.sin(angle)*1.3,Math.cos(angle)*1.3,3.8];const surface=sites[i];
        const inside=[Math.sin(angle)*.9,Math.cos(angle)*.9,.7];let p;
        if(!a.accessible)p=[outside[0],outside[1],2.35+.35*Math.sin(motion*Math.PI)];
        else if(step===0){p=mix(outside,inside,motion);p=p.map((v,j)=>v+.08*Math.sin(i*1.7+j+motion*Math.PI*6)*Math.sin(motion*Math.PI));}
        else if(step===1)p=i<Math.round(a.coverage*12)?mix(inside,surface,motion):inside;
        else p=mix(surface,outside,motion);
        points.push(p);
      }gases('gas',points,.075+.075*s.size);label('ads',[0,2.35,0],!a.accessible?'입구보다 커서 진입 제한':s.pressure<=0?'상대 압력 0 · 모형 점유율 0':step===1?'내부 골격 표면에 물리흡착':step===2?'표면을 떠나는 탈착':'입구 통과와 확산 · 개념 경로');
    }else if(c===8){
      name=applications[s.application].name+' · 구조–기능 모식도';drawNet('application',3.4,[0,0,0],2);wire('appPore',2.95);const points=[];
      for(let i=0;i<14;i++){const z=(i/13-.5)*5.6,r=step===0?1.1:1.5;points.push([Math.sin(i*2.3)*r,Math.cos(i*2.3)*r,z+(step===0?(1-motion)*1.5:0)]);}gases('appGas',points);
      if(s.application===1)for(let i=0;i<6;i++)ball('otherGas'+i,[2.4,Math.sin(i)*1.4,i*.35-.8],.14,colors.white);
      if(s.application===2)for(let i=0;i<6;i++)ball('affinity'+i,[Math.sin(i)*1.5,1.7,Math.cos(i)*1.5],.13,colors.purple);
      if(s.application===3){ball('activeSite',[0,1.7,1.7],.22,colors.purple);label('active',[0,2.4,1.7],'응용에 맞게 설계한 활성점');}
      if(step===2)label('function',[0,-2.35,0],applications[s.application].metric);
    }else{
      // Chapter 1 and surface-area chapter share the explicit dense/open comparison.
      name=c===6?'외부 표면과 내부 표면':'치밀한 재료와 열린 골격';box('dense',[-2.35,0,0],[1.7,2.7,2.3],colors.gray,.65);drawNet('open',2.8,[1.65,0,0],1);wire('openPore',2.4,[1.65,0,0]);
      label('denseLabel',[-2.35,2,0],'치밀한 재료 · 겉면');label('openLabel',[1.65,2,0],c===6?'MOF · 내부 표면도 활용':'MOF · 마디 + 링커 + 기공');
      if(c===0&&step===1){for(const n of network(1,2.8,[1.65,0,0],'highlight').nodes)ball(n.id,n.p,.24,colors.blue,.45);label('nodeRole',[1.65,0,0],'마디 = 연결부 · 링커 = 연결재');}
      if((c===0&&step===2)||(c===6&&step>0&&s.internal)){gases('innerGas',surfaceSites(2.8,[1.65,0,0],14),.095);if(c===6){for(const e of network(1,2.8,[1.65,0,0],'surface').edges)bar('surface-'+e.id,e.a,e.b,colors.orange,.065,.6);}}
      if(c===6&&step===2)label('areaMass',[0,-2.15,0],'S = A / m · 작은 질량, 큰 내부 면적');
      if(c===6)for(let i=0;i<6;i++)ball('outerGas'+i,[-3.23,Math.sin(i)*1.1,Math.cos(i)*.9],.095,colors.orange);
    }
    if(!labels.length){label('node',[-1.25,-1.9,0],'금속 마디');label('linker',[1,1.9,0],'유기 링커');}
    return {parts,labels,name};
  }
  const api={colors,families,chapters,applications,defaults,family,volume,adsorption,network,scene,clamp};
  if(typeof module==='object'&&module.exports)module.exports=api;else scope.MOFModel=api;
})(typeof window==='object'?window:globalThis);
