
// ========================== CARROSSEL DE SERVIÇOS ==========================
const carouselTrack = document.getElementById('carouselTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('carouselDots');
const serviceCards = document.querySelectorAll('.service-card');

let currentIndex = 0;
let cardsToShow = window.innerWidth <= 768 ? 1 : 2;
let totalCards = serviceCards.length;
let maxIndex = Math.max(0, totalCards - cardsToShow);

// Atualiza configurações do carrossel ao redimensionar
function updateCarouselSettings() {
    cardsToShow = window.innerWidth <= 768 ? 1 : 2;
    totalCards = serviceCards.length;
    maxIndex = Math.max(0, totalCards - cardsToShow);
    if (currentIndex > maxIndex) currentIndex = 0;
}

// Cria os indicadores (dots) do carrossel
function createDots() {
    dotsContainer.innerHTML = '';
    for (let i = 0; i <= maxIndex; i++) {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === currentIndex) {
            dot.classList.add('active');
        }
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }
}

// Atualiza a posição do carrossel e os controles
function updateCarousel() {
    const cardWidth = serviceCards[0].offsetWidth;

    const offset = -(currentIndex * (cardWidth ));
    carouselTrack.style.transform = `translateX(${offset}px)`;

    // Não desabilita os botões para permitir loop infinito
    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
    });
}

// Vai para um slide específico
function goToSlide(index) {
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    updateCarousel();
}

// Botão anterior (loop infinito)
prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
    } else {
        currentIndex = maxIndex; // Vai para o último slide possível
    }
    updateCarousel();
});

// Botão próximo (loop infinito)
nextBtn.addEventListener('click', () => {
    if (currentIndex < maxIndex) {
        currentIndex++;
    } else {
        currentIndex = 0; // Volta para o primeiro slide
    }
    updateCarousel();
});


