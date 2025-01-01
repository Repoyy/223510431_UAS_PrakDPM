import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the type for Book object
interface Book {
  _id: string;
  title: string;
  author: string;
  genre: string;
  description: string;
}

const BookListScreen = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookGenre, setBookGenre] = useState('');
  const [bookDescription, setBookDescription] = useState('');
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Fetch books from API when the component is mounted
  useEffect(() => {
    fetchBooks();
  }, []);

  // Fetch token from AsyncStorage and add it to headers
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token ? `Bearer ${token}` : ''; // Return the token with 'Bearer' prefix
    } catch (error) {
      console.error('Error getting token:', error);
      return ''; // Return empty string if there's an error
    }
  };

  // Fetch all books from the API with authorization token
  const fetchBooks = async () => {
    const token = await getAuthToken();
    try {
      const response = await fetch('https://backendbooktrack-production.up.railway.app/api/books', {
        headers: {
          'Authorization': token,
        },
      });
      const result = await response.json();
      if (result.data) {
        setBooks(result.data);
      } else {
        Alert.alert('Failed to fetch books');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error fetching books');
    }
  };

  // Handle adding or updating a book with authorization token
  const handleAddOrUpdateBook = async () => {
    if (!bookTitle || !bookAuthor || !bookGenre || !bookDescription) {
      Alert.alert('Please fill in all fields.');
      return;
    }

    const token = await getAuthToken();
    const url = editingBook
      ? `https://backendbooktrack-production.up.railway.app/api/books/${editingBook._id}`
      : 'https://backendbooktrack-production.up.railway.app/api/books';

    try {
      const response = await fetch(url, {
        method: editingBook ? 'PUT' : 'POST', // Use PUT for updating
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({
          title: bookTitle,
          author: bookAuthor,
          genre: bookGenre,
          description: bookDescription,
        }),
      });

      const newBook = await response.json();
      if (newBook && newBook.data && newBook.data._id) {
        if (editingBook) {
          // Update the existing book in the state
          setBooks((prevBooks) =>
            prevBooks.map((book) =>
              book._id === newBook.data._id ? newBook.data : book
            )
          );
        } else {
          // Add the new book to the state
          setBooks((prevBooks) => [...prevBooks, newBook.data]);
        }
        resetForm();
        Alert.alert(editingBook ? 'Updated' : 'Added', `Book ${editingBook ? 'updated' : 'added'} successfully!`);
      } else {
        Alert.alert('Failed to add or update book. Please try again.');
      }
    } catch (error) {
      console.error("Error adding/updating book:", error);
      Alert.alert('An error occurred while adding/updating the book.');
    }
  };

  // Handle deleting a book with authorization token
  const handleDeleteBook = async (_id: string) => {
    const token = await getAuthToken();
    try {
      await fetch(`https://backendbooktrack-production.up.railway.app/api/books/${_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      });
      setBooks((prevBooks) => prevBooks.filter((book) => book._id !== _id));
    } catch (error) {
      console.error(error);
      Alert.alert('An error occurred while deleting the book.');
    }
  };

  // Reset the form after adding or updating a book
  const resetForm = () => {
    setEditingBook(null);
    setBookTitle('');
    setBookAuthor('');
    setBookGenre('');
    setBookDescription('');
  };

  // Populate the form when editing a book
  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setBookTitle(book.title);
    setBookAuthor(book.author);
    setBookGenre(book.genre);
    setBookDescription(book.description);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book List</Text>
      
      {/* Form to Add or Update Book */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Book Title"
          value={bookTitle}
          onChangeText={setBookTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Author"
          value={bookAuthor}
          onChangeText={setBookAuthor}
        />
        <TextInput
          style={styles.input}
          placeholder="Genre"
          value={bookGenre}
          onChangeText={setBookGenre}
        />
        <TextInput
          style={styles.input}
          placeholder="Description"
          value={bookDescription}
          onChangeText={setBookDescription}
        />
        
        {/* Add or Update Book Button */}
        <TouchableOpacity style={styles.button} onPress={handleAddOrUpdateBook}>
          <Text style={styles.buttonText}>{editingBook ? 'Update Book' : 'Add Book'}</Text>
        </TouchableOpacity>
      </View>

      {/* List of Books */}
      <FlatList
        data={books}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.bookItem}>
            <Text style={styles.bookText}>
              {item.title} by {item.author} ({item.genre})
            </Text>
            <Text style={styles.bookDescription}>{item.description}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.buttonEditDelete}
                onPress={() => handleEditBook(item)}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.buttonEditDelete}
                onPress={() => handleDeleteBook(item._id)}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: '#f8f5f2', // Warna cream/abu-abu muda untuk latar belakang
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 25,
    color: '#2d2d2d', // Warna teks lebih gelap
  },
  form: {
    marginBottom: 30,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  input: {
    height: 45,
    borderColor: '#dcdcdc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    borderRadius: 8,
    backgroundColor: '#fafafa', // Warna latar belakang input
  },
  button: {
    backgroundColor: '#007bff', // Warna biru untuk tombol
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  bookItem: {
    backgroundColor: '#fff',
    padding: 18,
    marginBottom: 15,
    borderRadius: 12,
    shadowColor: '#bbb',
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 4,
  },
  bookText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  bookDescription: {
    fontSize: 15,
    color: '#777',
    marginTop: 6,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonEditDelete: {
    backgroundColor: '#007bff', // Warna biru untuk tombol edit/hapus
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginTop: 8,
  },
});

export default BookListScreen;
