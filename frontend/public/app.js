// DOM Elements
console.log('App.js loaded - Medical Encounter Document Capture', new Date().toISOString());
const camera = document.getElementById('camera');
const cameraToggle = document.getElementById('cameraToggle');
const captureButton = document.getElementById('captureButton');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');
const imagePreview = document.getElementById('imagePreview');
const retakeButton = document.getElementById('retakeButton');
const confirmButton = document.getElementById('confirmButton');
const editAttributesButton = document.getElementById('editAttributesButton');
const submitAttributesButton = document.getElementById('submitAttributesButton');
const placeholderMessage = document.querySelector('.placeholder-message');
const embeddingsBlueArrow = document.getElementById('embeddingsBlueArrow');
const rankingsSection = document.getElementById('rankingsSection');
const rankingsImagePreview = document.getElementById('rankingsImagePreview');
const rankingsList = document.getElementById('rankingsList');

// State
let isCameraOn = false;
let mediaStream = null;
let capturedImage = null;

// Camera Controls
async function toggleCamera() {
    if (!isCameraOn) {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            camera.srcObject = mediaStream;
            camera.classList.remove('hidden');
            placeholderMessage.classList.add('hidden');
            isCameraOn = true;
            cameraToggle.querySelector('.material-symbols-outlined').textContent = 'videocam_off';
            cameraToggle.classList.add('active');
            captureButton.disabled = false;
        } catch (err) {
            console.error('Error accessing camera:', err);
            alert('Unable to access camera. Please ensure you have granted camera permissions.');
        }
    } else {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            camera.srcObject = null;
        }
        camera.classList.add('hidden');
        placeholderMessage.classList.remove('hidden');
        isCameraOn = false;
        cameraToggle.querySelector('.material-symbols-outlined').textContent = 'videocam';
        cameraToggle.classList.remove('active');
        captureButton.disabled = true;
    }
}

// Capture frame
function captureFrame() {
    if (!isCameraOn) {
        alert('Please turn on the camera first.');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;
    canvas.getContext('2d').drawImage(camera, 0, 0);
    capturedImage = canvas.toDataURL('image/jpeg');
    showPreview(capturedImage);
}

// Handle file upload
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            capturedImage = e.target.result;
            showPreview(capturedImage);
            console.log('Image loaded from file, preview should be visible now');
        };
        reader.readAsDataURL(file);
    }
});

// Show preview
function showPreview(imageData) {
    console.log('showPreview called with image data');
    imagePreview.src = imageData;
    camera.classList.add('hidden');
    placeholderMessage.classList.add('hidden');
    previewArea.classList.remove('hidden');
    console.log('Preview area should now be visible, hidden class removed');
    console.log('previewArea element:', previewArea);
    console.log('previewArea classes:', previewArea.className);
}

// Retake photo
function retakePhoto() {
    capturedImage = null;
    previewArea.classList.add('hidden');
    if (isCameraOn) {
        camera.classList.remove('hidden');
    } else {
        placeholderMessage.classList.remove('hidden');
    }
    fileInput.value = '';
}

