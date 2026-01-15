"use client";

interface CharacterProps {
  wrongGuesses: number; // 0-6
  won: boolean;
}

export function RobotCharacter({ wrongGuesses, won }: CharacterProps) {
  // Metallic color palette (silvers, blues, teals)
  const colors = {
    body: "#B8C4CE",           // Silver body
    bodyDark: "#8A9AA8",       // Darker silver for shading
    bodyLight: "#D4DEE7",      // Lighter silver for highlights
    accent: "#4A90A4",         // Teal accent
    accentDark: "#357385",     // Darker teal
    screen: "#1A1A2E",         // Dark screen background
    screenActive: "#00D4AA",   // Teal-green screen when active
    screenDim: "#2D3A4A",      // Dim screen color
    lightOn: "#00FF88",        // Bright green indicator light
    lightOff: "#334444",       // Dim indicator light
    antennaOn: "#FF6B6B",      // Red antenna light when on
    antennaOff: "#553333",     // Dim antenna light
    joint: "#6B7B8C",          // Joint color
    platform: "#5C6B7A",       // Platform color
    platformDark: "#4A5866",   // Darker platform
    warning: "#FF4444",        // Warning red
    sparkle: "#00FFFF",        // Cyan sparkles for win
  };

  // Determine robot state based on wrongGuesses
  // 0: Fully powered, all lights on
  // 1: Antenna dims
  // 2: Screen flickers (shows static)
  // 3: Left arm droops
  // 4: Right arm droops
  // 5: Legs buckle (robot slumps)
  // 6: Powered down with "LOW BATTERY"

  const antennaDim = wrongGuesses >= 1;
  const screenFlicker = wrongGuesses >= 2;
  const leftArmDroop = wrongGuesses >= 3;
  const rightArmDroop = wrongGuesses >= 4;
  const legsBuckle = wrongGuesses >= 5;
  const poweredDown = wrongGuesses >= 6;

  // Position adjustments for buckling/slumping
  const bodyY = legsBuckle ? 115 : 100;
  const headY = legsBuckle ? 55 : 40;
  const bodyHeight = legsBuckle ? 70 : 80;

  // Arm droop angles
  const leftArmAngle = leftArmDroop ? 30 : 0;
  const rightArmAngle = rightArmDroop ? -30 : 0;

  // Screen content based on state
  const getScreenContent = () => {
    if (won) {
      return (
        <text
          x="100"
          y={headY + 28}
          textAnchor="middle"
          fill={colors.screenActive}
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          ^_^
        </text>
      );
    }
    if (poweredDown) {
      return (
        <>
          <text
            x="100"
            y={headY + 23}
            textAnchor="middle"
            fill={colors.warning}
            fontSize="7"
            fontFamily="monospace"
            fontWeight="bold"
          >
            LOW
          </text>
          <text
            x="100"
            y={headY + 32}
            textAnchor="middle"
            fill={colors.warning}
            fontSize="7"
            fontFamily="monospace"
            fontWeight="bold"
          >
            BATTERY
          </text>
        </>
      );
    }
    if (screenFlicker) {
      // Static/noise pattern
      return (
        <g opacity="0.6">
          {[...Array(12)].map((_, i) => (
            <rect
              key={i}
              x={80 + (i % 4) * 10}
              y={headY + 12 + Math.floor(i / 4) * 8}
              width="6"
              height="4"
              fill={i % 3 === 0 ? colors.screenDim : colors.screenActive}
              opacity={0.3 + Math.random() * 0.4}
            />
          ))}
        </g>
      );
    }
    // Happy face when powered
    return (
      <>
        {/* Eyes */}
        <circle cx="90" cy={headY + 20} r="4" fill={colors.screenActive} />
        <circle cx="110" cy={headY + 20} r="4" fill={colors.screenActive} />
        {/* Smile */}
        <path
          d={`M 88 ${headY + 30} Q 100 ${headY + 38} 112 ${headY + 30}`}
          fill="none"
          stroke={colors.screenActive}
          strokeWidth="2"
          strokeLinecap="round"
        />
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

      {/* Win state effects - flashing lights */}
      {won && (
        <>
          <g className="animate-pulse">
            {/* Sparkles around robot */}
            <circle cx="40" cy="80" r="4" fill={colors.sparkle} />
            <circle cx="160" cy="70" r="3" fill={colors.sparkle} />
            <circle cx="50" cy="50" r="3" fill={colors.sparkle} />
            <circle cx="150" cy="100" r="4" fill={colors.sparkle} />
          </g>
          <circle cx="35" cy="120" r="3" fill={colors.lightOn} className="animate-ping" />
          <circle cx="165" cy="90" r="2" fill={colors.lightOn} className="animate-ping" style={{ animationDelay: "0.15s" }} />
          <circle cx="45" cy="60" r="2" fill={colors.lightOn} className="animate-ping" style={{ animationDelay: "0.3s" }} />
        </>
      )}

      {/* Legs */}
      {/* Left leg */}
      <g transform={legsBuckle ? `rotate(15, 80, ${bodyY + bodyHeight - 10})` : ""}>
        <rect
          x="72"
          y={bodyY + bodyHeight - 10}
          width="16"
          height={legsBuckle ? 40 : 50}
          rx="4"
          fill={colors.body}
        />
        {/* Knee joint */}
        <circle
          cx="80"
          cy={bodyY + bodyHeight + 15}
          r="6"
          fill={colors.joint}
        />
        {/* Foot */}
        <ellipse
          cx="80"
          cy={legsBuckle ? 215 : 220}
          rx="14"
          ry="8"
          fill={colors.bodyDark}
        />
      </g>

      {/* Right leg */}
      <g transform={legsBuckle ? `rotate(-15, 120, ${bodyY + bodyHeight - 10})` : ""}>
        <rect
          x="112"
          y={bodyY + bodyHeight - 10}
          width="16"
          height={legsBuckle ? 40 : 50}
          rx="4"
          fill={colors.body}
        />
        {/* Knee joint */}
        <circle
          cx="120"
          cy={bodyY + bodyHeight + 15}
          r="6"
          fill={colors.joint}
        />
        {/* Foot */}
        <ellipse
          cx="120"
          cy={legsBuckle ? 215 : 220}
          rx="14"
          ry="8"
          fill={colors.bodyDark}
        />
      </g>

      {/* Body */}
      <rect
        x="65"
        y={bodyY}
        width="70"
        height={bodyHeight}
        rx="8"
        fill={colors.body}
      />
      {/* Body highlight */}
      <rect
        x="70"
        y={bodyY + 5}
        width="25"
        height={bodyHeight - 10}
        rx="4"
        fill={colors.bodyLight}
        opacity="0.3"
      />
      {/* Chest panel */}
      <rect
        x="78"
        y={bodyY + 15}
        width="44"
        height="35"
        rx="4"
        fill={colors.accent}
      />
      {/* Panel details */}
      <rect
        x="82"
        y={bodyY + 20}
        width="36"
        height="25"
        rx="2"
        fill={colors.accentDark}
      />
      {/* Chest lights */}
      <circle
        cx="90"
        cy={bodyY + 30}
        r="4"
        fill={poweredDown ? colors.lightOff : colors.lightOn}
        className={won ? "animate-pulse" : ""}
      />
      <circle
        cx="100"
        cy={bodyY + 30}
        r="4"
        fill={wrongGuesses >= 3 ? colors.lightOff : colors.lightOn}
        className={won ? "animate-pulse" : ""}
        style={won ? { animationDelay: "0.1s" } : {}}
      />
      <circle
        cx="110"
        cy={bodyY + 30}
        r="4"
        fill={wrongGuesses >= 2 ? colors.lightOff : colors.lightOn}
        className={won ? "animate-pulse" : ""}
        style={won ? { animationDelay: "0.2s" } : {}}
      />
      {/* Power meter */}
      <rect
        x="85"
        y={bodyY + 38}
        width="30"
        height="4"
        rx="2"
        fill={colors.screen}
      />
      <rect
        x="85"
        y={bodyY + 38}
        width={Math.max(30 - wrongGuesses * 5, 0)}
        height="4"
        rx="2"
        fill={wrongGuesses >= 5 ? colors.warning : colors.screenActive}
      />

      {/* Arms */}
      {/* Left arm */}
      <g transform={`rotate(${leftArmAngle}, 65, ${bodyY + 20})`}>
        {/* Shoulder joint */}
        <circle cx="60" cy={bodyY + 20} r="8" fill={colors.joint} />
        {/* Upper arm */}
        <rect
          x="45"
          y={bodyY + 15}
          width="12"
          height="35"
          rx="4"
          fill={colors.body}
        />
        {/* Elbow joint */}
        <circle cx="51" cy={bodyY + 50} r="6" fill={colors.joint} />
        {/* Lower arm */}
        <rect
          x="45"
          y={bodyY + 50}
          width="12"
          height="30"
          rx="4"
          fill={colors.body}
        />
        {/* Hand */}
        <circle cx="51" cy={bodyY + 82} r="10" fill={colors.bodyDark} />
        {/* Fingers */}
        <circle cx="44" cy={bodyY + 88} r="4" fill={colors.joint} />
        <circle cx="51" cy={bodyY + 92} r="4" fill={colors.joint} />
        <circle cx="58" cy={bodyY + 88} r="4" fill={colors.joint} />
      </g>

      {/* Right arm */}
      <g transform={`rotate(${rightArmAngle}, 135, ${bodyY + 20})`}>
        {/* Shoulder joint */}
        <circle cx="140" cy={bodyY + 20} r="8" fill={colors.joint} />
        {/* Upper arm */}
        <rect
          x="143"
          y={bodyY + 15}
          width="12"
          height="35"
          rx="4"
          fill={colors.body}
        />
        {/* Elbow joint */}
        <circle cx="149" cy={bodyY + 50} r="6" fill={colors.joint} />
        {/* Lower arm */}
        <rect
          x="143"
          y={bodyY + 50}
          width="12"
          height="30"
          rx="4"
          fill={colors.body}
        />
        {/* Hand */}
        <circle cx="149" cy={bodyY + 82} r="10" fill={colors.bodyDark} />
        {/* Fingers */}
        <circle cx="142" cy={bodyY + 88} r="4" fill={colors.joint} />
        <circle cx="149" cy={bodyY + 92} r="4" fill={colors.joint} />
        <circle cx="156" cy={bodyY + 88} r="4" fill={colors.joint} />
      </g>

      {/* Neck */}
      <rect
        x="90"
        y={bodyY - 15}
        width="20"
        height="20"
        rx="2"
        fill={colors.joint}
      />

      {/* Head */}
      <rect
        x="65"
        y={headY}
        width="70"
        height="50"
        rx="8"
        fill={colors.body}
      />
      {/* Head highlight */}
      <rect
        x="70"
        y={headY + 5}
        width="20"
        height="40"
        rx="4"
        fill={colors.bodyLight}
        opacity="0.3"
      />

      {/* Screen (face) */}
      <rect
        x="75"
        y={headY + 8}
        width="50"
        height="34"
        rx="4"
        fill={colors.screen}
      />
      {/* Screen content */}
      {getScreenContent()}

      {/* Side lights on head */}
      <circle
        cx="68"
        cy={headY + 25}
        r="5"
        fill={poweredDown ? colors.lightOff : colors.accent}
        className={won ? "animate-pulse" : ""}
      />
      <circle
        cx="132"
        cy={headY + 25}
        r="5"
        fill={wrongGuesses >= 4 ? colors.lightOff : colors.accent}
        className={won ? "animate-pulse" : ""}
        style={won ? { animationDelay: "0.15s" } : {}}
      />

      {/* Antenna */}
      <rect
        x="97"
        y={headY - 20}
        width="6"
        height="22"
        rx="2"
        fill={colors.bodyDark}
      />
      {/* Antenna light */}
      <circle
        cx="100"
        cy={headY - 22}
        r="6"
        fill={antennaDim ? colors.antennaOff : colors.antennaOn}
        className={won ? "animate-ping" : ""}
      />
      {/* Antenna glow when on */}
      {!antennaDim && !poweredDown && (
        <circle
          cx="100"
          cy={headY - 22}
          r="10"
          fill={colors.antennaOn}
          opacity="0.3"
        />
      )}

      {/* Ears / side sensors */}
      <rect
        x="55"
        y={headY + 10}
        width="8"
        height="20"
        rx="2"
        fill={colors.accent}
      />
      <rect
        x="137"
        y={headY + 10}
        width="8"
        height="20"
        rx="2"
        fill={colors.accent}
      />

      {/* Bolts on head */}
      <circle cx="72" cy={headY + 45} r="3" fill={colors.joint} />
      <circle cx="128" cy={headY + 45} r="3" fill={colors.joint} />
    </svg>
  );
}
