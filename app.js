window.API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://photo-restore-pro.com";

// Global function to update the credits display
function updateCreditsDisplay(credits) {
    console.log('=== updateCreditsDisplay called ===');
    console.log('Credits parameter:', credits);
    console.log('Type of credits:', typeof credits);
    
    let creditsMsg = document.getElementById('photo-credits-msg');
    let buyMoreBtn = document.getElementById('buy-more-credits-btn');
    const uploadForm = document.getElementById('photo-upload-form');
    const uploadFormContainer = document.getElementById('upload-form-container');
    
    console.log('Elements found:');
    console.log('- creditsMsg:', creditsMsg);
    console.log('- buyMoreBtn:', buyMoreBtn);
    console.log('- uploadForm:', uploadForm);
    console.log('- uploadFormContainer:', uploadFormContainer);
    
    if (!creditsMsg) {
        console.log('Creating creditsMsg element...');
        // Create the credits message element if it doesn't exist
        creditsMsg = document.createElement('div');
        creditsMsg.id = 'photo-credits-msg';
        creditsMsg.className = 'text-center text-lg font-bold text-indigo-700 my-4';
        if (uploadFormContainer) {
            uploadFormContainer.insertBefore(creditsMsg, uploadFormContainer.firstChild);
            console.log('Credits message inserted into container');
        } else {
            console.log('ERROR: uploadFormContainer not found!');
        }
    }
    
    if (!buyMoreBtn) {
        console.log('Creating buyMoreBtn element...');
        // Create the buy more credits button if it doesn't exist
        buyMoreBtn = document.createElement('button');
        buyMoreBtn.id = 'buy-more-credits-btn';
        buyMoreBtn.className = 'btn-primary w-full mt-4';
        buyMoreBtn.textContent = 'Buy More Credits';
        buyMoreBtn.onclick = function() {
            document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' });
        };
        if (uploadFormContainer) {
            uploadFormContainer.appendChild(buyMoreBtn);
            console.log('Buy more button inserted into container');
        } else {
            console.log('ERROR: uploadFormContainer not found for buy button!');
        }
    }
    
    console.log('Processing credits logic...');
    if (credits > 0) {
        console.log('Credits > 0, showing form and hiding buy button');
        creditsMsg.textContent = `You have ${credits} photo credit${credits === 1 ? '' : 's'} left.`;
        creditsMsg.classList.remove('text-red-600');
        creditsMsg.classList.add('text-indigo-700');
        
        // Show upload form and hide buy more button
        if (uploadForm) {
            uploadForm.style.display = 'block';
            uploadForm.disabled = false;
            console.log('Upload form shown and enabled');
        } else {
            console.log('ERROR: uploadForm not found!');
        }
        if (buyMoreBtn) {
            buyMoreBtn.style.display = 'none';
            console.log('Buy more button hidden');
        }
    } else {
        console.log('Credits = 0, hiding form and showing buy button');
        creditsMsg.textContent = 'You have 0 photo credits left. Please buy more to continue restoring photos.';
        creditsMsg.classList.remove('text-indigo-700');
        creditsMsg.classList.add('text-red-600');
        
        // Hide upload form and show buy more button
        if (uploadForm) {
            uploadForm.style.display = 'none';
            console.log('Upload form hidden');
        } else {
            console.log('ERROR: uploadForm not found!');
        }
        if (buyMoreBtn) {
            buyMoreBtn.style.display = 'block';
            console.log('Buy more button shown');
        }
    }
    console.log('=== updateCreditsDisplay completed ===');
}