// Confirm photo
function confirmPhoto() {
    console.log('Photo confirmed. Ready for processing.');

    if (capturedImage) {
        // Show loading state
        const confirmButton = document.getElementById('confirmButton');
        confirmButton.disabled = true;
        confirmButton.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span>';

        fetch('https://patient-referral-match-934163632848.us-central1.run.app', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: capturedImage })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Backend Response:', data);

            // Get attribute display elements
            const attributesDisplay = document.getElementById('attributesDisplay');
            const attributeName = document.getElementById('attributeName').querySelector('span');
            const attributeDOB = document.getElementById('attributeDOB').querySelector('span');
            const attributeProcedureDate = document.getElementById('attributeProcedureDate').querySelector('span');

            // Update the display with extracted attributes
            attributeName.textContent = data.name || 'N/A';
            attributeDOB.textContent = data.date_of_birth || 'N/A';
            attributeProcedureDate.textContent = data.date_of_first_procedure || 'N/A';

            // Apply animations for the transition
            const buttonContainer = document.querySelector('.button-container');
            const previewArea = document.getElementById('previewArea');
            const resultsLayout = document.querySelector('.results-layout');
            const previewContainer = document.querySelector('.preview-container');
            const attributesContainer = document.querySelector('.attributes-container');
            
            // First fade out the buttons
            buttonContainer.classList.add('fade-out');
            
            // After a short delay, switch to results mode layout and animate
            setTimeout(() => {
                // Add the results-mode class to change the layout and background
                previewArea.classList.add('results-mode');
                resultsLayout.classList.add('results-mode');
                
                // Slide the preview to the left
                previewContainer.classList.add('slide-left');
                
                // After the slide animation starts, fade in the attributes
                setTimeout(() => {
                    attributesContainer.classList.add('fade-in');
                }, 300);
            }, 500);
        })
        .catch(error => {
            console.error('Error sending image to backend:', error);
            alert('Error sending image to backend: ' + error.message);
        })
        .finally(() => {
            // Reset button state
            confirmButton.disabled = false;
            confirmButton.innerHTML = '<span class="material-symbols-outlined">check</span>';
        });
    } else {
        alert('No image captured.');
    }
}

// Make attributes editable
function makeAttributesEditable() {
    console.log('Making attributes editable');
    const nameSpan = document.getElementById('attributeName').querySelector('span');
    const dobSpan = document.getElementById('attributeDOB').querySelector('span');
    const procedureDateSpan = document.getElementById('attributeProcedureDate').querySelector('span');
    
    // Make each attribute editable
    makeSpanEditable(nameSpan);
    makeSpanEditable(dobSpan);
    makeSpanEditable(procedureDateSpan);
}

function makeSpanEditable(span) {
    // Create an input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = span.textContent;
    input.style.width = '100%';
    input.style.padding = '4px';
    input.style.border = '1px solid var(--accent-blue)';
    input.style.borderRadius = '4px';
    
    // Replace the span with the input
    span.parentNode.replaceChild(input, span);
    
    // Store the original span for later use
    input.originalSpan = span;
}

// Submit attributes to backend
function submitAttributes() {
    console.log('Submitting attributes to backend');
    
    // Initialize attributes object
    const attributes = {};
    
    // Check if there are editable inputs
    const inputs = document.querySelectorAll('.attributes-display input');
    
    if (inputs.length > 0) {
        // If there are inputs, collect their values and convert back to spans
        inputs.forEach(input => {
            // Get the attribute name from the parent div's id
            const attributeId = input.parentNode.id;
            let attributeName;
            
            if (attributeId === 'attributeName') {
                attributeName = 'name';
            } else if (attributeId === 'attributeDOB') {
                attributeName = 'date_of_birth';
            } else if (attributeId === 'attributeProcedureDate') {
                attributeName = 'date_of_first_procedure';
            }
            
            // Store the value
            if (attributeName) {
                attributes[attributeName] = input.value;
            }
            
            // Convert back to span
            const span = input.originalSpan;
            span.textContent = input.value;
            input.parentNode.replaceChild(span, input);
        });
    } else {
        // If there are no inputs, get values from the spans
        const nameSpan = document.getElementById('attributeName').querySelector('span');
        const dobSpan = document.getElementById('attributeDOB').querySelector('span');
        const procedureDateSpan = document.getElementById('attributeProcedureDate').querySelector('span');
        
        attributes.name = nameSpan.textContent;
        attributes.date_of_birth = dobSpan.textContent;
        attributes.date_of_first_procedure = procedureDateSpan.textContent;
    }
    
    // Show loading state
    submitAttributesButton.disabled = true;
    submitAttributesButton.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span>';
    
    // Send the attributes to the backend
    fetch('https://patient-referral-match-934163632848.us-central1.run.app/update-attributes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(attributes)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Attributes updated successfully:', data);
        
        // Check if we have referrals data
        if (data.referrals && Array.isArray(data.referrals)) {
            // Populate the match candidates table
            populateMatchCandidates(data.referrals);
            
            // Fade out the attributes container
            const attributesContainer = document.querySelector('.attributes-container');
            attributesContainer.classList.add('fade-out');
            
            // After fade-out completes, show the match candidates container
            setTimeout(() => {
                attributesContainer.style.display = 'none';
                const candidatesSection = document.getElementById('candidatesSection');
                candidatesSection.classList.remove('hidden');
                candidatesSection.classList.add('fade-in');
            }, 500); // Match the CSS transition duration
        } else {
            // If no referrals data, show a simple success message
            alert('Attributes updated successfully!');
        }
    })
    .catch(error => {
        console.error('Error updating attributes:', error);
        alert('Error updating attributes: ' + error.message);
    })
    .finally(() => {
        // Reset button state
        submitAttributesButton.disabled = false;
        submitAttributesButton.innerHTML = '<span class="material-symbols-outlined">check</span>';
    });
}

