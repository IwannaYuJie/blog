// Firebase配置对象
const firebaseConfig = {
  apiKey: "AIzaSyCtYU-UlvsoDsNvtJ0mzJab6XcnztTwVBs",
  authDomain: "blog-15b04.firebaseapp.com",
  projectId: "blog-15b04",
  storageBucket: "blog-15b04.firebasestorage.app",
  messagingSenderId: "474408380613",
  appId: "1:474408380613:web:a8a530cd850fa4d6bde8ac",
  measurementId: "G-BR8LPF39XZ"
};

// 初始化Firebase（兼容模式）
firebase.initializeApp(firebaseConfig);

// 初始化各种服务
const analytics = firebase.analytics();
const db = firebase.firestore();
const auth = firebase.auth();

// 全局变量，供其他脚本使用
window.firebaseApp = {
  analytics,
  db,
  auth,
  firebase
};

console.log('🔥 Firebase配置完成');