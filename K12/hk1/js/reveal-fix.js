// js/reveal-fix.js - Fix Reveal.js plugin errors
(function() {
    'use strict';
    
    // Fix for Reveal.js plugins
    if (typeof Reveal !== 'undefined') {
        
        // Safe plugin initialization
        const safeInitReveal = function() {
            try {
                // Check if Reveal is already initialized
                if (Reveal.isReady && Reveal.isReady()) {
                    console.log('🔧 Reveal.js already initialized - skipping');
                    return;
                }
                
                // Simple initialization without problematic plugins
                Reveal.initialize({
                    hash: true,
                    controls: true,
                    progress: true,
                    center: true,
                    transition: 'slide',
                    // Minimal plugins to avoid errors
                    plugins: [] 
                }).then(() => {
                    console.log('🔧 Reveal.js initialized safely');
                }).catch(error => {
                    console.warn('🔧 Reveal.js init warning:', error);
                });
                
            } catch (error) {
                console.error('🔧 Reveal.js init error:', error);
            }
        };
        
        // Wait for DOM and then initialize
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', safeInitReveal);
        } else {
            safeInitReveal();
        }
    }
    
    // Fix MathJax issues
    if (window.MathJax) {
        window.MathJax.startup = window.MathJax.startup || {};
        window.MathJax.startup.ready = function() {
            console.log('🔧 MathJax is ready');
            if (window.MathJax.startup.defaultReady) {
                window.MathJax.startup.defaultReady();
            }
        };
    }
})();