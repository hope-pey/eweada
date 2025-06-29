let excelData = null;
let images = new Map();
let defaultMaleImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAgDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
let defaultFemaleImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAgDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
const LOGO_BASE64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAgDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
let uploadedLogoBase64 = null;
let uploadedSchoolLogoBase64 = null;
let deletedCards = new Set(); // Track deleted cards by index
let manuallyAddedCards = []; // Track manually added cards

////////////
const MM_TO_INCH = 1 / 25.4;
const SCREEN_DPI = 96;  // Typical screen DPI for browsers
const DESIGN_WIDTH_MM = 90;  // The real physical card width you want when printed, in mm
////////////

// Dark Mode Toggle Functionality
function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) {
        console.warn('Dark mode toggle button with id="themeToggle" not found.');
        return;
    }
    const html = document.documentElement;
    const sunIcon = themeToggle.querySelector('.sun-icon');
    const moonIcon = themeToggle.querySelector('.moon-icon');
    const themeText = themeToggle.querySelector('.theme-text');
    
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeUI(newTheme);
        
        // Add a subtle animation effect
        document.body.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    });
    
    function updateThemeUI(theme) {
        if (theme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
            themeText.textContent = 'Light';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
            themeText.textContent = 'Dark';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize dark mode toggle
    initThemeToggle();
    
    document.getElementById('excelFile').addEventListener('change', handleExcelUpload);
    document.getElementById('imageFiles').addEventListener('change', handleImageUpload);
    document.getElementById('generateBtn').addEventListener('click', generatePDF);
    document.getElementById('logoFile').addEventListener('change', handleLogoUpload);
    document.getElementById('schoolLogoFile').addEventListener('change', handleSchoolLogoUpload);
    document.getElementById('fieldsForm').addEventListener('change', updateSelectedFields);
    document.getElementById('cardWidth').addEventListener('input', renderPreview);
    document.getElementById('cardHeight').addEventListener('input', renderPreview);
    document.getElementById('addCardBtn').addEventListener('click', addCardManually);
    document.getElementById('restoreBtn').addEventListener('click', restoreAllCards);
    document.getElementById('exportExcelBtn').addEventListener('click', exportManualDataToExcel);
    document.getElementById('exportImagesBtn').addEventListener('click', exportImagesAsZip);

    const fieldsForm = document.getElementById('fieldsForm');
    fieldsForm.addEventListener('dragstart', handleDragStart);
    fieldsForm.addEventListener('dragover', handleDragOver);
    fieldsForm.addEventListener('drop', handleDrop);
    fieldsForm.addEventListener('dragend', handleDragEnd);

    document.getElementById('logoAlign').addEventListener('input', renderPreview);
    document.getElementById('logoSize').addEventListener('input', renderPreview);
    document.getElementById('headerField').addEventListener('change', renderPreview);
    document.getElementById('mainTitleField').addEventListener('change', renderPreview);
    const numberSizeInput = document.getElementById('numberSize');
    if (numberSizeInput) numberSizeInput.addEventListener('input', renderPreview);
    
    // Removed adherent font size slider - now using fixed size of 35
});

let draggedItem = null;

function handleDragStart(e) {
    if (e.target.classList.contains('draggable-field')) {
        draggedItem = e.target;
        setTimeout(() => {
            if(draggedItem) draggedItem.classList.add('dragging');
        }, 0);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    const form = document.getElementById('fieldsForm');
    if (!form || !draggedItem) return;

    const afterElement = getDragAfterElement(form, e.clientY);
    if (afterElement == null) {
        form.appendChild(draggedItem);
    } else {
        form.insertBefore(draggedItem, afterElement);
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable-field:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function handleDrop(e) {
    e.preventDefault();
    if (draggedItem) {
        draggedItem.classList.remove('dragging');
        updateSelectedFields();
        draggedItem = null;
    }
}

function handleDragEnd() {
    if (draggedItem) {
        draggedItem.classList.remove('dragging');
        draggedItem = null;
    }
}

function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('excelInfo').textContent = file.name;
        deletedCards.clear();
        manuallyAddedCards = [];
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                let headerRowIndex = rows.findIndex(row => row.includes('NOM & PRENOM'));
                if (headerRowIndex === -1) {
                    alert('Could not find header row (NOM & PRENOM) in the Excel file.');
                    return;
                }
                const headers = rows[headerRowIndex];
                console.log('Excel headers detected:', headers);
                excelData = rows.slice(headerRowIndex + 1).map(row => {
                    const obj = {};
                    headers.forEach((header, i) => {
                        obj[header] = row[i] || '';
                    });
                    return obj;
                }).filter(row => (row['NOM & PRENOM'] && row['NOM & PRENOM'].trim() !== ''));
                // Populate field selection UI
                const fieldSection = document.getElementById('fieldSelection');
                const fieldsForm = document.getElementById('fieldsForm');
                const imageNameField = document.getElementById('imageNameField');
                const headerFieldSelect = document.getElementById('headerField');
                const mainTitleFieldSelect = document.getElementById('mainTitleField');

                fieldsForm.innerHTML = '';
                imageNameField.innerHTML = '';
                headerFieldSelect.innerHTML = '<option value="">None</option>';
                mainTitleFieldSelect.innerHTML = '<option value="">None</option>';

                headers.forEach(header => {
                    if (header === 'N') return; // Skip 'N' field in UI
                    const label = document.createElement('label');
                    label.className = 'draggable-field';
                    label.draggable = true;
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.name = 'field';
                    checkbox.value = header;
                    checkbox.checked = true;
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(' ' + header));
                    fieldsForm.appendChild(label);
                    const option = document.createElement('option');
                    option.value = header;
                    option.textContent = header;
                    imageNameField.appendChild(option.cloneNode(true));
                    headerFieldSelect.appendChild(option.cloneNode(true));
                    mainTitleFieldSelect.appendChild(option.cloneNode(true));
                });

                // Set default selections for layout fields
                if(headers.includes('ADHERENT')) headerFieldSelect.value = 'ADHERENT';
                if(headers.includes('NOM & PRENOM')) mainTitleFieldSelect.value = 'NOM & PRENOM';

                fieldSection.style.display = headers.length ? 'block' : 'none';
                updateSelectedFields();
                updateGenerateButton();
            } catch (error) {
                console.error('Error reading Excel file:', error);
                alert('Error reading Excel file. Please make sure it is a valid Excel file.');
            }
        };
        reader.onerror = function() {
            alert('Error reading the file. Please try again.');
        };
        reader.readAsArrayBuffer(file);
    }
    
    updateCardCount();
}

