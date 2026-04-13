import React from "react";
import Svg, { Circle, Rect, Path, Ellipse, G, Defs, RadialGradient, Stop, LinearGradient } from "react-native-svg";

type Props = {
  level: number;
  mood: "active" | "normal" | "lonely";
  size?: number;
};

/**
 * レベル別キャラクターSVG（2頭身デフォルメ人型）
 * Lv1: 布の服の赤ちゃん冒険者
 * Lv2: 革装備の見習い騎士
 * Lv3: 鉄の鎧のクエストナイト
 * Lv4: 銀装備+マント
 * Lv5: 金装備+英雄マント
 * Lv6: 輝く鎧+賢者の杖
 * Lv7: 王冠+聖剣の伝説の勇者
 */
export default function CharacterSvg({ level, mood, size = 120 }: Props) {
  // 機嫌による目の表現
  const eyeExpr = mood === "active" ? "happy" : mood === "lonely" ? "sad" : "normal";

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {commonDefs()}
      {level === 1 && renderLv1(eyeExpr)}
      {level === 2 && renderLv2(eyeExpr)}
      {level === 3 && renderLv3(eyeExpr)}
      {level === 4 && renderLv4(eyeExpr)}
      {level === 5 && renderLv5(eyeExpr)}
      {level === 6 && renderLv6(eyeExpr)}
      {level >= 7 && renderLv7(eyeExpr)}
    </Svg>
  );
}

type EyeExpr = "happy" | "sad" | "normal";

function commonDefs() {
  return (
    <Defs>
      <RadialGradient id="skin" cx="50%" cy="40%" r="50%">
        <Stop offset="0%" stopColor="#FDDCB5" />
        <Stop offset="100%" stopColor="#F5C99A" />
      </RadialGradient>
      <RadialGradient id="cheek" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#FFB3B3" stopOpacity={0.6} />
        <Stop offset="100%" stopColor="#FFB3B3" stopOpacity={0} />
      </RadialGradient>
    </Defs>
  );
}

/** 顔ベース（全レベル共通） */
function face(eyeExpr: EyeExpr, yOff = 0) {
  const ey = 38 + yOff;
  return (
    <G>
      {/* 頭 */}
      <Circle cx={60} cy={32 + yOff} r={22} fill="url(#skin)" />
      {/* 髪 */}
      <Path
        d={`M38,${28 + yOff} Q42,${12 + yOff} 60,${10 + yOff} Q78,${12 + yOff} 82,${28 + yOff} Q80,${18 + yOff} 60,${14 + yOff} Q40,${18 + yOff} 38,${28 + yOff}Z`}
        fill="#5D3A1A"
      />
      {/* 目 */}
      {eyeExpr === "happy" ? (
        <>
          <Path d={`M50,${ey} Q53,${ey - 3} 56,${ey}`} stroke="#333" strokeWidth={2} fill="none" />
          <Path d={`M64,${ey} Q67,${ey - 3} 70,${ey}`} stroke="#333" strokeWidth={2} fill="none" />
        </>
      ) : eyeExpr === "sad" ? (
        <>
          <Circle cx={53} cy={ey} r={2.5} fill="#333" />
          <Circle cx={67} cy={ey} r={2.5} fill="#333" />
          <Path d={`M49,${ey - 4} Q53,${ey - 2} 57,${ey - 4}`} stroke="#333" strokeWidth={1} fill="none" />
          <Path d={`M63,${ey - 4} Q67,${ey - 2} 71,${ey - 4}`} stroke="#333" strokeWidth={1} fill="none" />
        </>
      ) : (
        <>
          <Circle cx={53} cy={ey} r={3} fill="#333" />
          <Circle cx={67} cy={ey} r={3} fill="#333" />
          <Circle cx={54} cy={ey - 1} r={1} fill="#FFF" />
          <Circle cx={68} cy={ey - 1} r={1} fill="#FFF" />
        </>
      )}
      {/* 口 */}
      {eyeExpr === "happy" ? (
        <Path d={`M55,${ey + 7} Q60,${ey + 12} 65,${ey + 7}`} stroke="#C55" strokeWidth={1.5} fill="none" />
      ) : eyeExpr === "sad" ? (
        <Path d={`M55,${ey + 10} Q60,${ey + 7} 65,${ey + 10}`} stroke="#C55" strokeWidth={1.5} fill="none" />
      ) : (
        <Ellipse cx={60} cy={ey + 8} rx={3} ry={2} fill="#E88" />
      )}
      {/* ほっぺ */}
      <Circle cx={44} cy={ey + 4} r={5} fill="url(#cheek)" />
      <Circle cx={76} cy={ey + 4} r={5} fill="url(#cheek)" />
    </G>
  );
}