// Populate match candidates table
function populateMatchCandidates(referrals) {
    const tableBody = document.getElementById('candidatesTableBody');
    tableBody.innerHTML = ''; // Clear existing rows
    
    referrals.forEach(referral => {
        const row = document.createElement('tr');
        
        // Add the visible columns
        row.innerHTML = `
            <td>${referral.patient_name || 'N/A'}</td>
            <td>${referral.provisional_diagnosis || 'N/A'}</td>
            <td>${referral.category_of_care || 'N/A'}</td>
            <td>${referral.service_requested || 'N/A'}</td>
            <td>${referral.referral_date || 'N/A'}</td>
            <td>${referral.referral_expiration_date || 'N/A'}</td>
        `;
        
        // Store all other attributes as data attributes for hover display
        Object.keys(referral).forEach(key => {
            if (!['patient_name', 'provisional_diagnosis', 'category_of_care', 'service_requested', 'referral_date', 'referral_expiration_date'].includes(key)) {
                row.dataset[key] = referral[key] || '';
            }
        });
        
        // Add hover event listeners
        row.addEventListener('mouseenter', showDetailTooltip);
        row.addEventListener('mouseleave', hideDetailTooltip);
        
        tableBody.appendChild(row);
    });
    
    // Show the right arrow after the match candidates are populated
    setTimeout(() => {
        const rightArrow = document.getElementById('rightArrow');
        rightArrow.classList.add('fade-in');
    }, 800); // Delay to show after the match candidates container is fully visible
}

// Show tooltip with additional details on hover
function showDetailTooltip(event) {
    const row = event.currentTarget;
    
    // Create tooltip if it doesn't exist
    let tooltip = document.getElementById('detailTooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'detailTooltip';
        tooltip.className = 'detail-tooltip';
        document.body.appendChild(tooltip);
    }
    
    // Populate tooltip with all data attributes
    let tooltipContent = '<div class="tooltip-content">';
    
    // Get all data attributes and display them
    Object.keys(row.dataset).forEach(key => {
        // Format the key for display (replace underscores with spaces, capitalize)
        const formattedKey = key.replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        
        tooltipContent += `<div><strong>${formattedKey}:</strong> ${row.dataset[key]}</div>`;
    });
    
    tooltipContent += '</div>';
    tooltip.innerHTML = tooltipContent;
    
    // Position the tooltip below the row
    const rowRect = row.getBoundingClientRect();
    tooltip.style.top = `${rowRect.bottom + window.scrollY + 5}px`; // 5px gap
    tooltip.style.left = `${rowRect.left + window.scrollX}px`;
    
    // Show the tooltip - ensure it's visible by removing any existing class first
    tooltip.classList.remove('visible');
    // Force a reflow to ensure the class change takes effect
    void tooltip.offsetWidth;
    // Add the visible class
    tooltip.classList.add('visible');
}

// Hide tooltip when mouse leaves the row
function hideDetailTooltip() {
    const tooltip = document.getElementById('detailTooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
        // Optionally, move the tooltip off-screen to ensure it's not blocking anything
        tooltip.style.top = '-9999px';
        tooltip.style.left = '-9999px';
    }
}