function handleImageUpload(event) {
    const files = event.target.files;
    images.clear();
    if (files.length > 0) {
        document.getElementById('imageInfo').textContent = `Loaded ${files.length} images`;
        Array.from(files).forEach((file) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const id = file.name.replace(/\.[^/.]+$/, "").toLowerCase();
                if (id === 'f') {
                    defaultFemaleImage = e.target.result;
                } else if (id === 'm') {
                    defaultMaleImage = e.target.result;
                } else {
                    images.set(id, e.target.result);
                }
                updateGenerateButton();
                if (typeof renderUploadedImagesList === 'function') renderUploadedImagesList();
            };
            reader.onerror = function() {
                console.error('Error loading image:', file.name);
            };
            reader.readAsDataURL(file);
        });
    } else {
        document.getElementById('imageInfo').textContent = '';
        updateGenerateButton();
        if (typeof renderUploadedImagesList === 'function') renderUploadedImagesList();
    }
}

function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedLogoBase64 = e.target.result;
            document.getElementById('logoInfo').textContent = `✅ ${file.name} uploaded`;
            renderPreview();
        };
        reader.readAsDataURL(file);
    }
}

function handleSchoolLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedSchoolLogoBase64 = e.target.result;
            document.getElementById('schoolLogoInfo').textContent = `✅ ${file.name} uploaded`;
            renderPreview();
        };
        reader.readAsDataURL(file);
    }
}

function updateGenerateButton() {
    const generateBtn = document.getElementById('generateBtn');
    const hasExcelData = excelData && excelData.length > 0;
    const hasImages = images.size > 0;
    
    console.log('Update button state:', { hasExcelData, hasImages });
    generateBtn.disabled = !(hasExcelData && hasImages);
    
    if (!generateBtn.disabled) {
        generateBtn.style.backgroundColor = '#4CAF50';
    } else {
        generateBtn.style.backgroundColor = '#cccccc';
    }
}

function withLeadingZero(num) {
    if (!num) return '';
    num = String(num).trim();
    return num.startsWith('0') ? num : '0' + num;
}

let selectedFields = [];
function updateSelectedFields() {
    const checked = Array.from(document.querySelectorAll('#fieldsForm input[type="checkbox"]:checked'));
    selectedFields = checked.map(cb => cb.value);
    renderPreview();
}

function createIDCard(student, index, showDeleteButton = true, overridePhotoSrc = null, forcedCardWidthMM = null, forcedCardWidthPx = null, forcedCardHeightPx = null) {
    const MM_TO_INCH = 1 / 25.4;
    const SCREEN_DPI = 96;
    const DESIGN_WIDTH_PX = 325;
    const DESIGN_HEIGHT_PX = 510;

    const cardWidth = forcedCardWidthPx || parseFloat(document.getElementById('cardWidth').value);
    const cardHeight = forcedCardHeightPx || parseFloat(document.getElementById('cardHeight').value);

    const baseUnitW = cardWidth / DESIGN_WIDTH_PX;
    const baseUnitH = cardHeight / DESIGN_HEIGHT_PX;
    const baseUnit = Math.min(baseUnitW, baseUnitH);

    const logoAlign = document.getElementById('logoAlign').value;
    const logoSize = document.getElementById('logoSize').value;
    const headerField = document.getElementById('headerField').value;
    const mainTitleField = document.getElementById('mainTitleField').value;

    //test of scaling
    const photoScaleFactor = Math.min(baseUnitW, baseUnitH);
    ////

    // Number smaller: 25% of card height
    const verticalNumberFontSize = Math.floor(cardHeight * 0.20);
    const numberSpace = student['N'] ? verticalNumberFontSize + baseUnit * 10 : 0;

    const card = document.createElement('div');
    card.className = 'id-card';
    card.style.cssText = `
        font-family: Arial, sans-serif;
        width: ${cardWidth}px;
        height: ${cardHeight}px;
        border: ${baseUnit * 1}px solid #000;
        border-radius: ${baseUnit * 10}px;
        padding: ${baseUnit * 8}px;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        box-sizing: border-box;
        background: #fff;
        margin: 0;
    `;

    if (student['N']) {
        const verticalNum = document.createElement('div');
        verticalNum.textContent = String(student['N']).padStart(2, '0');
        verticalNum.style.cssText = `
            position: absolute;
            left: 0;
            top: 50%;
            transform: translateY(-30%) rotate(-90deg);
            font-size: ${verticalNumberFontSize}px;
            font-weight: 900;
            color: #111;
            letter-spacing: 2px;
            z-index: 10;
            width: ${verticalNumberFontSize * 1.2}px;
            text-align: center;
            pointer-events: none;
            user-select: none;
            line-height: 1;
            background: transparent;
        `;
        card.appendChild(verticalNum);
    }

    if (showDeleteButton) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'card-delete-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Delete this card';
        deleteBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 5px;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 1px solid #ccc;
            font-size: 16px;
            cursor: pointer;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            background: white;
        `;
        card.appendChild(deleteBtn);
    }

    // Main content area - starts with header
    const mainContent = document.createElement('div');
    mainContent.style.cssText = `
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        padding-left: ${numberSpace}px;
        padding: ${baseUnit * 8}px;
        padding-left: ${numberSpace + baseUnit * 8}px;
    `;

    // Header section with logos and adherent number
    const headerSection = document.createElement('div');
    headerSection.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: ${baseUnit * 8}px;
        padding-bottom: ${baseUnit * 8}px;
        border-bottom: ${baseUnit * 1}px solid #000;
    `;

    // Left logo (ticket logo)
    const leftLogo = document.createElement('div');
    leftLogo.style.cssText = `
        flex: 1;
        display: flex;
        justify-content: flex-start;
        align-items: center;
    `;
    
    const leftLogoImg = document.createElement('img');
    leftLogoImg.src = uploadedLogoBase64 || LOGO_BASE64;
    leftLogoImg.style.cssText = `
        height: ${baseUnit * 60 * photoScaleFactor}px;
        width: auto;
        max-width: 100%;
    `;
    leftLogoImg.onerror = () => {
        console.log('Left logo failed to load, using fallback');
        leftLogoImg.src = LOGO_BASE64;
    };
    leftLogo.appendChild(leftLogoImg);

    // Center logo (school logo)
    const centerLogo = document.createElement('div');
    centerLogo.style.cssText = `
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    const centerLogoImg = document.createElement('img');
    centerLogoImg.src = uploadedSchoolLogoBase64 || uploadedLogoBase64 || LOGO_BASE64;
    centerLogoImg.style.cssText = `
        height: ${baseUnit * 60 * photoScaleFactor}px;
        width: auto;
        max-width: 100%;
    `;
    centerLogoImg.onerror = () => {
        console.log('Center logo failed to load, using fallback');
        centerLogoImg.src = LOGO_BASE64;
    };
    centerLogo.appendChild(centerLogoImg);

    // Right adherent number
    const adherentNumber = document.createElement('div');
    adherentNumber.style.cssText = `
        flex: 1;
        display: flex;
        justify-content: flex-end;
        align-items: center;
    `;
    
    const adherentText = document.createElement('div');
    adherentText.textContent = String(student['ADHERENT'] || '').padStart(2, '0');
    adherentText.style.cssText = `
        font-size: ${baseUnit * 50 * photoScaleFactor}px;
        font-weight: 900;
        color: #111;
        letter-spacing: 2px;
        text-align: center;
    `;
    adherentNumber.appendChild(adherentText);

    headerSection.appendChild(leftLogo);
    headerSection.appendChild(centerLogo);
    headerSection.appendChild(adherentNumber);
    mainContent.appendChild(headerSection);

    // Name section
    if (mainTitleField && student[mainTitleField]) {
        const nameSection = document.createElement('div');
        nameSection.style.cssText = `
            text-align: center;
            margin-bottom: ${baseUnit * 8}px;
        `;
        
        let nameField = student[mainTitleField] || '';
        let numberPrefix = '';
        if (student['N']) {
            numberPrefix = String(student['N']).padStart(2, '0') + '. ';
        }
        
        const nameDiv = document.createElement('div');
        nameDiv.textContent = numberPrefix + nameField;
        nameDiv.style.cssText = `
            font-size: ${baseUnit * 20 * photoScaleFactor}px;
            font-weight: bold;
            text-align: center;
            color: #000;
        `;
        nameSection.appendChild(nameDiv);
        mainContent.appendChild(nameSection);
    }

    // All Excel fields section
    const fieldsSection = document.createElement('div');
    fieldsSection.style.cssText = `
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        gap: ${baseUnit * 6}px;
        margin-bottom: ${baseUnit * 8}px;
        align-items: flex-start;
    `;

    selectedFields.forEach(field => {
        if (!field || field === mainTitleField) return;

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'baseline';
        row.style.gap = '8px';
        row.style.marginBottom = '4px';

        const labelDiv = document.createElement('div');
        labelDiv.style.fontWeight = 'bold';
        labelDiv.style.color = '#222';
        labelDiv.style.fontSize = (23 * photoScaleFactor) + 'px';
        labelDiv.style.whiteSpace = 'nowrap';
        labelDiv.textContent = `${field.toUpperCase()}:`;

        const valueDiv = document.createElement('div');
        valueDiv.style.color = '#000';
        valueDiv.style.fontSize = (23 * photoScaleFactor) + 'px';
        valueDiv.style.whiteSpace = 'pre-wrap';
        valueDiv.textContent = student[field] || '';

        row.appendChild(labelDiv);
        row.appendChild(valueDiv);
        fieldsSection.appendChild(row);
    });

    mainContent.appendChild(fieldsSection);

    // Bottom section with photo only
    const bottomSection = document.createElement('div');
    bottomSection.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: auto;
        padding-top: ${baseUnit * 8}px;
    `;

    // Center photo
    const photoWrapper = document.createElement('div');
    photoWrapper.style.cssText = `
        width: ${baseUnit * 100 * photoScaleFactor}px;
        height: ${baseUnit * 100 * photoScaleFactor}px;
        border-radius: 50%;
        overflow: hidden;
        border: ${baseUnit * 2}px solid #000;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
    `;

    const id = String(student['ADHERENT'] || '').trim().toLowerCase();
    const type = String(student['type'] || student['TYPE'] || '').trim().toLowerCase();
    let photoSrc = overridePhotoSrc || images.get(id) || ((type === 'f') ? defaultFemaleImage : defaultMaleImage);

    if (photoSrc) {
        const photo = document.createElement('img');
        photo.src = photoSrc;
        photo.style.cssText = `width: 100%; height: 100%; object-fit: cover;`;
        photoWrapper.appendChild(photo);
    }

    bottomSection.appendChild(photoWrapper);
    mainContent.appendChild(bottomSection);
    card.appendChild(mainContent);

    return card;
}

