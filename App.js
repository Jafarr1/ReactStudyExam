import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable, TextInput, FlatList, Switch, Alert } from 'react-native';
import { useState, useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { database } from './firebase';
import { ThemeProvider, ThemeContext } from './ThemeContext';
import DueDatePicker from './DueDatePicker';
import { OPENAI_API_KEY } from '@env';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <ThemedNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}

function ThemedNavigator() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  return (
    <Stack.Navigator
      initialRouteName="Tasks"
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#121212' : '#fff',
        },
        headerTitleStyle: {
          color: isDark ? '#fff' : '#000',
        },
        headerTintColor: isDark ? '#fff' : '#000',
      }}
    >
      <Stack.Screen name="Tasks" component={TaskListScreen} />
      <Stack.Screen name="Detail" component={TaskDetailScreen} />
    </Stack.Navigator>
  );
}

function TaskListScreen({ navigation }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [quote, setQuote] = useState('');

  const [values, loading, error] = useCollection(collection(database, 'tasks'));

  useEffect(() => {
    fetchQuote();
  }, []);

    if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#121212' : '#fff' }}>
        <Text style={{ color: isDark ? 'white' : 'black' }}>Loading tasks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#121212' : '#fff' }}>
        <Text style={{ color: 'red' }}>Error: {error.message}</Text>
      </View>
    );
  }

  
  async function fetchQuote() {
    const prompts = [
      "Give me an obscure but motivational quote about education.",
      "Share a quote that students might find funny yet inspiring.",
      "Find a powerful quote from a historical figure about studying.",
      "What is a deep, philosophical quote about learning?",
      "Write a short poetic quote to inspire hard work in school.",
      "Give me a quote a teacher would say to motivate students.",
    ];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a helpful quote generator.' },
            { role: 'user', content: randomPrompt },
          ],
          max_tokens: 60,
          temperature: 0.9,
        }),
      });

      const data = await response.json();
      setQuote(data.choices?.[0]?.message?.content.trim() || 'No quote found.');
    } catch (err) {
      setQuote('Failed to fetch quote.');
      console.error('Error fetching quote:', err);
    }
  }

  const tasks = values?.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  async function addTask() {
    if (!title) return;
    await addDoc(collection(database, 'tasks'), {
      title,
      due: date.toISOString(),
      completed: false,
    });
    setTitle('');
  }

  async function toggleCompleted(task) {
    await updateDoc(doc(database, 'tasks', task.id), {
      completed: !task.completed,
    });
  }

  async function deleteTask(id) {
    await deleteDoc(doc(database, 'tasks', id));
  }

  function confirmDelete(id) {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: () => deleteTask(id), style: "destructive" }
      ]
    );
  }

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
        <Switch
          value={isDark}
          onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
        />
        <Text style={{ marginLeft: 8, color: isDark ? 'white' : 'black' }}>Dark Mode</Text>
      </View>

      <Text style={[styles.heading, isDark ? styles.headingDark : styles.headingLight]}>
        📚 Study Tasks
      </Text>

      <View style={{ marginBottom: 15 }}>
        <Text style={{ fontStyle: 'italic', color: isDark ? '#ddd' : '#555' }}>
          {quote}
        </Text>
      </View>

      <Pressable onPress={fetchQuote} style={[styles.button, { backgroundColor: '#28a745' }]}>
        <Text style={styles.buttonText}>Refresh Quote</Text>
      </Pressable>

      <TextInput
        placeholder="Task title"
        placeholderTextColor={isDark ? '#aaa' : '#666'}
        style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
        value={title}
        onChangeText={setTitle}
      />

      <DueDatePicker date={date} setDate={setDate} isDark={isDark} />

      <Pressable style={styles.button} onPress={addTask}>
        <Text style={styles.buttonText}>Add Task</Text>
      </Pressable>

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.taskItem, isDark && styles.taskItemDark]}>
            <Pressable onPress={() => navigation.navigate('Detail', { task: item })}>
              <Text style={[styles.taskTitle, item.completed && styles.completed, isDark && styles.taskTitleDark]}>
                {item.title}
              </Text>
              <Text style={[styles.taskDue, isDark && styles.taskDueDark]}>
                Due: {new Date(item.due).toLocaleString()}
              </Text>
            </Pressable>
            <View style={styles.taskActions}>
              <Switch
                value={item.completed}
                onValueChange={() => toggleCompleted(item)}
              />
              <Pressable onPress={() => confirmDelete(item.id)}>
                <Text style={styles.delete}>🗑️</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <StatusBar style={isDark ? "light" : "dark"} />
    </View>
  );
}

function TaskDetailScreen({ route, navigation }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const { task } = route.params;
  const [title, setTitle] = useState(task.title);
  const [date, setDate] = useState(new Date(task.due));

  async function saveTask() {
    if (!title.trim()) {
      alert('Title cannot be empty');
      return;
    }

    const taskRef = doc(database, 'tasks', task.id);
    await updateDoc(taskRef, {
      title,
      due: date.toISOString(),
    });

    navigation.goBack();
  }

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <Text style={[styles.heading, isDark ? styles.headingDark : styles.headingLight]}>
        📝 Edit Task
      </Text>

      <Text style={[styles.detailLabel, isDark && { color: 'white' }]}>Title:</Text>
      <TextInput
        style={[
          styles.input,
          { marginBottom: 20 },
          isDark ? styles.inputDark : styles.inputLight
        ]}
        value={title}
        onChangeText={setTitle}
        placeholderTextColor={isDark ? '#aaa' : '#666'}
      />

      <DueDatePicker date={date} setDate={setDate} isDark={isDark} />

      <Pressable style={styles.button} onPress={saveTask}>
        <Text style={styles.buttonText}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  containerLight: {
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  headingLight: {
    color: '#000',
  },
  headingDark: {
    color: '#fff',
  },
  input: {
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
  },
  inputLight: {
    backgroundColor: '#f0f0f0',
    color: '#000',
  },
  inputDark: {
    backgroundColor: '#333',
    color: '#fff',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  taskItem: {
    padding: 12,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    flexDirection: 'column',
    gap: 4,
  },
  taskItemDark: {
    borderBottomColor: '#444',
  },
  taskTitle: {
    fontSize: 18,
    color: '#000',
  },
  taskTitleDark: {
    color: '#fff',
  },
  completed: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  taskDue: {
    color: '#555',
    fontSize: 12,
  },
  taskDueDark: {
    color: '#aaa',
  },
  taskActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  delete: {
    fontSize: 20,
    marginLeft: 10,
  },
  detailLabel: {
    fontWeight: 'bold',
    marginTop: 10,
  },
});