// Event Listeners
cameraToggle.addEventListener('click', toggleCamera);
captureButton.addEventListener('click', captureFrame);
retakeButton.addEventListener('click', retakePhoto);
confirmButton.addEventListener('click', confirmPhoto);
editAttributesButton.addEventListener('click', makeAttributesEditable);
submitAttributesButton.addEventListener('click', submitAttributes);
const rightArrow = document.getElementById('rightArrow');
rightArrow.addEventListener('click', handleRightArrowClick);
embeddingsBlueArrow.addEventListener('click', handleBlueArrowClick);

// Handle right arrow click to change text and apply date filtering
function handleRightArrowClick() {
    // Get the right arrow element
    const rightArrow = document.getElementById('rightArrow');
    
    // Check if we're already in the filtered state
    if (rightArrow.dataset.state === 'filtered') {
        // We're in the filtered state, so proceed to embeddings explanation
        
        // Get the preview area and add the fade-to-white class
        const previewArea = document.getElementById('previewArea');
        previewArea.classList.add('fade-to-white');
        
        // Hide the candidates section and preview container
        const candidatesSection = document.getElementById('candidatesSection');
        candidatesSection.classList.add('hidden');
        
        // Hide the preview container and attributes container
        const previewContainer = document.querySelector('.preview-container');
        previewContainer.style.display = 'none';
        
        const attributesContainer = document.querySelector('.attributes-container');
        attributesContainer.style.display = 'none';
        
        // Show the embeddings explanation
        const embeddingsExplanation = document.getElementById('embeddingsExplanation');
        embeddingsExplanation.classList.remove('hidden');
        embeddingsExplanation.classList.add('visible');
        
        // Animate the elements sequentially
        const embeddingsTitle = document.querySelector('.embeddings-title');
        const embeddingsImageContainer = document.querySelector('.embeddings-image-container');
        const embeddingsText = document.querySelector('.embeddings-text');
        
        // Animate title
        embeddingsTitle.classList.add('animate');
        
        // Animate image after a delay (animation-delay is set in CSS)
        embeddingsImageContainer.classList.add('animate');
        
        // Animate text after a delay (animation-delay is set in CSS)
        embeddingsText.classList.add('animate');
        
    } else {
        // First time clicking - change to filtered state
        rightArrow.classList.add('clicked');
        
        // Change the header text and apply date filtering
        const header = document.querySelector('.match-candidates-container h3');
        header.classList.add('fade-out');
        
        setTimeout(() => {
            header.textContent = "Thanks to DocAI, we filter procedure date vs. referral expiration";
            header.classList.remove('fade-out');
            header.classList.add('fade-in');
            
            // Apply color coding to table rows
            applyDateFilterHighlighting();
            
            // Update the arrow text to indicate next action
            rightArrow.querySelector('.material-symbols-outlined').textContent = 'arrow_forward';
            
            // Mark the arrow as being in the filtered state
            rightArrow.dataset.state = 'filtered';
            
            // Update the arrow's appearance to make it clear it's clickable
            rightArrow.classList.remove('clicked');
            setTimeout(() => {
                rightArrow.classList.add('fade-in');
            }, 300);
            
        }, 500); // Match the CSS transition duration for the header fade
    }
}

// Apply highlighting to table rows based on date comparison
function applyDateFilterHighlighting() {
    // Get all table rows
    const tableRows = document.querySelectorAll('#candidatesTableBody tr');
    
    // Get the procedure date from the attributes display
    const procedureDateText = document.getElementById('attributeProcedureDate').querySelector('span').textContent;
    const procedureDate = new Date(procedureDateText);
    
    // Process each row
    tableRows.forEach(row => {
        // Get referral date and expiration date from the row
        const referralDateText = row.cells[4].textContent;
        const expirationDateText = row.cells[5].textContent;
        
        // Parse dates (handle 'N/A' values)
        const referralDate = referralDateText !== 'N/A' ? new Date(referralDateText) : null;
        const expirationDate = expirationDateText !== 'N/A' ? new Date(expirationDateText) : null;
        
        // Check if procedure date is within range
        let isWithinRange = false;
        
        if (referralDate && expirationDate && !isNaN(procedureDate.getTime())) {
            isWithinRange = procedureDate >= referralDate && procedureDate <= expirationDate;
        }
        
        // Apply appropriate styling
        if (isWithinRange) {
            row.style.backgroundColor = 'rgba(52, 168, 83, 0.2)'; // Light green
            row.style.color = '#1e7e34'; // Darker green for text
        } else {
            row.style.backgroundColor = 'rgba(234, 67, 53, 0.2)'; // Light red
            row.style.color = '#d32f2f'; // Darker red for text
        }
    });
}

