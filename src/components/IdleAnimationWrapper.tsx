import React, { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing } from "react-native";
import { useReducedMotion } from "../lib/useReducedMotion";

const IDLE_TYPES = [
  "bob",
  "breathe",
  "sway",
  "bounce",
  "flutter",
  "pulse",
  "spin",
  "flicker",
  "jump",
  "shake",
] as const;

export type IdleAnimationType = (typeof IDLE_TYPES)[number];

type Props = {
  type: IdleAnimationType;
  duration?: number;
  paused?: boolean;
  /** "subtle" = duration 2x for background/non-focus elements */
  intensity?: "normal" | "subtle";
  /** true にすると OS の「視差効果を減らす」を無視してアニメーションする */
  forceAnimate?: boolean;
  children: ReactNode;
};

export default function IdleAnimationWrapper({
  type,
  duration,
  paused = false,
  intensity = "normal",
  forceAnimate = false,
  children,
}: Props) {
  const reducedMotion = useReducedMotion() && !forceAnimate;
  const anim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  const baseDur = duration ?? getDefaultDuration(type);
  const dur = intensity === "subtle" ? baseDur * 2 : baseDur;

  useEffect(() => {
    if (reducedMotion || paused) {
      anim.setValue(0);
      loopRef.current?.stop();
      loopRef.current = null;
      return;
    }

    const cycle = Animated.sequence([
      Animated.timing(anim, {
        toValue: 1,
        duration: (dur * 1000) / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(anim, {
        toValue: 0,
        duration: (dur * 1000) / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    loopRef.current = Animated.loop(cycle);
    loopRef.current.start();

    return () => {
      loopRef.current?.stop();
      loopRef.current = null;
    };
  }, [reducedMotion, paused, dur, anim]);

  if (reducedMotion) {
    return <>{children}</>;
  }

  const transform = getTransform(type, anim);

  return (
    <Animated.View style={{ transform, opacity: type === "pulse" ? getPulseOpacity(anim) : 1 }}>
      {children}
    </Animated.View>
  );
}

function getDefaultDuration(type: IdleAnimationType): number {
  switch (type) {
    case "bob": return 3;
    case "breathe": return 3;
    case "sway": return 4;
    case "bounce": return 2;
    case "flutter": return 2.5;
    case "pulse": return 2;
    case "spin": return 2;
    case "flicker": return 0.8;
    case "jump": return 0.4;
    case "shake": return 0.3;
  }
}

function getTransform(type: IdleAnimationType, anim: Animated.Value) {
  switch (type) {
    case "bob":
      return [{ translateY: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [2, -3, 2] }) }];
    case "breathe":
      return [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }];
    case "sway":
      return [{ rotate: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["0deg", "2deg", "-2deg"] }) }];
    case "bounce":
      return [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) }];
    case "flutter":
      return [
        { rotate: anim.interpolate({ inputRange: [0, 1], outputRange: ["-1deg", "1deg"] }) },
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [-1, 1] }) },
      ];
    case "pulse":
      return [];
    case "spin":
      return [{ rotateY: anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] }) }];
    case "flicker":
      return [{ scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.95, 1.05] }) }];
    case "jump":
      return [{ translateY: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -20, 0] }) }];
    case "shake":
      return [{ rotate: anim.interpolate({ inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1], outputRange: ["0deg", "5deg", "-5deg", "5deg", "-5deg", "0deg"] }) }];
  }
}

function getPulseOpacity(anim: Animated.Value) {
  return anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] });
}