/** Lv1: 布の服の赤ちゃん冒険者 */
function renderLv1(eyeExpr: EyeExpr) {
  return (
    <G>
      {/* 体（布の服） */}
      <Rect x={42} y={52} width={36} height={35} rx={8} fill="#C4A96A" />
      <Rect x={46} y={52} width={28} height={10} rx={4} fill="#D4B97A" />
      {/* 腕 */}
      <Rect x={32} y={55} width={12} height={20} rx={6} fill="url(#skin)" />
      <Rect x={76} y={55} width={12} height={20} rx={6} fill="url(#skin)" />
      {/* 足 */}
      <Rect x={46} y={85} width={10} height={16} rx={5} fill="url(#skin)" />
      <Rect x={64} y={85} width={10} height={16} rx={5} fill="url(#skin)" />
      {/* 靴 */}
      <Ellipse cx={51} cy={100} rx={7} ry={5} fill="#8B6D4A" />
      <Ellipse cx={69} cy={100} rx={7} ry={5} fill="#8B6D4A" />
      {face(eyeExpr)}
      {/* 小さな木の剣 */}
      <Rect x={84} y={48} width={3} height={22} rx={1} fill="#8B6D4A" />
      <Rect x={80} y={68} width={11} height={3} rx={1} fill="#A08060" />
    </G>
  );
}

/** Lv2: 革装備の見習い騎士 */
function renderLv2(eyeExpr: EyeExpr) {
  return (
    <G>
      {/* 体（革の鎧） */}
      <Rect x={42} y={52} width={36} height={35} rx={6} fill="#8B5E3C" />
      <Rect x={44} y={54} width={32} height={8} rx={3} fill="#A0704C" />
      {/* ベルト */}
      <Rect x={42} y={70} width={36} height={4} rx={2} fill="#5C3A1E" />
      <Circle cx={60} cy={72} r={3} fill="#D4A030" />
      {/* 腕（革のグローブ） */}
      <Rect x={30} y={55} width={14} height={22} rx={7} fill="#8B5E3C" />
      <Rect x={76} y={55} width={14} height={22} rx={7} fill="#8B5E3C" />
      {/* 足（革のブーツ） */}
      <Rect x={45} y={85} width={11} height={18} rx={5} fill="#5C3A1E" />
      <Rect x={64} y={85} width={11} height={18} rx={5} fill="#5C3A1E" />
      <Ellipse cx={50} cy={102} rx={8} ry={5} fill="#5C3A1E" />
      <Ellipse cx={70} cy={102} rx={8} ry={5} fill="#5C3A1E" />
      {face(eyeExpr)}
      {/* 革の盾 */}
      <Ellipse cx={30} cy={68} rx={10} ry={12} fill="#A0704C" />
      <Ellipse cx={30} cy={68} rx={7} ry={9} fill="#8B5E3C" />
      <Circle cx={30} cy={68} r={3} fill="#D4A030" />
    </G>
  );
}

