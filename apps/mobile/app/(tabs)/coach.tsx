import React, { useState, useRef } from "react";
import {
  View, Text, SafeAreaView, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coachApi } from "../../lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

const QUICK_PROMPTS = [
  "Explain today's workout",
  "Why am I running slowly?",
  "How should I fuel for a long run?",
  "Should I rest or run when tired?",
  "What does threshold pace feel like?",
  "How do I run my first sub-20 5K?",
];

export default function CoachScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");

  const { data: historyData, isLoading } = useQuery({
    queryKey: ["coach-history"],
    queryFn: () => coachApi.getHistory(50).then((r) => r.data),
  });

  const { data: weeklySummary } = useQuery({
    queryKey: ["week-summary"],
    queryFn: () => coachApi.getWeekSummary().then((r) => r.data),
  });

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: (message: string) => coachApi.chat(message).then((r) => r.data),
    onMutate: (message) => {
      // Optimistically add user message
      const optimisticUser: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: message,
      };
      queryClient.setQueryData(["coach-history"], (old: Message[] = []) => [
        ...old, optimisticUser,
      ]);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["coach-history"] });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    },
  });

  const messages: Message[] = historyData ?? [];

  function handleSend() {
    const text = input.trim();
    if (!text || isPending) return;
    setInput("");
    sendMessage(text);
  }

  function handleQuickPrompt(prompt: string) {
    setInput(prompt);
  }

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4 border-b border-bg-surface">
          <Text className="text-white text-2xl font-bold">Coach</Text>
          <Text className="text-text-secondary text-sm mt-1">
            Ask anything about your training
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerClassName="px-4 py-4"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {/* Weekly summary card */}
          {weeklySummary?.summary && messages.length === 0 && (
            <View className="bg-bg-elevated rounded-2xl p-4 mb-4 border border-brand/20">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="w-2 h-2 rounded-full bg-brand" />
                <Text className="text-brand text-xs font-semibold uppercase tracking-wide">
                  This Week's Summary
                </Text>
              </View>
              <Text className="text-white text-sm leading-relaxed">
                {weeklySummary.summary}
              </Text>
            </View>
          )}

          {/* Empty state with quick prompts */}
          {messages.length === 0 && (
            <View className="mt-4">
              <Text className="text-text-muted text-sm mb-3">Try asking:</Text>
              <View className="flex-row flex-wrap gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => handleQuickPrompt(p)}
                    className="bg-bg-surface rounded-full px-4 py-2"
                  >
                    <Text className="text-text-secondary text-sm">{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Messages */}
          {isLoading ? (
            <ActivityIndicator color="#00D4AA" className="mt-8" />
          ) : (
            <View className="gap-3 mt-4">
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
              {isPending && (
                <View className="bg-bg-surface rounded-2xl p-4 self-start max-w-xs">
                  <View className="flex-row gap-1.5 items-center">
                    {[0, 1, 2].map((i) => (
                      <View
                        key={i}
                        className="w-2 h-2 rounded-full bg-brand"
                        style={{ opacity: 0.5 + i * 0.25 }}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Input row */}
        <View className="px-4 py-3 border-t border-bg-surface flex-row items-end gap-3">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach…"
            placeholderTextColor="#606060"
            multiline
            maxLength={1000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit
            className="flex-1 bg-bg-surface text-white rounded-2xl px-4 py-3 text-base max-h-32"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || isPending}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{
              backgroundColor: input.trim() && !isPending ? "#00D4AA" : "#1E1E1E",
            }}
          >
            <Text
              className="text-lg"
              style={{ color: input.trim() && !isPending ? "#0A0A0A" : "#606060" }}
            >
              ↑
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <View className={`flex-row ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <View className="w-8 h-8 rounded-full bg-brand-muted items-center justify-center mr-2 mt-1 flex-shrink-0">
          <Text className="text-brand text-xs font-bold">C</Text>
        </View>
      )}
      <View
        className={`rounded-2xl px-4 py-3 max-w-xs ${
          isUser ? "bg-brand rounded-tr-sm" : "bg-bg-surface rounded-tl-sm"
        }`}
        style={{ maxWidth: "80%" }}
      >
        <Text
          className={`text-sm leading-relaxed ${isUser ? "text-bg" : "text-white"}`}
        >
          {message.content}
        </Text>
      </View>
    </View>
  );
}
