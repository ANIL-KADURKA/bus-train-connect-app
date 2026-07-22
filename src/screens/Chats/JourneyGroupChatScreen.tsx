import {
  ArrowLeft01Icon,
  Bus01Icon,
  SentIcon,
  Train01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  brand,
  radius,
  spacing,
  theme,
  typography,
} from "../../constants/theme";
import { useGroupChat } from "../../hooks/useGroupChat";
import { useInChatSounds } from "../../lib/inChatSounds";
import type { RootStackParamList } from "../../navigation/RootNavigator";
import { useAuthStore } from "../../store/authStore";

type Props = NativeStackScreenProps<RootStackParamList, "JourneyGroupChat">;

type TemplateField = "place" | "duration" | "time" | "platform";

interface MessageTemplate {
  key: string;
  label: string;
  body: string;
  text: string;
  fields?: TemplateField[];
}

const BUS_TEMPLATES: MessageTemplate[] = [
  {
    key: "bus_arrived_at",
    label: "Arrived",
    body: "Bus arrived at {place}",
    text: "Bus arrived at",
    fields: ["place"],
  },
  {
    key: "bus_departed_from",
    label: "Departed",
    body: "Bus departed from {place}",
    text: "Bus departed from",
    fields: ["place"],
  },
  {
    key: "bus_delayed_by",
    label: "Delayed",
    body: "Bus delayed by {duration}",
    text: "Bus delayed by",
    fields: ["duration"],
  },
  {
    key: "boarding_started_at",
    label: "Boarding started",
    body: "Boarding started at {place}",
    text: "Boarding started at",
    fields: ["place"],
  },
  {
    key: "boarding_delayed_by",
    label: "Boarding delayed",
    body: "Boarding delayed by {duration}",
    text: "Boarding delayed by",
    fields: ["duration"],
  },
  {
    key: "traffic_delay_near",
    label: "Traffic delay",
    body: "Traffic delay near {place}",
    text: "Traffic delay near",
    fields: ["place"],
  },
  {
    key: "bus_stopped_at",
    label: "Stopped",
    body: "Bus stopped at {place}",
    text: "Bus stopped at",
    fields: ["place"],
  },
  {
    key: "bus_skipped",
    label: "Skipped",
    body: "Bus skipped {place}",
    text: "Bus skipped",
    fields: ["place"],
  },
  {
    key: "bus_expected_arrival",
    label: "Expected arrival",

    body: "Expected arrival at {place}: {time}",
    text: "Expected arrival at",
    fields: ["place", "time"],
  },
  {
    key: "anyone_boarded_from",
    label: "Anyone boarded?",
    body: "Anyone boarded from {place}?",
    text: "Anyone boarded from",
    fields: ["place"],
  },
  {
    key: "has_bus_crossed",
    label: "Crossed?",
    body: "Has the bus crossed {place}?",
    text: "Has the bus crossed",
    fields: ["place"],
  },
  {
    key: "ticket_checking",
    label: "Checking",
    body: "Ticket/checking happening",
    text: "Ticket/checking happening",
  },
  {
    key: "driver_announced_delay",
    label: "Announced delay",
    text: "Driver/conductor announced delay",
    body: "Driver/conductor announced delay",
  },
];

const TRAIN_TEMPLATES: MessageTemplate[] = [
  {
    key: "train_arrived_at",
    label: "Arrived",
    body: "Train arrived at {place}",
    text: "Train arrived at",
    fields: ["place"],
  },
  {
    key: "train_departed_from",
    label: "Departed",
    body: "Train departed from {place}",
    text: "Train departed from",
    fields: ["place"],
  },
  {
    key: "train_delayed_by",
    label: "Delayed",
    body: "Train delayed by {duration}",
    text: "Train delayed by",
    fields: ["duration"],
  },
  {
    key: "platform_changed_to",
    label: "Platform changed",
    body: "Platform changed to {platform}",
    text: "Platform changed to",
    fields: ["platform"],
  },
  {
    key: "coach_position_updated",
    label: "Coach position",
    body: "Coach position updated",
    text: "Coach position updated",
  },
  {
    key: "ticket_checking",
    label: "Checking",
    body: "Ticket checking happening",
    text: "Ticket checking happening",
  },
  {
    key: "train_halted_at",
    label: "Halted",
    body: "Train halted at {place}",
    text: "Train halted at",
    fields: ["place"],
  },
  {
    key: "train_expected_arrival",
    label: "Expected arrival",
    body: "Expected arrival at {place}: {time}",
    text: "Expected arrival at",
    fields: ["place", "time"],
  },
];

const fieldLabels: Record<TemplateField, string> = {
  place: "Place / station",
  duration: "Duration",
  time: "Time",
  platform: "Platform",
};

const titleFor = (journey: Props["route"]["params"]["journey"]): string =>
  journey.serviceName
    ? `${journey.serviceNumber} · ${journey.serviceName}`
    : journey.serviceNumber;

