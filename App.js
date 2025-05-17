import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StyleSheet, Text, View, Pressable, TextInput, FlatList, Switch } from 'react-native';
import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { database } from './firebase';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Tasks">
        <Stack.Screen name="Tasks" component={TaskListScreen} />
        <Stack.Screen name="Detail" component={TaskDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function TaskListScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [values, loading, error] = useCollection(collection(database, 'tasks'));

  function onChangeDate(event, selectedDate) {
    setShowDatePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDate(newDate);
      setShowTimePicker(true);
    }
  }

  function onChangeTime(event, selectedTime) {
    setShowTimePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDate(newDate);
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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>📚 Study Tasks</Text>

      <TextInput
        placeholder="Task title"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />

      <>
        <Pressable onPress={() => setShowDatePicker(true)}>
          <Text>Set Due: {date.toLocaleString()}</Text>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={onChangeTime}
          />
        )}
      </>

      <Pressable style={styles.button} onPress={addTask}>
        <Text style={styles.buttonText}>Add Task</Text>
      </Pressable>

      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Pressable onPress={() => navigation.navigate('Detail', { task: item })}>
              <Text style={[styles.taskTitle, item.completed && styles.completed]}>
                {item.title}
              </Text>
              <Text style={styles.taskDue}>Due: {new Date(item.due).toLocaleString()}</Text>
            </Pressable>
            <View style={styles.taskActions}>
              <Switch
                value={item.completed}
                onValueChange={() => toggleCompleted(item)}
              />
              <Pressable onPress={() => deleteTask(item.id)}>
                <Text style={styles.delete}>🗑️</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <StatusBar style="auto" />
    </View>
  );
}

function TaskDetailScreen({ route, navigation }) {
  const { task } = route.params;

  const [title, setTitle] = useState(task.title);
  const [date, setDate] = useState(new Date(task.due));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  function onChangeDate(event, selectedDate) {
    setShowDatePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDate(newDate);
      setShowTimePicker(true);
    }
  }

  function onChangeTime(event, selectedTime) {
    setShowTimePicker(false);
    if (event.type === 'dismissed') return;
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDate(newDate);
    }
  }

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
    <View style={styles.container}>
      <Text style={styles.heading}>📝 Edit Task</Text>

      <Text style={styles.detailLabel}>Title:</Text>
      <TextInput
        style={[styles.input, { marginBottom: 20 }]}
        value={title}
        onChangeText={setTitle}
      />

      <Pressable onPress={() => setShowDatePicker(true)} style={{ marginBottom: 20 }}>
        <Text>Set Due: {date.toLocaleString()}</Text>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onChangeDate}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={onChangeTime}
        />
      )}

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
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginVertical: 5,
    borderRadius: 8,
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
  taskTitle: {
    fontSize: 18,
  },
  completed: {
    textDecorationLine: 'line-through',
    color: 'gray',
  },
  taskDue: {
    color: '#555',
    fontSize: 12,
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
  detailValue: {
    fontSize: 16,
  },
});
