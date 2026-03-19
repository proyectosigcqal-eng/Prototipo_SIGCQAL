document.addEventListener('DOMContentLoaded', () => {
    // Modal Logic
    const modal = document.getElementById('eventModal');
    const openModalBtns = document.querySelectorAll('.open-modal');
    const closeModalBtn = document.querySelector('.close-modal');

    if (modal && openModalBtns.length > 0) {
        openModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.style.display = 'block';
            });
        });

        closeModalBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Close modal when clicking outside of it
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Dropdown Action Logic (for index.html table)
    const actionDots = document.querySelector('.action-dots');
    if (actionDots) {
        actionDots.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = actionDots.querySelector('.action-dropdown');
            if (dropdown) {
                const isVisible = dropdown.style.display === 'block';
                dropdown.style.display = isVisible ? 'none' : 'block';
            }
        });
    }

    // Close dropdowns when clicking anywhere else
    document.addEventListener('click', () => {
        const dropdowns = document.querySelectorAll('.action-dropdown');
        dropdowns.forEach(dropdown => {
            dropdown.style.display = 'none';
        });
    });
});
