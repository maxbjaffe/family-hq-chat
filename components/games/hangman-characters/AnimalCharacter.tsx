"use client";

interface CharacterProps {
  wrongGuesses: number; // 0-6
  won: boolean;
}

export function AnimalCharacter({ wrongGuesses, won }: CharacterProps) {
  // Warm color palette
  const colors = {
    body: "#F5D0C5",        // Soft peachy pink
    bodyDark: "#E8B4A6",    // Darker peachy pink for shading
    inner: "#FFE4E1",       // Misty rose for inner ears
    nose: "#D4877E",        // Dusty rose nose
    cheeks: "#FFCCC2",      // Soft coral cheeks
    eyes: "#5D4037",        // Warm brown eyes
    platform: "#DEB887",    // Burlywood platform
    platformDark: "#C9A66B", // Darker platform
    sparkle: "#FFD700",     // Gold sparkles
    zzz: "#9CA3AF",         // Gray for ZZZ
  };

  // Animation keyframes for win state bounce
  const bounceAnimation = won ? "animate-bounce" : "";

  // Determine bunny state based on wrongGuesses
  // 0: Happy and alert
  // 1: Ears start to droop
  // 2: Eyes get sleepy (half-closed)
  // 3: Yawning
  // 4: Sitting down
  // 5: Lying down
  // 6: Asleep with ZZZ

  const earDroop = Math.min(wrongGuesses * 8, 48); // Max 48 degrees droop at stage 6
  const eyeOpenness = wrongGuesses >= 2 ? Math.max(1 - (wrongGuesses - 1) * 0.15, 0.3) : 1;
  const isSitting = wrongGuesses >= 4;
  const isLyingDown = wrongGuesses >= 5;
  const isAsleep = wrongGuesses >= 6;
  const isYawning = wrongGuesses === 3;

  // Position adjustments for sitting/lying
  const bodyY = isSitting ? (isLyingDown ? 180 : 160) : 140;
  const headY = isSitting ? (isLyingDown ? 155 : 125) : 95;

  return (
    <svg
      viewBox="0 0 200 250"
      className={`w-full h-48 md:h-64 ${bounceAnimation}`}
    >
      {/* Platform */}
      <ellipse
        cx="100"
        cy="230"
        rx="70"
        ry="12"
        fill={colors.platformDark}
      />
      <ellipse
        cx="100"
        cy="228"
        rx="70"
        ry="10"
        fill={colors.platform}
      />

      {/* Win state sparkles */}
      {won && (
        <>
          <g className="animate-pulse">
            <polygon
              points="30,60 33,70 43,70 35,76 38,86 30,80 22,86 25,76 17,70 27,70"
              fill={colors.sparkle}
            />
            <polygon
              points="170,50 172,57 179,57 174,61 176,68 170,64 164,68 166,61 161,57 168,57"
              fill={colors.sparkle}
              transform="scale(0.8) translate(40, 10)"
            />
            <polygon
              points="50,40 52,47 59,47 54,51 56,58 50,54 44,58 46,51 41,47 48,47"
              fill={colors.sparkle}
              transform="scale(0.7) translate(180, 20)"
            />
          </g>
          {/* Extra sparkle particles */}
          <circle cx="45" cy="90" r="3" fill={colors.sparkle} className="animate-ping" />
          <circle cx="155" cy="80" r="2" fill={colors.sparkle} className="animate-ping" style={{ animationDelay: "0.2s" }} />
          <circle cx="60" cy="50" r="2" fill={colors.sparkle} className="animate-ping" style={{ animationDelay: "0.4s" }} />
        </>
      )}

      {/* ZZZ for sleeping */}
      {isAsleep && (
        <g fill={colors.zzz} fontFamily="Comic Sans MS, cursive" fontWeight="bold">
          <text x="140" y="120" fontSize="16" opacity="0.9">Z</text>
          <text x="155" y="105" fontSize="14" opacity="0.7">z</text>
          <text x="165" y="95" fontSize="12" opacity="0.5">z</text>
        </g>
      )}

      {/* Bunny body */}
      {isLyingDown ? (
        // Lying down body - horizontal oval
        <>
          <ellipse
            cx="100"
            cy={bodyY}
            rx="50"
            ry="30"
            fill={colors.body}
          />
          {/* Belly highlight */}
          <ellipse
            cx="100"
            cy={bodyY + 5}
            rx="35"
            ry="18"
            fill={colors.inner}
            opacity="0.5"
          />
        </>
      ) : isSitting ? (
        // Sitting body - squished oval
        <>
          <ellipse
            cx="100"
            cy={bodyY}
            rx="40"
            ry="35"
            fill={colors.body}
          />
          {/* Belly */}
          <ellipse
            cx="100"
            cy={bodyY + 8}
            rx="28"
            ry="22"
            fill={colors.inner}
            opacity="0.5"
          />
        </>
      ) : (
        // Standing body
        <>
          <ellipse
            cx="100"
            cy={bodyY}
            rx="35"
            ry="45"
            fill={colors.body}
          />
          {/* Belly */}
          <ellipse
            cx="100"
            cy={bodyY + 10}
            rx="25"
            ry="30"
            fill={colors.inner}
            opacity="0.5"
          />
        </>
      )}

      {/* Back feet (when lying down) */}
      {isLyingDown && (
        <>
          <ellipse cx="145" cy={bodyY + 15} rx="12" ry="8" fill={colors.body} />
          <ellipse cx="55" cy={bodyY + 15} rx="12" ry="8" fill={colors.body} />
        </>
      )}

      {/* Front feet/paws */}
      {!isLyingDown && (
        <>
          <ellipse
            cx="75"
            cy={isSitting ? bodyY + 30 : 185}
            rx="12"
            ry={isSitting ? 10 : 15}
            fill={colors.body}
          />
          <ellipse
            cx="125"
            cy={isSitting ? bodyY + 30 : 185}
            rx="12"
            ry={isSitting ? 10 : 15}
            fill={colors.body}
          />
          {/* Paw pads */}
          <ellipse
            cx="75"
            cy={isSitting ? bodyY + 33 : 190}
            rx="6"
            ry={isSitting ? 5 : 8}
            fill={colors.inner}
          />
          <ellipse
            cx="125"
            cy={isSitting ? bodyY + 33 : 190}
            rx="6"
            ry={isSitting ? 5 : 8}
            fill={colors.inner}
          />
        </>
      )}

      {/* Tail */}
      <circle
        cx={isLyingDown ? 50 : 100}
        cy={isLyingDown ? bodyY : bodyY + 35}
        r="10"
        fill={colors.inner}
      />

      {/* Head */}
      <ellipse
        cx="100"
        cy={headY}
        rx="38"
        ry={isLyingDown ? 30 : 35}
        fill={colors.body}
      />

      {/* Ears */}
      {/* Left ear */}
      <g transform={`rotate(${-15 - earDroop}, 75, ${headY - 25})`}>
        <ellipse
          cx="75"
          cy={headY - 55}
          rx="12"
          ry="35"
          fill={colors.body}
        />
        <ellipse
          cx="75"
          cy={headY - 50}
          rx="7"
          ry="25"
          fill={colors.inner}
        />
      </g>

      {/* Right ear */}
      <g transform={`rotate(${15 + earDroop}, 125, ${headY - 25})`}>
        <ellipse
          cx="125"
          cy={headY - 55}
          rx="12"
          ry="35"
          fill={colors.body}
        />
        <ellipse
          cx="125"
          cy={headY - 50}
          rx="7"
          ry="25"
          fill={colors.inner}
        />
      </g>

      {/* Cheeks */}
      <circle cx="70" cy={headY + 8} r="10" fill={colors.cheeks} opacity="0.6" />
      <circle cx="130" cy={headY + 8} r="10" fill={colors.cheeks} opacity="0.6" />

      {/* Eyes */}
      {won ? (
        // Happy closed eyes (arcs) for win
        <>
          <path
            d={`M 80 ${headY - 5} Q 85 ${headY - 12} 90 ${headY - 5}`}
            fill="none"
            stroke={colors.eyes}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={`M 110 ${headY - 5} Q 115 ${headY - 12} 120 ${headY - 5}`}
            fill="none"
            stroke={colors.eyes}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : isAsleep ? (
        // Sleeping eyes (closed lines)
        <>
          <line
            x1="80"
            y1={headY - 5}
            x2="95"
            y2={headY - 5}
            stroke={colors.eyes}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="105"
            y1={headY - 5}
            x2="120"
            y2={headY - 5}
            stroke={colors.eyes}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      ) : (
        // Normal/sleepy eyes
        <>
          {/* Eye whites */}
          <ellipse
            cx="85"
            cy={headY - 5}
            rx="10"
            ry={10 * eyeOpenness}
            fill="white"
          />
          <ellipse
            cx="115"
            cy={headY - 5}
            rx="10"
            ry={10 * eyeOpenness}
            fill="white"
          />
          {/* Pupils */}
          <ellipse
            cx="85"
            cy={headY - 5}
            rx="5"
            ry={5 * eyeOpenness}
            fill={colors.eyes}
          />
          <ellipse
            cx="115"
            cy={headY - 5}
            rx="5"
            ry={5 * eyeOpenness}
            fill={colors.eyes}
          />
          {/* Eye shine */}
          {eyeOpenness > 0.5 && (
            <>
              <circle cx="83" cy={headY - 7} r="2" fill="white" />
              <circle cx="113" cy={headY - 7} r="2" fill="white" />
            </>
          )}
        </>
      )}

      {/* Nose */}
      <ellipse
        cx="100"
        cy={headY + 10}
        rx="6"
        ry="4"
        fill={colors.nose}
      />

      {/* Mouth */}
      {won ? (
        // Big happy smile for win
        <path
          d={`M 88 ${headY + 18} Q 100 ${headY + 30} 112 ${headY + 18}`}
          fill="none"
          stroke={colors.nose}
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : isYawning ? (
        // Yawning mouth (open oval)
        <ellipse
          cx="100"
          cy={headY + 22}
          rx="8"
          ry="10"
          fill={colors.inner}
          stroke={colors.nose}
          strokeWidth="1"
        />
      ) : isAsleep ? (
        // Peaceful sleeping mouth
        <path
          d={`M 95 ${headY + 18} Q 100 ${headY + 20} 105 ${headY + 18}`}
          fill="none"
          stroke={colors.nose}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : wrongGuesses >= 4 ? (
        // Worried/sad mouth
        <path
          d={`M 92 ${headY + 22} Q 100 ${headY + 18} 108 ${headY + 22}`}
          fill="none"
          stroke={colors.nose}
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : wrongGuesses >= 1 ? (
        // Neutral/concerned mouth
        <path
          d={`M 92 ${headY + 18} L 108 ${headY + 18}`}
          fill="none"
          stroke={colors.nose}
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        // Happy smile
        <path
          d={`M 92 ${headY + 18} Q 100 ${headY + 25} 108 ${headY + 18}`}
          fill="none"
          stroke={colors.nose}
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}

      {/* Whiskers */}
      <g stroke={colors.bodyDark} strokeWidth="1" opacity="0.5">
        {/* Left whiskers */}
        <line x1="45" y1={headY + 5} x2="68" y2={headY + 8} />
        <line x1="45" y1={headY + 12} x2="68" y2={headY + 12} />
        <line x1="48" y1={headY + 19} x2="68" y2={headY + 16} />
        {/* Right whiskers */}
        <line x1="132" y1={headY + 8} x2="155" y2={headY + 5} />
        <line x1="132" y1={headY + 12} x2="155" y2={headY + 12} />
        <line x1="132" y1={headY + 16} x2="152" y2={headY + 19} />
      </g>
    </svg>
  );
}
