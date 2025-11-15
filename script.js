// DOM 요소
const participantForm = document.getElementById('participantForm');
const rouletteGame = document.getElementById('rouletteGame');
const participantNameInput = document.getElementById('participantName');
const participantPhoneInput = document.getElementById('participantPhone');
const submitButton = document.getElementById('submitButton');
const errorMessage = document.getElementById('errorMessage');
const currentParticipantName = document.getElementById('currentParticipantName');
const rouletteWheel = document.getElementById('rouletteWheel');
const spinButton = document.getElementById('spinButton');
const result = document.getElementById('result');
const resetButton = document.getElementById('resetButton');
const adminButton = document.getElementById('adminButton');
const adminPanel = document.getElementById('adminPanel');
const participantsList = document.getElementById('participantsList');
const refreshButton = document.getElementById('refreshButton');
const clearAllButton = document.getElementById('clearAllButton');
const exportJsonButton = document.getElementById('exportJsonButton');
const exportExcelButton = document.getElementById('exportExcelButton');
const closeAdminButton = document.getElementById('closeAdminButton');

// 상태 변수
let isSpinning = false;
let currentParticipant = null;
const sections = 8;
const sectionAngle = 360 / sections;
const STORAGE_KEY = 'roulette_participants'; // 로컬스토리지에 저장할 키 이름

// ============================================
// 데이터 저장 방식: 브라우저 로컬스토리지 (LocalStorage)
// ============================================
// 참여자 정보는 브라우저의 로컬스토리지에 저장됩니다.
// 
// 특징:
// - 브라우저별로 저장됨 (크롬, 파이어폭스, 엣지 등 각각 독립적)
// - 같은 브라우저에서만 접근 가능
// - 브라우저를 닫아도 데이터가 유지됨
// - 브라우저 캐시/데이터 삭제 시 사라짐
// - 시크릿 모드에서는 별도 저장소 사용 (일반 모드와 분리)
// - 도메인별로 저장됨 (다른 웹사이트에서 접근 불가)
//
// 저장 위치 예시:
// - Chrome: C:\Users\[사용자명]\AppData\Local\Google\Chrome\User Data\Default\Local Storage
// - Edge: C:\Users\[사용자명]\AppData\Local\Microsoft\Edge\User Data\Default\Local Storage
//
// 저장 형식: JSON 문자열
// 예: '[{"name":"홍길동","phone":"1234","date":"2025-01-15T10:30:00.000Z"}, ...]'

// 로컬스토리지에서 참여자 목록 가져오기
function getParticipants() {
    // localStorage.getItem()으로 저장된 문자열 가져오기
    const stored = localStorage.getItem(STORAGE_KEY);
    // 저장된 데이터가 있으면 JSON 파싱, 없으면 빈 배열 반환
    return stored ? JSON.parse(stored) : [];
}

// 참여자 목록 저장하기
function saveParticipant(name, phone) {
    // 기존 참여자 목록 가져오기
    const participants = getParticipants();
    
    // 새로운 참여자 정보를 배열에 추가
    participants.push({
        name: name.trim(),                    // 이름 (공백 제거)
        phone: phone.trim(),                  // 전화번호 뒷자리 4자리 (공백 제거)
        date: new Date().toISOString(),       // 참여 날짜/시간 (ISO 형식)
        result: null                          // 추첨 결과 (초기값은 null, 룰렛 결과 후 업데이트)
    });
    
    // 배열을 JSON 문자열로 변환하여 로컬스토리지에 저장
    // localStorage.setItem(키, 값) - 값은 반드시 문자열이어야 함
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
}

// 참여자의 추첨 결과 저장하기
function saveParticipantResult(name, phone, resultNumber) {
    // 기존 참여자 목록 가져오기
    const participants = getParticipants();
    
    // 현재 참여자 정보 찾기 (이름과 전화번호로 매칭)
    const participantIndex = participants.findIndex(p => 
        p.name.trim().toLowerCase() === name.trim().toLowerCase() && 
        p.phone.trim() === phone.trim()
    );
    
    // 참여자를 찾았으면 결과 업데이트
    if (participantIndex !== -1) {
        participants[participantIndex].result = resultNumber;
        participants[participantIndex].resultDate = new Date().toISOString(); // 결과 날짜/시간
        
        // 업데이트된 목록을 로컬스토리지에 저장
        localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
    }
}

