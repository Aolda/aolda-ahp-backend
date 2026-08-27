export const CREW_IMAGE_HTML = String.raw`
<dialog id="crewImageDialog" aria-labelledby="crewImageTitle" style="width:min(760px,94vw);max-height:85vh;border:1px solid #cbd5e1;border-radius:14px;padding:24px">
  <h2 id="crewImageTitle">선택 크루 프로필 이미지 갱신</h2>
  <p>Notion에서 최신 이미지를 가져옵니다. 실패하거나 이미지가 없는 크루는 기존 이미지를 유지합니다.</p>
  <progress id="crewImageProgress" max="100" value="0" style="width:100%" aria-label="이미지 갱신 진행률"></progress>
  <p id="crewImageStatus" role="status" aria-live="polite"></p>
  <div id="crewImageItems" style="max-height:45vh;overflow:auto"></div>
  <p class="meta">닫아도 서버 작업은 계속됩니다. ‘이미지 갱신 현황’에서 다시 확인할 수 있습니다.</p>
  <button id="crewImageReconnect">상태 다시 확인</button> <button id="crewImageClose">닫기</button>
</dialog>`;
export const CREW_IMAGE_SCRIPT = String.raw`
    let crewImageJobId = null, crewImageTimer = null, crewImageStarting = false;
    const imageStatusLabels = { PENDING: '대기', RUNNING: '진행 중', SUCCEEDED: '성공', FAILED: '실패', SKIPPED: '건너뜀', PARTIAL_FAILED: '일부 실패', INTERRUPTED: '중단됨' };
    function renderImageJob(job) {
      crewImageJobId = job.id;
      const percent = job.total ? Math.floor(job.processed * 100 / job.total) : 0;
      $('crewImageProgress').value = percent;
      $('crewImageStatus').textContent = (imageStatusLabels[job.status] || job.status) + ' · ' + job.processed + '/' + job.total + '명 (' + percent + '%) · 성공 ' + job.succeeded + ' / 실패 ' + job.failed + ' / 건너뜀 ' + job.skipped;
      $('crewImageItems').innerHTML = job.items.map((item) => '<div class="card" style="padding:10px;margin:8px 0;min-height:0"><strong>' + esc(item.crewName) + '</strong> · ' + esc(imageStatusLabels[item.status] || item.status) + '<div>' + esc(item.message || '') + '</div></div>').join('');
    }
    async function pollImageJob() {
      clearTimeout(crewImageTimer);
      if (!state.token || !crewImageJobId || !$('crewImageDialog').open) return;
      try {
        const { job } = await api('/admin/crews/image-refresh/' + crewImageJobId);
        renderImageJob(job);
        if (job.status === 'RUNNING') crewImageTimer = setTimeout(pollImageJob, 1500);
        else await loadCrews();
      } catch (error) {
        $('crewImageStatus').textContent = '상태 확인 실패: ' + error.message + ' · 서버 작업은 계속될 수 있습니다. 다시 확인해 주세요.';
      }
    }
    $('crewImageClose').onclick = () => $('crewImageDialog').close();
    $('crewImageDialog').addEventListener('close', () => clearTimeout(crewImageTimer));
    $('crewImageReconnect').onclick = pollImageJob;
    $('crewImageLatest').onclick = async () => {
      if (!$('crewImageDialog').open) $('crewImageDialog').showModal();
      $('crewImageStatus').textContent = '최근 작업을 확인하고 있습니다...';
      try {
        const { job } = await api('/admin/crews/image-refresh/latest');
        if (!job) { crewImageJobId = null; $('crewImageStatus').textContent = '이미지 갱신 이력이 없습니다.'; return; }
        renderImageJob(job); await pollImageJob();
      } catch (error) { $('crewImageStatus').textContent = error.message; }
    };
    $('bulkRefreshCrewImages').onclick = async () => {
      const crewIds = collectBulkIds('crewBulk');
      if (!crewIds.length || crewImageStarting) return;
      crewImageStarting = true; $('bulkRefreshCrewImages').disabled = true;
      clearTimeout(crewImageTimer); crewImageJobId = null;
      $('crewImageDialog').showModal(); $('crewImageProgress').value = 0;
      $('crewImageItems').replaceChildren(); $('crewImageStatus').textContent = crewIds.length + '명의 갱신 작업을 시작하고 있습니다...';
      try {
        const response = await fetch('/admin/crews/image-refresh', { method: 'POST', headers: { ...authHeaders(), 'content-type': 'application/json' }, body: JSON.stringify({ crewIds }) });
        const result = await response.json();
        if (response.status === 409 && result.jobId) {
          crewImageJobId = result.jobId; await pollImageJob();
          notify('기존 작업 진행 중', '새 작업을 시작하지 않고 진행 중인 작업을 표시합니다.', 'error');
        } else {
          if (!response.ok) throw new Error(result.message || '갱신 작업을 시작하지 못했습니다.');
          renderImageJob(result.job); await pollImageJob();
        }
      } catch (error) { $('crewImageStatus').textContent = error.message + ' · 이미지 갱신 현황에서 작업 생성 여부를 확인하세요.'; }
      finally { crewImageStarting = false; $('bulkRefreshCrewImages').disabled = false; }
    };
    $('logout').addEventListener('click', () => { clearTimeout(crewImageTimer); crewImageJobId = null; $('crewImageDialog').close(); });
`;
