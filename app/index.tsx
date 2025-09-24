import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Keyboard,
  Modal,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

const STORAGE_KEY = "@todos_v1";

export default function Index() {
  const [taskText, setTaskText] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Load tasks on startup
  useEffect(() => {
    loadTodos();
  }, []);

  // Save tasks whenever they change
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  async function loadTodos() {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) setTodos(JSON.parse(json));
    } catch (e) {
      console.warn("Failed to load todos", e);
    }
  }

  async function saveTodos(nextTodos: Todo[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextTodos));
    } catch (e) {
      console.warn("Failed to save todos", e);
    }
  }

  function addTask() {
    const text = taskText.trim();
    if (!text) return;
    const newTodo: Todo = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTodos((prev) => [newTodo, ...prev]);
    setTaskText("");
    Keyboard.dismiss();
  }

function deleteTask(id: string) {
  setTodos((prev) => prev.filter((t) => t.id !== id));
}

  function toggleComplete(id: string) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  function startEdit(t: Todo) {
    setEditingId(t.id);
    setEditingText(t.text);
    setIsEditing(true);
  }

  function saveEdit() {
    const text = editingText.trim();
    if (!text || !editingId) return;
    setTodos((prev) =>
      prev.map((t) => (t.id === editingId ? { ...t, text } : t))
    );
    cancelEdit();
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditingId(null);
    setEditingText("");
  }

  function filteredTodos() {
    switch (filter) {
      case "pending":
        return todos.filter((t) => !t.completed);
      case "completed":
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  }

  const renderItem = ({ item }: { item: Todo }) => (
    <TouchableOpacity
      onPress={() => toggleComplete(item.id)}
      onLongPress={() => startEdit(item)}
      style={[styles.todoItem, item.completed && styles.todoCompleted]}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.todoText, item.completed && styles.todoTextCompleted]}
          numberOfLines={2}
        >
          {item.text}
        </Text>
        <Text style={styles.metaText}>
          {new Date(item.createdAt).toLocaleDateString()}{" "}
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
      </View>
      <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>📝 To-Do List</Text>

      {/* Input Row */}
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Add a new task..."
          value={taskText}
          onChangeText={setTaskText}
          style={styles.input}
          onSubmitEditing={addTask}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addTask}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <FilterButton title="All" active={filter === "all"} onPress={() => setFilter("all")} />
        <FilterButton title="Pending" active={filter === "pending"} onPress={() => setFilter("pending")} />
        <FilterButton title="Completed" active={filter === "completed"} onPress={() => setFilter("completed")} />
      </View>

      {/* List */}
      <FlatList
        data={filteredTodos()}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 60 }}
        ListEmptyComponent={() => (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>✨ No tasks yet — add one!</Text>
          </View>
        )}
      />

      {/* Edit Modal */}
      <Modal visible={isEditing} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Task</Text>
            <TextInput
              value={editingText}
              onChangeText={setEditingText}
              style={styles.input}
              placeholder="Task text"
              autoFocus
            />
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 12 }}>
              <TouchableOpacity onPress={cancelEdit} style={[styles.modalBtn, { marginRight: 8 }]}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={[styles.modalBtn, { backgroundColor: "#3b82f6" }]}>
                <Text style={{ color: "white", fontWeight: "600" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FilterButton({
  title,
  active,
  onPress,
}: {
  title: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.filterBtn, active && styles.filterBtnActive]}>
      <Text style={[styles.filterBtnText, active && styles.filterBtnTextActive]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f9fafb" },
  header: { fontSize: 28, fontWeight: "700", marginBottom: 16, textAlign: "center", color: "#1f2937" },
  inputRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "white",
  },
  addBtn: {
    marginLeft: 8,
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addBtnText: { color: "white", fontWeight: "700", fontSize: 18 },
  filtersRow: { flexDirection: "row", justifyContent: "center", marginBottom: 12 },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginRight: 8,
  },
  filterBtnActive: { backgroundColor: "#111827" },
  filterBtnText: { color: "#374151" },
  filterBtnTextActive: { color: "white" },
  todoItem: {
    flexDirection: "row",
    padding: 14,
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  todoCompleted: { backgroundColor: "#dcfce7" },
  todoText: { fontSize: 16, fontWeight: "500", color: "#111827" },
  todoTextCompleted: { textDecorationLine: "line-through", color: "#065f46" },
  metaText: { fontSize: 12, color: "#6b7280" },
  deleteBtn: { paddingHorizontal: 10, paddingVertical: 6, marginLeft: 12, backgroundColor: "#fee2e2", borderRadius: 8 },
  deleteBtnText: { color: "#b91c1c", fontWeight: "700" },
  emptyBox: { padding: 30, alignItems: "center" },
  emptyText: { color: "#6b7280", fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "white", borderRadius: 12, padding: 16 },
  modalTitle: { fontWeight: "700", fontSize: 18, marginBottom: 8 },
  modalBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: "#e5e7eb" },
});
