document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            const confirmed = confirm('Are you sure you want to proceed?');
            if (!confirmed) {
                event.preventDefault();
            }
        });
    });
});
