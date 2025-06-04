document.addEventListener('DOMContentLoaded', function() {
    // Konfirmasi sebelum submit form
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            const confirmed = confirm('Are you sure you want to proceed?');
            if (!confirmed) {
                event.preventDefault();
            }
        });
    });

    // Sidebar toggle
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const closeSidebarMenu = document.querySelector('.sidebar .hamburger-menu');
    const searchToggle = document.querySelector('.search-toggle');
    const searchBar = document.querySelector('.search-bar');
    const sidebar = document.querySelector('.sidebar');

    if (hamburgerMenu && sidebar) {
        hamburgerMenu.addEventListener('click', () => {
            sidebar.style.display = (sidebar.style.display === 'none' || sidebar.style.display === '') ? 'block' : 'none';
        });
    }

    if (closeSidebarMenu && sidebar) {
        closeSidebarMenu.addEventListener('click', () => {
            sidebar.style.display = 'none';
        });
    }

    if (searchToggle && searchBar) {
        searchToggle.addEventListener('click', () => {
            searchBar.style.display = (searchBar.style.display === 'none' || searchBar.style.display === '') ? 'block' : 'none';
        });
    }

    window.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && !hamburgerMenu.contains(e.target)) {
            sidebar.style.display = 'none';
        }
    }
    
    //stat

        
    
    );
});

