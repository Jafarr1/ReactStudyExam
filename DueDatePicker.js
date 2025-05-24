import React, { useState } from 'react';
import { Text, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DueDatePicker({ date, setDate, isDark }) {
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

  const formattedDate =
    '📅 Due: ' +
    date.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <>
      <Pressable
        onPress={() => setShowDatePicker(true)}
        style={{
          marginBottom: 10,
          padding: 12,
          borderRadius: 8,
          backgroundColor: isDark ? '#333' : '#f0f0f0',
          borderWidth: 1,
          borderColor: isDark ? '#555' : '#ccc',
        }}
      >
        <Text style={{ color: isDark ? 'white' : '#000', fontSize: 16 }}>
          {formattedDate}
        </Text>
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
  );
}
