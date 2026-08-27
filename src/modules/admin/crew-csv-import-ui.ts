export const CREW_CSV_HTML = String.raw`
<dialog id="crewCsvDialog" aria-labelledby="crewCsvTitle" style="width:min(1000px,94vw);max-height:85vh;border:1px solid #cbd5e1;border-radius:14px;padding:24px">
  <h2 id="crewCsvTitle">CSV 크루 일괄 등록·수정</h2>
  <p>UTF-8 CSV · 최대 512KB / 1,000명. 전체 학번 대신 4자리 입학연도만 입력하세요.</p>
  <p>신규 등록에는 이름·이메일이 필요하며 기본 비공개입니다. 수정은 crewId로 대상을 지정합니다. 빈 셀은 기존 값을 유지합니다.</p>
  <p>Notion 페이지 ID는 선택 항목이며 CSV는 Notion에 쓰지 않습니다. 기존 연결은 교체하지 않습니다.</p>
  <div class="toolbar">
    <button id="crewCsvTemplate">빈 양식 다운로드</button>
    <select id="crewCsvMode" aria-label="등록 모드"><option value="create">신규 등록</option><option value="update">기존 크루 수정</option></select>
    <input id="crewCsvFile" type="file" accept=".csv,text/csv" aria-label="CSV 파일">
    <button id="crewCsvPreview">미리보기·검증</button>
  </div>
  <p class="meta">열: crewId(수정 대상), name(이름), email, joinedGen(기수), univDepartment(학과), univJoinedYear(입학연도), description(소개), isVisible(true/false), notionPageId</p>
  <p id="crewCsvStatus" role="status" aria-live="polite"></p>
  <div id="crewCsvRows" style="max-height:40vh;overflow:auto"></div>
  <div class="toolbar"><button id="crewCsvCommit" class="primary" disabled>검증된 전체 행 저장</button><button id="crewCsvClose">닫기</button></div>
</dialog>`;

export const CREW_CSV_SCRIPT = String.raw`
    let crewCsvPreview = null, crewCsvBusy = false;
    function invalidateCsvPreview() {
      crewCsvPreview = null; $('crewCsvCommit').disabled = true;
      $('crewCsvRows').replaceChildren(); $('crewCsvStatus').textContent = '';
    }
    function csvBusy(busy) {
      crewCsvBusy = busy;
      ['crewCsvFile', 'crewCsvMode', 'crewCsvPreview', 'crewCsvClose'].forEach((id) => $(id).disabled = busy);
      $('crewCsvCommit').disabled = busy || !crewCsvPreview;
    }
    $('openCrewCsv').onclick = () => { invalidateCsvPreview(); $('crewCsvDialog').showModal(); };
    $('crewCsvClose').onclick = () => $('crewCsvDialog').close();
    $('crewCsvDialog').addEventListener('cancel', (event) => { if (crewCsvBusy) event.preventDefault(); });
    $('crewCsvDialog').addEventListener('close', () => { invalidateCsvPreview(); $('crewCsvFile').value = ''; });
    $('crewCsvFile').onchange = invalidateCsvPreview;
    $('crewCsvMode').onchange = invalidateCsvPreview;
    $('crewCsvTemplate').onclick = async () => {
      try {
        const response = await fetch('/admin/crews/import/template', { headers: authHeaders() });
        if (!response.ok) throw new Error('양식을 다운로드할 수 없습니다.');
        const url = URL.createObjectURL(await response.blob());
        const link = document.createElement('a'); link.href = url; link.download = 'crew-template.csv'; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) { $('crewCsvStatus').textContent = error.message; }
    };
    $('crewCsvPreview').onclick = async () => {
      invalidateCsvPreview(); csvBusy(true);
      try {
        const file = $('crewCsvFile').files[0];
        if (!file || file.size > 512 * 1024) throw new Error('512KB 이하의 UTF-8 CSV 파일을 선택해 주세요.');
        const csv = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
        const mode = $('crewCsvMode').value;
        const result = (await api('/admin/crews/import/preview', { method: 'POST', body: JSON.stringify({ csv, mode }) })).data;
        $('crewCsvRows').innerHTML = '<table style="width:100%;text-align:left"><thead><tr><th>행</th><th>내용</th><th>검증 결과</th></tr></thead><tbody>'
          + result.rows.map((row) => '<tr><td>' + row.row + '</td><td style="white-space:pre-wrap;overflow-wrap:anywhere">'
            + esc(Object.entries(row.values).filter((entry) => entry[1] !== undefined).map((entry) => entry[0] + ': ' + entry[1]).join('\n'))
            + '</td><td>' + esc(row.errors.join(' / ') || (mode === 'create' ? '신규 등록' : '기존 크루 수정')) + '</td></tr>').join('') + '</tbody></table>';
        $('crewCsvStatus').textContent = result.rows.length + '행 · ' + (result.valid ? '검증 완료. 내용을 확인한 뒤 저장하세요.' : '오류가 있습니다. 파일을 수정해 다시 검증하세요.');
        if (result.valid) crewCsvPreview = { csv, mode, token: result.token };
      } catch (error) { $('crewCsvStatus').textContent = error.message; }
      finally { csvBusy(false); }
    };
    $('crewCsvCommit').onclick = async () => {
      if (!crewCsvPreview || crewCsvBusy) return;
      const payload = crewCsvPreview; csvBusy(true);
      try {
        const result = (await api('/admin/crews/import/commit', { method: 'POST', body: JSON.stringify(payload) })).data;
        crewCsvPreview = null;
        $('crewCsvStatus').textContent = '완료: 신규 ' + result.created + '명 / 수정 ' + result.updated + '명';
        await loadCrews();
      } catch (error) {
        crewCsvPreview = null;
        $('crewCsvStatus').textContent = error.message + ' 목록을 확인하고 미리보기를 다시 진행해 주세요.';
      } finally { csvBusy(false); }
    };
`;