/** Lv3: 鉄の鎧のクエストナイト */
function renderLv3(eyeExpr: EyeExpr) {
  return (
    <G>
      <Defs>
        <LinearGradient id="iron" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#A8B0B8" />
          <Stop offset="100%" stopColor="#6B7580" />
        </LinearGradient>
      </Defs>
      {/* 体（鉄の鎧） */}
      <Rect x={40} y={52} width={40} height={36} rx={6} fill="url(#iron)" />
      {/* 胸当て */}
      <Path d="M46,54 L60,60 L74,54 L74,66 L60,72 L46,66 Z" fill="#8090A0" />
      {/* 腕（鉄のガントレット） */}
      <Rect x={28} y={54} width={14} height={24} rx={7} fill="url(#iron)" />
      <Rect x={78} y={54} width={14} height={24} rx={7} fill="url(#iron)" />
      {/* 足（鉄のブーツ） */}
      <Rect x={44} y={86} width={12} height={18} rx={5} fill="#6B7580" />
      <Rect x={64} y={86} width={12} height={18} rx={5} fill="#6B7580" />
      <Ellipse cx={50} cy={103} rx={9} ry={5} fill="#6B7580" />
      <Ellipse cx={70} cy={103} rx={9} ry={5} fill="#6B7580" />
      {face(eyeExpr)}
      {/* 鉄の剣 */}
      <Rect x={86} y={38} width={4} height={30} rx={1} fill="#A8B0B8" />
      <Rect x={82} y={66} width={12} height={4} rx={2} fill="#6B7580" />
      <Path d="M86,38 L90,38 L88,32 Z" fill="#C0C8D0" />
      {/* 鉄の盾 */}
      <Path d="M20,56 L34,52 L34,76 L27,82 L20,76 Z" fill="url(#iron)" />
      <Path d="M23,58 L31,55 L31,73 L27,77 L23,73 Z" fill="#8090A0" />
    </G>
  );
}

/** Lv4: 銀装備+マント */
function renderLv4(eyeExpr: EyeExpr) {
  return (
    <G>
      <Defs>
        <LinearGradient id="silver" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E0E4E8" />
          <Stop offset="50%" stopColor="#C0C8D0" />
          <Stop offset="100%" stopColor="#A0A8B0" />
        </LinearGradient>
      </Defs>
      {/* マント */}
      <Path d="M38,48 Q30,70 26,105 L94,105 Q90,70 82,48 Z" fill="#4A6FA5" opacity={0.8} />
      {/* 体（銀の鎧） */}
      <Rect x={40} y={52} width={40} height={36} rx={6} fill="url(#silver)" />
      <Path d="M46,54 L60,62 L74,54 L74,68 L60,74 L46,68 Z" fill="#D0D8E0" />
      {/* 銀の肩当て */}
      <Ellipse cx={38} cy={54} rx={8} ry={5} fill="url(#silver)" />
      <Ellipse cx={82} cy={54} rx={8} ry={5} fill="url(#silver)" />
      {/* 腕 */}
      <Rect x={26} y={56} width={14} height={24} rx={7} fill="url(#silver)" />
      <Rect x={80} y={56} width={14} height={24} rx={7} fill="url(#silver)" />
      {/* 足 */}
      <Rect x={44} y={86} width={12} height={18} rx={5} fill="#A0A8B0" />
      <Rect x={64} y={86} width={12} height={18} rx={5} fill="#A0A8B0" />
      <Ellipse cx={50} cy={103} rx={9} ry={5} fill="#A0A8B0" />
      <Ellipse cx={70} cy={103} rx={9} ry={5} fill="#A0A8B0" />
      {face(eyeExpr)}
      {/* 銀の剣 */}
      <Rect x={88} y={34} width={4} height={34} rx={1} fill="#D0D8E0" />
      <Rect x={84} y={66} width={12} height={4} rx={2} fill="#A0A8B0" />
      <Path d="M88,34 L92,34 L90,26 Z" fill="#E0E8F0" />
    </G>
  );
}

