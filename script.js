// DATOS DE PRUEBA (MOCK DATA)
const MOCK_TRAMITES = [
    { id: 'FUI-2024-001', asunto: 'Solicitud de Acceso a la Información', estado: 'En Proceso', dependencia: 'Secretaría de Finanzas', encargado: 'Juan Pérez', asesor: 'Lic. Ana García' },
    { id: 'FUI-2024-002', asunto: 'Reporte de Mantenimiento Vial', estado: 'Pendiente de Acuse', dependencia: 'Obras Públicas', encargado: 'Roberto Gómez', asesor: 'Ing. Carlos Ruiz', folioGenerado: 'SFP/SC/DCP/4562/2026', asuntoGenerado: 'Se envía reporte de bacheo en Av. Universidad.' },
    { id: 'FUI-2024-003', asunto: 'Trámite de Licencia Sanitaria', estado: 'Completado', dependencia: 'Salud Pública', encargado: 'Dra. Elena Torres', asesor: 'Lic. María López' },
    { id: 'FUI-2024-004', asunto: 'Convenio de Colaboración Académica', estado: 'En Proceso', dependencia: 'Educación', encargado: 'Mtro. Luis Rivas', asesor: 'Dr. Jorge Hernandez' },
];

const CURRENT_USER = "Juan Pérez García";

// ESTADO DE LA APLICACIÓN
let userRole = 'Administrador';
let currentView = 'list';
let selectedTramite = null;
let searchTerm = '';

// ELEMENTOS DEL DOM
const listView = document.getElementById('listView');
const formView = document.getElementById('formView');
const tramitesGrid = document.getElementById('tramitesGrid');
const emptyList = document.getElementById('emptyList');
const searchInput = document.getElementById('searchInput');
const toggleRoleBtn = document.getElementById('toggleRoleBtn');
const roleText = document.getElementById('roleText');
const roleIcon = document.getElementById('roleIcon');
const backToList = document.getElementById('backToList');
const successMessage = document.getElementById('successMessage');
const pendingAlert = document.getElementById('pendingAlert');

// FORMULARIOS DE ETAPAS
const generationForm = document.getElementById('generationForm');
const closingForm = document.getElementById('closingForm');
const formStageTitle = document.getElementById('formStageTitle');

// CAMPOS DEL FORMULARIO
const formFolio = document.getElementById('formFolio');
const formDependencia = document.getElementById('formDependencia');
const formEncargado = document.getElementById('formEncargado');
const formAsesor = document.getElementById('formAsesor');
const formUser = document.getElementById('formUser');
const numOficio = document.getElementById('numOficio');
const fechaDocumento = document.getElementById('fechaDocumento');
const cuerpoContestacion = document.getElementById('cuerpoContestacion');
const dropZone = document.getElementById('dropZone');
const fileUpload = document.getElementById('fileUpload');

// ELEMENTOS DE VISTA PREVIA
const prevOficio = document.getElementById('prevOficio');
const prevAsuntoShort = document.getElementById('prevAsuntoShort');
const prevFecha = document.getElementById('prevFecha');
const prevEncargado = document.getElementById('prevEncargado');
const prevDependencia = document.getElementById('prevDependencia');
const prevBody = document.getElementById('prevBody');
const prevUser = document.getElementById('prevUser');
const prevAsesor = document.getElementById('prevAsesor');

// INICIALIZACIÓN
function init() {
    renderTramites();
    setupEventListeners();
}

