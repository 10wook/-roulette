const rouletteWheel = document.getElementById('rouletteWheel');
const spinButton = document.getElementById('spinButton');
const result = document.getElementById('result');

let isSpinning = false;
const sections = 8;
const sectionAngle = 360 / sections;

// 룰렛 회전 함수
function spinRoulette() {
    if (isSpinning) return;
    
    isSpinning = true;
    spinButton.disabled = true;
    result.textContent = '';
    result.classList.remove('show');
    
    // 랜덤한 섹션 선택 (1~8)
    const targetSection = Math.floor(Math.random() * sections) + 1;
    
    // 랜덤한 회전 각도 생성 (최소 3바퀴 이상)
    const spins = 3 + Math.random() * 2; // 3~5바퀴
    
    // 현재 회전 각도 가져오기
    const currentRotation = getCurrentRotation();
    
    // 선택된 섹션이 포인터(위쪽, 0도)에 오도록 각도 계산
    // 섹션 1은 0도 위치, 섹션 2는 45도 위치... 섹션 8은 315도 위치
    // 룰렛이 시계 반대 방향으로 회전하므로, 섹션이 포인터에 오려면
    // 해당 섹션의 각도를 360에서 빼서 계산
    const targetSectionAngle = (targetSection - 1) * sectionAngle;
    const rotationToTarget = 360 - targetSectionAngle;
    
    // 총 회전 각도 = 바퀴 수 * 360 + 목표까지의 회전 각도
    const totalRotation = spins * 360 + rotationToTarget;
    const finalRotation = currentRotation + totalRotation;
    
    // 룰렛 회전
    rouletteWheel.style.transform = `rotate(${finalRotation}deg)`;
    
    // 애니메이션 완료 후 결과 표시
    setTimeout(() => {
        // 최종 각도에서 포인터가 가리키는 섹션 계산
        // 룰렛이 회전한 각도를 360으로 나눈 나머지
        const normalizedRotation = finalRotation % 360;
        // 포인터는 위쪽(0도)을 가리키므로, 룰렛이 회전한 만큼 반대 방향으로 섹션 계산
        const pointerAngle = (360 - normalizedRotation) % 360;
        // 각도에 해당하는 섹션 계산 (각 섹션은 45도씩)
        const calculatedSection = Math.floor(pointerAngle / sectionAngle) + 1;
        // 섹션 번호가 8을 넘어가면 1로 순환
        const resultSection = calculatedSection > sections ? 1 : calculatedSection;
        
        result.textContent = `🎉 결과: ${resultSection}번!`;
        result.classList.add('show');
        isSpinning = false;
        spinButton.disabled = false;
    }, 4000);
}

// 현재 회전 각도 가져오기
function getCurrentRotation() {
    const transform = window.getComputedStyle(rouletteWheel).transform;
    if (transform === 'none') return 0;
    
    const values = transform.split('(')[1].split(')')[0].split(',');
    const a = values[0];
    const b = values[1];
    const angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
    return angle < 0 ? angle + 360 : angle;
}

// 버튼 클릭 이벤트
spinButton.addEventListener('click', spinRoulette);

// 키보드 스페이스바로도 돌릴 수 있게
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isSpinning) {
        e.preventDefault();
        spinRoulette();
    }
});

