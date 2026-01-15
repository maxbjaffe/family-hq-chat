"use client";

interface CharacterProps {
  wrongGuesses: number; // 0-6
  won: boolean;
}

export function MonsterCharacter({ wrongGuesses, won }: CharacterProps) {
  // Playful color palette (purples, greens, magentas)
  const colors = {
    body: "#9B59B6",            // Purple main body
    bodyDark: "#7D3C98",        // Darker purple for shading
    bodyLight: "#BB8FCE",       // Lighter purple for highlights
    belly: "#58D68D",           // Green belly spot
    bellyDark: "#45B374",       // Darker green
    spots: "#E91E8C",           // Magenta spots
    spotsDark: "#C4157A",       // Darker magenta
    eye: "#FFFFFF",             // White eyes
    pupil: "#2C3E50",           // Dark pupils
    mouth: "#7D3C98",           // Mouth color
    tongue: "#FF69B4",          // Pink tongue
    cheeks: "#FF69B4",          // Pink cheeks
    horns: "#45B374",           // Green horns
    platform: "#8E44AD",        // Purple platform
    platformDark: "#6C3483",    // Darker platform
    sparkle: "#FFD700",         // Gold sparkles for win
    tear: "#74B9FF",            // Blue tears
  };

  // Monster shrinks as wrong guesses increase
  // 0: Full size, big happy blob
  // 1: Slightly smaller, still happy
  // 2: Smaller, uncertain
  // 3: Medium, worried
  // 4: Small, sad
  // 5: Tiny, very sad
  // 6: Tiniest and pouty

  // Calculate scale based on wrong guesses (1.0 down to 0.4)
  const baseScale = won ? 1.1 : Math.max(1.0 - wrongGuesses * 0.1, 0.4);

  // Center point for scaling
  const centerX = 100;
  const centerY = 150;

  // Expression states
  const isHappy = wrongGuesses === 0;
  const isUncertain = wrongGuesses === 1 || wrongGuesses === 2;
  const isWorried = wrongGuesses === 3;
  const isSad = wrongGuesses === 4 || wrongGuesses === 5;
  const isPouty = wrongGuesses >= 6;

  // Eye size changes with scale
  const eyeScale = baseScale;

  // Get mouth path based on state
  const getMouth = () => {
    const mouthY = 170;

    if (won) {
      // Huge grin
      return (
        <g transform={`translate(${centerX}, ${mouthY}) scale(${baseScale})`}>
          <path
            d="M -30 0 Q 0 35 30 0"
            fill={colors.tongue}
            stroke={colors.mouth}
            strokeWidth="3"
          />
          <path
            d="M -30 0 Q 0 25 30 0"
            fill="none"
            stroke={colors.mouth}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Teeth */}
          <rect x="-15" y="-2" width="8" height="8" rx="1" fill="white" />
          <rect x="7" y="-2" width="8" height="8" rx="1" fill="white" />
        </g>
      );
    }

    if (isPouty) {
      // Pouty frown
      return (
        <g transform={`translate(${centerX}, ${mouthY}) scale(${baseScale})`}>
          <path
            d="M -15 8 Q 0 -5 15 8"
            fill="none"
            stroke={colors.mouth}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      );
    }

    if (isSad) {
      // Sad frown
      return (
        <g transform={`translate(${centerX}, ${mouthY}) scale(${baseScale})`}>
          <path
            d="M -20 10 Q 0 -3 20 10"
            fill="none"
            stroke={colors.mouth}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      );
    }

    if (isWorried) {
      // Worried wavy mouth
      return (
        <g transform={`translate(${centerX}, ${mouthY}) scale(${baseScale})`}>
          <path
            d="M -20 5 Q -10 0 0 5 Q 10 10 20 5"
            fill="none"
            stroke={colors.mouth}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      );
    }

    if (isUncertain) {
      // Uncertain/neutral mouth
      return (
        <g transform={`translate(${centerX}, ${mouthY}) scale(${baseScale})`}>
          <path
            d="M -18 5 Q 0 8 18 5"
            fill="none"
            stroke={colors.mouth}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // Happy smile with tongue
    return (
      <g transform={`translate(${centerX}, ${mouthY}) scale(${baseScale})`}>
        <path
          d="M -25 0 Q 0 25 25 0"
          fill={colors.tongue}
          stroke={colors.mouth}
          strokeWidth="3"
        />
        <path
          d="M -25 0 Q 0 18 25 0"
          fill="none"
          stroke={colors.mouth}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    );
  };

  // Get eyes based on state
  const getEyes = () => {
    const leftEyeX = 70;
    const rightEyeX = 130;
    const eyeY = 130;

    if (won) {
      // Happy squinted eyes
      return (
        <>
          <g transform={`translate(${leftEyeX}, ${eyeY}) scale(${eyeScale})`}>
            <path
              d="M -12 0 Q 0 -10 12 0"
              fill="none"
              stroke={colors.pupil}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
          <g transform={`translate(${rightEyeX}, ${eyeY}) scale(${eyeScale})`}>
            <path
              d="M -12 0 Q 0 -10 12 0"
              fill="none"
              stroke={colors.pupil}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>
        </>
      );
    }

    // Pupil position changes based on mood
    const pupilOffsetY = isPouty ? 3 : isSad ? 2 : 0;
    const pupilOffsetX = isPouty ? 0 : 2;

    // Eye shape changes
    const eyeHeight = isPouty ? 15 : isSad ? 18 : isWorried ? 22 : 25;

    return (
      <>
        {/* Left eye */}
        <g transform={`translate(${leftEyeX}, ${eyeY}) scale(${eyeScale})`}>
          <ellipse cx="0" cy="0" rx="18" ry={eyeHeight} fill={colors.eye} />
          <ellipse
            cx={pupilOffsetX}
            cy={pupilOffsetY}
            rx="8"
            ry="10"
            fill={colors.pupil}
          />
          <circle cx={pupilOffsetX + 3} cy={pupilOffsetY - 4} r="3" fill="white" />
          {/* Worried eyebrow */}
          {(isWorried || isSad || isPouty) && (
            <line
              x1="-15"
              y1={-eyeHeight - 5}
              x2="15"
              y2={-eyeHeight - (isWorried ? 10 : 8)}
              stroke={colors.bodyDark}
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}
        </g>

        {/* Right eye */}
        <g transform={`translate(${rightEyeX}, ${eyeY}) scale(${eyeScale})`}>
          <ellipse cx="0" cy="0" rx="18" ry={eyeHeight} fill={colors.eye} />
          <ellipse
            cx={-pupilOffsetX}
            cy={pupilOffsetY}
            rx="8"
            ry="10"
            fill={colors.pupil}
          />
          <circle cx={-pupilOffsetX + 3} cy={pupilOffsetY - 4} r="3" fill="white" />
          {/* Worried eyebrow */}
          {(isWorried || isSad || isPouty) && (
            <line
              x1="-15"
              y1={-eyeHeight - (isWorried ? 10 : 8)}
              x2="15"
              y2={-eyeHeight - 5}
              stroke={colors.bodyDark}
              strokeWidth="4"
              strokeLinecap="round"
            />
          )}
        </g>

        {/* Tears when sad or pouty */}
        {(isSad || isPouty) && (
          <>
            <circle
              cx={leftEyeX + 10 * eyeScale}
              cy={eyeY + 30 * eyeScale}
              r={4 * eyeScale}
              fill={colors.tear}
              opacity="0.8"
            />
            <circle
              cx={rightEyeX - 10 * eyeScale}
              cy={eyeY + 25 * eyeScale}
              r={3 * eyeScale}
              fill={colors.tear}
              opacity="0.8"
            />
          </>
        )}
      </>
    );
  };

  return (
    <svg
      viewBox="0 0 200 250"
      className={`w-full h-48 md:h-64 ${won ? "animate-bounce" : ""}`}
    >
      {/* Platform */}
      <ellipse
        cx="100"
        cy="230"
        rx="65"
        ry="12"
        fill={colors.platformDark}
      />
      <ellipse
        cx="100"
        cy="228"
        rx="65"
        ry="10"
        fill={colors.platform}
      />

      {/* Win state sparkles */}
      {won && (
        <>
          <g className="animate-pulse">
            <polygon
              points="30,70 33,80 43,80 35,86 38,96 30,90 22,96 25,86 17,80 27,80"
              fill={colors.sparkle}
            />
            <polygon
              points="170,60 172,67 179,67 174,71 176,78 170,74 164,78 166,71 161,67 168,67"
              fill={colors.sparkle}
              transform="scale(0.9) translate(20, 10)"
            />
            <polygon
              points="50,50 52,57 59,57 54,61 56,68 50,64 44,68 46,61 41,57 48,57"
              fill={colors.sparkle}
              transform="scale(0.7) translate(180, 30)"
            />
          </g>
          <circle cx="40" cy="110" r="4" fill={colors.spots} className="animate-ping" />
          <circle cx="160" cy="100" r="3" fill={colors.sparkle} className="animate-ping" style={{ animationDelay: "0.2s" }} />
          <circle cx="55" cy="60" r="3" fill={colors.belly} className="animate-ping" style={{ animationDelay: "0.4s" }} />
        </>
      )}

      {/* Monster body blob */}
      <g transform={`translate(${centerX}, ${centerY}) scale(${baseScale}) translate(${-centerX}, ${-centerY})`}>
        {/* Main blob body */}
        <ellipse
          cx="100"
          cy="160"
          rx="55"
          ry="65"
          fill={colors.body}
        />

        {/* Body highlight */}
        <ellipse
          cx="80"
          cy="140"
          rx="25"
          ry="30"
          fill={colors.bodyLight}
          opacity="0.4"
        />

        {/* Belly spot */}
        <ellipse
          cx="105"
          cy="175"
          rx="25"
          ry="20"
          fill={colors.belly}
        />
        <ellipse
          cx="100"
          cy="172"
          rx="18"
          ry="14"
          fill={colors.bellyDark}
          opacity="0.3"
        />

        {/* Decorative spots */}
        <circle cx="55" cy="140" r="8" fill={colors.spots} />
        <circle cx="145" cy="145" r="6" fill={colors.spots} />
        <circle cx="60" cy="175" r="5" fill={colors.spots} />
        <circle cx="140" cy="180" r="7" fill={colors.spots} />
        <circle cx="130" cy="120" r="4" fill={colors.spotsDark} />
        <circle cx="70" cy="115" r="5" fill={colors.spotsDark} />

        {/* Small horns/antennae */}
        <ellipse
          cx="70"
          cy="95"
          rx="8"
          ry="15"
          fill={colors.horns}
          transform="rotate(-15, 70, 95)"
        />
        <ellipse
          cx="130"
          cy="95"
          rx="8"
          ry="15"
          fill={colors.horns}
          transform="rotate(15, 130, 95)"
        />
        <circle cx="68" cy="82" r="5" fill={colors.belly} />
        <circle cx="132" cy="82" r="5" fill={colors.belly} />

        {/* Little arms */}
        <ellipse
          cx="45"
          cy="160"
          rx="12"
          ry="18"
          fill={colors.body}
          transform="rotate(-20, 45, 160)"
        />
        <ellipse
          cx="155"
          cy="160"
          rx="12"
          ry="18"
          fill={colors.body}
          transform="rotate(20, 155, 160)"
        />

        {/* Arm highlights */}
        <ellipse
          cx="42"
          cy="155"
          rx="6"
          ry="10"
          fill={colors.bodyLight}
          opacity="0.4"
          transform="rotate(-20, 42, 155)"
        />
        <ellipse
          cx="158"
          cy="155"
          rx="6"
          ry="10"
          fill={colors.bodyLight}
          opacity="0.4"
          transform="rotate(20, 158, 155)"
        />

        {/* Little feet */}
        <ellipse cx="75" cy="220" rx="15" ry="10" fill={colors.body} />
        <ellipse cx="125" cy="220" rx="15" ry="10" fill={colors.body} />
        <ellipse cx="75" cy="222" rx="10" ry="6" fill={colors.bodyLight} opacity="0.4" />
        <ellipse cx="125" cy="222" rx="10" ry="6" fill={colors.bodyLight} opacity="0.4" />

        {/* Cheek blush */}
        <circle cx="55" cy="155" r="10" fill={colors.cheeks} opacity="0.4" />
        <circle cx="145" cy="155" r="10" fill={colors.cheeks} opacity="0.4" />
      </g>

      {/* Eyes (separate so they scale nicely) */}
      {getEyes()}

      {/* Mouth */}
      {getMouth()}
    </svg>
  );
}
