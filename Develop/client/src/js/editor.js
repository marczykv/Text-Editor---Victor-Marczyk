import { openDB } from 'idb';

// Imports database functions and header
import { getDb, putDb } from './database'; // Imports functions
import { header } from './header'; // Imports content

export default class {
  constructor() {
    const localData = localStorage.getItem('content');

    // Check if CodeMirror is loaded
    if (typeof CodeMirror === 'undefined') {
      throw new Error('CodeMirror is not loaded');
    }

    this.editor = CodeMirror(document.querySelector('#main'), {
      value: '',
      mode: 'javascript',
      theme: 'monokai',
      lineNumbers: true,
      lineWrapping: true,
      autofocus: true,
      indentUnit: 2,
      tabSize: 2,
    });

    // Initialize the IndexedDB database
    const initdb = async () => {
      openDB('jate', 1, {
        upgrade(db) {
          if (db.objectStoreNames.contains('jate')) {
            console.log('jate database already exists');
            return;
          }
          db.createObjectStore('jate', { keyPath: 'id', autoIncrement: true });
          console.log('jate database created');
        },
      });
    };

    // Implement a method to save content to IndexedDB
    const putDb = async (content) => {
      const db = await openDB('jate', 1);
      const tx = db.transaction('jate', 'readwrite');
      const store = tx.objectStore('jate');
      const timestamp = Date.now();

      // Add the content to the object store
      await store.put({ id: timestamp, content });

      await tx.done;
    };

    // Implement a method to get content from IndexedDB
    const getDb = async () => {
      const db = await openDB('jate', 1);
      const tx = db.transaction('jate', 'readonly');
      const store = tx.objectStore('jate');

      // Retrieve the content from the object store (latest entry)
      const latestEntry = await store.get('latest');

      return latestEntry ? latestEntry.content : null;
    };

    // Fall back to localStorage if nothing is stored in IndexedDB, and if neither is available, set the value to header.
    initdb(); // Initialize the IndexedDB database

    getDb().then((data) => {
      console.info('Loaded data from IndexedDB, injecting into editor');
      this.editor.setValue(data || localData || header);
    });

    this.editor.on('change', () => {
      localStorage.setItem('content', this.editor.getValue());
    });

    // Save the content of the editor when the editor itself loses focus
    this.editor.on('blur', () => {
      console.log('The editor has lost focus');
      putDb(localStorage.getItem('content'));
    });
  }
}
