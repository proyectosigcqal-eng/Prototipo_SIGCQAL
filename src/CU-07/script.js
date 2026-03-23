// Mock Data
const memorandums = [
    {
        id: "250100002",
        folio: "250100002",
        fecha: "10/10/2025",
        sender: "Susana Edith Aguilera Ocaña",
        sender_cargo: "Encargada de la dirección administrativa",
        recipient: "Susana Edith Aguilera Ocaña",
        recipient_cargo: "Encargada de la dirección administrativa",
        subject: "Impuesto de control vehicular",
        lugar: "Guadalupe, Zac.",
        municipio: "Guadalupe.",
        content: "Con la finalidad de respetar los derechos laborales del personal adscrito a esta Comisión Estatal de Defensa del Contribuyente, por este medio, me dirijo a Usted para solicitarle realice todos los trámites necesarios para la dispersión de la nómina correspondiente a la quincena número uno del ejercicio fiscal 2026 (Primera Quincena de Diciembre), así mismo, pido a Usted efectúe lo conducente para que se ejecuten las erogaciones relacionadas con las Aportaciones del Plan de Seguridad Social e ISSSTEZAC y pago de Cuota y Seguro Sindical.",
        status: "Recibido"
    },
    {
        id: "250100003",
        folio: "250100003",
        fecha: "10/12/2025",
        sender: "Susana Edith Aguilera Ocaña",
        sender_cargo: "Encargada de la dirección administrativa",
        recipient: "Susana Edith Aguilera Ocaña",
        recipient_cargo: "Encargada de la dirección administrativa",
        subject: "Impuesto de control vehicular",
        lugar: "Guadalupe, Zac.",
        municipio: "Guadalupe.",
        content: "Contenido del segundo memorándum...",
        status: "Recibido"
    },
    {
        id: "250100004",
        folio: "250100004",
        fecha: "15/01/2026",
        sender: "Susana Edith Aguilera Ocaña",
        sender_cargo: "Encargada de la dirección administrativa",
        recipient: "Susana Edith Aguilera Ocaña",
        recipient_cargo: "Encargada de la dirección administrativa",
        subject: "Impuesto de control vehicular",
        lugar: "Guadalupe, Zac.",
        municipio: "Guadalupe.",
        content: "Contenido del tercer memorándum...",
        status: "Recibido"
    }
];

// DOM Elements
const buzonView = document.getElementById('buzon-view');
const detailsView = document.getElementById('details-view');
const memoList = document.getElementById('memo-list');
const detailFolioHeader = document.getElementById('detail-folio-header');
const detailFecha = document.getElementById('detail-fecha');
const detailMunicipio = document.getElementById('detail-municipio');
const detailSender = document.getElementById('detail-sender');
const detailSenderCargo = document.getElementById('detail-sender-cargo');
const detailRecipient = document.getElementById('detail-recipient');
const detailRecipientCargo = document.getElementById('detail-recipient-cargo');
const detailSubject = document.getElementById('detail-subject');
const detailContent = document.getElementById('detail-content');

const btnIsArea = document.getElementById('btn-is-area');
const btnNotArea = document.getElementById('btn-not-area');
const modalContainer = document.getElementById('modal-container');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close-modal');

// State
let currentMemo = null;

// Initialize
function init() {
    renderMemoList();
    setupEventListeners();
}

// Render Table
function renderMemoList() {
    memoList.innerHTML = '';
    
    // Sort by date (oldest first as requested)
    const sortedMemos = [...memorandums].sort((a, b) => {
        const dateA = parseDate(a.fecha);
        const dateB = parseDate(b.fecha);
        return dateA - dateB;
    });

    sortedMemos.forEach(memo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: 700;">${memo.folio}</td>
            <td>${memo.fecha}</td>
            <td>${memo.sender}</td>
            <td>${memo.subject}</td>
            <td>${memo.lugar}</td>
            <td><i class="fas fa-eye action-icon" onclick="showDetails('${memo.id}')"></i></td>
        `;
        memoList.appendChild(tr);
    });
}

function parseDate(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return new Date(year, month - 1, day);
}

// Show Details View
window.showDetails = function(id) {
    currentMemo = memorandums.find(m => m.id === id);
    if (!currentMemo) return;

    // Fill Details
    detailFolioHeader.textContent = `Detalles Memorandum ${currentMemo.folio}`;
    detailFecha.textContent = currentMemo.fecha;
    detailMunicipio.textContent = currentMemo.municipio;
    detailSender.textContent = currentMemo.sender;
    detailSenderCargo.textContent = currentMemo.sender_cargo;
    detailRecipient.textContent = currentMemo.recipient;
    detailRecipientCargo.textContent = currentMemo.recipient_cargo;
    detailSubject.textContent = currentMemo.subject;
    detailContent.textContent = currentMemo.content;

    // Switch View
    buzonView.style.display = 'none';
    detailsView.style.display = 'block';
};

// Event Listeners
function setupEventListeners() {
    // Si es del área
    btnIsArea.addEventListener('click', () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString();
        
        // Update Status (Simulated)
        if (currentMemo) {
            currentMemo.status = "En seguimiento";
            currentMemo.readAt = `${dateStr} ${timeStr}`;
        }

        // Show Modal
        showConfirmationModal();
    });

    // No es del área
    btnNotArea.addEventListener('click', () => {
        showReassignModal();
    });

    // Close Modal
    closeModal.addEventListener('click', () => {
        modalContainer.style.display = 'none';
        // Return to inbox
        detailsView.style.display = 'none';
        buzonView.style.display = 'block';
        renderMemoList();
    });

    // Sidebar navigation (simple implementation)
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (link.textContent.includes('Buzón')) {
                detailsView.style.display = 'none';
                buzonView.style.display = 'block';
            }
        });
    });
}

function showConfirmationModal() {
    modalBody.innerHTML = `
        <h3>Recepción confirmada exitosamente. El documento se encuentra “En seguimiento.”</h3>
        <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
    `;
    modalContainer.style.display = 'flex';
}

function showReassignModal() {
    modalBody.innerHTML = `
        <h3 class="reassign-msg">El memorándum será reasignado</h3>
    `;
    modalContainer.style.display = 'flex';
}

// Start
init();