/** Lv5: 金装備+英雄マント */
function renderLv5(eyeExpr: EyeExpr) {
  return (
    <G>
      <Defs>
        <LinearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFE066" />
          <Stop offset="50%" stopColor="#FFD700" />
          <Stop offset="100%" stopColor="#DAA520" />
        </LinearGradient>
      </Defs>
      {/* 英雄のマント（赤） */}
      <Path d="M36,46 Q24,72 22,108 L98,108 Q96,72 84,46 Z" fill="#C0392B" opacity={0.85} />
      <Path d="M36,46 Q28,60 24,80" stroke="#E74C3C" strokeWidth={2} fill="none" />
      {/* 体（金の鎧） */}
      <Rect x={40} y={52} width={40} height={36} rx={6} fill="url(#gold)" />
      <Path d="M46,54 L60,62 L74,54 L74,68 L60,74 L46,68 Z" fill="#FFE066" />
      {/* 金の肩当て（大きめ） */}
      <Ellipse cx={36} cy={53} rx={10} ry={6} fill="url(#gold)" />
      <Ellipse cx={84} cy={53} rx={10} ry={6} fill="url(#gold)" />
      {/* 腕 */}
      <Rect x={24} y={56} width={14} height={24} rx={7} fill="url(#gold)" />
      <Rect x={82} y={56} width={14} height={24} rx={7} fill="url(#gold)" />
      {/* 足 */}
      <Rect x={44} y={86} width={12} height={18} rx={5} fill="#DAA520" />
      <Rect x={64} y={86} width={12} height={18} rx={5} fill="#DAA520" />
      <Ellipse cx={50} cy={103} rx={9} ry={5} fill="#DAA520" />
      <Ellipse cx={70} cy={103} rx={9} ry={5} fill="#DAA520" />
      {face(eyeExpr)}
      {/* 金の大剣 */}
      <Rect x={90} y={28} width={5} height={40} rx={2} fill="#FFD700" />
      <Rect x={85} y={66} width={15} height={5} rx={2} fill="#DAA520" />
      <Path d="M90,28 L95,28 L92.5,18 Z" fill="#FFE066" />
      {/* 宝石 */}
      <Circle cx={92.5} cy={70} r={3} fill="#E74C3C" />
    </G>
  );
}

/** Lv6: 輝く鎧+賢者の杖 */
function renderLv6(eyeExpr: EyeExpr) {
  return (
    <G>
      <Defs>
        <LinearGradient id="platinum" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#E8F0FF" />
          <Stop offset="50%" stopColor="#B8D0F0" />
          <Stop offset="100%" stopColor="#90B0E0" />
        </LinearGradient>
        <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.8} />
          <Stop offset="100%" stopColor="#B8D0F0" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {/* オーラ */}
      <Circle cx={60} cy={60} r={55} fill="url(#glow)" />
      {/* 賢者のローブ */}
      <Path d="M36,48 Q26,75 28,108 L92,108 Q94,75 84,48 Z" fill="#2C3E80" opacity={0.85} />
      {/* 体（輝く鎧） */}
      <Rect x={40} y={52} width={40} height={36} rx={6} fill="url(#platinum)" />
      <Path d="M46,54 L60,64 L74,54 L74,70 L60,76 L46,70 Z" fill="#D0E0FF" />
      {/* 肩当て（輝く） */}
      <Ellipse cx={36} cy={53} rx={10} ry={7} fill="url(#platinum)" />
      <Ellipse cx={84} cy={53} rx={10} ry={7} fill="url(#platinum)" />
      {/* 腕 */}
      <Rect x={24} y={56} width={14} height={24} rx={7} fill="url(#platinum)" />
      <Rect x={82} y={56} width={14} height={24} rx={7} fill="url(#platinum)" />
      {/* 足 */}
      <Rect x={44} y={86} width={12} height={18} rx={5} fill="#90B0E0" />
      <Rect x={64} y={86} width={12} height={18} rx={5} fill="#90B0E0" />
      <Ellipse cx={50} cy={103} rx={9} ry={5} fill="#90B0E0" />
      <Ellipse cx={70} cy={103} rx={9} ry={5} fill="#90B0E0" />
      {face(eyeExpr)}
      {/* 賢者の杖 */}
      <Rect x={16} y={24} width={4} height={55} rx={2} fill="#6B4C8A" />
      {/* 杖の宝珠 */}
      <Circle cx={18} cy={22} r={8} fill="#9B59B6" opacity={0.7} />
      <Circle cx={18} cy={22} r={5} fill="#BB77DD" />
      <Circle cx={16} cy={20} r={2} fill="#FFFFFF" opacity={0.8} />
    </G>
  );
}

