import { useRef, useState, ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import "./TiltedCard.css";

const springValues = {
  damping: 50, // Increased from 30 for more stability
  stiffness: 80, // Reduced from 100 for smoother movement
  mass: 1.5, // Reduced from 2 for less inertia
};

interface TiltedCardProps {
  imageSrc?: string;
  altText?: string;
  captionText?: string;
  containerHeight?: string;
  containerWidth?: string;
  imageHeight?: string;
  imageWidth?: string;
  scaleOnHover?: number;
  rotateAmplitude?: number;
  showMobileWarning?: boolean;
  showTooltip?: boolean;
  overlayContent?: ReactNode;
  displayOverlayContent?: boolean;
  children?: ReactNode;
}

export default function TiltedCard({
  imageSrc,
  altText = "Tilted card image",
  captionText = "",
  containerHeight = "300px",
  containerWidth = "100%",
  imageHeight = "300px",
  imageWidth = "300px",
  scaleOnHover = 1.1,
  rotateAmplitude = 14,
  showMobileWarning = true,
  showTooltip = true,
  overlayContent = null,
  displayOverlayContent = false,
  children,
}: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);
  const opacity = useSpring(0);
  const rotateFigcaption = useSpring(0, {
    stiffness: 200, // Reduced from 350
    damping: 40, // Increased from 30
    mass: 0.8, // Reduced from 1
  });

  const [lastY, setLastY] = useState(0);

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    // Reduce the rotation amplitude for more subtle effect
    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude * 0.5;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude * 0.5;

    rotateX.set(rotationX);
    rotateY.set(rotationY);

    x.set(e.clientX - rect.left);
    y.set(e.clientY - rect.top);

    // Reduce the velocity effect for more stability
    const velocityY = offsetY - lastY;
    rotateFigcaption.set(-velocityY * 0.3); // Reduced from 0.6
    setLastY(offsetY);
  }

  function handleMouseEnter() {
    scale.set(scaleOnHover);
    opacity.set(1);
  }

  function handleMouseLeave() {
    opacity.set(0);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    rotateFigcaption.set(0);
  }

  const isCardMode = !!children;

  return (
    <figure
      ref={ref}
      className={`tilted-card-figure${isCardMode ? ' tilted-card-figure-flex' : ''}`}
      style={{
        height: containerHeight,
        width: containerWidth,
      }}
      onMouseMove={handleMouse}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showMobileWarning && (
        <div className="tilted-card-mobile-alert">
          This effect is not optimized for mobile. Check on desktop.
        </div>
      )}

      <motion.div
        className={`tilted-card-inner${isCardMode ? ' tilted-card-inner-flex' : ''}`}
        style={
          isCardMode
            ? { 
                width: '100%', 
                height: '100%', 
                rotateX, 
                rotateY, 
                scale,
                pointerEvents: 'none' // Don't block clicks during animation
              }
            : { 
                width: imageWidth, 
                height: imageHeight, 
                rotateX, 
                rotateY, 
                scale 
              }
        }
      >
        {isCardMode ? (
          children
        ) : (
          <>
            <motion.img
              src={imageSrc!}
              alt={altText}
              className="tilted-card-img"
              style={{
                width: imageWidth,
                height: imageHeight,
              }}
            />
            {displayOverlayContent && overlayContent && (
              <motion.div className="tilted-card-overlay">
                {overlayContent}
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      {showTooltip && (
        <motion.figcaption
          className="tilted-card-caption"
          style={{
            x,
            y,
            opacity,
            rotate: rotateFigcaption,
          }}
        >
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  );
} 