async function generatePDF() {
    if (!excelData || excelData.length === 0) {
        alert('No Excel data loaded. Please upload an Excel file.');
        return;
    }
    if (images.size === 0) {
        alert('No images loaded. Please upload student photos first.');
        return;
    }

    let fileName = prompt("Enter a name for the PDF file:", "id-cards");
    if (fileName === null || fileName.trim() === "") {
        console.log("PDF generation cancelled by user.");
        return;
    }
    // Sanitize filename
    fileName = fileName.replace(/[^a-z0-9_-\s]/gi, '').trim();
    if (fileName === "") {
        fileName = "id-cards";
    }
    fileName += ".pdf";

    console.log('Starting PDF generation...');
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'pdf-modal-overlay';
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '9999';

    const modalContent = document.createElement('div');
    modalContent.id = 'pdf-modal';
    modalContent.style.backgroundColor = 'white';
    modalContent.style.padding = '2rem';
    modalContent.style.borderRadius = '8px';
    modalContent.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    modalContent.style.textAlign = 'center';
    modalContent.style.maxWidth = '90%';
    modalContent.style.width = 'auto';

    const loadingText = document.createElement('div');
    loadingText.textContent = 'Generating PDF, please wait...';
    loadingText.style.fontSize = '1.2rem';
    loadingText.style.color = '#1a73e8';
    loadingText.style.marginBottom = '1rem';

    const spinner = document.createElement('div');
    spinner.style.border = '4px solid #f3f3f3';
    spinner.style.borderTop = '4px solid #1a73e8';
    spinner.style.borderRadius = '50%';
    spinner.style.width = '40px';
    spinner.style.height = '40px';
    spinner.style.animation = 'spin 1s linear infinite';
    spinner.style.margin = '0 auto';

    const style = document.createElement('style');
    style.textContent = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);

    modalContent.appendChild(loadingText);
    modalContent.appendChild(spinner);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    const filteredData = excelData.filter((student, index) => !deletedCards.has(index) && (student['NOM & PRENOM'] || student['TEL ADH'] || student['TEL PARENT'] || student['LYCEE'] || student['ADHERENT']));
    
    const allCardsData = [...filteredData, ...manuallyAddedCards];
    document.getElementById('cardCount').textContent = `Total cards generated: ${allCardsData.length}`;

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

        const cardsPerPage = 8;
        const pageW = 210;
        const pageH = 297;
        const cols = 2;
        const rows = 4;
        
        // Use minimal gaps to maximize card size
        // const margin = 5; // in mm 
        const marginX = 5; // left/right margin in mm
        const marginY = 10; // top/bottom margin in mm

        const hGap = 4; // mm
        const vGap = 4; // mm

        const usableW = pageW - 2 * marginX;//added
        const usableH = pageH - 2 * marginY;//added

        // Calculate card size to fill the page with the given gaps
        const cardWidthMM = (usableW - ((cols - 1) * hGap)) / cols;
        const cardHeightMM = (usableH - ((rows - 1) * vGap)) / rows;
        // const cardWidthMM = (pageW - ((cols - 1) * hGap)) / cols;
        // const cardHeightMM = (pageH - ((rows - 1) * vGap)) / rows;
        // Calculate pixel size matching your intended physical size at good print DPI
        const DPI = 300;
        const MM_TO_INCH = 1 / 25.4;
        const cardWidthPx = Math.round(cardWidthMM * MM_TO_INCH * DPI);
        const cardHeightPx = Math.round(cardHeightMM * MM_TO_INCH * DPI);
        const mainTitleField = document.getElementById('mainTitleField').value;

        for (let i = 0; i < allCardsData.length; i++) {
            const student = allCardsData[i];
            if (i > 0 && i % cardsPerPage === 0) {
                doc.addPage();
            }

            const pdfContainer = document.createElement('div');
            pdfContainer.style.position = 'absolute';
            pdfContainer.style.left = '-9999px';
            document.body.appendChild(pdfContainer);
            
            console.log(`Creating card ${i + 1}/${allCardsData.length} for student:`, student);
            
            // Create a simple test card first to see if the basic structure works
            const testCard = document.createElement('div');
            testCard.style.cssText = `
                width: ${cardWidthPx}px;
                height: ${cardHeightPx}px;
                background: white;
                border: 2px solid black;
                padding: 20px;
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            `;
            
            // Add header
            const header = document.createElement('div');
            header.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid black;
                padding-bottom: 10px;
                margin-bottom: 10px;
            `;
            
            const leftLogo = document.createElement('div');
            leftLogo.textContent = 'LOGO';
            leftLogo.style.cssText = `
                font-weight: bold;
                font-size: 16px;
            `;
            
            const centerLogo = document.createElement('div');
            centerLogo.textContent = 'SCHOOL';
            centerLogo.style.cssText = `
                font-weight: bold;
                font-size: 16px;
            `;
            
            const adherent = document.createElement('div');
            adherent.textContent = String(student['ADHERENT'] || '00');
            adherent.style.cssText = `
                font-weight: bold;
                font-size: 24px;
            `;
            
            header.appendChild(leftLogo);
            header.appendChild(centerLogo);
            header.appendChild(adherent);
            testCard.appendChild(header);
            
            // Add name
            const name = document.createElement('div');
            name.textContent = student[mainTitleField] || 'Student Name';
            name.style.cssText = `
                text-align: center;
                font-size: 18px;
                font-weight: bold;
                margin: 10px 0;
            `;
            testCard.appendChild(name);
            
            // Add photo placeholder
            const photo = document.createElement('div');
            photo.textContent = '📷';
            photo.style.cssText = `
                text-align: center;
                font-size: 48px;
                margin: 20px 0;
            `;
            testCard.appendChild(photo);
            
            pdfContainer.appendChild(testCard);
            
            const indexOnPage = i % cardsPerPage;
            const col = indexOnPage % 2;
            const row = Math.floor(indexOnPage / 2);
            
            const x = marginX + col * (cardWidthMM + hGap);
            const y = marginY + row * (cardHeightMM + vGap);

            await new Promise(resolve => setTimeout(resolve, 200));

            console.log(`Rendering test card ${i + 1} to canvas...`);
            
            try {
                const canvas = await html2canvas(testCard, { 
                    scale: 2, 
                    useCORS: true, 
                    backgroundColor: '#ffffff'
                });
                
                console.log(`Canvas created for test card ${i + 1}, size:`, canvas.width, 'x', canvas.height);
                
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                doc.addImage(imgData, 'JPEG', x, y, cardWidthMM, cardHeightMM);
                
                console.log(`Test card ${i + 1} added to PDF at position:`, x, y);
                
            } catch (canvasError) {
                console.error(`Error creating canvas for test card ${i + 1}:`, canvasError);
            }
            
            document.body.removeChild(pdfContainer);
            loadingText.textContent = `Generating PDF... ${i + 1}/${allCardsData.length} cards processed`;
        }

        doc.save(fileName);
        modalOverlay.remove();
        document.head.removeChild(style);
        console.log('PDF saved successfully');

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('An error occurred while generating the PDF. Please check console for details.');
        if (document.getElementById('pdf-modal-overlay')) {
            document.body.removeChild(document.getElementById('pdf-modal-overlay'));
        }
        if (style.parentElement) {
             document.head.removeChild(style);
        }
    } finally {
        showExportModal();
    }
}

function renderPreview() {
    const preview = document.getElementById('preview');
    const manualCardsSection = document.getElementById('manualCardsSection');
    
    preview.innerHTML = '';
    
    // Ensure every card has a consistent two-digit N value
    const allCards = [
        ...((excelData || []).map((student, index) => {
            // Use the N from data if present, otherwise use (index+1)
            let nValue = student['N'] ? String(student['N']).padStart(2, '0') : String(index + 1).padStart(2, '0');
            return { ...student, N: nValue, originalIndex: index, isManual: false };
        }).filter(card => !deletedCards.has(card.originalIndex))),
        ...(manuallyAddedCards.map((student, index) => {
            // Use the N from data if present, otherwise use (excelData.length + index + 1)
            let nValue = student['N'] ? String(student['N']).padStart(2, '0') : String((excelData ? excelData.length : 0) + index + 1).padStart(2, '0');
            return { ...student, N: nValue, originalIndex: index, isManual: true };
        }))
    ];

    if (allCards.length === 0) {
        preview.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📋</div>
                <h3>No cards to display</h3>
                <p>Upload an Excel file or add cards manually to see them here.</p>
                <div style="margin-top: 2rem; padding: 1rem; background: #f8fafc; border-radius: 8px; max-width: 500px; margin-left: auto; margin-right: auto;">
                    <h4 style="color: #1e293b; margin-bottom: 1rem;">How to get started:</h4>
                    <ul style="text-align: left; color: #64748b;">
                        <li>📊 Upload an Excel file with student data</li>
                        <li>📸 Upload student photos (optional)</li>
                        <li>🏷️ Select which fields to display on cards</li>
                        <li>➕ Add cards manually if needed</li>
                        <li>👀 Preview your cards here</li>
                    </ul>
                </div>
            </div>
        `;
        return;
    }
    
    // Helper function to display cards, defined once at the top of renderPreview
    function displayCards(cards, page = 1) {
        const cardsPerPage = 8;
        const startIndex = (page - 1) * cardsPerPage;
        const endIndex = startIndex + cardsPerPage;
        const pageCards = cards.slice(startIndex, endIndex);
        
        const cardsGrid = document.getElementById('cardsGrid');
        if (!cardsGrid) return; // Exit if the grid isn't on the page yet
        cardsGrid.innerHTML = '';
        
        pageCards.forEach((cardData, index) => {
            const student = cardData;
            const { isManual, originalIndex } = cardData;

            const globalIndex = startIndex + index;
            
            const card = createIDCard(student, globalIndex, true);
            
            const cardTypeIndicator = document.createElement('div');
            cardTypeIndicator.style.cssText = `
                position: absolute;
                top: 10px;
                left: 10px;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 600;
                z-index: 5;
                ${isManual ? 'background: #34d399; color: white;' : 'background: #3b82f6; color: white;'}
            `;
            cardTypeIndicator.textContent = isManual ? 'MANUAL' : 'EXCEL';
            card.appendChild(cardTypeIndicator);
            
            card.style.cursor = 'pointer';
            card.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
            
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'scale(1.02)';
                card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'scale(1)';
                card.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            });
            
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('card-delete-btn') || e.target.parentElement.classList.contains('card-delete-btn')) return;
                
                card.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    card.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        card.style.transform = 'scale(1)';
                    }, 100);
                }, 100);
                
                showCardDetails(student, globalIndex + 1, isManual);
            });
            
            const deleteFn = (e) => {
                e.stopPropagation();
                if (isManual) {
                    deleteManualCard(originalIndex);
                } else {
                    deleteCard(originalIndex);
                }
            };

            const deleteBtn = card.querySelector('.card-delete-btn');
            if (deleteBtn) {
                deleteBtn.onclick = deleteFn;
            }
            card.addEventListener('dblclick', deleteFn);
            
            cardsGrid.appendChild(card);
        });
        
        const pageInfoElement = document.getElementById('pageInfo');
        if (pageInfoElement) {
            pageInfoElement.textContent = `Page ${page} of ${Math.ceil(cards.length / cardsPerPage)}`;
        }
        
        const prevPageElement = document.getElementById('prevPage');
        const nextPageElement = document.getElementById('nextPage');
        
        if (prevPageElement) {
            prevPageElement.disabled = page <= 1;
            prevPageElement.style.opacity = page <= 1 ? '0.5' : '1';
        }
        if (nextPageElement) {
            nextPageElement.disabled = page >= Math.ceil(cards.length / cardsPerPage);
            nextPageElement.style.opacity = page >= Math.ceil(cards.length / cardsPerPage) ? '0.5' : '1';
        }
    }

    // Create enhanced preview container
    const previewContainer = document.createElement('div');
    previewContainer.style.cssText = `
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        margin: 1rem 0;
    `;
    
    // Create header with controls
    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
    `;
    
    // Add instruction text
    const instructionText = document.createElement('div');
    instructionText.style.cssText = `
        font-size: 0.9rem;
        opacity: 0.9;
        margin-bottom: 1rem;
        text-align: center;
        width: 100%;
    `;
    instructionText.innerHTML = `
        <span style="margin-right: 1rem;">🔍 Click on any card to view details</span>
        <span style="margin-right: 1rem;">🗑️ Use delete buttons or double-click to remove cards</span>
        <span>📄 Use pagination to navigate through pages</span>
    `;
    header.appendChild(instructionText);
    
    // Search and filter section
    const searchSection = document.createElement('div');
    searchSection.style.cssText = `
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
    `;
    
    searchSection.innerHTML = `
        <div style="position: relative;">
            <input type="text" id="cardSearch" placeholder="Search cards..." style="
                padding: 0.75rem 1rem 0.75rem 2.5rem;
                border: none;
                border-radius: 8px;
                font-size: 1rem;
                width: 250px;
                background: rgba(255, 255, 255, 0.9);
            ">
            <span style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #666;">🔍</span>
        </div>
        <select id="cardFilter" style="
            padding: 0.75rem 1rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            background: rgba(255, 255, 255, 0.9);
            cursor: pointer;
        ">
            <option value="all">All Cards</option>
            <option value="excel">Excel Cards</option>
            <option value="manual">Manual Cards</option>
        </select>
    `;
    
    // Pagination controls
    const paginationSection = document.createElement('div');
    paginationSection.style.cssText = `
        display: flex;
        gap: 0.5rem;
        align-items: center;
    `;
    
    const cardsPerPage = 8;
    const totalPages = Math.ceil(allCards.length / cardsPerPage);
    
    paginationSection.innerHTML = `
        <button id="prevPage" style="
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            cursor: pointer;
            font-weight: 600;
        ">← Previous</button>
        <span id="pageInfo" style="
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            font-weight: 600;
        ">Page 1 of ${totalPages}</span>
        <button id="nextPage" style="
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            cursor: pointer;
            font-weight: 600;
        ">Next →</button>
    `;
    
    header.appendChild(searchSection);
    header.appendChild(paginationSection);
    previewContainer.appendChild(header);
    
    // Cards display area
    const cardsArea = document.createElement('div');
    cardsArea.id = 'cardsDisplayArea';
    cardsArea.style.cssText = `
        padding: 2rem;
        min-height: 400px;
        background: #f8fafc;
    `;
    
    // Create cards grid
    const cardsGrid = document.createElement('div');
    cardsGrid.id = 'cardsGrid';
    cardsGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    `;
    
    cardsArea.appendChild(cardsGrid);
    previewContainer.appendChild(cardsArea);
    
    preview.appendChild(previewContainer);

    // Initial display
    displayCards(allCards, 1);
    
    // Add event listeners
    let currentPage = 1;
    let filteredCards = allCards;

    try {
        const prevPageElement = document.getElementById('prevPage');
        const nextPageElement = document.getElementById('nextPage');
        const cardSearchElement = document.getElementById('cardSearch');
        const cardFilterElement = document.getElementById('cardFilter');

        const updateFiltering = () => {
            const searchTerm = (cardSearchElement ? cardSearchElement.value : '').toLowerCase();
            const filterType = cardFilterElement ? cardFilterElement.value : 'all';
            
            filteredCards = allCards.filter(cardData => {
                const { isManual } = cardData;
                const matchesFilter = filterType === 'all' || 
                                    (filterType === 'excel' && !isManual) || 
                                    (filterType === 'manual' && isManual);
                
                const studentName = (cardData['NOM & PRENOM'] || '').toLowerCase();
                const adherent = (cardData['ADHERENT'] || '').toLowerCase();

                const matchesSearch = studentName.includes(searchTerm) || adherent.includes(searchTerm);

                return matchesFilter && matchesSearch;
            });
            
            currentPage = 1;
            displayCards(filteredCards, currentPage);
        };

        if (prevPageElement) {
            prevPageElement.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    displayCards(filteredCards, currentPage);
                }
            });
        }

        if (nextPageElement) {
            nextPageElement.addEventListener('click', () => {
                if (currentPage < Math.ceil(filteredCards.length / cardsPerPage)) {
                    currentPage++;
                    displayCards(filteredCards, currentPage);
                }
            });
        }

        if (cardSearchElement) {
            cardSearchElement.addEventListener('input', updateFiltering);
        }

        if (cardFilterElement) {
            cardFilterElement.addEventListener('change', updateFiltering);
        }
    } catch (error) {
        console.error("Error setting up preview event listeners:", error);
        alert("A critical error occurred while setting up the preview controls. Please check the console for details.");
    }
    
    // Manual cards section (simplified)
    if (manuallyAddedCards.length > 0) {
        if (manualCardsSection) {
            manualCardsSection.style.display = 'block';
            manualCardsSection.innerHTML = `
                <div style="
                    background: #f0f9ff;
                    border: 1px solid #0ea5e9;
                    border-radius: 8px;
                    padding: 1rem;
                    margin: 1rem 0;
                    text-align: center;
                ">
                    <h3 style="color: #0c4a6e; margin: 0;">Manual Cards Included</h3>
                    <p style="color: #0369a1; margin: 0.5rem 0 0 0;">
                        ${manuallyAddedCards.length} manually added card(s) are included in the preview above.
                    </p>
                </div>
            `;
        }
    } else {
        if (manualCardsSection) {
            manualCardsSection.style.display = 'none';
        }
    }
    
    updateCardCount();
}