/** Lv7: 王冠+聖剣の伝説の勇者 */
function renderLv7(eyeExpr: EyeExpr) {
  return (
    <G>
      <Defs>
        <LinearGradient id="holy" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFF8E0" />
          <Stop offset="50%" stopColor="#FFD700" />
          <Stop offset="100%" stopColor="#FF8C00" />
        </LinearGradient>
        <RadialGradient id="holyGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFD700" stopOpacity={0.5} />
          <Stop offset="60%" stopColor="#FFD700" stopOpacity={0.1} />
          <Stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {/* 聖なるオーラ */}
      <Circle cx={60} cy={60} r={58} fill="url(#holyGlow)" />
      {/* 英雄のマント（紫金） */}
      <Path d="M34,44 Q20,75 18,112 L102,112 Q100,75 86,44 Z" fill="#4A1A6B" opacity={0.85} />
      <Path d="M22,100 L98,100 L102,112 L18,112 Z" fill="#6B2A9B" opacity={0.5} />
      {/* 体（聖なる鎧） */}
      <Rect x={40} y={52} width={40} height={36} rx={6} fill="url(#holy)" />
      <Path d="M46,54 L60,64 L74,54 L74,70 L60,76 L46,70 Z" fill="#FFF0C0" />
      {/* 聖なる肩当て */}
      <Ellipse cx={34} cy={52} rx={12} ry={8} fill="url(#holy)" />
      <Ellipse cx={86} cy={52} rx={12} ry={8} fill="url(#holy)" />
      {/* 腕 */}
      <Rect x={22} y={54} width={14} height={26} rx={7} fill="url(#holy)" />
      <Rect x={84} y={54} width={14} height={26} rx={7} fill="url(#holy)" />
      {/* 足 */}
      <Rect x={44} y={86} width={12} height={18} rx={5} fill="#DAA520" />
      <Rect x={64} y={86} width={12} height={18} rx={5} fill="#DAA520" />
      <Ellipse cx={50} cy={103} rx={9} ry={5} fill="#DAA520" />
      <Ellipse cx={70} cy={103} rx={9} ry={5} fill="#DAA520" />
      {face(eyeExpr)}
      {/* 王冠 */}
      <Path d="M44,12 L48,22 L54,14 L60,24 L66,14 L72,22 L76,12 L78,26 L42,26 Z" fill="#FFD700" />
      <Rect x={42} y={24} width={36} height={4} rx={2} fill="#DAA520" />
      <Circle cx={54} cy={19} r={2} fill="#E74C3C" />
      <Circle cx={60} cy={17} r={2.5} fill="#3498DB" />
      <Circle cx={66} cy={19} r={2} fill="#2ECC71" />
      {/* 聖剣 */}
      <Rect x={92} y={20} width={5} height={48} rx={2} fill="#E0E8F0" />
      <Rect x={87} y={66} width={15} height={5} rx={2} fill="#FFD700" />
      <Path d="M92,20 L97,20 L94.5,8 Z" fill="#FFFFFF" />
      <Circle cx={94.5} cy={70} r={4} fill="#FFD700" />
      <Circle cx={94.5} cy={70} r={2} fill="#E74C3C" />
    </G>
  );
}