// RENDERIZAR TRÁMITES
function renderTramites() {
    const filtered = MOCK_TRAMITES.filter(t => {
        const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.asunto.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    tramitesGrid.innerHTML = '';
    
    if (filtered.length === 0) {
        emptyList.classList.remove('hidden');
        tramitesGrid.classList.add('hidden');
    } else {
        emptyList.classList.add('hidden');
        tramitesGrid.classList.remove('hidden');
        
        filtered.forEach(tramite => {
            const card = document.createElement('div');
            card.className = 'card-item';
            card.onclick = () => openForm(tramite);
            
            const statusClass = `status-${tramite.estado.toLowerCase().replace(/ /g, '-')}`;
            
            card.innerHTML = `
                <div class="card-item-header">
                    <span class="folio-tag">${tramite.id}</span>
                    <span class="status-badge ${statusClass}">${tramite.estado}</span>
                </div>
                <div class="card-item-body">
                    <h3>${tramite.asunto}</h3>
                    <div class="card-item-info">
                        <span>🏢 ${tramite.dependencia}</span>
                        <span>👤 ${tramite.encargado}</span>
                    </div>
                </div>
                <div class="card-item-footer">
                    <span class="btn-inline">${tramite.estado === 'Pendiente de Acuse' ? 'Subir Acuse →' : 'Generar Interacción →'}</span>
                </div>
            `;
            tramitesGrid.appendChild(card);
        });
    }
}

// CAMBIAR DE VISTA
function switchView(view) {
    currentView = view;
    if (view === 'list') {
        listView.classList.remove('hidden');
        formView.classList.add('hidden');
    } else {
        listView.classList.add('hidden');
        formView.classList.remove('hidden');
        window.scrollTo(0, 0);
    }
}

// ABRIR FORMULARIO SEGÚN ETAPA
function openForm(tramite) {
    selectedTramite = tramite;
    
    // Configuración base
    formFolio.innerText = tramite.id;
    formDependencia.value = tramite.dependencia;
    formEncargado.value = tramite.encargado;
    formAsesor.value = tramite.asesor;
    formUser.value = CURRENT_USER;
    
    if (tramite.estado === 'Pendiente de Acuse') {
        // ETAPA 2: CIERRE
        showClosingStage(tramite);
    } else {
        // ETAPA 1: GENERACIÓN
        showGenerationStage();
    }
    
    updatePreview();
    switchView('form');
}

function showGenerationStage() {
    formStageTitle.innerText = "Etapa 1: Generación";
    generationForm.classList.remove('hidden');
    closingForm.classList.add('hidden');
    pendingAlert.classList.add('hidden');
    
    // Datos precargados para generación
    numOficio.value = `SFP/SC/DCP/${Math.floor(1000 + Math.random() * 9000)}/2026`;
    fechaDocumento.value = new Date().toISOString().split('T')[0];
    cuerpoContestacion.value = '';
}

function showClosingStage(tramite) {
    formStageTitle.innerText = "Etapa 2: Cierre";
    generationForm.classList.add('hidden');
    closingForm.classList.remove('hidden');
    pendingAlert.classList.remove('hidden');
    
    // Usar datos guardados de la generación
    numOficio.value = tramite.folioGenerado;
    fechaDocumento.value = new Date().toISOString().split('T')[0];
    cuerpoContestacion.value = tramite.asuntoGenerado;
    
    resetFileUpload();
}

// ACTUALIZAR VISTA PREVIA
function updatePreview() {
    if (!selectedTramite) return;

    const oficio = numOficio.value || '---';
    const asunto = cuerpoContestacion.value || '---';
    const fecha = fechaDocumento.value ? formatDate(fechaDocumento.value) : '---';
    
    prevOficio.innerText = `MEMORÁNDUM-${oficio}`;
    prevAsuntoShort.innerText = asunto.substring(0, 50) + (asunto.length > 50 ? '...' : '');
    prevFecha.innerText = fecha;
    prevEncargado.innerText = formEncargado.value.toUpperCase();
    prevDependencia.innerText = formDependencia.value.toUpperCase();
    prevBody.innerText = asunto;
    prevAsesor.innerText = formAsesor.value;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-MX', options);
}

// MANEJO DE EVENTOS
function setupEventListeners() {
    searchInput.oninput = (e) => {
        searchTerm = e.target.value;
        renderTramites();
    };

    cuerpoContestacion.oninput = updatePreview;

    backToList.onclick = () => switchView('list');

    // ETAPA 1: GENERACIÓN Y DESCARGA
    generationForm.onsubmit = (e) => {
        e.preventDefault();
        const btn = document.getElementById('generateBtn');
        btn.disabled = true;
        btn.innerHTML = 'Generando...';

        setTimeout(() => {
            // Simular descarga
            alert("Descargando formato de contestación en PDF...");
            
            // Actualizar estado del trámite en el mock
            selectedTramite.estado = 'Pendiente de Acuse';
            selectedTramite.folioGenerado = numOficio.value;
            selectedTramite.asuntoGenerado = cuerpoContestacion.value;
            
            showSuccess("Formato generado. Esperando acuse.");
            showClosingStage(selectedTramite);
            btn.disabled = false;
            btn.innerHTML = '<span>📥</span> Generar y Descargar Contestación';
            renderTramites();
        }, 1500);
    };

    // ETAPA 2: CIERRE Y SUBIDA
    closingForm.onsubmit = (e) => {
        e.preventDefault();
        if (!fileUpload.files[0]) {
            alert("Por favor, sube el archivo PDF del acuse.");
            return;
        }

        const btn = document.getElementById('finalizeBtn');
        btn.disabled = true;
        btn.innerHTML = 'Subiendo...';

        setTimeout(() => {
            selectedTramite.estado = 'Completado';
            showSuccess("Trámitado finalizado y acuse almacenado correctamente.");
            switchView('list');
            renderTramites();
        }, 2000);
    };

    // Manejo de Archivos
    dropZone.onclick = () => fileUpload.click();
    fileUpload.onchange = (e) => handleFile(e.target.files[0]);
}

function handleFile(file) {
    if (!file || file.type !== 'application/pdf') {
        if (file) alert('Error: Solo se permiten archivos PDF.');
        resetFileUpload();
        return;
    }
    dropZone.classList.add('has-file');
    document.getElementById('dropZoneContent').innerHTML = `
        <span class="upload-icon">✅</span>
        <p><strong>${file.name.substring(0, 20)}...</strong></p>
    `;
}

function resetFileUpload() {
    fileUpload.value = '';
    dropZone.classList.remove('has-file');
    document.getElementById('dropZoneContent').innerHTML = `
        <span class="upload-icon">📄</span>
        <p>Haz clic para subir el acuse firmado</p>
    `;
}

function showSuccess(msg) {
    const text = document.getElementById('successText');
    text.innerText = msg;
    successMessage.classList.remove('hidden');
    window.scrollTo(0, 0);
    setTimeout(() => successMessage.classList.add('hidden'), 4000);
}

init();