const renderTemplate = (
  template: MessageTemplate,
  values: Record<string, string>,
) =>
  template.body.replace(
    /\{(\w+)\}/g,
    (_, key: string) => values[key]?.trim() ?? "",
  );

export const JourneyGroupChatScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { journey } = route.params;
  const templateInputRef = useRef<TextInput>(null);
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const didPrimeSoundTrackingRef = useRef(false);
  const currentUserId = useAuthStore((state) => state.user?.userId);
  const { messages, isLoading, isConnected, sendMessage } = useGroupChat(
    journey.journeyId,
  );
  const playInChatSound = useInChatSounds();
  const [tripModalOpen, setTripModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<MessageTemplate | null>(null);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [templateInput, setTemplateInput] = useState("");
  const templates =
    journey.transportType === "train" ? TRAIN_TEMPLATES : BUS_TEMPLATES;
  const visibleMessages = useMemo(() => [...messages].reverse(), [messages]);

  const templateFields = useMemo<TemplateField[]>(
    () => selectedTemplate?.fields ?? [],
    [selectedTemplate],
  );
  const templateInputPlaceholder = selectedTemplate
    ? templateFields.length > 0
      ? templateFields.map((field) => fieldLabels[field]).join(", ")
      : "No input needed"
    : "";
  const templateInputEditable =
    selectedTemplate !== null && templateFields.length > 0 && isConnected;
  const templateValues = useMemo(() => {
    if (templateFields.length === 0) {
      return {};
    }

    const firstField = templateFields[0];
    if (templateFields.length === 1 && firstField) {
      return { [firstField]: templateInput.trim() };
    }

    const parts = templateInput.split(",").map((part) => part.trim());
    return templateFields.reduce<Record<string, string>>(
      (values, field, index) => {
        values[field] = parts[index] ?? "";
        return values;
      },
      {},
    );
  }, [templateFields, templateInput]);
  const canSendTemplate =
    selectedTemplate !== null &&
    isConnected &&
    (templateFields.length === 0 ||
      templateFields.every((field) => Boolean(templateValues[field]?.trim())));

  useEffect(() => {
    const nextSeenMessageIds = new Set(
      messages.map((message) => message.messageId),
    );

    if (!didPrimeSoundTrackingRef.current) {
      seenMessageIdsRef.current = nextSeenMessageIds;
      didPrimeSoundTrackingRef.current = true;
      return;
    }

    const hasNewIncomingMessage =
      Boolean(currentUserId) &&
      messages.some(
        (message) =>
          !seenMessageIdsRef.current.has(message.messageId) &&
          message.senderId !== currentUserId,
      );

    seenMessageIdsRef.current = nextSeenMessageIds;

    if (hasNewIncomingMessage) {
      playInChatSound("receive");
    }
  }, [currentUserId, messages, playInChatSound]);

  const selectTemplate = (template: MessageTemplate) => {
    if (!isConnected) {
      return;
    }

    setSelectedTemplate(template);
    setTemplateInput("");
    setTemplateDropdownOpen(false);
  };

  const sendSelectedTemplate = () => {
    if (!selectedTemplate || !canSendTemplate) {
      return;
    }

    sendMessage(renderTemplate(selectedTemplate, templateValues));
    playInChatSound("send");
    setTemplateInput("");

    if (templateFields.length > 0) {
      requestAnimationFrame(() => {
        templateInputRef.current?.focus();
      });
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Back to chats"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={22}
              strokeWidth={1.8}
              color={theme.textPrimary}
            />
          </Pressable>

          <Pressable
            style={styles.headerDetails}
            onPress={() => setTripModalOpen(true)}
            onHoverIn={() => setTripModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Journey details"
          >
            <View style={styles.avatar}>
              <HugeiconsIcon
                icon={
                  journey.transportType === "train" ? Train01Icon : Bus01Icon
                }
                size={22}
                strokeWidth={1.8}
                color={brand.tealDeep}
              />
            </View>

            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>
                {titleFor(journey)}
              </Text>
              <Text style={styles.headerMeta} numberOfLines={1}>
                {journey.journeyDate}
              </Text>
            </View>

            <Text
              style={[styles.connection, isConnected && styles.connectionLive]}
            >
              {isConnected ? "Live" : "Connecting"}
            </Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={brand.teal} />
          </View>
        ) : (
          <FlatList
            inverted
            style={styles.messageList}
            data={visibleMessages}
            keyExtractor={(item) => item.messageId}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.messages,
              messages.length === 0 && styles.emptyMessages,
            ]}
            keyboardDismissMode="interactive"
            renderItem={({ item }) => {
              const mine = item.senderId === currentUserId;

              return (
                <View
                  style={[styles.messageRow, mine && styles.messageRowMine]}
                >
                  <View style={[styles.bubble, mine && styles.bubbleMine]}>
                    {mine ? null : (
                      <Text style={styles.sender}>{item.senderName}</Text>
                    )}
                    <Text
                      style={[
                        styles.messageText,
                        mine && styles.messageTextMine,
                      ]}
                    >
                      {item.renderedText}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptyBody}>
                  Start the journey group conversation.
                </Text>
              </View>
            }
          />
        )}

        <View style={styles.templateBar}>
          {templateDropdownOpen ? (
            <ScrollView
              style={styles.dropdownMenu}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {templates.map((template) => {
                const isSelected = selectedTemplate?.key === template.key;

                return (
                  <Pressable
                    key={template.key}
                    style={[
                      styles.dropdownItem,
                      isSelected && styles.dropdownItemActive,
                    ]}
                    onPress={() => selectTemplate(template)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.dropdownItemText}>{template.text}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <View style={styles.composerRow}>
            <Pressable
              style={[
                styles.dropdownButton,
                !isConnected && styles.dropdownButtonDisabled,
              ]}
              onPress={() =>
                isConnected && setTemplateDropdownOpen((open) => !open)
              }
              disabled={!isConnected}
              accessibilityRole="button"
              accessibilityLabel="Select message template"
            >
              <Text style={styles.dropdownButtonText} numberOfLines={1}>
                {selectedTemplate?.text ?? "Select a message"}
              </Text>
            </Pressable>

            <TextInput
              ref={templateInputRef}
              style={[
                styles.templateInput,
                !templateInputEditable && styles.templateInputDisabled,
              ]}
              value={templateInput}
              onChangeText={setTemplateInput}
              editable={templateInputEditable}
              placeholder={templateInputPlaceholder}
              placeholderTextColor={theme.textMuted}
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={sendSelectedTemplate}
            />

            <Pressable
              style={[
                styles.sendButton,
                !canSendTemplate && styles.sendButtonDisabled,
              ]}
              onPress={sendSelectedTemplate}
              disabled={!canSendTemplate}
              accessibilityRole="button"
              accessibilityLabel="Send template message"
            >
              <HugeiconsIcon
                icon={SentIcon}
                size={20}
                strokeWidth={1.8}
                color={theme.white}
              />
            </Pressable>
          </View>
        </View>

        <Modal
          visible={tripModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setTripModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setTripModalOpen(false)}
            />
            <View style={styles.tripModal}>
              <View style={styles.tripHeader}>
                <Text style={styles.tripLabel}>Journey group</Text>
                <Text
                  style={[
                    styles.connection,
                    isConnected && styles.connectionLive,
                  ]}
                >
                  {isConnected ? "Live" : "Connecting"}
                </Text>
              </View>
              <View style={styles.tripRoute}>
                <Text style={styles.tripRouteText}>
                  From: {journey.sourceLocation}
                </Text>
                <Text style={styles.tripRouteText}>
                  To: {journey.destinationLocation}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{journey.journeyDate}</Text>
                <View style={styles.members}>
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    size={14}
                    strokeWidth={1.8}
                    color={theme.textMuted}
                  />
                  <Text style={styles.metaText}>
                    {journey.memberCount}{" "}
                    {journey.memberCount === 1 ? "traveller" : "travellers"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.background,
  },
  keyboard: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
  },
  headerDetails: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: brand.tealMuted,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: theme.textPrimary,
  },
  headerMeta: {
    fontSize: typography.sm,
    color: theme.textMuted,
  },
  connection: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: theme.textMuted,
  },
  connectionLive: {
    color: brand.tealDeep,
  },
  messageList: {
    flex: 1,
	paddingHorizontal: spacing.md,
	backgroundColor: theme.background,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  messages: {
    paddingHorizontal: spacing.md   ,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  emptyMessages: {
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  messageRowMine: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    gap: spacing.xs,
  },
  bubbleMine: {
    backgroundColor: brand.teal,
    borderColor: brand.teal,
  },
  sender: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: brand.tealDeep,
  },
  messageText: {
    fontSize: typography.base,
    color: theme.textPrimary,
  },
  messageTextMine: {
    color: theme.white,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: theme.textPrimary,
  },
  emptyBody: {
    fontSize: typography.base,
    color: theme.textSecondary,
    textAlign: "center",
  },
  templateBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.border,
    backgroundColor: theme.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md
  },
  dropdownMenu: {
    maxHeight: 220,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },
  dropdownItem: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  dropdownItemActive: {
    backgroundColor: brand.tealMuted,
  },
  dropdownItemText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: theme.textPrimary,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dropdownButton: {
    flex: 1,
    height: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },
  dropdownButtonDisabled: {
    opacity: 0.45,
  },
  dropdownButtonText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: theme.textPrimary,
  },
  templateInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    fontSize: typography.base,
    color: theme.textPrimary,
  },
  templateInputDisabled: {
    color: theme.textMuted,
    opacity: 0.75,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: brand.teal,
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: "rgba(13,27,42,0.38)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  tripModal: {
    width: "100%",
    maxWidth: 360,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    gap: spacing.sm,
  },
  tripHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  tripLabel: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: theme.textMuted,
    textTransform: "uppercase",
  },
  tripRoute: {
    gap: spacing.xs,
  },
  tripRouteText: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: theme.textPrimary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  members: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.sm,
    color: theme.textMuted,
  },
});