// Function to fetch and display user credits on page load
async function fetchUserCredits() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`${window.API_BASE_URL}/api/auth/user/credits`, {
            method: 'GET',
            headers: {
                'x-auth-token': token
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Fetched credits:', data);
            if (typeof data.photo_credits !== 'undefined') {
                updateCreditsDisplay(data.photo_credits);
            }
        }
    } catch (error) {
        console.error('Error fetching user credits:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // --- CORE UI ELEMENTS ---
    const themeToggle = document.getElementById('theme-toggle');
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    // Modals
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const loginButton = document.getElementById('login-button');
    const mobileLoginButton = document.getElementById('mobile-login-button');
    const signupButton = document.getElementById('signup-button');
    const mobileSignupButton = document.getElementById('mobile-signup-button');
    const closeLogin = document.getElementById('close-login');
    const closeSignup = document.getElementById('close-signup');
    const switchToSignup = document.getElementById('switch-to-signup');
    const switchToLogin = document.getElementById('switch-to-login');

    // Forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    // --- NAVIGATION MENU LOGIC BASED ON AUTH ---
    const guestMenu = document.getElementById('guest-menu');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    const logoutButton = document.getElementById('logout-button');
    // Mobile
    const mobileGuestMenu = document.getElementById('mobile-guest-menu');
    const mobileUserMenu = document.getElementById('mobile-user-menu');
    const mobileUserName = document.getElementById('mobile-user-name');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');

    // --- UPLOAD UI LOGIC BASED ON AUTH/PLAN ---
    const guestUploadPrompt = document.getElementById('guest-upload-prompt');
    const paymentPrompt = document.getElementById('payment-prompt');
    const uploadFormContainer = document.getElementById('upload-form-container');

    // Function to update authentication UI state
    function updateAuthUI() {
        const token = localStorage.getItem('token');
        if (!token) {
            showNavMenus('guest');
            showUploadUI('guest');
            return;
        }
        
        // Fetch user data and update UI
        fetch(`${window.API_BASE_URL}/api/auth`, {
            headers: { 'x-auth-token': token }
        })
        .then(res => res.ok ? res.json() : null)
        .then(user => {
            if (!user || !user.name) {
                showNavMenus('guest');
                showUploadUI('guest');
            } else {
                showNavMenus('user', user.name);
                if (!user.plan || user.plan === '' || user.plan === null) {
                    showUploadUI('no-plan');
                } else {
                    showUploadUI('has-plan');
                }
            }
        })
        .catch(() => {
            showNavMenus('guest');
            showUploadUI('guest');
        });
    }

    // Update the login success handler to fetch credits
    function handleLoginSuccess(token, isSignup = false) {
        localStorage.setItem('token', token);
        updateAuthUI();
        fetchUserCredits(); // Fetch credits after login
        closeModal(isSignup ? signupModal : loginModal);
        showAlert(isSignup ? 'signup' : 'login', isSignup ? 'Account created successfully!' : 'Login successful!', true);
    }

    function showNavMenus(state, name) {
        if (guestMenu) guestMenu.style.display = (state === 'guest') ? 'flex' : 'none';
        if (userMenu) userMenu.style.display = (state === 'user') ? 'flex' : 'none';
        if (userName) userName.textContent = name || '';
        if (mobileGuestMenu) mobileGuestMenu.style.display = (state === 'guest') ? 'block' : 'none';
        if (mobileUserMenu) mobileUserMenu.style.display = (state === 'user') ? 'block' : 'none';
        if (mobileUserName) mobileUserName.textContent = name || '';
    }

    function showUploadUI(state) {
        if (guestUploadPrompt) guestUploadPrompt.style.display = (state === 'guest') ? 'block' : 'none';
        if (paymentPrompt) paymentPrompt.style.display = (state === 'no-plan') ? 'block' : 'none';
        if (uploadFormContainer) {
            if (state === 'has-plan') {
                uploadFormContainer.style.display = 'block';
                uploadFormContainer.classList.remove('hidden');
            } else {
                uploadFormContainer.style.display = 'none';
                uploadFormContainer.classList.add('hidden');
            }
        }
        // Show/hide the user-upload-area wrapper
        const userUploadArea = document.getElementById('user-upload-area');
        if (userUploadArea) {
            userUploadArea.classList.toggle('hidden', state === 'guest');
        }
    }

    // --- THEME TOGGLE ---
    const updateThemeIcons = (isDark) => {
        const icons = [themeToggle, mobileThemeToggle].filter(Boolean);
        icons.forEach(toggle => {
            const icon = toggle.querySelector('i');
            if (icon) icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        });
    };
    const toggleDarkMode = () => {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDark);
        updateThemeIcons(isDark);
    };
    if (themeToggle) themeToggle.addEventListener('click', toggleDarkMode);
    if (mobileThemeToggle) mobileThemeToggle.addEventListener('click', toggleDarkMode);
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        updateThemeIcons(true);
    }

    // --- MODAL CONTROLS ---
    const openModal = (modal) => {
        if (!modal) return;
        const form = modal.querySelector('form');
        if (form) form.reset();
        modal.querySelectorAll('.alert').forEach(alert => alert.classList.add('hidden'));
        modal.querySelectorAll('.form-input').forEach(input => input.classList.remove('valid', 'invalid'));
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };
    const closeModal = (modal) => {
        if (!modal) return;
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        const alert = modal.querySelector('.alert');
        if (alert) alert.classList.add('hidden');
    };

    if (loginButton) loginButton.addEventListener('click', () => openModal(loginModal));
    if (signupButton) signupButton.addEventListener('click', () => openModal(signupModal));
    if (mobileLoginButton) mobileLoginButton.addEventListener('click', () => { if(mobileMenu) mobileMenu.classList.add('hidden'); openModal(loginModal); });
    if (mobileSignupButton) mobileSignupButton.addEventListener('click', () => { if(mobileMenu) mobileMenu.classList.add('hidden'); openModal(signupModal); });
    
    if (closeLogin) closeLogin.addEventListener('click', () => closeModal(loginModal));
    if (closeSignup) closeSignup.addEventListener('click', () => closeModal(signupModal));
    if (switchToSignup) switchToSignup.addEventListener('click', (e) => { e.preventDefault(); closeModal(loginModal); openModal(signupModal); });
    if (switchToLogin) switchToLogin.addEventListener('click', (e) => { e.preventDefault(); closeModal(signupModal); openModal(loginModal); });
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) closeModal(loginModal);
        if (e.target === signupModal) closeModal(signupModal);
    });

    // --- ALERT HELPER ---
    const showAlert = (formId, message, isSuccess = false) => {
        const alert = document.getElementById(`${formId}-alert`);
        const alertIcon = document.getElementById(`${formId}-alert-icon`);
        const alertText = document.getElementById(`${formId}-alert-text`);
        if (!alert || !alertIcon || !alertText) return;
        alert.classList.remove('hidden', 'alert-success', 'alert-error');
        alertIcon.classList.remove('fa-check-circle', 'fa-exclamation-circle');
        if (isSuccess) {
            alert.classList.add('alert-success');
            alertIcon.classList.add('fa-check-circle');
        } else {
            alert.classList.add('alert-error');
            alertIcon.classList.add('fa-exclamation-circle');
        }
        alertText.textContent = message;
        
        // Scroll to the alert message if it's an error
        if (!isSuccess) {
            setTimeout(() => {
                alert.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    };

    // --- SIGNUP FORM SUBMISSION ---
    if (signupForm) {
        signupForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            const terms = document.getElementById('terms').checked;

            // Frontend validation
            if (!name || !email || !password || !confirmPassword) {
                showAlert('signup', 'Please fill in all fields.');
                return;
            }
            if (password !== confirmPassword) {
                showAlert('signup', 'Passwords do not match.');
                return;
            }
            if (!terms) {
                showAlert('signup', 'You must agree to the Terms of Service.');
                return;
            }

            console.log('Sending signup request...');
            fetch(`${window.API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            })
            .then(response => {
                console.log('Signup response status:', response.status);
                console.log('Signup response ok:', response.ok);
                return response.json();
            })
            .then(data => {
                console.log('Signup response data:', data);
                if (data.token) {
                    console.log('Signup successful, calling handleLoginSuccess...');
                    
                    // Hide the form and show a prominent message
                    const signupFormElement = document.getElementById('signup-form');
                    const signupModalContent = signupModal.querySelector('.modal-content');
                    
                    if (signupFormElement && signupModalContent) {
                        // Hide the form
                        signupFormElement.style.display = 'none';
                        
                        // Create and show a success message
                        const successDiv = document.createElement('div');
                        successDiv.className = 'text-center py-8';
                        successDiv.innerHTML = `
                            <div class="text-green-600 text-6xl mb-4">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <h3 class="text-xl font-bold text-gray-800 mb-2">Account Created Successfully!</h3>
                            <p class="text-gray-600">Signup completed, logging you in...</p>
                        `;
                        
                        signupModalContent.appendChild(successDiv);
                    }
                    
                    // Wait a moment to show the message, then log in
                    setTimeout(() => {
                        handleLoginSuccess(data.token, true);
                        // Update credits display with the data from signup response
                        if (data.user && typeof data.user.photo_credits !== 'undefined') {
                            console.log('Credits received from backend:', data.user.photo_credits);
                            console.log('Calling updateCreditsDisplay with:', data.user.photo_credits);
                            updateCreditsDisplay(data.user.photo_credits);
                            console.log('updateCreditsDisplay called successfully');
                            if (data.user.photo_credits <= 0) {
                                alert('You have no photo credits left. Please buy more to continue restoring photos.');
                                // Redirect to pricing page
                                setTimeout(() => {
                                    document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' });
                                }, 1000);
                            }
                        } else {
                            console.log('No photo_credits in response data:', data);
                        }
                    }, 3500); // Wait 3.5 seconds to show the message
                } else {
                    console.log('Signup failed - no token in response');
                    showAlert('signup', data.msg || 'Signup failed.');
                }
            })
            .catch(error => {
                console.error('Signup fetch error:', error);
                showAlert('signup', 'Signup failed. Please try again.');
            });
        });
    }

    // --- LOGIN FORM SUBMISSION ---
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            console.log('Sending login request...');
            fetch(`${window.API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            })
            .then(response => {
                console.log('Login response status:', response.status);
                console.log('Login response ok:', response.ok);
                return response.json();
            })
            .then(data => {
                console.log('Login response data:', data);
                if (data.token) {
                    console.log('Login successful, calling handleLoginSuccess...');
                    handleLoginSuccess(data.token, false);
                    // Update credits display with the data from login response
                    if (data.user && typeof data.user.photo_credits !== 'undefined') {
                        console.log('Credits received from backend:', data.user.photo_credits);
                        console.log('Calling updateCreditsDisplay with:', data.user.photo_credits);
                        updateCreditsDisplay(data.user.photo_credits);
                        console.log('updateCreditsDisplay called successfully');
                        if (data.user.photo_credits <= 0) {
                            alert('You have no photo credits left. Please buy more to continue restoring photos.');
                            // Redirect to pricing page
                            setTimeout(() => {
                                document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' });
                            }, 1000);
                        }
                    } else {
                        console.log('No photo_credits in response data:', data);
                    }
                } else {
                    console.log('Login failed - no token in response');
                    showAlert('login', data.msg || 'Login failed');
                }
            })
            .catch(error => {
                console.error('Login fetch error:', error);
                showAlert('login', 'Login failed. Please try again.');
            });
        });
    }

    // Logout functionality
    if (logoutButton) logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.reload();
    });
    if (mobileLogoutButton) mobileLogoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.reload();
    });

    // --- GUEST UPLOAD PROMPT BUTTON ---
    const uploadLoginPromptButton = document.getElementById('upload-login-prompt-button');
    if (uploadLoginPromptButton) {
        uploadLoginPromptButton.addEventListener('click', function() {
            openModal(loginModal);
        });
    }

    // --- OTHER INITIALIZATIONS ---
    if (mobileMenuButton) mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                if (mobileMenu) mobileMenu.classList.add('hidden');
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Call fetchUserCredits on page load if user is logged in
    if (localStorage.getItem('token')) {
        fetchUserCredits();
    }

    // Initialize auth UI on page load
    updateAuthUI();

    // --- PHOTO UPLOAD FORM ---
    const uploadForm = document.querySelector("#upload-form-container form");
    const uploadedImgPreview = document.getElementById('uploaded-image-preview');
    
    // Custom Credit Confirmation Modal
    function showCreditModal(message) {
        return new Promise((resolve) => {
            const modal = document.getElementById('credit-modal');
            const msg = document.getElementById('credit-modal-message');
            const okBtn = document.getElementById('credit-modal-ok');
            const cancelBtn = document.getElementById('credit-modal-cancel');
            msg.textContent = message;
            modal.classList.remove('hidden');

            function cleanup(result) {
                modal.classList.add('hidden');
                okBtn.removeEventListener('click', onOk);
                cancelBtn.removeEventListener('click', onCancel);
                resolve(result);
            }
            function onOk() { cleanup(true); }
            function onCancel() { cleanup(false); }

            okBtn.addEventListener('click', onOk);
            cancelBtn.addEventListener('click', onCancel);
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const fileInput = document.getElementById('photo-upload');
            const imageFile = fileInput.files[0];
            
            if (!imageFile) {
                alert('Please select an image to upload.');
                return;
            }

            // Get current credits before proceeding
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please log in to restore photos.');
                return;
            }

            // Fetch current credits and show confirmation
            fetch(`${window.API_BASE_URL}/api/auth/user/credits`, {
                method: 'GET',
                headers: {
                    'x-auth-token': token
                }
            })
            .then(response => response.json())
            .then(async data => {
                const currentCredits = data.photo_credits || 0;
                const remainingCredits = currentCredits - 1;
                
                const confirmMessage = `You have ${currentCredits} photo credit${currentCredits === 1 ? '' : 's'} remaining.\n\nThis restoration will use 1 credit.\nAfter restoration, you will have ${remainingCredits} credit${remainingCredits === 1 ? '' : 's'} left.\n\nDo you want to proceed with the restoration?`;
                
                const proceed = await showCreditModal(confirmMessage);
                if (!proceed) return;
                // User confirmed, proceed with upload
                proceedWithUpload(imageFile);
            })
            .catch(async error => {
                console.error('Error fetching credits:', error);
                // If we can't fetch credits, still allow upload but warn user
                const proceed = await showCreditModal('Unable to verify your credits. This restoration will use 1 credit.\n\nDo you want to proceed?');
                if (proceed) {
                    proceedWithUpload(imageFile);
                }
            });
        });
    }

    // Function to handle the actual upload process
    function proceedWithUpload(imageFile) {
        const processingIndicator = document.getElementById('processing-indicator');
        const previewImg = document.getElementById('restored-image');
        const placeholder = document.querySelector('#restoration-preview #preview-placeholder');
        const previewSection = document.getElementById('restoration-preview');
        const downloadBtn = document.getElementById('download-restored-image');
        const uploadedImgPreview = document.getElementById('uploaded-image-preview');
        
        // Show uploaded image preview
        if (uploadedImgPreview && imageFile) {
            const reader = new FileReader();
            reader.onload = function(e) {
                uploadedImgPreview.src = e.target.result;
                uploadedImgPreview.style.display = 'block';
            };
            reader.readAsDataURL(imageFile);
        }

        if (previewSection) previewSection.style.display = 'block';
        if (processingIndicator) processingIndicator.classList.remove('hidden');
        if (placeholder) placeholder.classList.add('hidden');
        if (previewImg) previewImg.classList.add('hidden');
        if (downloadBtn) downloadBtn.style.display = 'none';

        const formData = new FormData();
        formData.append('photo', imageFile);

        fetch(`${window.API_BASE_URL}/api/restore`, {
            method: 'POST',
            headers: { 'x-auth-token': localStorage.getItem('token') },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 403) {
                    return response.json().then(data => {
                        throw new Error(data.msg || 'Access denied. Please check your plan and credits.');
                    });
                }
                throw new Error('Upload failed with status ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (!data.restored) throw new Error('No restored image URL returned.');
            if (processingIndicator) processingIndicator.classList.add('hidden');
            if (previewImg && placeholder) {
                previewImg.src = data.restored;
                previewImg.onload = function() {
                    previewImg.classList.remove('hidden');
                    placeholder.classList.add('hidden');
                    // Dynamically adjust image size
                    let maxW = 400, maxH = 350;
                    let w = previewImg.naturalWidth, h = previewImg.naturalHeight;
                    if (w > maxW || h > maxH) {
                        if (w / maxW > h / maxH) {
                            previewImg.style.width = maxW + 'px';
                            previewImg.style.height = 'auto';
                        } else {
                            previewImg.style.height = maxH + 'px';
                            previewImg.style.width = 'auto';
                        }
                    } else {
                        previewImg.style.width = w + 'px';
                        previewImg.style.height = h + 'px';
                    }
                    // Show download button only after image loads
                    if (downloadBtn) {
                        downloadBtn.style.display = 'inline-block';
                        downloadBtn.onclick = function(ev) {
                            ev.preventDefault();
                            fetch(previewImg.src, {mode: 'cors'})
                                .then(resp => resp.blob())
                                .then(blob => {
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.style.display = 'none';
                                    a.href = url;
                                    a.download = 'restored-image.jpg';
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                })
                                .catch(() => alert('Failed to download image.'));
                        };
                    }
                };
                previewImg.onerror = function() {
                    previewImg.classList.add('hidden');
                    if (downloadBtn) downloadBtn.style.display = 'none';
                    // Show error message
                    const errorMsg = document.getElementById('error-message');
                    const errorText = document.getElementById('error-text');
                    if (errorMsg && errorText) {
                        errorText.textContent = 'Failed to load the restored image. Please try again.';
                        errorMsg.classList.remove('hidden');
                    }
                };
            }
            // Update credits display after successful upload
            if (typeof data.photo_credits !== 'undefined') {
                console.log('Credits received from backend:', data.photo_credits);
                console.log('Calling updateCreditsDisplay with:', data.photo_credits);
                
                // Add a small delay to ensure DOM is ready
                setTimeout(() => {
                    updateCreditsDisplay(data.photo_credits);
                    console.log('updateCreditsDisplay called successfully');
                    
                    // Also fetch fresh credits from server to ensure UI is in sync
                    fetchUserCredits();
                    
                    // Show a brief notification about credits update
                    const creditsNotification = document.createElement('div');
                    creditsNotification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                    creditsNotification.textContent = `Credits updated: ${data.photo_credits} remaining`;
                    document.body.appendChild(creditsNotification);
                    
                    // Remove notification after 3 seconds
                    setTimeout(() => {
                        if (creditsNotification.parentNode) {
                            creditsNotification.parentNode.removeChild(creditsNotification);
                        }
                    }, 3000);
                }, 100);
                
                if (data.photo_credits <= 0) {
                    alert('You have no photo credits left. Please buy more to continue restoring photos.');
                    // Redirect to pricing page
                    setTimeout(() => {
                        document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' });
                    }, 1000);
                }
            } else {
                console.log('No photo_credits in response data:', data);
            }
        })
        .catch(error => {
            console.error('Error uploading image:', error);
            alert('Error: ' + error.message);
            if (processingIndicator) processingIndicator.classList.add('hidden');
            if (placeholder) placeholder.classList.remove('hidden');
            if (previewImg) previewImg.classList.add('hidden');
            if (downloadBtn) downloadBtn.style.display = 'none';
        });
    }

    // === DYNAMIC PRICING FOR PLANS ===
    window.updatePrice = function(plan) {
        let qty = 1;
        let price = 0;
        if (plan === 'basic') {
            qty = parseInt(document.getElementById('basic-qty').value) || 1;
            price = qty * 6.99;
            document.getElementById('basic-price').textContent = `Total: £${price.toFixed(2)}`;
        } else if (plan === 'advanced') {
            qty = parseInt(document.getElementById('advanced-qty').value) || 1;
            if (qty <= 5) {
                price = qty * 6.99;
            } else {
                price = 5 * 6.99 + (qty - 5) * 5.99;
            }
            document.getElementById('advanced-price').textContent = `Total: £${price.toFixed(2)}`;
        } else if (plan === 'premium') {
            qty = parseInt(document.getElementById('premium-qty').value) || 1;
            if (qty <= 10) {
                price = qty * 5.99;
            } else {
                price = 10 * 5.99 + (qty - 10) * 4.99;
            }
            document.getElementById('premium-price').textContent = `Total: £${price.toFixed(2)}`;
        }
    };

    // === PAYPAL INTEGRATION ===
    // Validate number of photos
    window.validateQty = function(plan) {
        let qty = 1;
        let warningId = '';
        if (plan === 'basic') {
            qty = parseInt(document.getElementById('basic-qty').value) || 0;
            warningId = 'basic-qty-warning';
        } else if (plan === 'advanced') {
            qty = parseInt(document.getElementById('advanced-qty').value) || 0;
            warningId = 'advanced-qty-warning';
        } else if (plan === 'premium') {
            qty = parseInt(document.getElementById('premium-qty').value) || 0;
            warningId = 'premium-qty-warning';
        }
        const warning = document.getElementById(warningId);
        if (qty < 1) {
            if (warning) warning.classList.remove('hidden');
            return false;
        } else {
            if (warning) warning.classList.add('hidden');
            return true;
        }
    };

    // Show PayPal button for the selected plan
    window.showPaypal = function(plan) {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            // Show login modal for guests
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                loginModal.style.display = 'block';
                document.body.style.overflow = 'hidden';
                // Show a message in the login modal
                const loginAlert = document.getElementById('login-alert');
                const loginAlertText = document.getElementById('login-alert-text');
                if (loginAlert && loginAlertText) {
                    loginAlert.classList.remove('hidden', 'alert-success', 'alert-error');
                    loginAlert.classList.add('alert-error');
                    loginAlertText.textContent = 'Please sign in or create an account to make a purchase.';
                }
            }
            return;
        }
        
        if (!window.validateQty(plan)) {
            return;
        }
        
        // Hide all PayPal button containers first
        ['basic', 'advanced', 'premium'].forEach(p => {
            const el = document.getElementById('paypal-button-' + p);
            if (el) el.innerHTML = '';
        });
        
        // Get selected quantity and price
        let qty = 1;
        let price = 0;
        let label = '';
        
        if (plan === 'basic') {
            qty = parseInt(document.getElementById('basic-qty').value) || 1;
            price = qty * 6.99;
            label = `Basic Restoration (${qty} photo${qty > 1 ? 's' : ''})`;
        } else if (plan === 'advanced') {
            qty = parseInt(document.getElementById('advanced-qty').value) || 1;
            if (qty <= 5) {
                price = qty * 6.99;
            } else {
                price = 5 * 6.99 + (qty - 5) * 5.99;
            }
            label = `Advanced Restoration (${qty} photo${qty > 1 ? 's' : ''})`;
        } else if (plan === 'premium') {
            qty = parseInt(document.getElementById('premium-qty').value) || 1;
            if (qty <= 10) {
                price = qty * 5.99;
            } else {
                price = 10 * 5.99 + (qty - 10) * 4.99;
            }
            label = `Premium Package (${qty} photo${qty > 1 ? 's' : ''})`;
        }
        
        price = price.toFixed(2);
        console.log('Plan:', plan);
        console.log('Quantity:', qty);
        console.log('Price:', price);
        console.log('Label:', label);
        
        const containerId = 'paypal-button-' + plan;
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('PayPal container not found:', containerId);
            return;
        }
        
        // Wait for PayPal SDK to load
        const waitForPayPal = () => {
            if (window.paypal) {
                renderPayPalButton();
            } else {
                console.log('PayPal SDK not loaded yet, retrying in 500ms...');
                setTimeout(waitForPayPal, 500);
            }
        };
        
        const renderPayPalButton = () => {
            // Render PayPal button
            paypal.Buttons({
                style: { 
                    layout: 'vertical', 
                    color: 'blue', 
                    shape: 'rect', 
                    label: 'paypal' 
                },
                createOrder: function(data, actions) {
                    console.log('Creating order with price:', price);
                    return actions.order.create({
                        purchase_units: [{
                            amount: { 
                                value: price, 
                                currency_code: 'GBP' 
                            },
                            description: label
                        }]
                    });
                },
                onApprove: function(data, actions) {
                    return actions.order.capture().then(function(details) {
                        // Get token from localStorage
                        const token = localStorage.getItem('token');
                        if (!token) {
                            alert('Please log in to complete your purchase.');
                            return;
                        }
                        
                        fetch(`${window.API_BASE_URL}/api/auth/payment-success`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-auth-token': token
                            },
                            body: JSON.stringify({ 
                                plan: plan, 
                                orderID: data.orderID, 
                                payerID: data.payerID, 
                                qty: qty 
                            })
                        })
                        .then(res => res.json())
                        .then(res => {
                            // Show custom payment success message
                            const successMsg = document.getElementById('payment-success-message');
                            const successText = document.getElementById('payment-success-text');
                            if (successMsg && successText) {
                                successText.textContent = 'Payment successful! Your plan has been updated. You can now upload your photos for restoration.';
                                successMsg.classList.remove('hidden');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                            setTimeout(() => window.location.reload(), 1200);
                        })
                        .catch(() => alert('Payment succeeded, but failed to update your plan. Please contact support.'));
                    });
                },
                onError: function(err) {
                    alert('PayPal error: ' + err);
                }
            }).render('#' + containerId);
        };
        
        // Start waiting for PayPal SDK
        waitForPayPal();
    };

    // Add event listeners to quantity inputs for real-time price updates
    // Basic plan quantity
    const basicQty = document.getElementById('basic-qty');
    if (basicQty) {
        basicQty.addEventListener('input', () => window.updatePrice('basic'));
    }

    // Advanced plan quantity
    const advancedQty = document.getElementById('advanced-qty');
    if (advancedQty) {
        advancedQty.addEventListener('input', () => window.updatePrice('advanced'));
    }

    // Premium plan quantity
    const premiumQty = document.getElementById('premium-qty');
    if (premiumQty) {
        premiumQty.addEventListener('input', () => window.updatePrice('premium'));
    }

    // === FAQ ACCORDION FUNCTIONALITY ===
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('i');
            
            // Toggle the answer visibility
            answer.classList.toggle('hidden');
            
            // Rotate the chevron icon
            if (icon) {
                icon.style.transform = answer.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
            }
            
            // Optional: Close other open FAQs (accordion behavior)
            // Uncomment the lines below if you want only one FAQ open at a time
            /*
            faqQuestions.forEach(otherQuestion => {
                if (otherQuestion !== this) {
                    const otherAnswer = otherQuestion.nextElementSibling;
                    const otherIcon = otherQuestion.querySelector('i');
                    otherAnswer.classList.add('hidden');
                    if (otherIcon) {
                        otherIcon.style.transform = 'rotate(0deg)';
                    }
                }
            });
            */
        });
    });
}); 