function deleteCard(index) {
    deletedCards.add(index);
    renderPreview();
    updateCardCount();
}

function deleteManualCard(index) {
    manuallyAddedCards.splice(index, 1);
    renderPreview();
    updateCardCount();
}

function restoreAllCards() {
    deletedCards.clear();
    renderPreview();
    updateCardCount();
}

function updateCardCount() {
    if (!excelData || !Array.isArray(excelData)) return;
    const filteredData = excelData.filter((student, index) => 
        !deletedCards.has(index) && (
        student['NOM & PRENOM'] ||
        student['TEL ADH'] ||
        student['TEL PARENT'] ||
        student['LYCEE'] ||
        student['ADHERENT']
        )
    );
    const totalCards = excelData.length;
    const deletedCount = deletedCards.size;
    const activeCards = filteredData.length + manuallyAddedCards.length;
    document.getElementById('cardCount').textContent = `Active cards: ${activeCards} | Deleted: ${deletedCount} | Total: ${totalCards} | Added: ${manuallyAddedCards.length}`;
    
    // Show/hide restore button
    const restoreBtn = document.getElementById('restoreBtn');
    if (deletedCount > 0) {
        restoreBtn.style.display = 'flex';
    } else {
        restoreBtn.style.display = 'none';
    }
}

function addCardManually() {
    console.log('addCardManually function called');
    
    // Check if we have the required data
    if (!selectedFields || selectedFields.length === 0) {
        if (excelData && excelData.length > 0) {
             // This can happen if the excel file has no headers that were parsed
             alert('Could not determine fields from Excel file. Please check the file format.');
        } else {
            alert('Please upload an Excel file first to set up the field structure.');
        }
        return;
    }
    
    // Show options modal first
    const optionsModal = document.createElement('div');
    optionsModal.style.position = 'fixed';
    optionsModal.style.top = '0';
    optionsModal.style.left = '0';
    optionsModal.style.width = '100%';
    optionsModal.style.height = '100%';
    optionsModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    optionsModal.style.display = 'flex';
    optionsModal.style.justifyContent = 'center';
    optionsModal.style.alignItems = 'center';
    optionsModal.style.zIndex = '10000';

    const optionsContent = document.createElement('div');
    optionsContent.style.backgroundColor = 'white';
    optionsContent.style.padding = '2rem';
    optionsContent.style.borderRadius = '12px';
    optionsContent.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    optionsContent.style.maxWidth = '400px';
    optionsContent.style.width = '90%';
    optionsContent.style.textAlign = 'center';

    optionsContent.innerHTML = `
        <h2 style="margin-bottom: 1.5rem; color: #1a73e8;">Add Cards</h2>
        <p style="margin-bottom: 2rem; color: #666;">Choose how you want to add cards:</p>
        
        <div style="display: flex; flex-direction: column; gap: 1rem;">
            <button id="singleCardBtn" style="padding: 1rem; background: #1a73e8; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">
                Add Single Card
            </button>
            
            <button id="bulkCardBtn" style="padding: 1rem; background: #34d399; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">
                Add Multiple Cards
            </button>
            
            <button id="cancelOptionsBtn" style="padding: 1rem; border: 2px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 1rem;">
                Cancel
            </button>
        </div>
    `;

    optionsModal.appendChild(optionsContent);
    document.body.appendChild(optionsModal);

    // Event listeners for options
    document.getElementById('singleCardBtn').addEventListener('click', () => {
        document.body.removeChild(optionsModal);
        addSingleCard();
    });

    document.getElementById('bulkCardBtn').addEventListener('click', () => {
        document.body.removeChild(optionsModal);
        addBulkCards();
    });

    document.getElementById('cancelOptionsBtn').addEventListener('click', () => {
        document.body.removeChild(optionsModal);
    });
}

