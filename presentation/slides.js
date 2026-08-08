document.addEventListener('DOMContentLoaded', () => {
  const slides = document.querySelectorAll('.slide');
  const slideIndicator = document.getElementById('slideIndicator');
  const progressBar = document.getElementById('progressBar');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnFullscreen = document.getElementById('btnFullscreen');
  
  let currentSlide = 1;
  const totalSlides = slides.length;

  function showSlide(index) {
    if (index < 1) index = 1;
    if (index > totalSlides) index = totalSlides;

    slides.forEach(slide => {
      slide.classList.remove('active');
      if (parseInt(slide.getAttribute('data-slide')) === index) {
        slide.classList.add('active');
      }
    });

    currentSlide = index;
    slideIndicator.textContent = `Slide ${currentSlide} of ${totalSlides}`;
    const progressPercent = (currentSlide / totalSlides) * 100;
    progressBar.style.width = `${progressPercent}%`;
  }

  btnPrev.addEventListener('click', () => showSlide(currentSlide - 1));
  btnNext.addEventListener('click', () => showSlide(currentSlide + 1));

  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Space') {
      e.preventDefault();
      showSlide(currentSlide + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      showSlide(currentSlide - 1);
    } else if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
  });

  showSlide(1);
});