// 중복 참여 체크
function isDuplicateParticipant(name, phone) {
    const participants = getParticipants();
    return participants.some(p => 
        p.name.trim().toLowerCase() === name.trim().toLowerCase() && 
        p.phone.trim() === phone.trim()
    );
}

// 에러 메시지 표시
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 3000);
}

// 참여자 정보 제출
function handleSubmit() {
    const name = participantNameInput.value.trim();
    const phone = participantPhoneInput.value.trim();
    
    // 입력 검증
    if (!name) {
        showError('이름을 입력해주세요.');
        participantNameInput.focus();
        return;
    }
    
    if (!phone || phone.length !== 4) {
        showError('전화번호 뒷자리 4자리를 정확히 입력해주세요.');
        participantPhoneInput.focus();
        return;
    }
    
    // 숫자만 입력되었는지 확인
    if (!/^\d{4}$/.test(phone)) {
        showError('전화번호는 숫자 4자리만 입력 가능합니다.');
        participantPhoneInput.focus();
        return;
    }
    
    // 중복 체크
    if (isDuplicateParticipant(name, phone)) {
        showError('이미 참여하신 분입니다. 한 번만 참여 가능합니다.');
        return;
    }
    
    // 참여자 정보 저장
    saveParticipant(name, phone);
    currentParticipant = { name, phone };
    
    // 폼 숨기고 룰렛 게임 표시
    participantForm.style.display = 'none';
    currentParticipantName.textContent = name;
    rouletteGame.style.display = 'block';
    
    // 사용자가 "돌리기" 버튼을 직접 눌러야 룰렛이 돌아감
}

// 전화번호 입력 필드에 숫자만 입력되도록 제한
participantPhoneInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
});

// 엔터키로 제출
participantNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        participantPhoneInput.focus();
    }
});

participantPhoneInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSubmit();
    }
});

// 제출 버튼 클릭 이벤트
submitButton.addEventListener('click', handleSubmit);

// 룰렛 회전 함수
function spinRoulette() {
    if (isSpinning) return;
    
    isSpinning = true;
    spinButton.disabled = true;
    result.textContent = '';
    result.classList.remove('show');
    
    // ============================================
    // 1단계: 랜덤한 결과 섹션 선택
    // ============================================
    // 1~8번 중 랜덤하게 하나 선택 (이 섹션이 최종 결과가 됨)
    const targetSection = Math.floor(Math.random() * sections) + 1;
    
    // ============================================
    // 2단계: 회전 바퀴 수 결정 (시각적 효과를 위한 랜덤 바퀴 수)
    // ============================================
    // Math.random() * 2는 0~2 사이의 값
    // 3 + (0~2) = 3~5바퀴 회전
    // 예: 3바퀴 = 1080도, 4바퀴 = 1440도, 5바퀴 = 1800도
    const spins = 3 + Math.random() * 2; // 3~5바퀴
    
    // ============================================
    // 3단계: 현재 룰렛의 회전 상태 확인
    // ============================================
    // 이전에 회전했던 각도를 가져옴 (연속 회전 시 누적 각도 고려)
    const currentRotation = getCurrentRotation();
    
    // ============================================
    // 4단계: 목표 섹션이 포인터에 오도록 필요한 각도 계산
    // ============================================
    // 섹션 위치 설명:
    // - 섹션 1: 0도 위치 (위쪽, 포인터 위치)
    // - 섹션 2: 45도 위치
    // - 섹션 3: 90도 위치
    // - 섹션 4: 135도 위치
    // - 섹션 5: 180도 위치
    // - 섹션 6: 225도 위치
    // - 섹션 7: 270도 위치
    // - 섹션 8: 315도 위치
    
    // 예: 섹션 3을 선택했다면
    // targetSectionAngle = (3-1) * 45 = 90도
    const targetSectionAngle = (targetSection - 1) * sectionAngle;
    
    // 룰렛은 시계 반대 방향으로 회전하므로,
    // 섹션이 포인터(0도)에 오려면 360도에서 해당 섹션의 각도를 빼야 함
    // 예: 섹션 3(90도)이 포인터에 오려면 360 - 90 = 270도 회전 필요
    const rotationToTarget = 360 - targetSectionAngle;
    
    // ============================================
    // 5단계: 최종 회전 각도 계산
    // ============================================
    // 총 회전 각도 = (랜덤 바퀴 수 * 360도) + 목표 섹션까지의 각도
    // 예: 4바퀴 + 섹션 3으로 가려면
    //    = (4 * 360) + 270 = 1440 + 270 = 1710도
    const totalRotation = spins * 360 + rotationToTarget;
    
    // 최종 각도 = 현재 각도 + 추가로 회전할 각도
    // 예: 현재 90도에서 시작하고 1710도 더 회전하면
    //    = 90 + 1710 = 1800도
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
        
        // 현재 참여자의 추첨 결과 저장
        if (currentParticipant) {
            saveParticipantResult(
                currentParticipant.name, 
                currentParticipant.phone, 
                resultSection
            );
        }
        
        isSpinning = false;
        spinButton.style.display = 'none'; // 돌리기 버튼 숨기기
        resetButton.style.display = 'block'; // 처음으로 돌아가기 버튼 표시
    }, 4000);
}