function addSingleCard() {
    // Calculate next index
    const activeExcelCards = (excelData || []).filter((_, index) => !deletedCards.has(index)).length;
    const nextIndex = activeExcelCards + manuallyAddedCards.length;
    
    createCardForm(nextIndex, false);
}

function addBulkCards() {
    // Show bulk input modal
    const bulkModal = document.createElement('div');
    bulkModal.style.position = 'fixed';
    bulkModal.style.top = '0';
    bulkModal.style.left = '0';
    bulkModal.style.width = '100%';
    bulkModal.style.height = '100%';
    bulkModal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    bulkModal.style.display = 'flex';
    bulkModal.style.justifyContent = 'center';
    bulkModal.style.alignItems = 'center';
    bulkModal.style.zIndex = '10000';

    const bulkContent = document.createElement('div');
    bulkContent.style.backgroundColor = 'white';
    bulkContent.style.padding = '2rem';
    bulkContent.style.borderRadius = '12px';
    bulkContent.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    bulkContent.style.maxWidth = '400px';
    bulkContent.style.width = '90%';
    bulkContent.style.textAlign = 'center';

    bulkContent.innerHTML = `
        <h2 style="margin-bottom: 1.5rem; color: #1a73e8;">Add Multiple Cards</h2>
        <p style="margin-bottom: 1rem; color: #666;">How many cards do you want to create?</p>
        
        <div style="margin-bottom: 2rem;">
            <input type="number" id="cardCount" min="1" max="50" value="1" style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 1rem; text-align: center;">
        </div>
        
        <div style="display: flex; gap: 1rem; justify-content: center;">
            <button id="cancelBulkBtn" style="padding: 0.75rem 1.5rem; border: 2px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; font-weight: 600;">Cancel</button>
            <button id="startBulkBtn" style="padding: 0.75rem 1.5rem; background: #34d399; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Start</button>
        </div>
    `;

    bulkModal.appendChild(bulkContent);
    document.body.appendChild(bulkModal);

    document.getElementById('startBulkBtn').addEventListener('click', () => {
        const count = parseInt(document.getElementById('cardCount').value);
        if (count < 1 || count > 50) {
            alert('Please enter a number between 1 and 50.');
            return;
        }
        document.body.removeChild(bulkModal);
        startBulkCardCreation(count);
    });

    document.getElementById('cancelBulkBtn').addEventListener('click', () => {
        document.body.removeChild(bulkModal);
    });
}

