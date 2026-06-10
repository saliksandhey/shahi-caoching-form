document.addEventListener('DOMContentLoaded', () => {
    // Initialize Cleave.js for Date of Birth (DD/MM/YYYY)
    new Cleave('#dob', {
        date: true,
        delimiter: '/',
        datePattern: ['d', 'm', 'Y']
    });

    const form = document.getElementById('registration-form');
    const formCard = document.getElementById('form-card');
    const successCard = document.getElementById('success-card');

    // Handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Custom validation
        let isValid = validateForm();
        
        if (isValid) {
            const btn = document.getElementById('submit-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="loader-spinner"></span> <span>Processing...</span>';
            btn.classList.add('loading');
            btn.disabled = true;
            
            // Collect form data
            const formData = new FormData(form);
            
            // Convert DD/MM/YYYY to YYYY-MM-DD for the backend
            const dobRaw = formData.get('dob') || '';
            const dobClean = dobRaw.replace(/\s+/g, '');
            const dobParts = dobClean.split('/');
            const formattedDob = dobParts.length === 3 ? `${dobParts[2]}-${dobParts[1]}-${dobParts[0]}` : dobClean;

            const payload = {
                fullName: formData.get('fullName'),
                fatherName: formData.get('fatherName'),
                mobile: formData.get('mobile'),
                email: formData.get('email'),
                dob: formattedDob,
                city: formData.get('city'),
                shortAddress: formData.get('shortAddress'),
                skillLevel: formData.get('skillLevel'),
                notes: formData.get('notes')
            };

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok) {
                    showSuccess();
                } else {
                    alert('Error: ' + (result.error || 'Failed to submit registration.'));
                    btn.innerHTML = originalText;
                    btn.classList.remove('loading');
                    btn.disabled = false;
                }
            } catch (error) {
                console.error('Submission error:', error);
                alert('An unexpected error occurred. Please try again.');
                btn.innerHTML = originalText;
                btn.classList.remove('loading');
                btn.disabled = false;
            }
        }
    });

    // Remove error class on input
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            const group = input.closest('.form-group');
            if (group.classList.contains('has-error')) {
                group.classList.remove('has-error');
            }
            
            if (input.type === 'checkbox') {
                skillsError.style.display = 'none';
            }
        });
    });

    function validateForm() {
        let isValid = true;
        
        // Standard HTML5 validation
        const requiredInputs = form.querySelectorAll('input[required], select[required]');
        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                showError(input);
                isValid = false;
            } else {
                // Specific validations
                if (input.type === 'email' && input.value) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(input.value)) {
                        showError(input);
                        isValid = false;
                    }
                }
                
                if (input.type === 'tel') {
                    const telRegex = /^[0-9]{10,15}$/;
                    if (!telRegex.test(input.value.replace(/[\s-]/g, ''))) {
                        showError(input);
                        isValid = false;
                    }
                }
            }
        });


        return isValid;
    }

    function showError(input) {
        const group = input.closest('.form-group');
        group.classList.add('has-error');
    }

    function showSuccess() {
        formCard.style.opacity = '0';
        formCard.style.transform = 'translateY(-20px)';
        formCard.style.transition = 'opacity 0.5s var(--bezier), transform 0.5s var(--bezier)';
        
        // Small delay to allow fade out before showing success
        setTimeout(() => {
            formCard.style.display = 'none';
            successCard.style.display = ''; // Reverts to CSS display flex
            
            // Trigger reflow to restart animation
            void successCard.offsetWidth;
            
            successCard.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 500);
    }
});