// Handle blue arrow click to get semantic search rankings
function handleBlueArrowClick() {
    // Add loading state to the arrow
    embeddingsBlueArrow.classList.add('loading');
    embeddingsBlueArrow.querySelector('.material-symbols-outlined').textContent = 'hourglass_empty';
    
    // Get the procedure date from the attributes display
    const procedureDateText = document.getElementById('attributeProcedureDate').querySelector('span').textContent;
    
    // Call the backend to get semantic search rankings
    fetch('https://patient-referral-match-934163632848.us-central1.run.app/semantic-search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date_of_first_procedure: procedureDateText })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        console.log('Semantic search results:', data);
        
        // Copy the current image to the rankings image preview
        rankingsImagePreview.src = imagePreview.src;
        
        // Populate the rankings list
        populateRankings(data.rankings || []);
        
        // Fade out the embeddings explanation
        const embeddingsExplanation = document.getElementById('embeddingsExplanation');
        embeddingsExplanation.classList.add('fade-out');
        
        // After fade-out completes, show the rankings section
        setTimeout(() => {
            embeddingsExplanation.classList.add('hidden');
            rankingsSection.classList.remove('hidden');
            
            // After a short delay, fade in the rankings section
            setTimeout(() => {
                rankingsSection.classList.add('visible');
                
                // Add fade-in class to the rankings container for smooth appearance
                const rankingsContainer = document.getElementById('rankingsContainer');
                if (rankingsContainer) {
                    rankingsContainer.classList.add('fade-in');
                }
            }, 100);
        }, 500);
    })
    .catch(error => {
        console.error('Error getting semantic search rankings:', error);
        alert('Error getting semantic search rankings: ' + error.message);
    })
    .finally(() => {
        // Reset the arrow state
        embeddingsBlueArrow.classList.remove('loading');
        embeddingsBlueArrow.querySelector('.material-symbols-outlined').textContent = 'arrow_forward';
    });
}

// Populate rankings list
function populateRankings(rankings) {
    rankingsList.innerHTML = ''; // Clear existing items
    
    // If no rankings, show a message
    if (!rankings.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = 'No matching referrals found';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        rankingsList.appendChild(row);
        return;
    }
    
    // Add each ranking item as a table row
    rankings.forEach((ranking, index) => {
        const row = document.createElement('tr');
        
        // Create cells for each column
        const nameCell = document.createElement('td');
        nameCell.textContent = ranking.patient_name || 'Unknown Patient';
        
        const facilityCell = document.createElement('td');
        facilityCell.textContent = ranking.referring_facility || 'N/A';
        
        const serviceCell = document.createElement('td');
        serviceCell.textContent = ranking.service_requested || 'N/A';
        
        const distanceCell = document.createElement('td');
        distanceCell.textContent = ranking.distance ? ranking.distance.toFixed(4) : 'N/A';
        
        // Append cells to row
        row.appendChild(nameCell);
        row.appendChild(facilityCell);
        row.appendChild(serviceCell);
        row.appendChild(distanceCell);
        
        // Store all attributes as data attributes for hover display
        Object.keys(ranking).forEach(key => {
            row.dataset[key] = ranking[key] || '';
        });
        
        // Add hover event listeners for tooltip
        row.addEventListener('mouseenter', showDetailTooltip);
        row.addEventListener('mouseleave', hideDetailTooltip);
        
        rankingsList.appendChild(row);
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    captureButton.disabled = true; // Disable capture button until camera is on
    
    // Ensure preview area is hidden on page load
    if (previewArea) {
        previewArea.classList.add('hidden');
        console.log('Preview area hidden on page load');
    }
});
