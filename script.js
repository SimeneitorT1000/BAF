document.addEventListener('DOMContentLoaded', function() {

    // ====== MENÚ HAMBURGUESA ======
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburgerMenu && navMenu) {
        hamburgerMenu.addEventListener('click', () => {
            const isExpanded = navMenu.classList.toggle('active');
            hamburgerMenu.classList.toggle('active');
            hamburgerMenu.setAttribute('aria-expanded', isExpanded);
        });
        document.querySelectorAll('.nav-menu .nav-list a').forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    hamburgerMenu.classList.remove('active');
                    hamburgerMenu.setAttribute('aria-expanded', 'false');
                }
            });
        });
    }

    // ====== LIGHTBOX (MODIFICADO PARA IMÁGENES Y PDFS) ======
    const lightboxTriggers = document.querySelectorAll('.galeria-img, .uniforme-img-clickable, .programa-img-clickable, .noticia-img-clickable');
    const lightbox = document.getElementById('lightbox');
    const lightboxImgEl = document.getElementById('lightbox-img'); 
    const lightboxPdfEl = document.getElementById('lightbox-pdf'); 
    const lightboxCerrar = document.getElementById('lightbox-cerrar');
    
    // Asegurarse que el lightbox está oculto al inicio por si acaso CSS no lo hizo
    if(lightbox) {
        lightbox.style.display = 'none';
    }
    if(lightboxImgEl) {
        lightboxImgEl.style.display = 'none';
    }
    if(lightboxPdfEl) {
        lightboxPdfEl.style.display = 'none';
    }

    if (lightboxTriggers.length > 0 && lightbox && lightboxImgEl && lightboxPdfEl && lightboxCerrar) {
        lightboxTriggers.forEach(trigger => {
            trigger.addEventListener('click', function() { 
                const isPdfTrigger = this.classList.contains('pdf-trigger'); 
                const pdfSrc = this.dataset.pdfSrc; 

                document.body.classList.add('lightbox-active');
                lightbox.style.display = 'flex'; 

                if (isPdfTrigger && pdfSrc) {
                    lightboxImgEl.style.display = 'none';    
                    lightboxPdfEl.style.display = 'block';   
                    lightboxPdfEl.src = pdfSrc;              
                } else if (this.tagName === 'IMG') { 
                    lightboxPdfEl.style.display = 'none';    
                    lightboxPdfEl.src = '';                  
                    lightboxImgEl.style.display = 'block';   
                    lightboxImgEl.src = this.src;
                    lightboxImgEl.alt = this.alt;
                } else {
                    console.warn('Tipo de trigger de lightbox no reconocido:', this);
                    cerrarLightbox(); 
                    return;
                }
                lightboxCerrar.focus();
            });
        });

        function cerrarLightbox() {
            lightbox.style.display = 'none'; 
            document.body.classList.remove('lightbox-active');
            lightboxImgEl.style.display = 'none';
            lightboxImgEl.src = ''; 
            lightboxPdfEl.style.display = 'none';
            lightboxPdfEl.src = ''; 
        }

        lightboxCerrar.addEventListener('click', cerrarLightbox);
        lightboxCerrar.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') cerrarLightbox();
        });
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) { 
                cerrarLightbox();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.style.display === 'flex') { 
                cerrarLightbox();
            }
        });
    }

    // ====== CARRUSEL DE NOTICIAS (Lógica revisada para reanudar auto-scroll) ======
    const viewportNoticias = document.getElementById('noticias-carousel-viewport');
    const sliderNoticias = document.getElementById('noticias-carousel-slider');
    const prevBtnNoticias = document.getElementById('noticias-prev');
    const nextBtnNoticias = document.getElementById('noticias-next');
    
    if (viewportNoticias && sliderNoticias && sliderNoticias.children.length > 0) {
        let itemsNoticias = Array.from(sliderNoticias.children);
        let currentPositionNoticias = 0;
        let itemWidthNoticias = 0; 
        let directionNoticias = -1; 
        const speedNoticias = 0.7; 
        const RESUME_DELAY = 4000; 

        let animationFrameIdNoticias = null;
        let autoScrollEnabled = true; 
        let userHasInteractedRecently = false; // Renombrado para más claridad
        let resumeTimer = null;      

        function calculateCarouselDimensions() {
            if (itemsNoticias.length > 0 && itemsNoticias[0].offsetWidth > 0) {
                const itemStyle = getComputedStyle(itemsNoticias[0]);
                itemWidthNoticias = itemsNoticias[0].offsetWidth + parseInt(itemStyle.marginRight || '0');
            }
        }

        function getMaxScroll() {
            if (!itemsNoticias.length || !viewportNoticias.clientWidth || itemWidthNoticias === 0) return 0;
            const totalSliderWidth = itemsNoticias.length * itemWidthNoticias - parseInt(getComputedStyle(itemsNoticias[itemsNoticias.length - 1]).marginRight || '0');
            const maxScrollValue = totalSliderWidth - viewportNoticias.clientWidth;
            return maxScrollValue > 0 ? maxScrollValue : 0;
        }
        
        function updateSliderPosition(smooth = false) { 
            sliderNoticias.style.transition = smooth ? 'transform 0.4s ease-in-out' : 'none';
            sliderNoticias.style.transform = `translateX(${currentPositionNoticias}px)`;
        }

        function runAutoScrollStep() {
            if (!autoScrollEnabled || userHasInteractedRecently) return;

            const maxScroll = getMaxScroll();
            if (maxScroll > 0 && itemWidthNoticias > 0) {
                currentPositionNoticias += speedNoticias * directionNoticias;
                if (currentPositionNoticias > 0) { 
                    currentPositionNoticias = 0; directionNoticias = -1; 
                } else if (currentPositionNoticias < -maxScroll) { 
                    currentPositionNoticias = -maxScroll; directionNoticias = 1; 
                }
                updateSliderPosition(false); 
            } else { 
                currentPositionNoticias = 0; updateSliderPosition(false);
            }
        }

        function manageAutoScrollLoop() {
            runAutoScrollStep();
            animationFrameIdNoticias = requestAnimationFrame(manageAutoScrollLoop);
        }

        function startAutoScroll() {
            if (getMaxScroll() <= 0) return; 
            
            autoScrollEnabled = true;
            // userHasInteractedRecently se maneja por los eventos y timers
            
            clearTimeout(resumeTimer); 

            if (!animationFrameIdNoticias) { 
                animationFrameIdNoticias = requestAnimationFrame(manageAutoScrollLoop);
            }
        }

        function stopAutoScroll() {
            // Este stop es genérico, no necesariamente implica interacción del usuario.
            // Puede ser llamado por resize, por ejemplo.
            autoScrollEnabled = false; 
            if (animationFrameIdNoticias) {
                cancelAnimationFrame(animationFrameIdNoticias);
                animationFrameIdNoticias = null;
            }
            // No limpiamos userHasInteractedRecently aquí, porque la interacción puede seguir "activa"
            // clearTimeout(resumeTimer); // El timer debe ser manejado específicamente
        }
        
        if (nextBtnNoticias && prevBtnNoticias) {
            const handleButtonClick = () => {
                userHasInteractedRecently = true; 
                stopAutoScroll(); // Detiene el movimiento inmediato
                clearTimeout(resumeTimer); // Limpia cualquier timer anterior

                resumeTimer = setTimeout(() => {
                    userHasInteractedRecently = false; 
                    if (!viewportNoticias.matches(':hover')) { 
                        startAutoScroll();
                    }
                    // Si el mouse está encima, mouseleave se encargará
                }, RESUME_DELAY);
            };

            nextBtnNoticias.addEventListener('click', () => {
                const maxScroll = getMaxScroll();
                if (itemWidthNoticias > 0 && currentPositionNoticias > -maxScroll) {
                    currentPositionNoticias -= itemWidthNoticias;
                     if (currentPositionNoticias < -maxScroll) currentPositionNoticias = -maxScroll;
                    updateSliderPosition(true); 
                }
                handleButtonClick();
            });

            prevBtnNoticias.addEventListener('click', () => {
                if (itemWidthNoticias > 0 && currentPositionNoticias < 0) {
                    currentPositionNoticias += itemWidthNoticias;
                    if (currentPositionNoticias > 0) currentPositionNoticias = 0;
                    updateSliderPosition(true); 
                }
                handleButtonClick();
            });
        }
        
        viewportNoticias.addEventListener('mouseenter', () => {
            userHasInteractedRecently = true; // El hover cuenta como interacción reciente
            stopAutoScroll(); 
            clearTimeout(resumeTimer); // Si el mouse entra, cancela la reanudación por botón
        });

        viewportNoticias.addEventListener('mouseleave', () => {
            if (document.hasFocus()) {
                // Solo reanudar si no hay un timer de botón pendiente.
                // Si hay un timer de botón, ese timer decidirá cuándo reanudar.
                // Si no hay timer, la pausa fue solo por hover, así que reanudar.
                const isButtonTimerPending = !!resumeTimer && setTimeout(()=>{},0) !== resumeTimer; // Heurística
                
                userHasInteractedRecently = false; // El hover ya no está activo
                if (!isButtonTimerPending) { // Si no es un timer de botón el que está esperando...
                    startAutoScroll();
                }
                // Si sí era un timer de botón, ese timer se encargará de llamar a startAutoScroll
                // y verificará el hover en ese momento.
            }
        });
        
        window.addEventListener('resize', () => {
            stopAutoScroll(); 
            clearTimeout(resumeTimer); // Detener cualquier reanudación pendiente
            userHasInteractedRecently = false; // Resetear en resize
            calculateCarouselDimensions();
            currentPositionNoticias = 0; 
            updateSliderPosition(false);
            startAutoScroll(); 
        });

        // Carga inicial
        window.addEventListener('load', () => {
            calculateCarouselDimensions();
            updateSliderPosition(false); 
            startAutoScroll();
        });
        if (document.readyState === 'complete') { 
             calculateCarouselDimensions();
             updateSliderPosition(false);
             startAutoScroll();
        }
    }

    // ====== ACTUALIZAR AÑO EN FOOTER ======
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
});