function startBulkCardCreation(totalCards) {
    let currentCard = 0;
    let bulkCards = [];
    let isStopped = false;
    
    function createNextCard() {
        if (currentCard >= totalCards || isStopped) {
            // All cards created or process stopped
            if (bulkCards.length > 0) {
                manuallyAddedCards.push(...bulkCards);
                renderPreview();
                updateCardCount();
                if (isStopped) {
                    alert(`Bulk creation stopped. ${bulkCards.length} cards were successfully created.`);
                } else {
                    alert(`Successfully created ${totalCards} cards!`);
                }
            }
            return;
        }
        
        currentCard++;
        const totalExcelCards = excelData ? excelData.length : 0;
        const activeExcelCards = excelData ? excelData.filter((student, index) => !deletedCards.has(index)).length : 0;
        const nextIndex = activeExcelCards + manuallyAddedCards.length + bulkCards.length + 1;
        
        // Calculate the next available number for this specific card
        const maxExcelNumber = excelData ? Math.max(...excelData.map(row => parseInt(row['N']) || 0)) : 0;
        const maxManualNumber = manuallyAddedCards.length > 0 ? Math.max(...manuallyAddedCards.map(card => parseInt(card['N']) || 0)) : 0;
        const maxBulkNumber = bulkCards.length > 0 ? Math.max(...bulkCards.map(card => parseInt(card['N']) || 0)) : 0;
        const nextNumber = Math.max(maxExcelNumber, maxManualNumber, maxBulkNumber) + 1;
        
        createCardForm(nextIndex, true, (cardData) => {
            // Ensure the card has the correct number
            if (!cardData['N']) {
                cardData['N'] = nextNumber;
            }
            bulkCards.push(cardData);
            createNextCard();
        }, () => {
            // Stop callback
            isStopped = true;
            createNextCard();
        });
    }
    
    createNextCard();
}

