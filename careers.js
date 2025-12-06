// ===========================
// Careers Page JavaScript
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    // Apply button functionality
    const applyButtons = document.querySelectorAll('.apply-btn');
    const positionSelect = document.getElementById('position');
    const applySection = document.getElementById('apply');

    applyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const jobTitle = button.getAttribute('data-job');

            // Set the position in the dropdown
            if (positionSelect) {
                positionSelect.value = jobTitle;
            }

            // Scroll to application form
            if (applySection) {
                const navbar = document.getElementById('navbar');
                const navbarHeight = navbar ? navbar.offsetHeight : 0;
                const targetPosition = applySection.offsetTop - navbarHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Careers form handling
    const careersForm = document.getElementById('careersForm');

    if (careersForm) {
        careersForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(careersForm);
            const firstName = formData.get('firstName');
            const lastName = formData.get('lastName');
            const email = formData.get('email');
            const position = formData.get('position');
            const resume = formData.get('resume');

            // Validation
            if (!firstName || !lastName || !email || !position) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email.match(emailRegex)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }

            // File validation
            if (!resume || resume.size === 0) {
                showNotification('Please upload your resume.', 'error');
                return;
            }

            // Check file size (5MB max)
            if (resume.size > 5 * 1024 * 1024) {
                showNotification('Resume file size must be less than 5MB.', 'error');
                return;
            }

            // Check file type
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!allowedTypes.includes(resume.type)) {
                showNotification('Resume must be in PDF or Word format.', 'error');
                return;
            }

            // Submit form
            const submitButton = careersForm.querySelector('.btn');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Submitting...';
            submitButton.disabled = true;

            try {
                const response = await fetch('/careers-application', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.success) {
                    showNotification('Application submitted successfully! We\'ll be in touch soon.', 'success');
                    careersForm.reset();
                } else {
                    showNotification(data.error || 'Failed to submit application. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Form submission error:', error);
                showNotification('Failed to submit application. Please email your resume to careers@synetica.us', 'error');
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }

    // File input display
    const fileInput = document.getElementById('resume');
    const fileInfo = document.querySelector('.file-info');

    if (fileInput && fileInfo) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                fileInfo.textContent = `Selected: ${file.name} (${fileSizeMB} MB)`;
                fileInfo.style.color = 'var(--primary-color)';
            } else {
                fileInfo.textContent = 'Upload your resume in PDF or Word format';
                fileInfo.style.color = 'var(--text-muted)';
            }
        });
    }
});
