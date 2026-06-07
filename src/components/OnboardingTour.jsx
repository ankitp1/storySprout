import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

export default function OnboardingTour({ steps, onComplete, active }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const tourBoxRef = useRef(null);
  const [positionStyle, setPositionStyle] = useState({});

  const step = steps[currentStep];

  // Reset step to 0 when tour becomes active
  useEffect(() => {
    if (active) {
      setCurrentStep(0);
    }
  }, [active]);

  // Update target element position
  useEffect(() => {
    if (!active) return;

    const updatePosition = () => {
      if (!step || !step.selector) {
        setTargetRect(null);
        setPositionStyle({
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1100,
        });
        return;
      }

      const element = document.querySelector(step.selector);
      if (element) {
        // Scroll element into view if needed
        element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        
        // Wait a small bit for scroll/render
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);

          // Calculate tour box position
          const boxWidth = 320;
          const boxHeight = 220; // estimate
          const padding = 16;
          let top = rect.bottom + padding + window.scrollY;
          let left = rect.left + rect.width / 2 - boxWidth / 2 + window.scrollX;

          // Prevent off-screen left/right
          if (left < padding) left = padding;
          if (left + boxWidth > window.innerWidth - padding) {
            left = window.innerWidth - boxWidth - padding;
          }

          // If element is near bottom, show above instead
          if (rect.bottom + boxHeight > window.innerHeight) {
            top = rect.top - boxHeight - padding + window.scrollY;
          }

          setPositionStyle({
            position: 'absolute',
            top: `${top}px`,
            left: `${left}px`,
            width: `${boxWidth}px`,
            zIndex: 1100,
          });
        }, 100);
      } else {
        // Fallback to center if element not found
        setTargetRect(null);
        setPositionStyle({
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1100,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [currentStep, step, active]);

  if (!active || !step) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1050 }}>
      {/* Dimmed Overlay Backdrop */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
          pointerEvents: 'auto',
          zIndex: 1040,
          transition: 'all 0.3s ease'
        }}
        onClick={onComplete}
      />

      {/* Target Highlight Outline */}
      {targetRect && (
        <div 
          style={{
            position: 'absolute',
            top: `${targetRect.top + window.scrollY - 8}px`,
            left: `${targetRect.left + window.scrollX - 8}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
            borderRadius: '16px',
            border: '4px solid var(--tertiary)',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 20px var(--tertiary)',
            pointerEvents: 'none',
            zIndex: 1045,
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        />
      )}

      {/* Tour Card */}
      <div 
        ref={tourBoxRef}
        style={{
          background: 'var(--surface-color)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          boxShadow: 'var(--shadow-lg)',
          border: '3px solid var(--primary)',
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          transition: 'all 0.3s ease',
          ...positionStyle
        }}
      >
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ 
            fontSize: '0.85rem', 
            fontWeight: 'bold', 
            background: 'var(--primary-light)', 
            color: 'white', 
            padding: '2px 8px', 
            borderRadius: '12px' 
          }}>
            🌱 Step {currentStep + 1} of {steps.length}
          </span>
          <button 
            onClick={onComplete}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '50%'
            }}
            title="Skip Tour"
          >
            <X size={18} />
          </button>
        </div>

        {/* Card Body */}
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
            {step.icon && <span style={{ fontSize: '1.2rem' }}>{step.icon}</span>}
            {step.title}
          </h4>
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            {step.content}
          </p>
        </div>

        {/* Card Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <button 
            className="btn-secondary"
            onClick={handleBack}
            disabled={currentStep === 0}
            style={{ 
              padding: '0.4rem 0.8rem', 
              fontSize: '0.85rem', 
              opacity: currentStep === 0 ? 0.3 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>

          <button 
            className="btn-primary"
            onClick={handleNext}
            style={{ 
              padding: '0.4rem 1rem', 
              fontSize: '0.85rem', 
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {currentStep === steps.length - 1 ? 'Finish!' : 'Next'} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
