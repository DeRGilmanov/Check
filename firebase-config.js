// Firebase конфигурация
const firebaseConfig = {
  apiKey: "AIzaSyD4FS4d3_Dd2Bb1Rgn2EtMe1pDdr5Uy3vQ",
  authDomain: "check-7ef70.firebaseapp.com",
  databaseURL: "https://check-7ef70-default-rtdb.firebaseio.com",
  projectId: "check-7ef70",
  storageBucket: "check-7ef70.firebasestorage.app",
  messagingSenderId: "871236501125",
  appId: "1:871236501125:web:195605338d3950ce01f3ec",
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Проверка подключения
database.ref(".info/connected").on("value", (snap) => {
  const statusElement = document.getElementById("connectionStatus");
  if (snap.val() === true) {
    statusElement.innerHTML = "✅ Подключено";
    statusElement.style.color = "#10b981";
  } else {
    statusElement.innerHTML = "❌ Отключено";
    statusElement.style.color = "#ef4444";
  }
});
