import { SymbolView, type SFSymbol } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";

type ItemType = "text" | "rect" | "circle" | "arrow" | "emoji";

type MarkupItem = {
  id: number;
  type: ItemType;
  x: number;
  y: number;
  color: string;
  text: string;
  scale: number;
  rotation: number;
  length: number;
};

const COLORS = [
  "#ffffff",
  "#ff3b30",
  "#ffcc00",
  "#34c759",
  "#0a84ff",
  "#000000",
];
const EMOJIS = ["😀", "😂", "😍", "😎", "👍", "🔥", "❤️", "⭐", "✅", "❌", "⚠️", "📍"];
const SHAPE_SIZE = 120;
const TRASH_SIZE = 64;
const HIT_PADDING = 28;
const MIN_ARROW_LENGTH = 48;
const ARROW_HEIGHT = 36;
const MIN_SCALE = 0.3;
const MAX_SCALE = 6;

type Props = { active: boolean; onDone: () => void };

export function MarkupOverlay({ active, onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [items, setItems] = useState<MarkupItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [color, setColor] = useState(COLORS[1]);

  const update = (id: number, patch: Partial<MarkupItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const add = (type: ItemType, text = "") => {
    const id = nextId.current++;
    const item: MarkupItem = {
      id,
      type,
      x: type === "text" ? width * 0.2 : (width - SHAPE_SIZE) / 2,
      y: type === "text" ? height * 0.25 : (height - SHAPE_SIZE) / 2,
      color,
      text,
      scale: 1,
      rotation: 0,
      length: SHAPE_SIZE,
    };
    setItems((prev) => [...prev, item]);
    setOpenMenu(null);
    setSelectedId(id);
    setEditingId(type === "text" ? id : null);
  };

  const finishEditing = (id: number) => {
    setEditingId(null);
    setItems((prev) => prev.filter((i) => i.id !== id || i.text.trim() !== ""));
  };

  const remove = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedId(null);
    setEditingId(null);
  };

  const [dragging, setDragging] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const nextId = useRef(1);
  const [openMenu, setOpenMenu] = useState<"color" | "shape" | "emoji" | null>(null);
  const toggle = (menu: "color" | "shape" | "emoji") =>
    setOpenMenu((m) => (m === menu ? null : menu));

  const trashCenter = {
    x: width / 2,
    y: height - insets.bottom - Spacing.three - TRASH_SIZE / 2,
  };
  const isOverTrash = (x: number, y: number) =>
    Math.hypot(x - trashCenter.x, y - trashCenter.y) < TRASH_SIZE;

  const selected = items.find((i) => i.id === selectedId);

  const activeColor = selected?.color ?? color;

  const finish = () => {
    setSelectedId(null);
    setEditingId(null);
    setOpenMenu(null);
    onDone();
  };

  const chooseColor = (c: string) => {
    setColor(c);
    if (selectedId !== null) update(selectedId, { color: c });
  };

  return (
    <GestureHandlerRootView
      style={StyleSheet.absoluteFill}
      pointerEvents={active ? "box-none" : "none"}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => {
          setSelectedId(null);
          setEditingId(null);
        }}
      />
      {items.map((item) => (
        <MarkupItemView
          key={item.id}
          item={item}
          selected={active && item.id === selectedId}
          editing={item.id === editingId}
          onSelect={() => setSelectedId(item.id)}
          onEdit={() => {
            setSelectedId(item.id);
            setEditingId(item.id);
          }}
          onMove={(x, y) => update(item.id, { x, y })}
          onScale={(scale) => update(item.id, { scale })}
          onRotate={(rotation) => update(item.id, { rotation })}
          onResize={(patch) => update(item.id, patch)}
          onChangeText={(text) => update(item.id, { text })}
          onFinishEditing={() => finishEditing(item.id)}
          onDragChange={(x, y) => {
            setDragging(true);
            setOverTrash(isOverTrash(x, y));
          }}
          onDragEnd={(x, y) => {
            const drop = isOverTrash(x, y);
            setDragging(false);
            setOverTrash(false);
            if (drop) remove(item.id);
            return drop;
          }}
        />
      ))}

      <TrashTarget
        visible={active && dragging}
        hot={overTrash}
        left={trashCenter.x - TRASH_SIZE / 2}
        top={trashCenter.y - TRASH_SIZE / 2}
      />

      {active && (
        <View
          style={[styles.toolbar, { bottom: insets.bottom + Spacing.three }]}
        >
          <View style={styles.row}>
            <Pressable
              accessibilityLabel="Color"
              style={[
                styles.button,
                openMenu === "color" && styles.buttonActive,
              ]}
              onPress={() => toggle("color")}
            >
              <View
                style={[styles.colorDot, { backgroundColor: activeColor }]}
              />
            </Pressable>
            {openMenu === "color" && (
              <View style={styles.menu}>
                {COLORS.map((c) => (
                  <Pressable
                    key={c}
                    accessibilityLabel={`Color ${c}`}
                    onPress={() => chooseColor(c)}
                    hitSlop={4}
                    style={[
                      styles.swatchRing,
                      activeColor === c && styles.swatchRingActive,
                    ]}
                  >
                    <View style={[styles.swatch, { backgroundColor: c }]} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
          <View style={styles.row}>
            <ToolButton
              label="Shapes"
              name={{
                ios: "square.on.circle",
                android: "category",
                web: "category",
              }}
              active={openMenu === "shape"}
              onPress={() => toggle("shape")}
            />
            {openMenu === "shape" && (
              <View style={styles.menu}>
                <ToolButton
                  plain
                  label="Add rectangle"
                  name={{
                    ios: "rectangle",
                    android: "crop_square",
                    web: "crop_square",
                  }}
                  onPress={() => add("rect")}
                />
                <ToolButton
                  plain
                  label="Add circle"
                  name={{ ios: "circle", android: "circle", web: "circle" }}
                  onPress={() => add("circle")}
                />
                <ToolButton
                  plain
                  label="Add arrow"
                  name={{
                    ios: "arrow.right",
                    android: "arrow_forward",
                    web: "arrow_forward",
                  }}
                  onPress={() => add("arrow")}
                />
              </View>
            )}
          </View>
          <View style={styles.row}>
            <Pressable
              accessibilityLabel="Emoji"
              style={[
                styles.button,
                openMenu === "emoji" && styles.buttonActive,
              ]}
              onPress={() => toggle("emoji")}
            >
              <Text style={styles.emojiButton}>😀</Text>
            </Pressable>
            {openMenu === "emoji" && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[styles.emojiMenu, { maxWidth: width - 96 }]}
                contentContainerStyle={styles.emojiMenuContent}
                keyboardShouldPersistTaps="handled"
              >
                {EMOJIS.map((e) => (
                  <Pressable
                    key={e}
                    accessibilityLabel={`Add ${e}`}
                    style={styles.menuButton}
                    onPress={() => add("emoji", e)}
                  >
                    <Text style={styles.emojiButton}>{e}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
          <View style={styles.row}>
            <ToolButton
              label="Add text"
              name={{ ios: "textformat", android: "title", web: "title" }}
              onPress={() => add("text")}
            />
          </View>
          <Pressable
            accessibilityLabel="Done"
            style={styles.done}
            onPress={finish}
          >
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const BOUNCE = { damping: 14, stiffness: 240, mass: 0.7 };

function TrashTarget({
  visible,
  hot,
  left,
  top,
}: {
  visible: boolean;
  hot: boolean;
  left: number;
  top: number;
}) {
  const show = useSharedValue(0);
  const heat = useSharedValue(0);

  useEffect(() => {
    show.value = withSpring(
      visible ? 1 : 0,
      visible ? BOUNCE : { damping: 20 },
    );
  }, [visible, show]);

  useEffect(() => {
    heat.value = withSpring(hot ? 1 : 0, BOUNCE);
  }, [hot, heat]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, show.value),
    backgroundColor: interpolateColor(
      Math.min(1, Math.max(0, heat.value)),
      [0, 1],
      ["rgba(110,110,118,0.75)", "#ff3b30"],
    ),
    transform: [
      { translateY: (1 - show.value) * 40 },
      { scale: show.value * (1 + heat.value * 0.3) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.trash, { left, top }, style]}
    >
      <SymbolView
        name={{ ios: "trash", android: "delete", web: "delete" } as never}
        tintColor="#fff"
        size={28}
      />
    </Animated.View>
  );
}

function ToolButton({
  label,
  name,
  onPress,
  active,
  plain,
}: {
  label: string;
  name: { ios: SFSymbol; android: string; web: string };
  onPress: () => void;
  active?: boolean;
  plain?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      style={({ pressed }) => [
        plain ? styles.menuButton : styles.button,
        active && styles.buttonActive,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      <SymbolView name={name as never} tintColor="#fff" size={22} />
    </Pressable>
  );
}

type ItemViewProps = {
  item: MarkupItem;
  selected: boolean;
  editing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onMove: (x: number, y: number) => void;
  onScale: (scale: number) => void;
  onRotate: (rotation: number) => void;
  onResize: (patch: Partial<MarkupItem>) => void;
  onChangeText: (text: string) => void;
  onFinishEditing: () => void;
  onDragChange: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => boolean;
};

function MarkupItemView({
  item,
  selected,
  editing,
  onSelect,
  onEdit,
  onMove,
  onScale,
  onRotate,
  onResize,
  onChangeText,
  onFinishEditing,
  onDragChange,
  onDragEnd,
}: ItemViewProps) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const pinchScale = useSharedValue(1);
  const rotateDelta = useSharedValue(0);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .enabled(!editing)
    .maxPointers(1)
    .onBegin(onSelect)
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
      onDragChange(e.absoluteX, e.absoluteY);
    })
    .onEnd((e) => {
      if (!onDragEnd(e.absoluteX, e.absoluteY)) {
        onMove(item.x + e.translationX, item.y + e.translationY);
      }
      tx.value = 0;
      ty.value = 0;
    });

  const tap = Gesture.Tap()
    .runOnJS(true)
    .enabled(!editing)
    .onEnd((_e, success) => {
      if (!success) return;
      if (item.type === "text" && selected) onEdit();
      else onSelect();
    });

  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .enabled(!editing)
    .onBegin(onSelect)
    .onUpdate((e) => {
      pinchScale.value = e.scale;
    })
    .onEnd((e) => {
      onScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, item.scale * e.scale)));
      pinchScale.value = 1;
    });

  const rotate = Gesture.Rotation()
    .runOnJS(true)
    .enabled(!editing)
    .onBegin(onSelect)
    .onUpdate((e) => {
      rotateDelta.value = e.rotation;
    })
    .onEnd((e) => {
      onRotate(item.rotation + e.rotation);
      rotateDelta.value = 0;
    });

  const startLength = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Dragging an end handle changes the length along the arrow's axis while
  // the opposite end stays fixed on screen.
  const resizeGesture = (side: 1 | -1) =>
    Gesture.Pan()
      .runOnJS(true)
      .maxPointers(1)
      .onBegin(() => {
        startLength.value = item.length;
        startX.value = item.x;
        startY.value = item.y;
      })
      .onUpdate((e) => {
        const start = {
          length: startLength.value,
          x: startX.value,
          y: startY.value,
        };
        const dx = Math.cos(item.rotation);
        const dy = Math.sin(item.rotation);
        const along = (e.translationX * dx + e.translationY * dy) / item.scale;
        const length = Math.max(MIN_ARROW_LENGTH, start.length + side * along);
        const shift = side * ((length - start.length) / 2) * item.scale;
        const cx = start.x + (start.length + 2 * HIT_PADDING) / 2 + shift * dx;
        const cy = start.y + (ARROW_HEIGHT + 2 * HIT_PADDING) / 2 + shift * dy;
        onResize({
          length,
          x: cx - (length + 2 * HIT_PADDING) / 2,
          y: cy - (ARROW_HEIGHT + 2 * HIT_PADDING) / 2,
        });
      });
  const rightHandle = resizeGesture(1);
  const leftHandle = resizeGesture(-1);

  const gesture = Gesture.Exclusive(
    Gesture.Simultaneous(pan, pinch, rotate),
    tap,
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      {
        scale: Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, item.scale * pinchScale.value),
        ),
      },
      { rotate: `${item.rotation + rotateDelta.value}rad` },
    ],
  }));

  return (
    <Animated.View
      style={[styles.itemOuter, { left: item.x, top: item.y }, animatedStyle]}
    >
      <GestureDetector gesture={gesture}>
        <View style={[styles.item, selected && styles.itemSelected]}>
          {item.type === "emoji" ? (
            <Text style={styles.emoji}>{item.text}</Text>
          ) : item.type === "text" ? (
            editing ? (
              <TextInput
                autoFocus
                multiline
                value={item.text}
                onChangeText={onChangeText}
                onBlur={onFinishEditing}
                placeholder="Type…"
                placeholderTextColor="rgba(255,255,255,0.6)"
                style={[styles.text, { color: item.color }]}
              />
            ) : (
              <Text style={[styles.text, { color: item.color }]}>
                {item.text}
              </Text>
            )
          ) : item.type === "arrow" ? (
            <View style={[styles.arrow, { width: item.length }]}>
              <View
                style={[styles.arrowShaft, { backgroundColor: item.color }]}
              />
              <View
                style={[styles.arrowHead, { borderLeftColor: item.color }]}
              />
            </View>
          ) : (
            <View
              style={[
                styles.shape,
                { borderColor: item.color },
                item.type === "circle" && styles.circle,
              ]}
            />
          )}
        </View>
      </GestureDetector>
      {item.type === "arrow" && selected && !editing && (
        <>
          <GestureDetector gesture={leftHandle}>
            <View style={[styles.handle, styles.handleLeft]}>
              <View style={styles.grip} />
            </View>
          </GestureDetector>
          <GestureDetector gesture={rightHandle}>
            <View style={[styles.handle, styles.handleRight]}>
              <View style={styles.grip} />
            </View>
          </GestureDetector>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  trash: {
    position: "absolute",
    width: TRASH_SIZE,
    height: TRASH_SIZE,
    borderRadius: TRASH_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbar: {
    position: "absolute",
    right: Spacing.three,
    flexDirection: "column",
    alignItems: "flex-end",
    gap: Spacing.three,
  },
  row: {
    flexDirection: "row-reverse",
    gap: Spacing.two,
    alignItems: "center",
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(110,110,118,0.75)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  buttonActive: {
    backgroundColor: "rgba(10,132,255,0.85)",
    borderColor: "rgba(255,255,255,0.6)",
  },
  buttonPressed: { transform: [{ scale: 0.92 }], opacity: 0.85 },
  menu: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(90,90,98,0.85)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#fff",
  },
  swatchRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  swatchRingActive: { borderColor: "#fff" },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.5)",
  },
  done: {
    height: 44,
    paddingHorizontal: Spacing.four,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  doneText: { color: "#000", fontWeight: "700", fontSize: 16 },
  itemOuter: { position: "absolute" },
  item: { padding: HIT_PADDING, borderRadius: 6 },
  handle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: HIT_PADDING + 8,
    alignItems: "center",
    justifyContent: "center",
  },
  handleLeft: { left: -8 },
  handleRight: { right: -8 },
  grip: {
    width: 8,
    height: 32,
    borderRadius: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.4)",
  },
  itemSelected: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    borderStyle: "dashed",
    padding: HIT_PADDING - 1,
  },
  text: {
    fontSize: 28,
    fontWeight: "700",
    minWidth: 60,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowRadius: 3,
  },
  shape: {
    width: SHAPE_SIZE,
    height: SHAPE_SIZE,
    borderWidth: 4,
    borderRadius: 6,
  },
  arrow: {
    width: SHAPE_SIZE,
    height: ARROW_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
  },
  arrowShaft: { flex: 1, height: 6 },
  arrowHead: {
    width: 0,
    height: 0,
    borderTopWidth: 18,
    borderBottomWidth: 18,
    borderLeftWidth: 30,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  emoji: { fontSize: 64, lineHeight: 80 },
  emojiButton: { fontSize: 24 },
  emojiMenu: {
    flexGrow: 0,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(90,90,98,0.85)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  emojiMenuContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.two,
    gap: Spacing.one,
  },
  circle: { borderRadius: SHAPE_SIZE / 2 },
});
