document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    const asuntoInput = document.querySelector('.form-group.col-12 textarea');
    const previewAsunto = document.querySelector('.memo-meta p:nth-child(2) strong');
    const memoContentInput = document.querySelector('.memo-content');
    const previewBody = document.querySelector('.memo-body p');
    const elaboroSelect = document.getElementById('elaboro-select');
    const dependenciaElaboroSelect = document.getElementById('dependencia-elaboro-select');

    const baseText = 'De conformidad al oficio marcado con el Número SFP/SC/DCP/0040/2026 emitido por... ';

    const updatePreview = () => {
        // Asunto
        if (asuntoInput && previewAsunto) {
            const text = asuntoInput.value;
            previewAsunto.nextSibling.textContent = ` ${text}`;
        }

        // Cuerpo del memorándum
        if (previewBody && elaboroSelect && dependenciaElaboroSelect) {
            const elaboroText = elaboroSelect.value ? ` ${elaboroSelect.value}` : '';
            const dependenciaText = dependenciaElaboroSelect.value ? ` ${dependenciaElaboroSelect.value}` : '';
            previewBody.textContent = `${baseText}${elaboroText}${dependenciaText}`;
        }
        
        // Contenido adicional
        if (memoContentInput && previewBody) {
            const currentBody = previewBody.textContent;
            previewBody.textContent = `${currentBody} ${memoContentInput.value}`;
        }
    };

    if (asuntoInput) asuntoInput.addEventListener('input', updatePreview);
    if (memoContentInput) memoContentInput.addEventListener('input', updatePreview);
    if (elaboroSelect) elaboroSelect.addEventListener('change', updatePreview);
    if (dependenciaElaboroSelect) dependenciaElaboroSelect.addEventListener('change', updatePreview);

    // Initial call to set the state
    updatePreview();
});