function createCardForm(nextIndex, isBulk = false, onComplete = null, onStop = null) {
    let tempPhotoDataURL = null;

    const modal = document.createElement('div');
    modal.className = 'add-card-modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'add-card-modal-content';

    const formContainer = document.createElement('div');
    formContainer.className = 'add-card-form-container';

    const form = document.createElement('form');
    const bulkProgress = isBulk ? `<div class="bulk-progress">
        <strong>Bulk Mode:</strong> Creating card ${nextIndex}
    </div>` : '';
    
    // Calculate the next available number for manual cards
    const maxExcelNumber = excelData ? Math.max(...excelData.map(row => parseInt(row['N']) || 0)) : 0;
    const maxManualNumber = manuallyAddedCards.length > 0 ? Math.max(...manuallyAddedCards.map(card => parseInt(card['N']) || 0)) : 0;
    const nextNumber = Math.max(maxExcelNumber, maxManualNumber) + 1;
    
    let formHTML = `
        <h2 class="form-title">Add New Card (Index: ${nextIndex})</h2>
        ${bulkProgress}
        
        <div class="form-group">
            <label for="add_N_${nextIndex}">Number:</label>
            <input type="number" id="add_N_${nextIndex}" class="form-control" value="${nextNumber}" readonly>
            <small class="form-text">Auto-assigned number</small>
        </div>
        
        <div class="form-group">
            <label>Photo:</label>
            <div class="photo-upload-area">
                <input type="file" id="addPhoto_${nextIndex}" accept="image/*" class="file-input">
                <button type="button" id="uploadPhotoBtn_${nextIndex}" class="btn btn-primary">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>
                    Upload Photo
                </button>
                <span id="photoFileName_${nextIndex}" class="file-name"></span>
            </div>
            <small class="form-text">Click the button to upload a photo for this card</small>
        </div>
    `;

    selectedFields.forEach(field => {
        if (field === 'N') return; // Skip 'N' field as we already added it above
        formHTML += `
            <div class="form-group">
                <label for="add_${field.replace(/[^a-zA-Z0-9]/g, '_')}_${nextIndex}">${field}:</label>
                <input type="text" id="add_${field.replace(/[^a-zA-Z0-9]/g, '_')}_${nextIndex}" class="form-control">
            </div>
        `;
    });

    const submitButtonText = isBulk ? 'Add & Next' : 'Add Card';
    const stopButton = isBulk ? `<button type="button" id="stopBulkBtn_${nextIndex}" class="btn btn-danger">Stop & Save</button>` : '';
    
    formHTML += `
        <div class="form-actions">
            ${stopButton}
            <button type="button" id="cancelAdd_${nextIndex}" class="btn btn-secondary">Cancel</button>
            <button type="submit" class="btn btn-primary">${submitButtonText}</button>
        </div>
    `;
    form.innerHTML = formHTML;

    const previewContainer = document.createElement('div');
    previewContainer.className = 'add-card-preview-container';
    previewContainer.innerHTML = `
        <h3 class="preview-title">Live Preview</h3>
        <div class="live-preview-wrapper">
            <div id="livePreviewCard_${nextIndex}"></div>
        </div>
    `;

    function updateLivePreview() {
        const previewDiv = document.getElementById(`livePreviewCard_${nextIndex}`);
        if (!previewDiv) return;

        const tempCard = {};
        // Add the number field
        const numberInput = form.querySelector(`#add_N_${nextIndex}`);
        if (numberInput) {
            tempCard['N'] = numberInput.value;
        }
        
        selectedFields.forEach(field => {
            if (field === 'N') return; // Skip 'N' as we already handled it
            const fieldId = `add_${field.replace(/[^a-zA-Z0-9]/g, '_')}_${nextIndex}`;
            const input = form.querySelector('#' + fieldId);
            if (input) {
                tempCard[field] = input.value;
            }
        });
        
        const card = createIDCard(tempCard, nextIndex, false, tempPhotoDataURL);
        previewDiv.innerHTML = '';
        previewDiv.appendChild(card);
    }

    formContainer.appendChild(form);
    modalContent.appendChild(formContainer);
    modalContent.appendChild(previewContainer);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);

    // Defer event listener setup
    setTimeout(() => {
        modal.classList.add('visible'); // Make the modal visible with animation

        const photoInput = modal.querySelector(`#addPhoto_${nextIndex}`);
        const uploadBtn = modal.querySelector(`#uploadPhotoBtn_${nextIndex}`);
        const cancelBtn = modal.querySelector(`#cancelAdd_${nextIndex}`);

        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => photoInput.click());
        }

        if (photoInput) {
            photoInput.addEventListener('change', function(e) {
                if (e.target.files.length > 0) {
                    const file = e.target.files[0];
                    modal.querySelector(`#photoFileName_${nextIndex}`).textContent = file.name;
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        tempPhotoDataURL = e.target.result;
                        updateLivePreview();
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        const closeModal = () => {
            modal.classList.remove('visible');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 300); // Wait for transition to finish
        };

        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeModal);
        }

        form.addEventListener('input', updateLivePreview);
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const newCard = {};
            // Add the number field
            const numberInput = form.querySelector(`#add_N_${nextIndex}`);
            if (numberInput) {
                newCard['N'] = numberInput.value;
            }
            
            selectedFields.forEach(field => {
                if (field === 'N') return; // Skip 'N' as we already handled it
                const fieldId = `add_${field.replace(/[^a-zA-Z0-9]/g, '_')}_${nextIndex}`;
                const input = form.querySelector('#' + fieldId);
                if (input) {
                    newCard[field] = input.value;
                }
            });

            if (tempPhotoDataURL) {
                const photoId = (newCard['ADHERENT'] || `manual_${Date.now()}`).toLowerCase();
                images.set(photoId, tempPhotoDataURL);
            }

            if (isBulk && onComplete) {
                onComplete(newCard);
            } else {
                manuallyAddedCards.push(newCard);
                renderPreview();
                updateCardCount();
            }
            closeModal();
        };
        
        if (isBulk && onStop) {
            const stopBtn = modal.querySelector('#stopBulkBtn_'+nextIndex);
            if (stopBtn) {
                stopBtn.addEventListener('click', () => {
                    modal.remove(); 
                    onStop();
                });
            }
        }

        updateLivePreview();
    }, 0);
}

