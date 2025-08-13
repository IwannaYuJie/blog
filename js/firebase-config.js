// 检测运行环境
const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const isHTTPS = location.protocol === 'https:';

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

// 安全的Firebase初始化
try {
  // 初始化Firebase（兼容模式 - v12.1.0）
  firebase.initializeApp(firebaseConfig);
  
  // 初始化服务时添加错误处理
  let analytics = null;
  let db = null;
  let auth = null;
  
  // Firestore初始化（优先级最高）
  try {
    db = firebase.firestore();
    
    // 配置Firestore设置
    const settings = {
      ignoreUndefinedProperties: true
    };
    
    console.log('🗄️ Firestore初始化成功');
  } catch (firestoreError) {
    console.error('❌ Firestore初始化失败:', firestoreError.message);
  }
  
  // Auth初始化
  try {
    auth = firebase.auth();
    console.log('🔐 Auth初始化成功');
  } catch (authError) {
    console.warn('⚠️ Auth初始化失败:', authError.message);
  }
  
  // Analytics初始化（开发环境下可能失败）
  try {
    if (!isDevelopment || isHTTPS) {
      analytics = firebase.analytics();
      console.log('📊 Analytics初始化成功');
    } else {
      console.log('🔧 开发环境下跳过Analytics初始化');
    }
  } catch (analyticsError) {
    console.warn('⚠️ Analytics初始化失败（可能是广告拦截器或网络问题）:', analyticsError.message);
  }
  
  // Auth初始化
  try {
    auth = firebase.auth();
    console.log('🔐 Auth初始化成功');
  } catch (authError) {
    console.warn('⚠️ Auth初始化失败:', authError.message);
  }
  
  // 全局变量，供其他脚本使用
  window.firebaseApp = {
    analytics,
    db,
    auth,
    firebase,
    isDevelopment,
    isHTTPS
  };
  
  console.log('🔥 Firebase配置完成');
  
} catch (error) {
  console.error('❌ Firebase初始化完全失败:', error);
  // Firebase不可用时不提供降级方案
  window.firebaseApp = {
    analytics: null,
    db: null,
    auth: null,
    firebase: null,
    isDevelopment: true,
    isHTTPS: false
  };
  console.log('❌ Firebase不可用');
}