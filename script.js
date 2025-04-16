// Add smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add intersection observer for scroll animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        }
    });
}, {
    threshold: 0.1
});

// Observe all unit cards
document.querySelectorAll('.unit-card').forEach((card) => {
    observer.observe(card);
});

// Add hover effect sound (optional)
document.querySelectorAll('.unit-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        // You can add a subtle hover sound here if desired
    });
}); 