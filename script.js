class PhotoEditor {
    constructor() {
        this.canvas = document.getElementById('imageCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.originalImage = null;
        this.currentImage = null;
        this.isCropping = false;
        this.cropStart = { x: 0, y: 0 };
        this.cropEnd = { x: 0, y: 0 };
        this.filters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0
        };
        this.currentFilter = 'none';
        this.effects = {
            vignette: false,
            grain: false
        };
        this.rotation = 0;
        
        this.initializeEventListeners();
        this.updateStatus('Готов к работе');
    }

    initializeEventListeners() {
        // File upload
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.loadImage(e.target.files[0]);
        });

        // Drag and drop support
        const canvas = this.canvas;
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            canvas.style.borderColor = 'var(--primary-color)';
        });

        canvas.addEventListener('dragleave', (e) => {
            e.preventDefault();
            canvas.style.borderColor = '';
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            canvas.style.borderColor = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.loadImage(files[0]);
            }
        });

        // Save functionality
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveImage();
        });

        // Crop functionality
        document.getElementById('cropBtn').addEventListener('click', () => {
            this.toggleCropMode();
        });

        // Rotate functionality
        document.getElementById('rotateBtn').addEventListener('click', () => {
            this.rotateImage();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyFilter(e.target.dataset.filter);
            });
        });

        // Sliders
        document.getElementById('brightnessSlider').addEventListener('input', (e) => {
            this.filters.brightness = parseInt(e.target.value);
            this.updateSliderValue(e.target);
            this.applyAdjustments();
        });

        document.getElementById('contrastSlider').addEventListener('input', (e) => {
            this.filters.contrast = parseInt(e.target.value);
            this.updateSliderValue(e.target);
            this.applyAdjustments();
        });

        document.getElementById('saturationSlider').addEventListener('input', (e) => {
            this.filters.saturation = parseInt(e.target.value);
            this.updateSliderValue(e.target);
            this.applyAdjustments();
        });

        document.getElementById('blurSlider').addEventListener('input', (e) => {
            this.filters.blur = parseInt(e.target.value);
            this.updateSliderValue(e.target);
            this.applyAdjustments();
        });

        // Effects
        document.getElementById('vignetteBtn').addEventListener('click', () => {
            this.toggleEffect('vignette');
        });

        document.getElementById('grainBtn').addEventListener('click', () => {
            this.toggleEffect('grain');
        });

        // New effects
        document.getElementById('blurBtn').addEventListener('click', () => {
            this.toggleEffect('blur');
        });

        document.getElementById('sharpenBtn').addEventListener('click', () => {
            this.toggleEffect('sharpen');
        });

        // Transformations
        document.getElementById('flipHBtn').addEventListener('click', () => {
            this.flipHorizontal();
        });

        document.getElementById('flipVBtn').addEventListener('click', () => {
            this.flipVertical();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetAll();
        });

        // Canvas events for cropping
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.isCropping) {
                this.startCrop(e);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isCropping) {
                this.updateCrop(e);
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            if (this.isCropping) {
                this.endCrop();
            }
        });

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.isCropping) {
                e.preventDefault();
                this.startCrop(e.touches[0]);
            }
        });

        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isCropping) {
                e.preventDefault();
                this.updateCrop(e.touches[0]);
            }
        });

        this.canvas.addEventListener('touchend', () => {
            if (this.isCropping) {
                this.endCrop();
            }
        });
    }

    loadImage(file) {
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.updateStatus('Ошибка: Выберите файл изображения');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.updateStatus('Ошибка: Файл слишком большой (максимум 10MB)');
            return;
        }

        this.updateStatus('Загрузка изображения...');
        this.showProgress();

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.currentImage = img;
                this.resetAdjustments();
                this.fitImageToCanvas();
                this.drawImage();
                this.enableSaveButton();
                this.updateStatus('Изображение загружено');
                this.hideProgress();
            };
            img.onerror = () => {
                this.updateStatus('Ошибка загрузки изображения');
                this.hideProgress();
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            this.updateStatus('Ошибка чтения файла');
            this.hideProgress();
        };
        reader.readAsDataURL(file);
    }

    fitImageToCanvas() {
        if (!this.originalImage) return;

        const canvas = this.canvas;
        const img = this.originalImage;
        
        const canvasAspect = canvas.width / canvas.height;
        const imgAspect = img.width / img.height;

        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

        if (imgAspect > canvasAspect) {
            drawWidth = canvas.width;
            drawHeight = canvas.width / imgAspect;
            offsetY = (canvas.height - drawHeight) / 2;
        } else {
            drawHeight = canvas.height;
            drawWidth = canvas.height * imgAspect;
            offsetX = (canvas.width - drawWidth) / 2;
        }

        this.imageBounds = {
            x: offsetX,
            y: offsetY,
            width: drawWidth,
            height: drawHeight
        };
    }

    drawImage() {
        if (!this.currentImage) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply rotation
        if (this.rotation !== 0) {
            this.ctx.save();
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.rotate((this.rotation * Math.PI) / 180);
            this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
        }

        this.ctx.drawImage(
            this.currentImage,
            this.imageBounds.x,
            this.imageBounds.y,
            this.imageBounds.width,
            this.imageBounds.height
        );

        if (this.rotation !== 0) {
            this.ctx.restore();
        }

        // Apply effects
        this.applyEffects();
    }

    applyAdjustments() {
        if (!this.originalImage) return;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;

        // Start with the current image (which may have filters applied)
        let sourceImage = this.originalImage;
        
        // Draw the source image
        tempCtx.drawImage(
            sourceImage,
            this.imageBounds.x,
            this.imageBounds.y,
            this.imageBounds.width,
            this.imageBounds.height
        );

        // Apply adjustments
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Brightness
            data[i] = Math.min(255, data[i] * (this.filters.brightness / 100));
            data[i + 1] = Math.min(255, data[i + 1] * (this.filters.brightness / 100));
            data[i + 2] = Math.min(255, data[i + 2] * (this.filters.brightness / 100));

            // Contrast
            const factor = (259 * (this.filters.contrast + 255)) / (255 * (259 - this.filters.contrast));
            data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
            data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
            data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));

            // Saturation
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray + (this.filters.saturation / 100) * (data[i] - gray);
            data[i + 1] = gray + (this.filters.saturation / 100) * (data[i + 1] - gray);
            data[i + 2] = gray + (this.filters.saturation / 100) * (data[i + 2] - gray);
        }

        tempCtx.putImageData(imageData, 0, 0);

        // Create new image from adjusted canvas
        const adjustedImage = new Image();
        adjustedImage.onload = () => {
            this.currentImage = adjustedImage;
            this.drawImage();
        };
        adjustedImage.src = tempCanvas.toDataURL();
    }

    applyFilter(filterName) {
        this.currentFilter = filterName;
        
        // Remove active class from all filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        event.target.classList.add('active');

        if (!this.originalImage) return;

        // Create a temporary canvas for filter processing
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;

        // Draw the original image with current bounds
        tempCtx.drawImage(
            this.originalImage,
            this.imageBounds.x,
            this.imageBounds.y,
            this.imageBounds.width,
            this.imageBounds.height
        );

        // Apply filter only if it's not 'none'
        if (filterName !== 'none') {
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const data = imageData.data;

            switch (filterName) {
                case 'vintage':
                    this.applyVintageFilter(data);
                    break;
                case 'blackwhite':
                    this.applyBlackWhiteFilter(data);
                    break;
                case 'sepia':
                    this.applySepiaFilter(data);
                    break;
                case 'cool':
                    this.applyCoolFilter(data);
                    break;
                case 'warm':
                    this.applyWarmFilter(data);
                    break;
                case 'dramatic':
                    this.applyDramaticFilter(data);
                    break;
                case 'fade':
                    this.applyFadeFilter(data);
                    break;
                case 'neon':
                    this.applyNeonFilter(data);
                    break;
                case 'sunset':
                    this.applySunsetFilter(data);
                    break;
                case 'cyberpunk':
                    this.applyCyberpunkFilter(data);
                    break;
                case 'retro':
                    this.applyRetroFilter(data);
                    break;
                case 'monochrome':
                    this.applyMonochromeFilter(data);
                    break;
                case 'duotone':
                    this.applyDuotoneFilter(data);
                    break;
            }

            tempCtx.putImageData(imageData, 0, 0);
        }

        // Create new image from processed canvas
        const processedImage = new Image();
        processedImage.onload = () => {
            this.currentImage = processedImage;
            this.drawImage();
        };
        processedImage.src = tempCanvas.toDataURL();
    }

    applyVintageFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.2); // Increase red
            data[i + 1] = Math.min(255, data[i + 1] * 0.9); // Decrease green
            data[i + 2] = Math.min(255, data[i + 2] * 0.8); // Decrease blue
        }
    }

    applyBlackWhiteFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
        }
    }

    applySepiaFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
    }

    applyCoolFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 0.8); // Decrease red
            data[i + 1] = Math.min(255, data[i + 1] * 0.9); // Slightly decrease green
            data[i + 2] = Math.min(255, data[i + 2] * 1.2); // Increase blue
        }
    }

    applyWarmFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.2); // Increase red
            data[i + 1] = Math.min(255, data[i + 1] * 1.1); // Increase green
            data[i + 2] = Math.min(255, data[i + 2] * 0.8); // Decrease blue
        }
    }

    applyDramaticFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            // Increase contrast and add dark tones
            data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.5 + 128));
            data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.5 + 128));
            data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.5 + 128));
        }
    }

    applyFadeFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 0.8);
            data[i + 1] = Math.min(255, data[i + 1] * 0.8);
            data[i + 2] = Math.min(255, data[i + 2] * 0.8);
        }
    }

    applyEffects() {
        if (this.effects.vignette) {
            this.applyVignetteEffect();
        }
        
        if (this.effects.grain) {
            this.applyGrainEffect();
        }
    }

    applyVignetteEffect() {
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width / 2
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    applyGrainEffect() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 30;
            data[i] = Math.min(255, Math.max(0, data[i] + noise));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    toggleEffect(effectName) {
        this.effects[effectName] = !this.effects[effectName];
        
        const btn = document.getElementById(effectName + 'Btn');
        if (this.effects[effectName]) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
        
        this.drawImage();
    }

    toggleCropMode() {
        this.isCropping = !this.isCropping;
        const cropBtn = document.getElementById('cropBtn');
        const cropOverlay = document.getElementById('cropOverlay');
        
        if (this.isCropping) {
            cropBtn.classList.add('active');
            cropOverlay.style.display = 'block';
            this.updateStatus('Режим обрезки активен');
        } else {
            cropBtn.classList.remove('active');
            cropOverlay.style.display = 'none';
            this.updateStatus('Режим обрезки отключен');
        }
    }

    startCrop(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.cropStart = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
        this.cropEnd = { ...this.cropStart };
    }

    updateCrop(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        this.cropEnd = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
        
        const cropOverlay = document.getElementById('cropOverlay');
        const left = Math.min(this.cropStart.x, this.cropEnd.x) / scaleX;
        const top = Math.min(this.cropStart.y, this.cropEnd.y) / scaleY;
        const width = Math.abs(this.cropEnd.x - this.cropStart.x) / scaleX;
        const height = Math.abs(this.cropEnd.y - this.cropStart.y) / scaleY;
        
        cropOverlay.style.left = left + 'px';
        cropOverlay.style.top = top + 'px';
        cropOverlay.style.width = width + 'px';
        cropOverlay.style.height = height + 'px';
    }

    endCrop() {
        if (this.cropStart.x === this.cropEnd.x || this.cropStart.y === this.cropEnd.y) {
            return;
        }
        
        this.performCrop();
    }

    performCrop() {
        const left = Math.min(this.cropStart.x, this.cropEnd.x);
        const top = Math.min(this.cropStart.y, this.cropEnd.y);
        const width = Math.abs(this.cropEnd.x - this.cropStart.x);
        const height = Math.abs(this.cropEnd.y - this.cropStart.y);
        
        // Ensure minimum crop size
        if (width < 10 || height < 10) {
            this.updateStatus('Область обрезки слишком мала');
            return;
        }
        
        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');
        
        croppedCanvas.width = width;
        croppedCanvas.height = height;
        
        // Draw the cropped area from the current image
        croppedCtx.drawImage(
            this.currentImage,
            left, top, width, height,
            0, 0, width, height
        );
        
        const croppedImage = new Image();
        croppedImage.onload = () => {
            this.originalImage = croppedImage;
            this.currentImage = croppedImage;
            this.resetAdjustments(); // Reset filters and adjustments
            this.fitImageToCanvas();
            this.drawImage();
            this.toggleCropMode();
            this.updateStatus('Изображение обрезано');
        };
        croppedImage.src = croppedCanvas.toDataURL();
    }

    rotateImage() {
        this.rotation = (this.rotation + 90) % 360;
        this.drawImage();
        this.updateStatus('Изображение повернуто');
    }

    resetAdjustments() {
        this.filters = {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            blur: 0
        };
        
        this.currentFilter = 'none';
        this.effects = {
            vignette: false,
            grain: false
        };
        this.rotation = 0;
        
        // Reset sliders
        document.getElementById('brightnessSlider').value = 100;
        document.getElementById('contrastSlider').value = 100;
        document.getElementById('saturationSlider').value = 100;
        document.getElementById('blurSlider').value = 0;
        
        // Reset slider values display
        document.querySelectorAll('.slider-value').forEach((span, index) => {
            const values = [100, 100, 100, 0];
            span.textContent = values[index];
        });
        
        // Reset filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('[data-filter="none"]').classList.add('active');
        
        // Reset effect buttons
        document.getElementById('vignetteBtn').classList.remove('active');
        document.getElementById('grainBtn').classList.remove('active');
    }

    saveImage() {
        if (!this.currentImage) return;
        
        this.updateStatus('Сохранение изображения...');
        
        const link = document.createElement('a');
        link.download = 'edited-photo.png';
        link.href = this.canvas.toDataURL();
        link.click();
        
        this.updateStatus('Изображение сохранено');
    }

    updateSliderValue(slider) {
        const valueSpan = slider.parentNode.querySelector('.slider-value');
        valueSpan.textContent = slider.value;
    }

    enableSaveButton() {
        document.getElementById('saveBtn').disabled = false;
    }

    updateStatus(message) {
        document.getElementById('statusText').textContent = message;
    }

    showProgress() {
        const progressBar = document.getElementById('progressBar');
        const progressFill = progressBar.querySelector('.progress-fill');
        progressBar.style.display = 'flex';
        progressFill.style.width = '0%';
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
            }
            progressFill.style.width = progress + '%';
        }, 100);
    }

    hideProgress() {
        document.getElementById('progressBar').style.display = 'none';
    }

    // New filter functions
    applyNeonFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Create neon effect
            data[i] = Math.min(255, r + 50);
            data[i + 1] = Math.min(255, g + 30);
            data[i + 2] = Math.min(255, b + 80);
        }
    }

    applySunsetFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.3); // Increase red
            data[i + 1] = Math.min(255, data[i + 1] * 0.8); // Decrease green
            data[i + 2] = Math.min(255, data[i + 2] * 0.6); // Decrease blue
        }
    }

    applyCyberpunkFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * 1.2); // Increase red
            data[i + 1] = Math.min(255, data[i + 1] * 0.7); // Decrease green
            data[i + 2] = Math.min(255, data[i + 2] * 1.4); // Increase blue
        }
    }

    applyRetroFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = Math.min(255, gray * 1.1);
            data[i + 1] = Math.min(255, gray * 0.9);
            data[i + 2] = Math.min(255, gray * 0.8);
        }
    }

    applyMonochromeFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
        }
    }

    applyDuotoneFilter(data) {
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = Math.min(255, gray * 1.2); // Cyan
            data[i + 1] = Math.min(255, gray * 0.8); // Magenta
            data[i + 2] = Math.min(255, gray * 1.4); // Yellow
        }
    }

    // New transformation functions
    flipHorizontal() {
        this.flipH = !this.flipH;
        this.drawImage();
        this.updateStatus('Изображение отражено по горизонтали');
    }

    flipVertical() {
        this.flipV = !this.flipV;
        this.drawImage();
        this.updateStatus('Изображение отражено по вертикали');
    }

    resetAll() {
        this.originalImage = this.currentImage;
        this.resetAdjustments();
        this.flipH = false;
        this.flipV = false;
        this.rotation = 0;
        this.drawImage();
        this.updateStatus('Все изменения сброшены');
    }

    // Enhanced drawImage function
    drawImage() {
        if (!this.currentImage) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply transformations
        this.ctx.save();
        
        // Center the transformations
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        
        // Apply rotation
        if (this.rotation !== 0) {
            this.ctx.rotate((this.rotation * Math.PI) / 180);
        }
        
        // Apply flips
        if (this.flipH) {
            this.ctx.scale(-1, 1);
        }
        if (this.flipV) {
            this.ctx.scale(1, -1);
        }
        
        // Draw image
        this.ctx.drawImage(
            this.originalImage,
            -this.imageBounds.width / 2,
            -this.imageBounds.height / 2,
            this.imageBounds.width,
            this.imageBounds.height
        );
        
        this.ctx.restore();

        // Apply effects
        this.applyEffects();
    }
}

// Initialize the photo editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PhotoEditor();
}); 