function exportManualDataToExcel() {
    const activeExcelCards = (excelData || []).filter((_, index) => !deletedCards.has(index));
    const allCardsData = [...activeExcelCards, ...manuallyAddedCards];

    if (allCardsData.length === 0) {
        alert('No cards to export.');
        return;
    }

    let headers = selectedFields.length > 0 ? selectedFields.filter(h => h !== 'INDEX' && h !== 'N') : Object.keys(allCardsData[0] || {}).filter(h => h !== 'INDEX' && h !== 'N');
    if (headers.length === 0) {
        alert('No fields selected or available to export.');
        return;
    }
    
    const worksheetData = allCardsData.map(card => {
        return headers.map(header => card[header] || '');
    });

    worksheetData.unshift(headers);

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } }
    };

    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for(let c = range.s.c; c <= range.e.c; ++c) {
        const address = XLSX.utils.encode_cell({r: 0, c: c});
        if(!worksheet[address]) continue;
        worksheet[address].s = headerStyle;
    }

    const colWidths = headers.map((header, i) => ({
        wch: Math.max(
            header.length,
            ...(worksheetData.slice(1).map(row => (row[i] || '').toString().length))
        ) + 2
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'All Cards');
    XLSX.writeFile(workbook, 'all_cards_export.xlsx');
}

function exportImagesAsZip() {
    const imageNameField = document.getElementById('imageNameField').value;
    if (!imageNameField) {
        alert('Please select a field to name the images by.');
        return;
    }

    if (manuallyAddedCards.length === 0 || images.size === 0) {
        alert('No manually added cards or images available to export.');
        return;
    }

    const zip = new JSZip();
    let imageCount = 0;

    manuallyAddedCards.forEach(card => {
        const adherentId = String(card['ADHERENT'] || '').trim().toLowerCase();
        const photoSrc = images.get(adherentId);

        if (photoSrc) {
            const fileNameValue = card[imageNameField] || `card_${adherentId || (imageCount + 1)}`;
            const safeFileName = String(fileNameValue).replace(/[^a-z0-9_-\s\.]/gi, '').trim();
            const fileExtension = photoSrc.substring(photoSrc.indexOf('/') + 1, photoSrc.indexOf(';'));
            const finalFileName = `${safeFileName}.${fileExtension}`;
            
            const base64Data = photoSrc.split(';base64,').pop();
            zip.file(finalFileName, base64Data, { base64: true });
            imageCount++;
        }
    });

    if (imageCount === 0) {
        alert('No matching images found for the manually added cards.');
        return;
    }

    zip.generateAsync({ type: 'blob' }).then(function(content) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'exported_images.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

function showExportModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'export-modal-overlay';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'export-modal-content';

    modalContent.innerHTML = `
        <h2>PDF Generated!</h2>
        <p>Would you like to export associated data?</p>
        <div class="export-modal-buttons">
            <button id="modalExportExcelBtn" class="btn btn-primary">Export All Cards to Excel</button>
            <div class="image-export-group">
                <button id="modalExportImagesBtn" class="btn btn-primary">Export Images as .zip</button>
                <div class="input-group">
                    <label for="modalImageNameField">Name images by:</label>
                    <select id="modalImageNameField"></select>
                </div>
            </div>
            <button id="modalCloseBtn" class="btn btn-secondary">Close</button>
        </div>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Populate dropdown
    const originalDropdown = document.getElementById('imageNameField');
    const modalDropdown = document.getElementById('modalImageNameField');
    modalDropdown.innerHTML = originalDropdown.innerHTML;

    // Add event listeners
    document.getElementById('modalExportExcelBtn').addEventListener('click', exportManualDataToExcel);
    document.getElementById('modalExportImagesBtn').addEventListener('click', () => {
        // Temporarily move the selected value for the export function
        const originalSelect = document.getElementById('imageNameField');
        const modalSelect = document.getElementById('modalImageNameField');
        originalSelect.value = modalSelect.value;
        exportImagesAsZip();
    });
    document.getElementById('modalCloseBtn').addEventListener('click', () => {
        modalOverlay.classList.remove('visible');
        setTimeout(() => {
        document.body.removeChild(modalOverlay);
        }, 300); // Wait for animation
    });

    // Make it visible
    setTimeout(() => {
        modalOverlay.classList.add('visible');
    }, 10);
} 