// 처음으로 돌아가기 함수
function resetToStart() {
    // 룰렛 게임 영역 숨기기
    rouletteGame.style.display = 'none';
    
    // 참여자 정보 입력 폼 표시
    participantForm.style.display = 'block';
    
    // 입력 필드 초기화
    participantNameInput.value = '';
    participantPhoneInput.value = '';
    
    // 결과 및 버튼 초기화
    result.textContent = '';
    result.classList.remove('show');
    spinButton.style.display = 'block';
    resetButton.style.display = 'none';
    spinButton.disabled = false;
    
    // 룰렛 초기화
    rouletteWheel.style.transform = 'rotate(0deg)';
    
    // 현재 참여자 정보 초기화
    currentParticipant = null;
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

// ============================================
// 관리자 패널 기능
// ============================================

// 참여자 목록 표시
function displayParticipants() {
    const participants = getParticipants();
    
    if (participants.length === 0) {
        participantsList.innerHTML = '<div class="empty-message">저장된 참여자가 없습니다.</div>';
        return;
    }
    
    participantsList.innerHTML = participants.map((participant, index) => {
        const date = new Date(participant.date);
        const dateStr = date.toLocaleString('ko-KR');
        const resultDateStr = participant.resultDate ? new Date(participant.resultDate).toLocaleString('ko-KR') : '';
        
        return `
            <div class="participant-item" data-index="${index}">
                <div class="participant-header">
                    <div class="participant-info">
                        <div class="participant-name">${participant.name}</div>
                        <div class="participant-details">전화번호: ${participant.phone}</div>
                        <div class="participant-details">참여일시: ${dateStr}</div>
                        ${participant.result ? 
                            `<div class="participant-result">🎯 결과: ${participant.result}번</div>
                             <div class="participant-details">결과일시: ${resultDateStr}</div>` :
                            `<div class="participant-result null">결과 없음</div>`
                        }
                    </div>
                    <div class="participant-actions">
                        <button class="edit-btn" onclick="editParticipant(${index})">수정</button>
                        <button class="delete-btn" onclick="deleteParticipant(${index})">삭제</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 참여자 수정 모드
function editParticipant(index) {
    const participants = getParticipants();
    const participant = participants[index];
    const item = document.querySelector(`.participant-item[data-index="${index}"]`);
    
    item.classList.add('editing');
    item.innerHTML = `
        <div class="participant-edit-form">
            <input type="text" id="edit-name-${index}" value="${participant.name}" placeholder="이름">
            <input type="text" id="edit-phone-${index}" value="${participant.phone}" placeholder="전화번호 4자리" maxlength="4">
            <select id="edit-result-${index}">
                <option value="">결과 없음</option>
                ${Array.from({length: sections}, (_, i) => i + 1).map(num => 
                    `<option value="${num}" ${participant.result === num ? 'selected' : ''}>${num}번</option>`
                ).join('')}
            </select>
            <div class="participant-actions">
                <button class="save-btn" onclick="saveParticipantEdit(${index})">저장</button>
                <button class="cancel-btn" onclick="cancelEdit(${index})">취소</button>
            </div>
        </div>
    `;
    
    // 전화번호 입력 필드에 숫자만 입력되도록 제한
    const phoneInput = document.getElementById(`edit-phone-${index}`);
    phoneInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
}

// 참여자 수정 저장
function saveParticipantEdit(index) {
    const participants = getParticipants();
    const name = document.getElementById(`edit-name-${index}`).value.trim();
    const phone = document.getElementById(`edit-phone-${index}`).value.trim();
    const result = document.getElementById(`edit-result-${index}`).value;
    
    if (!name) {
        alert('이름을 입력해주세요.');
        return;
    }
    
    if (!phone || phone.length !== 4 || !/^\d{4}$/.test(phone)) {
        alert('전화번호는 숫자 4자리를 입력해주세요.');
        return;
    }
    
    // 중복 체크 (자기 자신 제외)
    const isDuplicate = participants.some((p, i) => 
        i !== index && 
        p.name.trim().toLowerCase() === name.toLowerCase() && 
        p.phone.trim() === phone
    );
    
    if (isDuplicate) {
        alert('이미 존재하는 이름과 전화번호 조합입니다.');
        return;
    }
    
    participants[index].name = name;
    participants[index].phone = phone;
    participants[index].result = result ? parseInt(result) : null;
    if (result) {
        participants[index].resultDate = new Date().toISOString();
    } else {
        participants[index].resultDate = null;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
    displayParticipants();
}

// 수정 취소
function cancelEdit(index) {
    displayParticipants();
}

// 참여자 삭제
function deleteParticipant(index) {
    if (!confirm('정말 삭제하시겠습니까?')) {
        return;
    }
    
    const participants = getParticipants();
    participants.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
    displayParticipants();
}

// 전체 삭제
function clearAllParticipants() {
    if (!confirm('모든 참여자 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        return;
    }
    
    localStorage.removeItem(STORAGE_KEY);
    displayParticipants();
    alert('모든 데이터가 삭제되었습니다.');
}

// 데이터 내보내기 (JSON 파일로 다운로드)
function exportParticipantsJSON() {
    const participants = getParticipants();
    const dataStr = JSON.stringify(participants, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roulette_participants_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// 데이터 내보내기 (엑셀 파일로 다운로드)
function exportParticipantsExcel() {
    const participants = getParticipants();
    
    if (participants.length === 0) {
        alert('내보낼 데이터가 없습니다.');
        return;
    }
    
    // 엑셀 데이터 준비
    const excelData = participants.map((p, index) => {
        const date = new Date(p.date);
        const resultDate = p.resultDate ? new Date(p.resultDate) : null;
        
        return {
            '번호': index + 1,
            '이름': p.name,
            '전화번호': p.phone,
            '참여일시': date.toLocaleString('ko-KR'),
            '추첨결과': p.result ? `${p.result}번` : '결과 없음',
            '결과일시': resultDate ? resultDate.toLocaleString('ko-KR') : ''
        };
    });
    
    // 워크북 생성
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // 열 너비 설정
    const colWidths = [
        { wch: 8 },   // 번호
        { wch: 15 },  // 이름
        { wch: 12 },  // 전화번호
        { wch: 20 },  // 참여일시
        { wch: 12 },  // 추첨결과
        { wch: 20 }   // 결과일시
    ];
    ws['!cols'] = colWidths;
    
    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(wb, ws, '참여자 목록');
    
    // 파일명 생성
    const fileName = `roulette_participants_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // 파일 다운로드
    XLSX.writeFile(wb, fileName);
}

// 관리자 패널 열기/닫기
function toggleAdminPanel() {
    if (adminPanel.style.display === 'none') {
        adminPanel.style.display = 'block';
        participantForm.style.display = 'none';
        rouletteGame.style.display = 'none';
        displayParticipants();
    } else {
        adminPanel.style.display = 'none';
        participantForm.style.display = 'block';
    }
}

// 관리자 패널 이벤트 리스너
adminButton.addEventListener('click', toggleAdminPanel);
closeAdminButton.addEventListener('click', toggleAdminPanel);
refreshButton.addEventListener('click', displayParticipants);
clearAllButton.addEventListener('click', clearAllParticipants);
exportJsonButton.addEventListener('click', exportParticipantsJSON);
exportExcelButton.addEventListener('click', exportParticipantsExcel);

// 버튼 클릭 이벤트
spinButton.addEventListener('click', spinRoulette);
resetButton.addEventListener('click', resetToStart);

// 키보드 스페이스바로도 돌릴 수 있게
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !isSpinning) {
        e.preventDefault();
        spinRoulette();
    }
});

