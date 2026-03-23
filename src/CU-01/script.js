document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const STORAGE_LAST_FOLIO = 'cu01_lastFolioNumber';
    const STORAGE_REGISTROS = 'cu01_registros';

    const MAX_PDF_BYTES = 25 * 1024 * 1024;

    const form = document.getElementById('correspondenciaForm');
    const alertBox = document.getElementById('alert');

    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const overlay = document.getElementById('overlay');

    const folioInput = document.getElementById('folio');
    const remitenteInput = document.getElementById('remitente');
    const asuntoInput = document.getElementById('asunto');
    const fechaOficioInput = document.getElementById('fechaOficio');
    const procedenciaSelect = document.getElementById('procedencia');
    const documentoPdfInput = document.getElementById('documentoPdf');
    const anexosPdfInput = document.getElementById('anexosPdf');

    const errorRemitente = document.getElementById('errorRemitente');
    const errorAsunto = document.getElementById('errorAsunto');
    const errorFechaOficio = document.getElementById('errorFechaOficio');
    const errorProcedencia = document.getElementById('errorProcedencia');
    const errorDocumentoPdf = document.getElementById('errorDocumentoPdf');
    const errorAnexosPdf = document.getElementById('errorAnexosPdf');

    const previewBtn = document.getElementById('previewBtn');
    const saveBtn = document.getElementById('saveBtn');
    const clearBtn = document.getElementById('clearBtn');

    const previewBody = document.getElementById('previewBody');
    const previewStatus = document.getElementById('previewStatus');
    const chipPreviewRequired = document.getElementById('chipPreviewRequired');

    const pdfModal = document.getElementById('pdfModal');
    const pdfModalClose = document.getElementById('pdfModalClose');
    const pdfFrame = document.getElementById('pdfFrame');

    const state = {
        nextFolioNumber: 1,
        previewApproved: false,
        previewFingerprint: '',
        mainPdfUrl: null,
        annexUrls: [],
        modalOpen: false
    };

    function safeParseJsonArray(value) {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function showAlert(type, message) {
        alertBox.classList.remove('hidden', 'alert-success', 'alert-error', 'alert-info');
        if (type === 'success') alertBox.classList.add('alert-success');
        if (type === 'error') alertBox.classList.add('alert-error');
        if (type === 'info') alertBox.classList.add('alert-info');
        alertBox.textContent = message;
    }

    function clearAlert() {
        alertBox.classList.add('hidden');
        alertBox.textContent = '';
        alertBox.classList.remove('alert-success', 'alert-error', 'alert-info');
    }

    function getTodayIso() {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    function formatFolioNumber(n) {
        return `CE-${String(n).padStart(6, '0')}`;
    }

    function loadNextFolioNumber() {
        try {
            const stored = localStorage.getItem(STORAGE_LAST_FOLIO);
            const last = Number.parseInt(stored || '0', 10);
            if (Number.isFinite(last) && last >= 0) return last + 1;
            return 1;
        } catch {
            return 1;
        }
    }

    function setPreviewState({ approved, message, statusType }) {
        state.previewApproved = approved;
        saveBtn.disabled = !approved;
        chipPreviewRequired.classList.toggle('hidden', approved);
        previewStatus.classList.remove('chip-warning', 'chip-success', 'chip-info');
        if (statusType === 'success') previewStatus.classList.add('chip-success');
        if (statusType === 'warning') previewStatus.classList.add('chip-warning');
        if (statusType === 'info') previewStatus.classList.add('chip-info');
        previewStatus.textContent = message;
    }

    function normalizeText(s) {
        return (s || '').trim().replace(/\s+/g, ' ');
    }

    function fingerprintCurrentForm() {
        const mainPdf = documentoPdfInput.files && documentoPdfInput.files[0] ? documentoPdfInput.files[0] : null;
        const anexos = anexosPdfInput.files ? Array.from(anexosPdfInput.files) : [];
        const mainKey = mainPdf ? `${mainPdf.name}|${mainPdf.size}|${mainPdf.lastModified}` : '';
        const anexosKey = anexos.map(f => `${f.name}|${f.size}|${f.lastModified}`).join('||');

        return [
            normalizeText(remitenteInput.value),
            normalizeText(asuntoInput.value),
            fechaOficioInput.value || '',
            procedenciaSelect.value || '',
            mainKey,
            anexosKey
        ].join('##');
    }

    function clearValidation() {
        [remitenteInput, asuntoInput, fechaOficioInput, procedenciaSelect, documentoPdfInput, anexosPdfInput].forEach(el => {
            el.classList.remove('is-invalid', 'is-valid');
        });
        [errorRemitente, errorAsunto, errorFechaOficio, errorProcedencia, errorDocumentoPdf, errorAnexosPdf].forEach(el => {
            el.textContent = '';
        });
    }

    function setFieldStatus(inputEl, errorEl, message) {
        if (!message) {
            inputEl.classList.remove('is-invalid');
            inputEl.classList.add('is-valid');
            errorEl.textContent = '';
            return true;
        }
        inputEl.classList.remove('is-valid');
        inputEl.classList.add('is-invalid');
        errorEl.textContent = message;
        return false;
    }

    function validateRemitente() {
        const value = normalizeText(remitenteInput.value);
        if (!value) return setFieldStatus(remitenteInput, errorRemitente, 'Remitente es obligatorio.');
        if (value.length < 3) return setFieldStatus(remitenteInput, errorRemitente, 'Remitente debe tener al menos 3 caracteres.');
        return setFieldStatus(remitenteInput, errorRemitente, '');
    }

    function validateAsunto() {
        const value = normalizeText(asuntoInput.value);
        if (!value) return setFieldStatus(asuntoInput, errorAsunto, 'Asunto es obligatorio.');
        if (value.length < 8) return setFieldStatus(asuntoInput, errorAsunto, 'Asunto debe tener al menos 8 caracteres.');
        return setFieldStatus(asuntoInput, errorAsunto, '');
    }

    function validateFechaOficio() {
        const value = fechaOficioInput.value;
        if (!value) return setFieldStatus(fechaOficioInput, errorFechaOficio, 'Fecha del Oficio es obligatoria.');
        const today = getTodayIso();
        if (value > today) return setFieldStatus(fechaOficioInput, errorFechaOficio, 'Fecha del Oficio no puede ser futura.');
        return setFieldStatus(fechaOficioInput, errorFechaOficio, '');
    }

    function validateProcedencia() {
        const value = procedenciaSelect.value;
        if (!value) return setFieldStatus(procedenciaSelect, errorProcedencia, 'Procedencia es obligatoria.');
        return setFieldStatus(procedenciaSelect, errorProcedencia, '');
    }

    function isPdfFile(file) {
        if (!file) return false;
        const nameOk = /\.pdf$/i.test(file.name);
        const typeOk = file.type === 'application/pdf' || file.type === 'application/x-pdf' || file.type === '';
        return nameOk && typeOk;
    }

    function validateMainPdf() {
        const file = documentoPdfInput.files && documentoPdfInput.files[0] ? documentoPdfInput.files[0] : null;
        if (!file) return setFieldStatus(documentoPdfInput, errorDocumentoPdf, 'Documento digitalizado es obligatorio.');
        if (!isPdfFile(file)) return setFieldStatus(documentoPdfInput, errorDocumentoPdf, 'Selecciona un archivo PDF válido.');
        if (file.size > MAX_PDF_BYTES) return setFieldStatus(documentoPdfInput, errorDocumentoPdf, 'El PDF excede el tamaño permitido.');
        return setFieldStatus(documentoPdfInput, errorDocumentoPdf, '');
    }

    function validateAnnexes() {
        const files = anexosPdfInput.files ? Array.from(anexosPdfInput.files) : [];
        if (files.length === 0) {
            anexosPdfInput.classList.remove('is-invalid');
            anexosPdfInput.classList.remove('is-valid');
            errorAnexosPdf.textContent = '';
            return true;
        }
        const invalid = files.find(f => !isPdfFile(f) || f.size > MAX_PDF_BYTES);
        if (invalid) {
            return setFieldStatus(anexosPdfInput, errorAnexosPdf, 'Todos los anexos deben ser PDF válidos y dentro del tamaño permitido.');
        }
        return setFieldStatus(anexosPdfInput, errorAnexosPdf, '');
    }

    function validateAll() {
        const ok = [
            validateRemitente(),
            validateAsunto(),
            validateFechaOficio(),
            validateProcedencia(),
            validateMainPdf(),
            validateAnnexes()
        ].every(Boolean);
        return ok;
    }

    function invalidatePreviewIfNeeded() {
        const fp = fingerprintCurrentForm();
        if (!state.previewApproved) return;
        if (fp !== state.previewFingerprint) {
            setPreviewState({ approved: false, message: 'Pendiente', statusType: 'warning' });
            previewBody.innerHTML = `
                <div class="preview-empty">
                    <div class="preview-empty-title">Cambios detectados</div>
                    <div class="preview-empty-text">Vuelve a previsualizar para validar antes de guardar.</div>
                </div>
            `;
            revokeAllObjectUrls();
        }
    }

    function revokeAllObjectUrls() {
        if (state.mainPdfUrl) {
            URL.revokeObjectURL(state.mainPdfUrl);
            state.mainPdfUrl = null;
        }
        if (state.annexUrls.length > 0) {
            state.annexUrls.forEach(u => URL.revokeObjectURL(u.url));
            state.annexUrls = [];
        }
        pdfFrame.src = 'about:blank';
    }

    function renderPreview({ folio, remitente, asunto, fechaOficio, procedencia, mainFile, annexFiles }) {
        const mainName = mainFile ? mainFile.name : 'Sin archivo';
        const fechaFmt = fechaOficio ? fechaOficio.split('-').reverse().join('/') : '';
        const annexRows = annexFiles.map((f, idx) => `
            <div class="file-row">
                <div class="file-meta">
                    <div class="file-name">${escapeHtml(f.name)}</div>
                    <div class="file-tag">Anexo ${idx + 1}</div>
                </div>
                <button class="btn-mini" type="button" data-open-annex="${idx}">Ver PDF</button>
            </div>
        `).join('');

        previewBody.innerHTML = `
            <div class="preview-kv">
                <div class="preview-k">Folio</div>
                <div class="preview-v">${folio}</div>
                <div class="preview-k">Remitente</div>
                <div class="preview-v">${escapeHtml(remitente)}</div>
                <div class="preview-k">Procedencia</div>
                <div class="preview-v">${escapeHtml(procedencia)}</div>
                <div class="preview-k">Fecha del Oficio</div>
                <div class="preview-v">${escapeHtml(fechaFmt)}</div>
                <div class="preview-k">Asunto</div>
                <div class="preview-v">${escapeHtml(asunto)}</div>
            </div>
            <div class="preview-files">
                <div class="file-row">
                    <div class="file-meta">
                        <div class="file-name">${escapeHtml(mainName)}</div>
                        <div class="file-tag">Documento digitalizado</div>
                    </div>
                    <button class="btn-mini" type="button" data-open-pdf="main">Ver PDF</button>
                </div>
                ${annexFiles.length > 0 ? annexRows : `<div class="file-row">
                    <div class="file-meta">
                        <div class="file-name">Sin anexos</div>
                        <div class="file-tag">Anexos</div>
                    </div>
                    <div></div>
                </div>`}
            </div>
        `;
    }

    function escapeHtml(text) {
        return String(text || '')
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function openPdfModal(title, url) {
        pdfFrame.src = url;
        document.getElementById('pdfModalTitle').textContent = title;
        overlay.classList.remove('hidden');
        pdfModal.classList.remove('hidden');
        state.modalOpen = true;
    }

    function closePdfModal() {
        pdfModal.classList.add('hidden');
        state.modalOpen = false;
        pdfFrame.src = 'about:blank';
        if (!sidebar.classList.contains('is-open')) overlay.classList.add('hidden');
    }

    function openSidebar() {
        sidebar.classList.add('is-open');
        overlay.classList.remove('hidden');
    }

    function closeSidebar() {
        sidebar.classList.remove('is-open');
        if (!state.modalOpen) overlay.classList.add('hidden');
    }

    function initFolio() {
        state.nextFolioNumber = loadNextFolioNumber();
        folioInput.value = formatFolioNumber(state.nextFolioNumber);
    }

    function resetToInitialState() {
        clearAlert();
        clearValidation();
        revokeAllObjectUrls();
        form.reset();
        initFolio();
        setPreviewState({ approved: false, message: 'Pendiente', statusType: 'warning' });
        previewBody.innerHTML = `
            <div class="preview-empty">
                <div class="preview-empty-title">Previsualización pendiente</div>
                <div class="preview-empty-text">Completa la captura y selecciona el PDF para habilitar el guardado.</div>
            </div>
        `;
        state.previewFingerprint = '';
    }

    function persistRegistro(payload) {
        try {
            const prev = safeParseJsonArray(localStorage.getItem(STORAGE_REGISTROS));
            prev.unshift(payload);
            localStorage.setItem(STORAGE_REGISTROS, JSON.stringify(prev));
            localStorage.setItem(STORAGE_LAST_FOLIO, String(state.nextFolioNumber));
            return true;
        } catch {
            return false;
        }
    }

    function focusFirstInvalid() {
        const first = form.querySelector('.is-invalid');
        if (first) {
            first.focus({ preventScroll: true });
            first.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }

    remitenteInput.addEventListener('input', () => {
        validateRemitente();
        invalidatePreviewIfNeeded();
    });

    asuntoInput.addEventListener('input', () => {
        validateAsunto();
        invalidatePreviewIfNeeded();
    });

    fechaOficioInput.addEventListener('change', () => {
        validateFechaOficio();
        invalidatePreviewIfNeeded();
    });

    procedenciaSelect.addEventListener('change', () => {
        validateProcedencia();
        invalidatePreviewIfNeeded();
    });

    documentoPdfInput.addEventListener('change', () => {
        validateMainPdf();
        invalidatePreviewIfNeeded();
    });

    anexosPdfInput.addEventListener('change', () => {
        validateAnnexes();
        invalidatePreviewIfNeeded();
    });

    previewBtn.addEventListener('click', () => {
        clearAlert();
        const ok = validateAll();
        if (!ok) {
            setPreviewState({ approved: false, message: 'Pendiente', statusType: 'warning' });
            showAlert('error', 'Corrige los campos marcados antes de previsualizar.');
            focusFirstInvalid();
            return;
        }

        revokeAllObjectUrls();

        const mainFile = documentoPdfInput.files[0];
        state.mainPdfUrl = URL.createObjectURL(mainFile);

        const annexFiles = anexosPdfInput.files ? Array.from(anexosPdfInput.files) : [];
        state.annexUrls = annexFiles.map((f, idx) => ({ index: idx, name: f.name, url: URL.createObjectURL(f) }));

        const payload = {
            folio: folioInput.value,
            remitente: normalizeText(remitenteInput.value),
            asunto: normalizeText(asuntoInput.value),
            fechaOficio: fechaOficioInput.value,
            procedencia: procedenciaSelect.value,
            mainFileName: mainFile.name,
            annexFileNames: annexFiles.map(f => f.name)
        };

        renderPreview({
            folio: payload.folio,
            remitente: payload.remitente,
            asunto: payload.asunto,
            fechaOficio: payload.fechaOficio,
            procedencia: payload.procedencia,
            mainFile,
            annexFiles
        });

        state.previewFingerprint = fingerprintCurrentForm();
        setPreviewState({ approved: true, message: 'Validado', statusType: 'success' });
        showAlert('info', 'Previsualización generada. Ahora puedes guardar el registro.');
    });

    previewBody.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest ? e.target.closest('button') : null;
        if (!btn) return;

        if (btn.dataset.openPdf === 'main') {
            if (!state.mainPdfUrl) return;
            openPdfModal('Documento digitalizado', state.mainPdfUrl);
            return;
        }

        if (btn.dataset.openAnnex != null) {
            const index = Number.parseInt(btn.dataset.openAnnex, 10);
            const target = state.annexUrls.find(a => a.index === index);
            if (!target) return;
            openPdfModal(`Anexo: ${target.name}`, target.url);
        }
    });

    pdfModalClose.addEventListener('click', closePdfModal);

    overlay.addEventListener('click', () => {
        if (state.modalOpen) closePdfModal();
        closeSidebar();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (state.modalOpen) closePdfModal();
            closeSidebar();
        }
    });

    sidebarToggle.addEventListener('click', () => {
        const isOpen = sidebar.classList.contains('is-open');
        if (isOpen) closeSidebar();
        else openSidebar();
    });

    clearBtn.addEventListener('click', () => {
        resetToInitialState();
        showAlert('info', 'Formulario limpiado.');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAlert();

        if (!state.previewApproved) {
            showAlert('error', 'La previsualización es obligatoria antes de guardar.');
            setPreviewState({ approved: false, message: 'Pendiente', statusType: 'warning' });
            return;
        }

        const ok = validateAll();
        if (!ok) {
            showAlert('error', 'Corrige los campos marcados antes de guardar.');
            focusFirstInvalid();
            setPreviewState({ approved: false, message: 'Pendiente', statusType: 'warning' });
            return;
        }

        if (fingerprintCurrentForm() !== state.previewFingerprint) {
            showAlert('error', 'Se detectaron cambios. Vuelve a previsualizar antes de guardar.');
            setPreviewState({ approved: false, message: 'Pendiente', statusType: 'warning' });
            return;
        }

        const registro = {
            folio: folioInput.value,
            remitente: normalizeText(remitenteInput.value),
            asunto: normalizeText(asuntoInput.value),
            fechaOficio: fechaOficioInput.value,
            procedencia: procedenciaSelect.value,
            documento: documentoPdfInput.files[0].name,
            anexos: anexosPdfInput.files ? Array.from(anexosPdfInput.files).map(f => f.name) : [],
            creadoEn: new Date().toISOString()
        };

        const saved = persistRegistro(registro);
        if (!saved) {
            showAlert('error', 'No fue posible guardar el registro en este navegador.');
            return;
        }

        resetToInitialState();
        showAlert('success', `Registro guardado correctamente con folio ${registro.folio}.`);
    });

    fechaOficioInput.max = getTodayIso();
    initFolio();
    setPreviewState({ approved: false, message: 'Pendiente', statusType: 'warning' });
});
