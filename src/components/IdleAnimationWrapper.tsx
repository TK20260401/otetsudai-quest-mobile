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
] as const;

export type IdleAnimationType = (typeof IDLE_TYPES)[number];

type Props = {
  type: IdleAnimationType;
  duration?: number;
  paused?: boolean;
  children: ReactNode;
};

export default function IdleAnimationWrapper({
  type,
  duration,
  paused = false,
  children,
}: Props) {
  const reducedMotion = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  const dur = duration ?? getDefaultDuration(type);

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
  }
}

function getTransform(type: IdleAnimationType, anim: Animated.Value) {
  switch (type) {
    case "bob":
      return [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }];
    case "breathe":
      return [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }];
    case "sway":
      return [{ rotate: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ["0deg", "2deg", "-2deg"] }) }];
    case "bounce":
      return [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }];
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
  }
}

function getPulseOpacity(anim: Animated.Value) {
  return anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] });
}
