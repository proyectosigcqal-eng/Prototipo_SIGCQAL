// CONFIGURACIÓN INICIAL
let municipios = [
    { id: 1, nombre: 'Guadalupe', estatus: 'Activo' },
    { id: 2, nombre: 'Zacatecas', estatus: 'Activo' },
    { id: 3, nombre: 'Fresnillo', estatus: 'Activo' },
    { id: 4, nombre: 'Jerez', estatus: 'Inactivo' }
];

let currentFilter = 'Activo';

// ELEMENTOS DEL DOM
const municipiosList = document.getElementById('municipiosList');
const emptyList = document.getElementById('emptyList');
const municipiosTable = document.getElementById('municipiosTable');
const municipioModal = document.getElementById('municipioModal');
const deleteModal = document.getElementById('deleteModal');
const municipioForm = document.getElementById('municipioForm');
const modalTitle = document.getElementById('modalTitle');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');
const tabButtons = document.querySelectorAll('.tab-btn');
const countActivos = document.getElementById('countActivos');
const countInactivos = document.getElementById('countInactivos');

// ELEMENTOS DEL FORMULARIO
const inputId = document.getElementById('municipioId');
const inputNombre = document.getElementById('municipioNombre');
const inputEstatus = document.getElementById('municipioEstatus');
const errorNombre = document.getElementById('errorNombre');
const errorDuplicado = document.getElementById('errorDuplicado');

// ELEMENTOS DE ELIMINACIÓN
const deleteTargetName = document.getElementById('deleteTargetName');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
let municipioToDelete = null;

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    renderTable();
    setupEventListeners();
});

// FUNCIONES DE RENDERIZADO
function renderTable() {
    municipiosList.innerHTML = '';
    
    // Actualizar contadores
    const activosCount = municipios.filter(m => m.estatus === 'Activo').length;
    const inactivosCount = municipios.filter(m => m.estatus === 'Inactivo').length;
    countActivos.textContent = activosCount;
    countInactivos.textContent = inactivosCount;

    // Filtrar municipios por estatus actual
    const filteredMunicipios = municipios.filter(m => m.estatus === currentFilter);
    
    if (filteredMunicipios.length === 0) {
        municipiosTable.classList.add('hidden');
        emptyList.classList.remove('hidden');
        return;
    }

    municipiosTable.classList.remove('hidden');
    emptyList.classList.add('hidden');

    filteredMunicipios.forEach(m => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${m.nombre}</strong><br>
                <span class="status-badge ${m.estatus === 'Activo' ? 'status-active' : 'status-inactive'}">
                    ${m.estatus}
                </span>
            </td>
            <td class="actions-cell">
                <button class="btn btn-secondary btn-sm" onclick="openEditModal(${m.id})">EDITAR</button>
                <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${m.id})">ELIMINAR</button>
            </td>
        `;
        municipiosList.appendChild(row);
    });
}

// EVENT LISTENERS
function setupEventListeners() {
    // Manejo de pestañas
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.status;
            renderTable();
        });
    });

    // Abrir modal para agregar
    document.getElementById('addMunicipioBtn').addEventListener('click', () => {
        openAddModal();
    });

    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModals();
        });
    });

    // Guardar formulario
    municipioForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveMunicipio();
    });

    // Confirmar eliminación
    confirmDeleteBtn.addEventListener('click', () => {
        deleteMunicipio();
    });

    // Limpiar errores al escribir
    inputNombre.addEventListener('input', () => {
        errorNombre.classList.add('hidden');
        errorDuplicado.classList.add('hidden');
    });

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === municipioModal) closeModals();
        if (e.target === deleteModal) closeModals();
    });
}

// FUNCIONES DE MODAL
function openAddModal() {
    modalTitle.textContent = 'Agregar Nuevo Municipio';
    municipioForm.reset();
    inputId.value = '';
    clearErrors();
    municipioModal.classList.remove('hidden');
    inputNombre.focus();
}

function openEditModal(id) {
    const municipio = municipios.find(m => m.id === id);
    if (!municipio) return;

    modalTitle.textContent = 'Editar Municipio';
    inputId.value = municipio.id;
    inputNombre.value = municipio.nombre;
    inputEstatus.value = municipio.estatus;
    clearErrors();
    municipioModal.classList.remove('hidden');
    inputNombre.focus();
}

function openDeleteModal(id) {
    const municipio = municipios.find(m => m.id === id);
    if (!municipio) return;

    municipioToDelete = id;
    deleteTargetName.textContent = municipio.nombre;
    deleteModal.classList.remove('hidden');
}

function closeModals() {
    municipioModal.classList.add('hidden');
    deleteModal.classList.add('hidden');
    municipioToDelete = null;
}

function clearErrors() {
    errorNombre.classList.add('hidden');
    errorDuplicado.classList.add('hidden');
}

// FUNCIONES CRUD
function saveMunicipio() {
    const id = inputId.value;
    const nombre = inputNombre.value; // Ya no es .trim() porque es un select
    const estatus = inputEstatus.value;

    // Validación: Campo obligatorio
    if (!nombre) {
        errorNombre.classList.remove('hidden');
        return;
    }

    // Validación: Duplicados (excepto si estamos editando el mismo registro)
    const exists = municipios.some(m => m.nombre === nombre && m.id != id);
    if (exists) {
        errorDuplicado.classList.remove('hidden');
        return;
    }

    if (id) {
        // Editar
        const index = municipios.findIndex(m => m.id == id);
        if (index !== -1) {
            municipios[index] = { ...municipios[index], nombre, estatus };
            currentFilter = estatus; // Cambiar a la pestaña del estatus editado
            updateActiveTab();
            showNotification('Municipio actualizado correctamente.');
        }
    } else {
        // Agregar
        const newId = municipios.length > 0 ? Math.max(...municipios.map(m => m.id)) + 1 : 1;
        municipios.push({ id: newId, nombre, estatus });
        currentFilter = estatus; // Cambiar a la pestaña del nuevo estatus
        updateActiveTab();
        showNotification('Municipio agregado con éxito.');
    }

    renderTable();
    closeModals();
    
    // Simular integración con CU-17 (Reflejar en tiempo real)
    console.log("Notificando a MAIQR-CU-17: Lista de municipios actualizada.");
}

function updateActiveTab() {
    tabButtons.forEach(btn => {
        if (btn.dataset.status === currentFilter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function deleteMunicipio() {
    if (municipioToDelete === null) return;

    const index = municipios.findIndex(m => m.id === municipioToDelete);
    if (index !== -1) {
        const nombre = municipios[index].nombre;
        municipios.splice(index, 1);
        showNotification(`Municipio "${nombre}" eliminado correctamente.`);
        renderTable();
    }
    
    closeModals();
}

// UTILIDADES
function showNotification(message) {
    successText.textContent = message;
    successMessage.classList.remove('hidden');
    
    setTimeout(() => {
        successMessage.classList.add('hidden');
    }, 4000);
}
